
import React from 'react';
import { createRoot } from 'react-dom/client';
import * as ReactDOM from 'react-dom';
import App from './App';
import { AppProvider } from './state/appContext';

// Expose React and ReactDOM to the global scope so UMD libraries like Recharts can find them.
// This is a common requirement when mixing ESM modules with older script formats.
(window as any).React = React;
(window as any).ReactDOM = ReactDOM;

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </React.StrictMode>
);