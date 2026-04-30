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
  { id: 'chat', label: '聊天迭代', icon: MessageSquare },
  { id: 'a11y', label: '无障碍检查', icon: Shield },
]

export function SidePanel() {
  const [activeTab, setActiveTab] = useState<SidePanelTab>('copilot')

  return (
    <div className="flex flex-col h-full">
      <div className="h-10 border-b border-border flex items-center px-3 gap-1 bg-card flex-shrink-0">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-accent text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          )
        })}
      </div>
      <div className="flex-1 overflow-hidden">
        {activeTab === 'copilot' && <CopilotChatPanel />}
        {activeTab === 'chat' && <ChatWindow />}
        {activeTab === 'a11y' && <A11yReport />}
      </div>
    </div>
  )
}
