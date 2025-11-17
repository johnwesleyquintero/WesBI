
import * as React from 'react';
import { createRoot } from 'react-dom/client';
import * as ReactDOM from 'react-dom';
import App from './App';
import { AppProvider } from './state/appContext';

// Production Fix: UMD libraries like Recharts, loaded via CDN, expect `React` to be a global
// object. However, the `React` object imported from an ES module is frozen (not extensible).
// Older libraries that try to attach properties to it (like the legacy `PropTypes`) will
// cause a "Cannot add property" TypeError.
//
// To solve this, we create a new, extensible object that spreads all properties from the
// imported `React` module. We then attach `PropTypes` to this copy and expose the result
// globally as `window.React`.
const extensibleReact = { ...React };
if ((window as any).PropTypes) {
  (extensibleReact as any).PropTypes = (window as any).PropTypes;
}

(window as any).React = extensibleReact;
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
