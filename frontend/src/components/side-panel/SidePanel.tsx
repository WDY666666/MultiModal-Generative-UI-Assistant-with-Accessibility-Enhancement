import { useState } from 'react'
import { Bot, MessageSquare, Shield } from 'lucide-react'
import { ChatWindow } from './ChatWindow'
import { A11yReport } from './A11yReport'
import { CopilotChatPanel } from './CopilotChatPanel'

type SidePanelTab = 'copilot' | 'chat' | 'a11y'

const tabs: Array<{
  id: SidePanelTab
  label: string
  icon: typeof Bot
}> = [
  { id: 'copilot', label: 'CopilotKit', icon: Bot },
  { id: 'chat', label: 'Manual Chat', icon: MessageSquare },
  { id: 'a11y', label: 'A11y Scan', icon: Shield },
]

export function SidePanel() {
  const [activeTab, setActiveTab] = useState<SidePanelTab>('copilot')

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-10 flex-shrink-0 items-center gap-1 border-b border-border bg-card px-3">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-accent text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          )
        })}
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        {activeTab === 'copilot' && <CopilotChatPanel />}
        {activeTab === 'chat' && <ChatWindow />}
        {activeTab === 'a11y' && <A11yReport />}
      </div>
    </div>
  )
}
