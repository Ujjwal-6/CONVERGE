import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Obtaining the root element from the DOM
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// React 18 createRoot API
const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);