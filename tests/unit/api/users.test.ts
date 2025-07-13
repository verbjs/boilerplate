import { describe, test, expect, beforeAll, afterAll, beforeEach } from 'bun:test';
import { createServer, ServerProtocol } from 'verb';
import type { VerbRequest, VerbResponse } from 'verb';

describe('Users API', () => {
  let server: any;
  let baseUrl: string;
  let users: any[];

  beforeAll(async () => {
    const app = createServer(ServerProtocol.HTTP);
    
    // Reset users before each test
    const resetUsers = () => {
      users = [
        { id: 1, name: 'John Doe', email: 'john@example.com', active: true },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com', active: false },
      ];
    };

    resetUsers();

    // Middleware to reset data for each request in tests
    app.use(async (req: VerbRequest, res: VerbResponse, next: () => void) => {
      if (req.headers.get('x-test-reset') === 'true') {
        resetUsers();
      }
      next();
    });

    // Routes
    app.get('/api/users', async (req: VerbRequest, res: VerbResponse) => {
      const { active, search } = req.query;
      let filteredUsers = [...users];

      if (active !== undefined) {
        filteredUsers = filteredUsers.filter(u => u.active === (active === 'true'));
      }

      if (search) {
        filteredUsers = filteredUsers.filter(u => 
          u.name.toLowerCase().includes(search.toLowerCase()) ||
          u.email.toLowerCase().includes(search.toLowerCase())
        );
      }

      return res.json({ success: true, data: filteredUsers });
    });

    app.get('/api/users/:id', async (req: VerbRequest, res: VerbResponse) => {
      const id = parseInt(req.params.id);
      const user = users.find(u => u.id === id);
      
      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }
      
      return res.json({ success: true, data: user });
    });

    app.post('/api/users', async (req: VerbRequest, res: VerbResponse) => {
      const body = await req.json();
      
      // Simple validation
      if (!body.name || !body.email) {
        return res.status(400).json({ 
          success: false, 
          error: 'Name and email are required' 
        });
      }

      // Check for duplicate email
      if (users.find(u => u.email === body.email)) {
        return res.status(409).json({ 
          success: false, 
          error: 'Email already exists' 
        });
      }

      const newUser = {
        id: Math.max(...users.map(u => u.id), 0) + 1,
        name: body.name,
        email: body.email,
        active: body.active ?? true,
      };
      
      users.push(newUser);
      return res.status(201).json({ success: true, data: newUser });
    });

    app.put('/api/users/:id', async (req: VerbRequest, res: VerbResponse) => {
      const id = parseInt(req.params.id);
      const userIndex = users.findIndex(u => u.id === id);
      
      if (userIndex === -1) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      const body = await req.json();
      users[userIndex] = { ...users[userIndex], ...body, id };
      
      return res.json({ success: true, data: users[userIndex] });
    });

    app.delete('/api/users/:id', async (req: VerbRequest, res: VerbResponse) => {
      const id = parseInt(req.params.id);
      const userIndex = users.findIndex(u => u.id === id);
      
      if (userIndex === -1) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      users.splice(userIndex, 1);
      return res.status(204).send();
    });

    server = app.withOptions({ port: 0 }).listen();
    baseUrl = `http://localhost:${server.port}`;
  });

  afterAll(() => {
    server?.stop();
  });

  beforeEach(async () => {
    // Reset data before each test
    await fetch(`${baseUrl}/api/users`, {
      headers: { 'x-test-reset': 'true' }
    });
  });

  test('GET /api/users - should return all users', async () => {
    const response = await fetch(`${baseUrl}/api/users`);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveLength(2);
  });

  test('GET /api/users - should filter by active status', async () => {
    const response = await fetch(`${baseUrl}/api/users?active=true`);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toHaveLength(1);
    expect(data.data[0].active).toBe(true);
  });

  test('GET /api/users - should search by name', async () => {
    const response = await fetch(`${baseUrl}/api/users?search=john`);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toHaveLength(1);
    expect(data.data[0].name).toContain('John');
  });

  test('GET /api/users/:id - should return specific user', async () => {
    const response = await fetch(`${baseUrl}/api/users/1`);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.id).toBe(1);
  });

  test('POST /api/users - should create new user', async () => {
    const newUser = { 
      name: 'Bob Wilson', 
      email: 'bob@example.com',
      active: true 
    };
    
    const response = await fetch(`${baseUrl}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newUser),
    });
    
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data).toMatchObject(newUser);
    expect(data.data.id).toBeDefined();
  });

  test('POST /api/users - should validate required fields', async () => {
    const response = await fetch(`${baseUrl}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'No Email' }),
    });
    
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Name and email are required');
  });

  test('POST /api/users - should prevent duplicate emails', async () => {
    const duplicateUser = { 
      name: 'Duplicate', 
      email: 'john@example.com' // Existing email
    };
    
    const response = await fetch(`${baseUrl}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(duplicateUser),
    });
    
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Email already exists');
  });

  test('PUT /api/users/:id - should update existing user', async () => {
    const updates = { name: 'John Updated', active: false };
    
    const response = await fetch(`${baseUrl}/api/users/1`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.name).toBe('John Updated');
    expect(data.data.active).toBe(false);
    expect(data.data.id).toBe(1); // ID should remain unchanged
  });

  test('DELETE /api/users/:id - should delete user', async () => {
    const response = await fetch(`${baseUrl}/api/users/1`, {
      method: 'DELETE',
    });

    expect(response.status).toBe(204);

    // Verify user is deleted
    const getResponse = await fetch(`${baseUrl}/api/users/1`);
    expect(getResponse.status).toBe(404);
  });

  test('Error handling - should handle non-existent user operations', async () => {
    // GET non-existent user
    const getResponse = await fetch(`${baseUrl}/api/users/999`);
    expect(getResponse.status).toBe(404);

    // PUT non-existent user
    const putResponse = await fetch(`${baseUrl}/api/users/999`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Updated' }),
    });
    expect(putResponse.status).toBe(404);

    // DELETE non-existent user
    const deleteResponse = await fetch(`${baseUrl}/api/users/999`, {
      method: 'DELETE',
    });
    expect(deleteResponse.status).toBe(404);
  });
});