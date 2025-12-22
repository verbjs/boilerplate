# Boilerplate Documentation

The official Verb + Bun fullstack boilerplate with tutorial.

## Quick Start

```bash
cd boilerplate
bun install
bun run dev
```

Visit:
- **Main App**: http://localhost:3001
- **API Explorer**: http://localhost:3001/api-demo

## Documentation

- [Tutorial](./tutorial.md) - Step-by-step guide
- [API Routes](./api-routes.md) - Backend API reference
- [Frontend](./frontend.md) - React component guide
- [Customization](./customization.md) - Extending the boilerplate

## Project Structure

```
src/
├── main.ts              # Server with withRoutes
├── frontend/
│   ├── index.html       # Main page
│   ├── index.tsx        # User management app
│   ├── api.html         # API explorer
│   └── api.tsx          # Interactive docs
└── types.d.ts           # TypeScript declarations
```

## Features

### Backend

- Verb framework with Bun routing
- REST API (Users, Products)
- Parameter extraction
- Error handling

### Frontend

- React 18 with TypeScript
- Automatic bundling
- CSS hot reloading
- User management UI

### Development

- Hot Module Reloading
- Zero configuration
- Enhanced console
- Route display

## Available Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start dev server with HMR |
| `bun run start` | Start production server |
| `bun run build` | Build application |
| `bun test` | Run tests |
| `bun run lint` | Lint with Biome |
| `bun run format` | Format with Biome |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api` | API info |
| GET | `/api/health` | Health check |
| GET | `/api/users` | List users |
| POST | `/api/users` | Create user |
| GET | `/api/users/:id` | Get user |
| GET | `/api/products` | List products |
| POST | `/api/products` | Create product |
| GET | `/api/products/:id` | Get product |
