import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { setTheme } from './kijazo/core'
import { site } from './content'
import './styles.css'
import './mwaweru.css'
import './components/elsewhere.css'
import './components/world-expansion.css'

setTheme(site.kijazoTheme)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
