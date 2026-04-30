import { Header } from './Header'
import { ThreeColumnLayout } from './ThreeColumnLayout'
import { InputPanel } from '@/components/input-panel/InputPanel'
import { PreviewPanel } from '@/components/preview-panel/PreviewPanel'
import { SidePanel } from '@/components/side-panel/SidePanel'

export function AppLayout() {
  return (
    <div className="h-screen flex flex-col">
      <Header />
      <ThreeColumnLayout
        left={<InputPanel />}
        center={<PreviewPanel />}
        right={<SidePanel />}
      />
    </div>
  )
}
