
import React from 'react';
import { createRoot } from 'react-dom/client';
import * as ReactDOM from 'react-dom';
import App from './App';
import { AppProvider } from './state/appContext';

// Expose React and ReactDOM to the global scope so UMD libraries like Recharts can find them.
// This is a common requirement when mixing ESM modules with older script formats.
(window as any).React = React;
(window as any).ReactDOM = ReactDOM;

// Production Fix: Some UMD libraries like Recharts still rely on the legacy `PropTypes`
// library being attached to the React object. Since `prop-types` is now a separate package
// (loaded via CDN in index.html), we manually attach it here to prevent runtime errors.
if ((window as any).PropTypes) {
  (window as any).React.PropTypes = (window as any).PropTypes;
}

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