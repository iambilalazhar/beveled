import React from 'react'
import ReactDOM from 'react-dom/client'
import '../index.css'
import { ThemeProvider } from '@/components/theme-provider'
import { Studio } from '@/studio/Studio'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <Studio />
    </ThemeProvider>
  </React.StrictMode>
)
