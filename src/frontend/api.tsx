import { createRoot } from "react-dom/client";
import { useState, useEffect } from "react";

interface User {
  id: number;
  name: string;
  email: string;
}

interface Product {
  id: number;
  name: string;
  price: number;
  inStock: boolean;
}

interface APIResponse {
  message: string;
  version: string;
  endpoints: string[];
}

function APIExplorer() {
  const [apiInfo, setApiInfo] = useState<APIResponse | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load API info
      const apiResponse = await fetch('/api');
      const apiData = await apiResponse.json();
      setApiInfo(apiData);

      // Load users
      const usersResponse = await fetch('/api/users');
      const usersData = await usersResponse.json();
      setUsers(usersData);

      // Load products
      const productsResponse = await fetch('/api/products');
      const productsData = await productsResponse.json();
      setProducts(productsData);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const testEndpoint = async (url: string, method: string = 'GET') => {
    try {
      const response = await fetch(url, { method });
      const data = await response.json();
      alert(`${method} ${url}\n\nResponse:\n${JSON.stringify(data, null, 2)}`);
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  if (loading) {
    return <div>Loading API data...</div>;
  }

  if (error) {
    return (
      <div>
        <div style={{ color: 'red', marginBottom: '20px' }}>Error: {error}</div>
        <button onClick={loadData}>Retry</button>
      </div>
    );
  }

  return (
    <div>
      {/* API Info Section */}
      <div className="endpoint-section">
        <div className="endpoint-header">
          <span className="method get">GET</span>
          /api - API Information
        </div>
        <div className="endpoint-content">
          <p>Get basic API information and available endpoints.</p>
          <button className="test-button" onClick={() => testEndpoint('/api')}>
            Test Endpoint
          </button>
          {apiInfo && (
            <div className="response">
              {JSON.stringify(apiInfo, null, 2)}
            </div>
          )}
        </div>
      </div>

      {/* Users Section */}
      <div className="endpoint-section">
        <div className="endpoint-header">
          <span className="method get">GET</span>
          /api/users - Users List
        </div>
        <div className="endpoint-content">
          <p>Get all users in the system.</p>
          <button className="test-button" onClick={() => testEndpoint('/api/users')}>
            Test Endpoint
          </button>
          <div className="response">
            {JSON.stringify(users, null, 2)}
          </div>
        </div>
      </div>

      <div className="endpoint-section">
        <div className="endpoint-header">
          <span className="method get">GET</span>
          /api/users/:id - Get User by ID
        </div>
        <div className="endpoint-content">
          <p>Get a specific user by their ID.</p>
          <button className="test-button" onClick={() => testEndpoint('/api/users/1')}>
            Test with ID 1
          </button>
          <button className="test-button" onClick={() => testEndpoint('/api/users/2')}>
            Test with ID 2
          </button>
        </div>
      </div>

      <div className="endpoint-section">
        <div className="endpoint-header">
          <span className="method post">POST</span>
          /api/users - Create New User
        </div>
        <div className="endpoint-content">
          <p>Create a new user. Requires name and email in request body.</p>
          <button 
            className="test-button" 
            onClick={() => {
              fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: 'Test User', email: 'test@example.com' })
              })
              .then(res => res.json())
              .then(data => {
                alert(`POST /api/users\n\nResponse:\n${JSON.stringify(data, null, 2)}`);
                loadData(); // Refresh data
              })
              .catch(err => alert(`Error: ${err.message}`));
            }}
          >
            Test Create User
          </button>
        </div>
      </div>

      {/* Products Section */}
      <div className="endpoint-section">
        <div className="endpoint-header">
          <span className="method get">GET</span>
          /api/products - Products List
        </div>
        <div className="endpoint-content">
          <p>Get all products. Supports ?inStock=true/false query parameter.</p>
          <button className="test-button" onClick={() => testEndpoint('/api/products')}>
            Test All Products
          </button>
          <button className="test-button" onClick={() => testEndpoint('/api/products?inStock=true')}>
            Test In-Stock Only
          </button>
          <div className="response">
            {JSON.stringify(products, null, 2)}
          </div>
        </div>
      </div>

      <div className="endpoint-section">
        <div className="endpoint-header">
          <span className="method get">GET</span>
          /api/products/:id - Get Product by ID
        </div>
        <div className="endpoint-content">
          <p>Get a specific product by its ID.</p>
          <button className="test-button" onClick={() => testEndpoint('/api/products/1')}>
            Test with ID 1
          </button>
          <button className="test-button" onClick={() => testEndpoint('/api/products/2')}>
            Test with ID 2
          </button>
        </div>
      </div>

      <div className="endpoint-section">
        <div className="endpoint-header">
          <span className="method post">POST</span>
          /api/products - Create New Product
        </div>
        <div className="endpoint-content">
          <p>Create a new product. Requires name and price in request body.</p>
          <button 
            className="test-button" 
            onClick={() => {
              fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: 'Test Product', price: 99.99, inStock: true })
              })
              .then(res => res.json())
              .then(data => {
                alert(`POST /api/products\n\nResponse:\n${JSON.stringify(data, null, 2)}`);
                loadData(); // Refresh data
              })
              .catch(err => alert(`Error: ${err.message}`));
            }}
          >
            Test Create Product
          </button>
        </div>
      </div>

      <div style={{ marginTop: '30px', padding: '20px', background: '#f8f9fa', borderRadius: '6px' }}>
        <h3>How to Use This API</h3>
        <p>This API supports standard REST operations:</p>
        <ul>
          <li><strong>GET</strong> - Retrieve data</li>
          <li><strong>POST</strong> - Create new resources</li>
          <li><strong>PUT</strong> - Update existing resources (not implemented in this demo)</li>
          <li><strong>DELETE</strong> - Remove resources (not implemented in this demo)</li>
        </ul>
        <p>All responses are in JSON format. POST requests require a JSON body with appropriate data.</p>
      </div>
    </div>
  );
}

document.addEventListener("DOMContentLoaded", () => {
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error("Root element not found");
  }

  createRoot(rootElement).render(<APIExplorer />);
});