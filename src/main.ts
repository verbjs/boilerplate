import { server } from 'verb';
// @ts-ignore - HTML imports work with Bun but TypeScript doesn't recognize them
import indexHtml from './frontend/index.html';
// @ts-ignore
import apiHtml from './frontend/api.html';
// @ts-ignore
import testHtml from './frontend/test.html';

const app = server.http() as any;

// ** API endpoints ** (Bun routes pattern)
const users = [
  { id: 1, name: 'John Doe', email: 'john@example.com' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
];

const products = [
  { id: 1, name: 'Laptop', price: 999.99, inStock: true },
  { id: 2, name: 'Phone', price: 599.99, inStock: false },
  { id: 3, name: 'Tablet', price: 299.99, inStock: true }
];

app.withRoutes({
  // ** HTML imports **
  // Bundle & route index.html to "/". This uses HTMLRewriter to scan the HTML for `<script>` and `<link>` tags, 
  // runs Bun's JavaScript & CSS bundler on them, transpiles any TypeScript, JSX, and TSX, 
  // downlevels CSS with Bun's CSS parser and serves the result.
  "/": indexHtml,
  // Bundle & route api.html to "/api-demo"
  "/api-demo": apiHtml,
  // Test route for debugging React mounting
  "/test": testHtml,

  // ** API endpoints ** (Verb + Bun v1.2.3+ pattern)
  "/api/users": {
    async GET() {
      return Response.json(users);
    },
    async POST(req: Request) {
      const { name, email } = await req.json();
      if (!name || !email) {
        return Response.json({ error: "Name and email are required" }, { status: 400 });
      }
      const newUser = { id: Date.now(), name, email };
      users.push(newUser);
      return Response.json(newUser, { status: 201 });
    },
  },
  "/api/users/:id": async (req: Request) => {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const id = parseInt(pathParts[pathParts.length - 1] || '0');
    const user = users.find(u => u.id === id);
    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }
    return Response.json(user);
  },
  
  // Main API info endpoint
  "/api": async () => {
    return Response.json({
      message: "Verb + Bun Fullstack API",
      version: "1.0.0",
      endpoints: [
        "GET /api",
        "GET /api/health",
        "GET /api/users",
        "POST /api/users", 
        "GET /api/users/:id",
        "GET /api/products",
        "POST /api/products",
        "GET /api/products/:id"
      ]
    });
  },

  // Health check endpoint
  "/api/health": async () => {
    return Response.json({ 
      status: "healthy", 
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage()
    });
  },

  // Products endpoints
  "/api/products": {
    async GET(req: Request) {
      const url = new URL(req.url);
      const inStockFilter = url.searchParams.get('inStock');
      
      if (inStockFilter !== null) {
        const filterValue = inStockFilter === 'true';
        const filtered = products.filter(p => p.inStock === filterValue);
        return Response.json(filtered);
      }
      
      return Response.json(products);
    },
    async POST(req: Request) {
      const { name, price, inStock = true } = await req.json();
      if (!name || price === undefined) {
        return Response.json({ error: "Name and price are required" }, { status: 400 });
      }
      const newProduct = { 
        id: Date.now(), 
        name, 
        price: parseFloat(price), 
        inStock: Boolean(inStock) 
      };
      products.push(newProduct);
      return Response.json(newProduct, { status: 201 });
    },
  },
  
  "/api/products/:id": async (req: Request) => {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const id = parseInt(pathParts[pathParts.length - 1] || '0');
    const product = products.find(p => p.id === id);
    if (!product) {
      return Response.json({ error: "Product not found" }, { status: 404 });
    }
    return Response.json(product);
  }
});

// Configure development options
app.withOptions({
  port: 3001,
  hostname: 'localhost',
  development: {
    hmr: true,     // Hot module reloading (Bun v1.2.3+ required)
    console: true  // Enhanced console output
  }
});

console.log('Starting Verb server with Bun fullstack pattern...');
app.listen();
console.log('🚀 Server running on http://localhost:3001');