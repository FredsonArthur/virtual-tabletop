import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// O Strict Mode foi removido para evitar o duplo ciclo de montagem no Canvas do PixiJS
createRoot(document.getElementById('root')).render(
  <App />
)