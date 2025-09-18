import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import App from './App.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(148, 163, 184, 0.2)',
          borderRadius: '12px',
          color: '#f1f5f9',
          fontSize: '14px',
          fontWeight: '500',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
        },
        success: {
          style: {
            border: '1px solid rgba(34, 197, 94, 0.3)',
            background: 'rgba(15, 23, 42, 0.95)',
            color: '#22c55e',
          },
          iconTheme: {
            primary: '#22c55e',
            secondary: 'rgba(15, 23, 42, 0.95)',
          },
        },
        error: {
          style: {
            border: '1px solid rgba(239, 68, 68, 0.3)',
            background: 'rgba(15, 23, 42, 0.95)',
            color: '#ef4444',
          },
          iconTheme: {
            primary: '#ef4444',
            secondary: 'rgba(15, 23, 42, 0.95)',
          },
        },
        loading: {
          style: {
            border: '1px solid rgba(59, 130, 246, 0.3)',
            background: 'rgba(15, 23, 42, 0.95)',
            color: '#3b82f6',
          },
          iconTheme: {
            primary: '#3b82f6',
            secondary: 'rgba(15, 23, 42, 0.95)',
          },
        },
      }}
    />
  </StrictMode>
);
