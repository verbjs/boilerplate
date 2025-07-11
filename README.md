# Verb + Bun Fullstack Boilerplate

A complete fullstack boilerplate demonstrating Verb framework's `withRoutes` pattern, similar to Bun's native fullstack capabilities, with React frontend and REST API.

## Features

- 🚀 **Verb Framework** - High-performance multi-protocol server framework
- ⚡ **Bun Native Routes** - Uses Bun's native routing with HTML imports  
- 🔥 **Hot Module Reloading** - Instant feedback during development
- 📦 **TypeScript Support** - Full type safety across frontend and backend
- 🎯 **React Integration** - Automatic bundling and JSX/TSX transpilation
- 🛠️ **REST API** - Complete CRUD API with users and products
- 📊 **API Explorer** - Interactive API documentation and testing
- 🎨 **Zero Config** - Works out of the box

## Architecture

This boilerplate demonstrates Verb's `withRoutes` pattern which leverages Bun's native routing capabilities:

- **HTML Imports**: Frontend React components are automatically bundled
- **API Routes**: RESTful endpoints using HTTP method objects
- **Parameter Extraction**: Automatic URL parameter parsing
- **Development Features**: HMR, route logging, and enhanced console output

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) v1.2.3+ installed on your system

### Installation

1. Clone or copy this boilerplate directory
2. Install dependencies:
   ```bash
   bun install
   ```

### Development

Start the development server with hot reload:

```bash
bun run dev
```

Your app will be available at:
- **Frontend**: http://localhost:3001
- **API Demo**: http://localhost:3001/api-demo
- **Health Check**: http://localhost:3001/api/health

### Production

Build and start the production server:

```bash
bun run build
bun run start
```

## Project Structure

```
src/
├── main.ts              # Main application with withRoutes pattern
├── api/                 # Organized API handlers (optional approach)
│   ├── index.ts         # Re-exports all handlers
│   ├── users.ts         # User CRUD operations
│   ├── products.ts      # Product CRUD operations  
│   └── system.ts        # Health and info endpoints
├── frontend/            # React frontend
│   ├── index.html       # Main page with React app
│   ├── index.tsx        # User management interface
│   ├── api.html         # API explorer page
│   └── api.tsx          # Interactive API documentation
└── db/                  # Database setup (optional)
    └── ...
```

## Available Endpoints

### Frontend Routes
- `GET /` - Main React application (user management)
- `GET /api-demo` - Interactive API explorer

### API Routes
- `GET /api` - API information and available endpoints
- `GET /api/health` - Server health check
- `GET /api/users` - List all users
- `POST /api/users` - Create a new user
- `GET /api/users/:id` - Get user by ID
- `GET /api/products` - List products (supports `?inStock=true/false`)
- `POST /api/products` - Create a new product
- `GET /api/products/:id` - Get product by ID

## Example Usage

### Creating a User
```bash
curl -X POST http://localhost:3001/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com"}'
```

### Filtering Products
```bash
# Get all products
curl http://localhost:3001/api/products

# Get only in-stock products
curl http://localhost:3001/api/products?inStock=true
```

## Verb withRoutes Pattern

The main application demonstrates Verb's `withRoutes` method which maps directly to Bun's native routing:

```typescript
import { createServer } from 'verb';
import indexHtml from './frontend/index.html';

const app = createServer();

app.withRoutes({
  // HTML imports with automatic bundling
  "/": indexHtml,
  
  // API endpoints with HTTP methods
  "/api/users": {
    async GET(req) {
      return Response.json(users);
    },
    async POST(req) {
      const data = await req.json();
      return Response.json(newUser, { status: 201 });
    }
  },
  
  // Single handler for parameterized routes  
  "/api/users/:id": async (req) => {
    const id = req.params?.id;
    return Response.json(user);
  }
});

app.withOptions({
  port: 3001,
  development: { hmr: true, console: true }
});

app.listen();
```

## Development Scripts

- `bun run dev` - Start development server with hot reload
- `bun run start` - Start production server  
- `bun run build` - Build the application
- `bun run lint` - Lint code with Biome
- `bun run format` - Format code with Biome

## Technologies

- **Runtime**: [Bun](https://bun.sh) v1.2.3+
- **Framework**: [Verb](https://github.com/wess/verb) - Multi-protocol server framework
- **Frontend**: React 19 + TypeScript
- **Bundling**: Bun's native bundler (automatic)
- **Linting**: [Biome](https://biomejs.dev)
- **Hot Reloading**: Bun's native HMR

## Performance

This boilerplate leverages both Verb and Bun's performance optimizations:

- **Native Routing**: Uses Bun's optimized route matching
- **Zero-Copy Bundling**: Bun's fast bundler with native performance
- **Functional Architecture**: No OOP overhead, pure functional approach
- **TypeScript**: Compiled with Bun's native TypeScript support

## License

MIT
