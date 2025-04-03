// Import Promise polyfill first for global application use
import 'promise-polyfill/src/polyfill';

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css"; // Global styles

// Set up global unhandled promise rejection handler
window.addEventListener('unhandledrejection', function(event) {
  console.error('Unhandled promise rejection:', event.reason);
  
  // Prevent the default handling (which would log to console)
  event.preventDefault();
});

// Log that the app is starting with Promise support
console.log('App starting with Promise support:', typeof Promise !== 'undefined');

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
