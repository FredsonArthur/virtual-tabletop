import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// O Strict Mode foi removido para evitar o duplo ciclo de montagem no Canvas
ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)