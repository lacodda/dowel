import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { initTheme } from 'dowel-ui'
import { App } from './App'
import './styles.css'

// Before the first paint, so a reader who chose light does not see a flash of
// dark on the way in.
initTheme('dowel.stand.theme')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
