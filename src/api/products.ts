// Product data store (in a real app, this would be a database)
const products = [
  { id: 1, name: 'Laptop', price: 999.99, inStock: true },
  { id: 2, name: 'Phone', price: 599.99, inStock: false },
  { id: 3, name: 'Tablet', price: 299.99, inStock: true }
];

export const productHandlers = {
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
  }
};

export const getProductById = async (req: Request & { params?: { id: string } }) => {
  const id = parseInt(req.params?.id || '0');
  const product = products.find(p => p.id === id);
  if (!product) {
    return Response.json({ error: "Product not found" }, { status: 404 });
  }
  return Response.json(product);
};

// Export products data for external access
export { products };