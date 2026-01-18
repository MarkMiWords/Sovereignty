
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error("[Boot] FATAL: Root element missing in index.html.");
} else {
  try {
    console.log("[Boot] Initializing Sovereign Engine...");
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log("[Boot] Render Complete.");
  } catch (err) {
    console.error("[Boot] Initialization Failed:", err);
    rootElement.innerHTML = `
      <div style="height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #050505; color: #e67e22; font-family: serif; text-align: center; padding: 20px;">
        <h1 style="font-size: 3rem; margin-bottom: 20px;">Boot Interrupted.</h1>
        <p style="color: #666; max-width: 500px; line-height: 1.6;">The Sovereign Engine encountered an error during initialization. This is usually due to browser security restrictions on IndexedDB or an outdated cache.</p>
        <button onclick="localStorage.clear(); location.reload();" style="margin-top: 40px; background: #e67e22; color: white; border: none; padding: 15px 30px; cursor: pointer; text-transform: uppercase; letter-spacing: 0.2em; font-weight: bold;">Force Hard Reset</button>
      </div>
    `;
  }
}
