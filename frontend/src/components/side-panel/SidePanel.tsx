import { useState } from 'react'
import { ChatWindow } from './ChatWindow'
import { A11yReport } from './A11yReport'
import { MessageSquare, Shield } from 'lucide-react'

export function SidePanel() {
  const [activeTab, setActiveTab] = useState<'chat' | 'a11y'>('chat')

  return (
    <div className="flex flex-col h-full">
      <div className="h-10 border-b border-border flex items-center px-3 gap-1 bg-card flex-shrink-0">
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
            activeTab === 'chat'
              ? 'bg-accent text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          聊天迭代
        </button>
        <button
          onClick={() => setActiveTab('a11y')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
            activeTab === 'a11y'
              ? 'bg-accent text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          无障碍检查
        </button>
      </div>
      <div className="flex-1 overflow-hidden">
        {activeTab === 'chat' ? <ChatWindow /> : <A11yReport />}
      </div>
    </div>
  )
}
