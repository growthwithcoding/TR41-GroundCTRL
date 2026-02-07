import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import App from './App.jsx'
import './index.css'

// Load fonts asynchronously to prevent render blocking
const loadFonts = () => {
  // Load critical fonts first (used in initial UI)
  import('@fontsource/geist-sans/400.css')
  import('@fontsource/geist-sans/500.css')
  import('@fontsource/geist-sans/600.css')
  import('@fontsource/geist-sans/700.css')

  // Load monospace fonts later (used in code blocks, etc.)
  setTimeout(() => {
    import('@fontsource/geist-mono/400.css')
    import('@fontsource/geist-mono/500.css')
    import('@fontsource/geist-mono/600.css')
    import('@fontsource/geist-mono/700.css')
    import('@fontsource/jetbrains-mono/400.css')
    import('@fontsource/jetbrains-mono/500.css')
    import('@fontsource/jetbrains-mono/600.css')
    import('@fontsource/jetbrains-mono/700.css')
  }, 100)
}

// Start loading fonts
loadFonts()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <App />
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>,
)
