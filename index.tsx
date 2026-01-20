
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const mountApp = () => {
  try {
    const rootElement = document.getElementById('root');
    if (!rootElement) {
      throw new Error("Target container #root not found in DOM.");
    }

    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (error: any) {
    console.error("MOUNT FAILURE:", error);
    // Explicitly trigger the index.html window.onerror logic
    if (window.onerror) {
      window.onerror(error.message, 'index.tsx', 0, 0, error);
    }
  }
};

mountApp();
