# Getting Started with Verb + Bun Fullstack Development

A complete tutorial and boilerplate for building modern fullstack applications using Verb framework with Bun's native routing, React frontend, and REST API.

## 🚀 What You'll Build

By following this tutorial, you'll create a fully functional web application with:

- **Interactive React Frontend** - User management interface with real-time updates
- **REST API Backend** - Complete CRUD operations for users and products  
- **Hot Module Reloading** - Instant feedback during development
- **TypeScript Support** - Full type safety across frontend and backend
- **Zero Configuration** - Everything works out of the box

**Live Example**: After setup, you'll have a working app at `http://localhost:3001`

## 📋 Prerequisites

Before you begin, make sure you have:

- **Bun v1.2.3+** installed ([Download here](https://bun.sh))
- Basic knowledge of **TypeScript** and **React**
- A code editor (VS Code recommended)

### Installing Bun

If you don't have Bun installed:

```bash
# macOS/Linux
curl -fsSL https://bun.sh/install | bash

# Windows
powershell -c "irm bun.sh/install.ps1 | iex"

# Verify installation
bun --version
```

## 🏁 Quick Start (2 minutes)

1. **Clone this directory** and navigate to it:
   ```bash
   cd /path/to/verb/boilerplate
   ```

2. **Install dependencies**:
   ```bash
   bun install
   ```

3. **Start the development server**:
   ```bash
   bun run dev
   ```

4. **Open your browser** and visit:
   - **Main App**: http://localhost:3001
   - **API Explorer**: http://localhost:3001/api-demo

🎉 **You're done!** You now have a fully functional fullstack application running.

## 📖 Step-by-Step Tutorial

### Step 1: Understanding the Project Structure

```
src/
├── main.ts              # Main server with Verb's withRoutes pattern
├── frontend/            # React frontend components
│   ├── index.html       # Main page entry point
│   ├── index.tsx        # User management React app  
│   ├── api.html         # API explorer page
│   └── api.tsx          # Interactive API documentation
└── types.d.ts           # TypeScript declarations for HTML imports
```

### Step 2: How Verb's withRoutes Works

The magic happens in `src/main.ts`. Verb's `withRoutes` method maps directly to Bun's native routing:

```typescript
import { createServer } from 'verb';
// HTML imports work automatically with TypeScript
import indexHtml from './frontend/index.html';
import apiHtml from './frontend/api.html';

const app = createServer();

app.withRoutes({
  // 🎯 HTML Routes (automatic bundling)
  "/": indexHtml,           // Serves React app with bundling
  "/api-demo": apiHtml,     // Serves API explorer
  
  // 🔥 API Routes (HTTP method objects)
  "/api/users": {
    async GET() {
      return Response.json(users);  // List all users
    },
    async POST(req) {
      const { name, email } = await req.json();
      const newUser = { id: Date.now(), name, email };
      users.push(newUser);
      return Response.json(newUser, { status: 201 });
    }
  },
  
  // ⚡ Parameterized Routes
  "/api/users/:id": async (req) => {
    const url = new URL(req.url);
    const id = url.pathname.split('/').pop();
    const user = users.find(u => u.id === parseInt(id));
    return Response.json(user || { error: "Not found" });
  }
});
```

### Step 3: Frontend with React

The frontend uses React with automatic bundling. Let's look at `src/frontend/index.tsx`:

```tsx
import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

function App() {
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({ name: '', email: '' });

  // Load users from API
  useEffect(() => {
    fetch('/api/users')
      .then(res => res.json())
      .then(setUsers);
  }, []);

  // Create new user
  const handleSubmit = async (e) => {
    e.preventDefault();
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newUser)
    });
    const user = await response.json();
    setUsers([...users, user]);
    setNewUser({ name: '', email: '' });
  };

  return (
    <div className="app">
      <h1>User Management</h1>
      
      {/* Add User Form */}
      <form onSubmit={handleSubmit}>
        <input 
          placeholder="Name"
          value={newUser.name}
          onChange={(e) => setNewUser({...newUser, name: e.target.value})}
        />
        <input 
          placeholder="Email"
          value={newUser.email}
          onChange={(e) => setNewUser({...newUser, email: e.target.value})}
        />
        <button type="submit">Add User</button>
      </form>

      {/* Users List */}
      <div className="users">
        {users.map(user => (
          <div key={user.id} className="user-card">
            <h3>{user.name}</h3>
            <p>{user.email}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Mount with proper DOM handling
function mountApp() {
  const root = createRoot(document.getElementById('root')!);
  root.render(<App />);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountApp);
} else {
  mountApp();
}
```

### Step 4: API Development

Add new API endpoints by extending the `withRoutes` configuration:

```typescript
app.withRoutes({
  // ... existing routes ...
  
  // Products API
  "/api/products": {
    async GET(req) {
      const url = new URL(req.url);
      const inStock = url.searchParams.get('inStock');
      
      let filtered = products;
      if (inStock !== null) {
        filtered = products.filter(p => p.inStock === (inStock === 'true'));
      }
      
      return Response.json(filtered);
    },
    
    async POST(req) {
      const { name, price, inStock = true } = await req.json();
      
      if (!name || !price) {
        return Response.json(
          { error: "Name and price required" }, 
          { status: 400 }
        );
      }
      
      const product = {
        id: Date.now(),
        name,
        price: parseFloat(price),
        inStock: Boolean(inStock)
      };
      
      products.push(product);
      return Response.json(product, { status: 201 });
    }
  }
});
```

### Step 5: Development Features

Enable development features with `withOptions`:

```typescript
app.withOptions({
  port: 3001,
  hostname: 'localhost',
  development: {
    hmr: true,        // Hot Module Reloading
    console: true     // Enhanced console output
  },
  showRoutes: true    // Display routes on startup
});
```

## 🛠️ Available Commands

| Command | Description |
|---------|-------------|
| `bun run dev` | Start development server with HMR |
| `bun run start` | Start production server |
| `bun run build` | Build the application |
| `bun test` | Run tests |
| `bun run lint` | Lint code with Biome |
| `bun run format` | Format code with Biome |

## 🔗 API Endpoints

### Frontend Routes
- `GET /` - Main React application
- `GET /api-demo` - Interactive API explorer

### API Routes
- `GET /api` - API information
- `GET /api/health` - Health check
- `GET /api/users` - List users
- `POST /api/users` - Create user
- `GET /api/users/:id` - Get user by ID
- `GET /api/products` - List products (supports `?inStock=true/false`)
- `POST /api/products` - Create product
- `GET /api/products/:id` - Get product by ID

## 🧪 Testing Your API

### Using curl
```bash
# List users
curl http://localhost:3001/api/users

# Create a user
curl -X POST http://localhost:3001/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane Doe","email":"jane@example.com"}'

# Get specific user
curl http://localhost:3001/api/users/1

# Filter products
curl "http://localhost:3001/api/products?inStock=true"
```

### Using the API Explorer
Visit http://localhost:3001/api-demo for an interactive API testing interface.

## 🚀 Key Features Explained

### 1. HTML Imports with Automatic Bundling
```typescript
import indexHtml from './frontend/index.html';  // TypeScript recognizes this!
```
Bun automatically bundles React/TSX, CSS, and other assets referenced in your HTML.

### 2. Zero-Config TypeScript
No `webpack.config.js` or complex build setup. Bun handles everything:
- TypeScript compilation
- JSX/TSX transformation  
- CSS bundling
- Asset optimization

### 3. Hot Module Reloading
Changes to your React components or API routes reload instantly:
```typescript
app.withOptions({
  development: { hmr: true }  // That's it!
});
```

### 4. Functional Programming
Following best practices, this boilerplate uses functional patterns:
- No classes, pure functions
- Immutable data patterns
- Functional React components

## 🎯 Next Steps

### Add Authentication
```typescript
const authenticate = async (req) => {
  const token = req.headers.get('Authorization');
  return await verifyToken(token);
};

app.withRoutes({
  "/api/protected": async (req) => {
    const user = await authenticate(req);
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    return Response.json({ message: "Welcome!", user });
  }
});
```

### Add Database Integration
```typescript
import { Database } from "bun:sqlite";

const db = new Database("app.db");
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL
  )
`);
```

### Add WebSocket for Real-time Features
```typescript
const wsServer = createServer(ServerProtocol.WEBSOCKET);
wsServer.websocket({
  open: (ws) => ws.send("Connected!"),
  message: (ws, message) => {
    // Broadcast to all clients
    wsServer.publish("chat", message);
  }
});
```

## 📚 Learn More

- **Verb Framework**: [GitHub Repository](https://github.com/wess/verb)
- **Bun Documentation**: [bun.sh/docs](https://bun.sh/docs)
- **React Documentation**: [react.dev](https://react.dev)

## 🤝 Contributing

This boilerplate is designed to be a starting point. Feel free to:
- Add new features
- Improve the documentation
- Share your customizations
- Report issues or suggestions

## 📄 License

MIT License - feel free to use this boilerplate for any project!

---

**Happy coding!** 🎉 You now have a solid foundation for building modern fullstack applications with Verb and Bun.