import React from 'react'
import ReactDOM from 'react-dom/client'
import Editor from './Editor'
import '../index.css'
import { ThemeProvider } from '@/components/theme-provider'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <Editor />
    </ThemeProvider>
  </React.StrictMode>
)
