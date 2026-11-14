import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

window.addEventListener('error', (e) => {
  const root = document.getElementById('root')
  if (root) {
    root.innerHTML = '<div style="padding:24px;color:#fb7185;background:#070b14;min-height:100vh;"><h2>App Startup Issue Detected</h2><p style="color:#9aa8c7;">' + (e.message || 'Error') + '</p></div>'
  }
})

const rootElement = document.getElementById('root')
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
}