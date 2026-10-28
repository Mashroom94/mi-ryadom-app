import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AppProvider } from './context/AppContext'
import './styles.css'
import './interaction-fixes.css'
import { registerPwa } from './services/pwaUpdate'

window.addEventListener('load', () => void registerPwa())

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppProvider><App /></AppProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
