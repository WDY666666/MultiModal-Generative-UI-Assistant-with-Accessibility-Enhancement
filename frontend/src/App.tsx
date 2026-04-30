import { AppLayout } from '@/components/layout/AppLayout'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import { CopilotActions } from '@/components/copilot/CopilotActions'

export default function App() {
  return (
    <ErrorBoundary>
      <CopilotActions />
      <AppLayout />
    </ErrorBoundary>
  )
}
