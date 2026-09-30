import React from 'react'
import ReactDOM from 'react-dom/client'
import '../index.css'
import { ThemeProvider } from '@/components/theme-provider'
import { MockupEditor } from '@/mockup'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <MockupEditor />
    </ThemeProvider>
  </React.StrictMode>
)
