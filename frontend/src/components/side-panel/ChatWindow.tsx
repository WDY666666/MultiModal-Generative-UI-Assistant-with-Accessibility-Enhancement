import { useState, useRef, useEffect } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { useAppStore } from '@/stores/useAppStore'
import { ChatMessage } from './ChatMessage'

export function ChatWindow() {
  const chatMessages = useAppStore((s) => s.chatMessages)
  const isChatLoading = useAppStore((s) => s.isChatLoading)
  const sendMessage = useAppStore((s) => s.sendMessage)
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  const handleSend = () => {
    if (!input.trim() || isChatLoading) return
    sendMessage(input.trim())
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {chatMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
            生成 UI 后，可通过对话继续迭代修改。
          </div>
        ) : (
          chatMessages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))
        )}
        {isChatLoading && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>AI 正在思考...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 border-t border-border">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入修改指令，如：把主按钮改成蓝色..."
            className="flex-1 h-9 rounded-md border border-border bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            disabled={isChatLoading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isChatLoading}
            className="h-9 w-9 rounded-md bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="发送修改指令"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
