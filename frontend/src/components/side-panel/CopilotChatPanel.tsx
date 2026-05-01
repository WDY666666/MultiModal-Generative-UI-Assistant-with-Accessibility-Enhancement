import { useEffect, useRef, useState } from 'react'
import { Bot, Code2, Loader2, Send, Sparkles } from 'lucide-react'
import { useAppStore } from '@/stores/useAppStore'
import { ChatMessage } from './ChatMessage'

const suggestions = [
  '基于当前预览，完善整个登录模块界面，增加表单校验、记住我、安全提示和更完整的品牌区。',
  '不要重新生成新页面，只迭代当前预览代码：把视觉做得更现代，增强按钮、输入框和焦点状态。',
  '基于当前代码修复潜在无障碍问题，补充 aria、label、键盘焦点和对比度细节。',
]

export function CopilotChatPanel() {
  const chatMessages = useAppStore((s) => s.chatMessages)
  const isChatLoading = useAppStore((s) => s.isChatLoading)
  const generatedCode = useAppStore((s) => s.generatedCode)
  const a11yResults = useAppStore((s) => s.a11yResults)
  const sendMessage = useAppStore((s) => s.sendMessage)
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages, isChatLoading])

  const handleSend = (message = input.trim()) => {
    if (!message || isChatLoading) return
    sendMessage(message)
    setInput('')
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="copilot-chat-panel flex h-full min-h-0 flex-col bg-background">
      <div className="border-b border-border bg-card/70 px-4 py-3">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <Bot className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-semibold text-foreground">CopilotKit 工作区助手</h2>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                可直接应用到预览
              </span>
            </div>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              已接入 CopilotKit Provider、readable state 和 actions。本面板会读取当前生成代码，通过后端
              <span className="mx-1 rounded bg-muted px-1 font-mono text-[11px]">/chat</span>
              迭代后直接更新中间 Sandpack 预览。
            </p>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1.5 rounded-xl border border-border bg-background px-2.5 py-2">
            <Code2 className="h-3.5 w-3.5 text-primary" />
            当前代码 {generatedCode.length.toLocaleString()} 字符
          </div>
          <div className="flex items-center gap-1.5 rounded-xl border border-border bg-background px-2.5 py-2">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            a11y 分数 {a11yResults?.score ?? '待扫描'}
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        {chatMessages.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-3 text-xs leading-5 text-muted-foreground">
            可以直接输入“完善当前登录页面”“把按钮改成蓝色”“修复无障碍问题”等指令。
            助手会基于当前预览代码修改，而不是重新开一个和预览脱节的代码块。
          </div>
        ) : (
          chatMessages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))
        )}

        {isChatLoading && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>正在基于当前预览代码迭代...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-border bg-card/70 p-3">
        <div className="mb-2 flex gap-2 overflow-x-auto pb-1">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => handleSend(suggestion)}
              disabled={isChatLoading}
              className="shrink-0 rounded-full border border-border bg-background px-3 py-1.5 text-[11px] text-muted-foreground transition hover:border-primary/40 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              {suggestion}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入迭代指令，会直接应用到当前预览..."
            disabled={isChatLoading}
            className="h-10 min-w-0 flex-1 rounded-xl border border-border bg-background px-3 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
          />
          <button
            type="button"
            onClick={() => handleSend()}
            disabled={!input.trim() || isChatLoading}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="发送并应用到预览"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
