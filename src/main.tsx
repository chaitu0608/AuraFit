import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { initAuthDeepLink } from '@/lib/authDeepLink'
import './styles/tailwind.css'

initAuthDeepLink()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
