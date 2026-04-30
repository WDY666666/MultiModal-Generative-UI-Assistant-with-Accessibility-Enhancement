import { User, Bot } from 'lucide-react'
import type { ChatMessage as ChatMessageType } from '@/types'

interface ChatMessageProps {
  message: ChatMessageType
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex gap-2 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div
        className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
          isUser ? 'bg-primary' : 'bg-accent'
        }`}
      >
        {isUser ? (
          <User className="w-3 h-3 text-primary-foreground" />
        ) : (
          <Bot className="w-3 h-3 text-foreground" />
        )}
      </div>
      <div
        className={`max-w-[85%] rounded-lg px-3 py-2 text-xs leading-relaxed ${
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-accent text-foreground'
        }`}
      >
        {message.content}
      </div>
    </div>
  )
}
