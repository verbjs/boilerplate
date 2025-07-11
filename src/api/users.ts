// User data store (in a real app, this would be a database)
const users = [
  { id: 1, name: 'John Doe', email: 'john@example.com' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
];

export const userHandlers = {
  async GET(req: Request) {
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
  }
};

export const getUserById = async (req: Request & { params?: { id: string } }) => {
  const id = parseInt(req.params?.id || '0');
  const user = users.find(u => u.id === id);
  if (!user) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }
  return Response.json(user);
};

// Export users data for external access
export { users };