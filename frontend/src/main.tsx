import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { CopilotKit } from '@copilotkit/react-core'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CopilotKit runtimeUrl="/api/copilotkit" showDevConsole={false}>
      <App />
    </CopilotKit>
  </StrictMode>,
)
