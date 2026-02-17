/**
 * @author Prahlad Yadav
 * @version 1.0
 * @since 2026-02-16
 */
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import AppErrorBoundary from './components/AppErrorBoundary.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import './index.css'

if (typeof globalThis.global === 'undefined') {
  globalThis.global = globalThis
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <AppErrorBoundary>
        <App />
      </AppErrorBoundary>
    </ThemeProvider>
  </React.StrictMode>,
)
