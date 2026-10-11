import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { initTheme, lineProducts } from 'dowel-ui'
import { App } from './App'
import './styles.css'

// Before the first paint, so a reader who chose light does not see a flash of
// dark on the way in.
initTheme('dowel.demo.theme')

// kilna's colour, from the line's own registry rather than written down here.
const kilna = lineProducts.find((product) => product.name === 'kilna')
if (kilna) document.documentElement.style.setProperty('--accent-base', kilna.accent)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
