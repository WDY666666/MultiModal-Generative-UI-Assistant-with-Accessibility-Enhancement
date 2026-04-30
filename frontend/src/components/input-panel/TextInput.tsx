import { useAppStore } from '@/stores/useAppStore'

export function TextInput() {
  const textPrompt = useAppStore((s) => s.textPrompt)
  const setTextPrompt = useAppStore((s) => s.setTextPrompt)

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor="prompt-input" className="text-xs font-medium text-foreground">
        自然语言描述
      </label>
      <textarea
        id="prompt-input"
        className="w-full h-32 resize-none rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
        placeholder="例如：创建一个现代风格的登录页面，包含邮箱和密码输入框，登录按钮，以及忘记密码链接..."
        value={textPrompt}
        onChange={(e) => setTextPrompt(e.target.value)}
      />
    </div>
  )
}
