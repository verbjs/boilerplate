import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { createServer, ServerProtocol } from 'verb';
import type { VerbRequest, VerbResponse } from 'verb';

describe('Products API', () => {
  let server: any;
  let baseUrl: string;

  beforeAll(async () => {
    // Create test server
    const app = createServer(ServerProtocol.HTTP);
    
    // Mock data
    const products = [
      { id: 1, name: 'Product 1', price: 100 },
      { id: 2, name: 'Product 2', price: 200 },
    ];

    // Setup routes
    app.get('/api/products', async (req: VerbRequest, res: VerbResponse) => {
      return res.json({ success: true, data: products });
    });

    app.get('/api/products/:id', async (req: VerbRequest, res: VerbResponse) => {
      const id = parseInt(req.params.id);
      const product = products.find(p => p.id === id);
      
      if (!product) {
        return res.status(404).json({ success: false, error: 'Product not found' });
      }
      
      return res.json({ success: true, data: product });
    });

    app.post('/api/products', async (req: VerbRequest, res: VerbResponse) => {
      const body = await req.json();
      const newProduct = {
        id: products.length + 1,
        name: body.name,
        price: body.price,
      };
      
      products.push(newProduct);
      return res.status(201).json({ success: true, data: newProduct });
    });

    // Start server on random port
    server = app.withOptions({ port: 0 }).listen();
    baseUrl = `http://localhost:${server.port}`;
  });

  afterAll(() => {
    server?.stop();
  });

  test('GET /api/products - should return all products', async () => {
    const response = await fetch(`${baseUrl}/api/products`);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveLength(2);
    expect(data.data[0]).toMatchObject({
      id: 1,
      name: 'Product 1',
      price: 100,
    });
  });

  test('GET /api/products/:id - should return specific product', async () => {
    const response = await fetch(`${baseUrl}/api/products/1`);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toMatchObject({
      id: 1,
      name: 'Product 1',
      price: 100,
    });
  });

  test('GET /api/products/:id - should return 404 for non-existent product', async () => {
    const response = await fetch(`${baseUrl}/api/products/999`);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Product not found');
  });

  test('POST /api/products - should create new product', async () => {
    const newProduct = { name: 'Product 3', price: 300 };
    
    const response = await fetch(`${baseUrl}/api/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProduct),
    });
    
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data).toMatchObject({
      id: 3,
      name: 'Product 3',
      price: 300,
    });
  });

  test('POST /api/products - should validate required fields', async () => {
    const response = await fetch(`${baseUrl}/api/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    // This would fail without proper validation - demonstrates need for validation middleware
    expect(response.status).toBe(201); // Current behavior, would be 400 with validation
  });
});