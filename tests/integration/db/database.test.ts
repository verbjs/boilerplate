import { describe, test, expect, beforeAll, afterAll, beforeEach } from 'bun:test';
import { Database } from 'bun:sqlite';
import { join } from 'path';

// Mock database factory for testing
class TestDatabase {
  private db: Database;

  constructor(path: string = ':memory:') {
    this.db = new Database(path);
    this.init();
  }

  private init() {
    // Create tables
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT,
        user_id INTEGER NOT NULL,
        published BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    // Create indexes
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id)');
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_posts_published ON posts(published)');
  }

  // User methods
  createUser(name: string, email: string) {
    const stmt = this.db.prepare('INSERT INTO users (name, email) VALUES (?, ?)');
    const result = stmt.run(name, email);
    return { id: result.lastInsertRowid, name, email };
  }

  getUserById(id: number) {
    const stmt = this.db.prepare('SELECT * FROM users WHERE id = ?');
    return stmt.get(id);
  }

  getUserByEmail(email: string) {
    const stmt = this.db.prepare('SELECT * FROM users WHERE email = ?');
    return stmt.get(email);
  }

  getAllUsers() {
    const stmt = this.db.prepare('SELECT * FROM users ORDER BY created_at DESC');
    return stmt.all();
  }

  updateUser(id: number, updates: { name?: string; email?: string }) {
    const fields = [];
    const values = [];
    
    if (updates.name) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.email) {
      fields.push('email = ?');
      values.push(updates.email);
    }
    
    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const stmt = this.db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`);
    const result = stmt.run(...values);
    return result.changes > 0;
  }

  deleteUser(id: number) {
    const stmt = this.db.prepare('DELETE FROM users WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // Post methods
  createPost(title: string, content: string, userId: number, published: boolean = false) {
    const stmt = this.db.prepare('INSERT INTO posts (title, content, user_id, published) VALUES (?, ?, ?, ?)');
    const result = stmt.run(title, content, userId, published);
    return { id: result.lastInsertRowid, title, content, userId, published };
  }

  getPostById(id: number) {
    const stmt = this.db.prepare(`
      SELECT p.*, u.name as author_name, u.email as author_email
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
    `);
    return stmt.get(id);
  }

  getPostsByUser(userId: number) {
    const stmt = this.db.prepare('SELECT * FROM posts WHERE user_id = ? ORDER BY created_at DESC');
    return stmt.all(userId);
  }

  getPublishedPosts() {
    const stmt = this.db.prepare(`
      SELECT p.*, u.name as author_name
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.published = TRUE
      ORDER BY p.created_at DESC
    `);
    return stmt.all();
  }

  updatePost(id: number, updates: { title?: string; content?: string; published?: boolean }) {
    const fields = [];
    const values = [];
    
    if (updates.title !== undefined) {
      fields.push('title = ?');
      values.push(updates.title);
    }
    if (updates.content !== undefined) {
      fields.push('content = ?');
      values.push(updates.content);
    }
    if (updates.published !== undefined) {
      fields.push('published = ?');
      values.push(updates.published);
    }
    
    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const stmt = this.db.prepare(`UPDATE posts SET ${fields.join(', ')} WHERE id = ?`);
    const result = stmt.run(...values);
    return result.changes > 0;
  }

  deletePost(id: number) {
    const stmt = this.db.prepare('DELETE FROM posts WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // Transaction support
  transaction<T>(fn: () => T): T {
    return this.db.transaction(fn)();
  }

  // Cleanup
  close() {
    this.db.close();
  }

  // Test utilities
  clear() {
    this.db.exec('DELETE FROM posts');
    this.db.exec('DELETE FROM users');
  }

  getStats() {
    const userCount = this.db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
    const postCount = this.db.prepare('SELECT COUNT(*) as count FROM posts').get() as { count: number };
    const publishedCount = this.db.prepare('SELECT COUNT(*) as count FROM posts WHERE published = TRUE').get() as { count: number };
    
    return {
      users: userCount.count,
      posts: postCount.count,
      publishedPosts: publishedCount.count,
    };
  }
}

describe('Database Integration', () => {
  let db: TestDatabase;

  beforeAll(() => {
    db = new TestDatabase();
  });

  afterAll(() => {
    db.close();
  });

  beforeEach(() => {
    db.clear();
  });

  describe('User Operations', () => {
    test('should create user', () => {
      const user = db.createUser('John Doe', 'john@example.com');
      
      expect(user.id).toBeDefined();
      expect(user.name).toBe('John Doe');
      expect(user.email).toBe('john@example.com');
    });

    test('should get user by id', () => {
      const created = db.createUser('Jane Smith', 'jane@example.com');
      const user = db.getUserById(created.id as number);
      
      expect(user).toBeDefined();
      expect(user.name).toBe('Jane Smith');
      expect(user.email).toBe('jane@example.com');
      expect(user.created_at).toBeDefined();
    });

    test('should get user by email', () => {
      db.createUser('Bob Wilson', 'bob@example.com');
      const user = db.getUserByEmail('bob@example.com');
      
      expect(user).toBeDefined();
      expect(user.name).toBe('Bob Wilson');
    });

    test('should get all users', () => {
      db.createUser('User 1', 'user1@example.com');
      db.createUser('User 2', 'user2@example.com');
      
      const users = db.getAllUsers();
      expect(users).toHaveLength(2);
    });

    test('should update user', () => {
      const created = db.createUser('Original Name', 'original@example.com');
      const updated = db.updateUser(created.id as number, { 
        name: 'Updated Name',
        email: 'updated@example.com'
      });
      
      expect(updated).toBe(true);
      
      const user = db.getUserById(created.id as number);
      expect(user.name).toBe('Updated Name');
      expect(user.email).toBe('updated@example.com');
    });

    test('should delete user', () => {
      const created = db.createUser('To Delete', 'delete@example.com');
      const deleted = db.deleteUser(created.id as number);
      
      expect(deleted).toBe(true);
      
      const user = db.getUserById(created.id as number);
      expect(user).toBeUndefined();
    });

    test('should enforce unique email constraint', () => {
      db.createUser('User 1', 'same@example.com');
      
      expect(() => {
        db.createUser('User 2', 'same@example.com');
      }).toThrow();
    });
  });

  describe('Post Operations', () => {
    let userId: number;

    beforeEach(() => {
      const user = db.createUser('Test Author', 'author@example.com');
      userId = user.id as number;
    });

    test('should create post', () => {
      const post = db.createPost('Test Title', 'Test content', userId, true);
      
      expect(post.id).toBeDefined();
      expect(post.title).toBe('Test Title');
      expect(post.content).toBe('Test content');
      expect(post.published).toBe(true);
    });

    test('should get post with author info', () => {
      const created = db.createPost('Post Title', 'Post content', userId);
      const post = db.getPostById(created.id as number);
      
      expect(post).toBeDefined();
      expect(post.title).toBe('Post Title');
      expect(post.author_name).toBe('Test Author');
      expect(post.author_email).toBe('author@example.com');
    });

    test('should get posts by user', () => {
      db.createPost('Post 1', 'Content 1', userId);
      db.createPost('Post 2', 'Content 2', userId);
      
      const posts = db.getPostsByUser(userId);
      expect(posts).toHaveLength(2);
    });

    test('should get only published posts', () => {
      db.createPost('Published', 'Content', userId, true);
      db.createPost('Draft', 'Content', userId, false);
      
      const published = db.getPublishedPosts();
      expect(published).toHaveLength(1);
      expect(published[0].title).toBe('Published');
    });

    test('should update post', () => {
      const created = db.createPost('Original', 'Original content', userId, false);
      const updated = db.updatePost(created.id as number, {
        title: 'Updated Title',
        published: true
      });
      
      expect(updated).toBe(true);
      
      const post = db.getPostById(created.id as number);
      expect(post.title).toBe('Updated Title');
      expect(post.published).toBe(1); // SQLite boolean as integer
    });

    test('should delete post', () => {
      const created = db.createPost('To Delete', 'Content', userId);
      const deleted = db.deletePost(created.id as number);
      
      expect(deleted).toBe(true);
      
      const post = db.getPostById(created.id as number);
      expect(post).toBeUndefined();
    });
  });

  describe('Transactions', () => {
    test('should commit successful transaction', () => {
      const result = db.transaction(() => {
        const user = db.createUser('Transactional User', 'trans@example.com');
        db.createPost('Transactional Post', 'Content', user.id as number);
        return user.id;
      });
      
      expect(result).toBeDefined();
      
      const stats = db.getStats();
      expect(stats.users).toBe(1);
      expect(stats.posts).toBe(1);
    });

    test('should rollback failed transaction', () => {
      expect(() => {
        db.transaction(() => {
          const user = db.createUser('User 1', 'user1@example.com');
          db.createUser('User 2', 'user1@example.com'); // Duplicate email - should fail
          return user.id;
        });
      }).toThrow();
      
      const stats = db.getStats();
      expect(stats.users).toBe(0); // No users should be created
    });
  });

  describe('Data Integrity', () => {
    test('should maintain foreign key constraints', () => {
      // This test assumes foreign key constraints are enabled
      expect(() => {
        db.createPost('Orphan Post', 'Content', 999); // Non-existent user
      }).toThrow();
    });

    test('should handle concurrent operations', () => {
      // Create multiple users and posts to test concurrent access
      const promises = [];
      
      for (let i = 0; i < 10; i++) {
        promises.push(
          Promise.resolve().then(() => {
            const user = db.createUser(`User ${i}`, `user${i}@example.com`);
            return db.createPost(`Post ${i}`, `Content ${i}`, user.id as number);
          })
        );
      }
      
      return Promise.all(promises).then(() => {
        const stats = db.getStats();
        expect(stats.users).toBe(10);
        expect(stats.posts).toBe(10);
      });
    });
  });

  describe('Performance', () => {
    test('should handle bulk operations efficiently', () => {
      const start = performance.now();
      
      // Create 1000 users
      for (let i = 0; i < 1000; i++) {
        db.createUser(`User ${i}`, `user${i}@example.com`);
      }
      
      const end = performance.now();
      const duration = end - start;
      
      expect(duration).toBeLessThan(1000); // Should complete in under 1 second
      
      const stats = db.getStats();
      expect(stats.users).toBe(1000);
    });

    test('should use indexes for fast queries', () => {
      // Create test data
      for (let i = 0; i < 100; i++) {
        db.createUser(`User ${i}`, `user${i}@example.com`);
      }
      
      const start = performance.now();
      
      // Query by email (should use index)
      const user = db.getUserByEmail('user50@example.com');
      
      const end = performance.now();
      const duration = end - start;
      
      expect(user).toBeDefined();
      expect(duration).toBeLessThan(10); // Should be very fast with index
    });
  });
});