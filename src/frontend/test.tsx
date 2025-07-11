import React from "react";
import { createRoot } from "react-dom/client";

function SimpleApp() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🚀 React is Working!</h1>
      <p>This is a simple test to verify React mounting.</p>
      <p>Current time: {new Date().toLocaleString()}</p>
    </div>
  );
}

console.log("Script loaded!");

// Mount the React app
function mountApp() {
  const rootElement = document.getElementById("root");
  console.log("Root element:", rootElement);
  
  if (!rootElement) {
    console.error("Root element not found!");
    return;
  }
  
  console.log("Mounting React app...");
  const root = createRoot(rootElement);
  root.render(<SimpleApp />);
  console.log("React app mounted!");
}

// Try to mount immediately if DOM is ready, otherwise wait for it
if (document.readyState === 'loading') {
  console.log("DOM is loading, waiting for DOMContentLoaded...");
  document.addEventListener('DOMContentLoaded', mountApp);
} else {
  console.log("DOM is ready, mounting immediately...");
  mountApp();
}