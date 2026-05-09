import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { AuthProvider } from './context/AuthContext.jsx'
import { Toaster } from 'react-hot-toast'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#1a1a28', color: '#f0f0ff', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px' },
          success: { iconTheme: { primary: '#10b981', secondary: '#1a1a28' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#1a1a28' } }
        }}
      />
    </AuthProvider>
  </React.StrictMode>
)
