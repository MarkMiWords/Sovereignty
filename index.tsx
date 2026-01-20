
import React from 'react';
import ReactDOM from 'react-dom/client';

async function bootstrap() {
  const { default: App } = await import('./App.tsx');
  const rootEl = document.getElementById('root');
  if (rootEl) {
    const root = ReactDOM.createRoot(rootEl);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    
    // Cleanup sentinel
    const sentinel = document.getElementById('loading-sentinel');
    if (sentinel) sentinel.remove();
  }
}

bootstrap().catch(err => {
  console.error("Critical mount failure:", err);
  document.body.innerHTML = `<div style="padding:40px;color:red;font-family:monospace;">BOOT_ERROR: ${err.message}</div>`;
});
