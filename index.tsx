

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx'; // Updated from named import to default
// import './index.css'; // Removed: this file was not provided and caused a SyntaxError

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);