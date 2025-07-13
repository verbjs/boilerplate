import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { createServer, ServerProtocol } from 'verb';
import type { VerbRequest, VerbResponse } from 'verb';

// Mock JWT for testing
const mockJWT = {
  sign: (payload: any, secret: string) => `mock.token.${btoa(JSON.stringify(payload))}`,
  verify: (token: string, secret: string) => {
    if (!token.startsWith('mock.token.')) throw new Error('Invalid token');
    const payload = token.replace('mock.token.', '');
    return JSON.parse(atob(payload));
  }
};

// Mock auth middleware
const authMiddleware = async (req: VerbRequest, res: VerbResponse, next: () => void) => {
  const authHeader = req.headers.get('authorization');
  
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  const token = authHeader.replace('Bearer ', '');
  
  try {
    const decoded = mockJWT.verify(token, 'test-secret');
    (req as any).user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Optional auth middleware - doesn't fail if no token
const optionalAuthMiddleware = async (req: VerbRequest, res: VerbResponse, next: () => void) => {
  const authHeader = req.headers.get('authorization');
  
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '');
    try {
      const decoded = mockJWT.verify(token, 'test-secret');
      (req as any).user = decoded;
    } catch (error) {
      // Ignore invalid tokens in optional auth
    }
  }
  
  next();
};

// Role-based auth middleware
const requireRole = (role: string) => {
  return async (req: VerbRequest, res: VerbResponse, next: () => void) => {
    const user = (req as any).user;
    
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (user.role !== role) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
};

describe('Auth Middleware', () => {
  let server: any;
  let baseUrl: string;

  beforeAll(async () => {
    const app = createServer(ServerProtocol.HTTP);

    // Public route
    app.get('/api/public', async (req: VerbRequest, res: VerbResponse) => {
      return res.json({ message: 'Public endpoint', user: (req as any).user || null });
    });

    // Protected route
    app.get('/api/protected', authMiddleware, async (req: VerbRequest, res: VerbResponse) => {
      return res.json({ message: 'Protected endpoint', user: (req as any).user });
    });

    // Optional auth route
    app.get('/api/optional', optionalAuthMiddleware, async (req: VerbRequest, res: VerbResponse) => {
      const user = (req as any).user;
      return res.json({ 
        message: 'Optional auth endpoint', 
        authenticated: !!user,
        user: user || null 
      });
    });

    // Admin only route
    app.get('/api/admin', authMiddleware, requireRole('admin'), async (req: VerbRequest, res: VerbResponse) => {
      return res.json({ message: 'Admin endpoint', user: (req as any).user });
    });

    // Login route for testing
    app.post('/api/login', async (req: VerbRequest, res: VerbResponse) => {
      const { username, password } = await req.json();
      
      // Mock user database
      const users = [
        { id: 1, username: 'user', password: 'password', role: 'user' },
        { id: 2, username: 'admin', password: 'admin123', role: 'admin' },
      ];
      
      const user = users.find(u => u.username === username && u.password === password);
      
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      const token = mockJWT.sign({ 
        id: user.id, 
        username: user.username, 
        role: user.role 
      }, 'test-secret');
      
      return res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
    });

    server = app.withOptions({ port: 0 }).listen();
    baseUrl = `http://localhost:${server.port}`;
  });

  afterAll(() => {
    server?.stop();
  });

  describe('Authentication', () => {
    test('should access public route without auth', async () => {
      const response = await fetch(`${baseUrl}/api/public`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Public endpoint');
      expect(data.user).toBe(null);
    });

    test('should reject protected route without token', async () => {
      const response = await fetch(`${baseUrl}/api/protected`);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('No token provided');
    });

    test('should reject protected route with invalid token', async () => {
      const response = await fetch(`${baseUrl}/api/protected`, {
        headers: { 'Authorization': 'Bearer invalid.token' }
      });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Invalid token');
    });

    test('should allow protected route with valid token', async () => {
      // Login first
      const loginResponse = await fetch(`${baseUrl}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'user', password: 'password' })
      });
      const loginData = await loginResponse.json();

      // Access protected route
      const response = await fetch(`${baseUrl}/api/protected`, {
        headers: { 'Authorization': `Bearer ${loginData.token}` }
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Protected endpoint');
      expect(data.user.username).toBe('user');
    });
  });

  describe('Optional Authentication', () => {
    test('should work without token', async () => {
      const response = await fetch(`${baseUrl}/api/optional`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.authenticated).toBe(false);
      expect(data.user).toBe(null);
    });

    test('should work with valid token', async () => {
      // Login first
      const loginResponse = await fetch(`${baseUrl}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'user', password: 'password' })
      });
      const loginData = await loginResponse.json();

      // Access optional auth route
      const response = await fetch(`${baseUrl}/api/optional`, {
        headers: { 'Authorization': `Bearer ${loginData.token}` }
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.authenticated).toBe(true);
      expect(data.user.username).toBe('user');
    });

    test('should ignore invalid token gracefully', async () => {
      const response = await fetch(`${baseUrl}/api/optional`, {
        headers: { 'Authorization': 'Bearer invalid.token' }
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.authenticated).toBe(false);
      expect(data.user).toBe(null);
    });
  });

  describe('Role-based Authorization', () => {
    test('should reject admin route for regular user', async () => {
      // Login as regular user
      const loginResponse = await fetch(`${baseUrl}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'user', password: 'password' })
      });
      const loginData = await loginResponse.json();

      // Try to access admin route
      const response = await fetch(`${baseUrl}/api/admin`, {
        headers: { 'Authorization': `Bearer ${loginData.token}` }
      });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Insufficient permissions');
    });

    test('should allow admin route for admin user', async () => {
      // Login as admin
      const loginResponse = await fetch(`${baseUrl}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'admin123' })
      });
      const loginData = await loginResponse.json();

      // Access admin route
      const response = await fetch(`${baseUrl}/api/admin`, {
        headers: { 'Authorization': `Bearer ${loginData.token}` }
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Admin endpoint');
      expect(data.user.role).toBe('admin');
    });

    test('should reject admin route without authentication', async () => {
      const response = await fetch(`${baseUrl}/api/admin`);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('No token provided');
    });
  });

  describe('Login Flow', () => {
    test('should reject invalid credentials', async () => {
      const response = await fetch(`${baseUrl}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'user', password: 'wrong' })
      });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Invalid credentials');
    });

    test('should return token for valid credentials', async () => {
      const response = await fetch(`${baseUrl}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'user', password: 'password' })
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.token).toBeDefined();
      expect(data.token).toMatch(/^mock\.token\./);
      expect(data.user.username).toBe('user');
      expect(data.user.role).toBe('user');
    });
  });
});