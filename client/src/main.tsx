import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './App.css';
import SelectedDirectoryProvider from './context/directory-dialog';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <SelectedDirectoryProvider>
      <App />
    </SelectedDirectoryProvider>
  </React.StrictMode>
);
