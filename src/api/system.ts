// System-level API handlers

export const apiInfoHandler = async () => {
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
};

export const healthHandler = async () => {
  return Response.json({ 
    status: "healthy", 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
};