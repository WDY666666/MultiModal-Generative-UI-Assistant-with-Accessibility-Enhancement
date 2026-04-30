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
        placeholder="例如：创建一个现代风格的在线教育仪表盘，左侧导航栏，右侧显示统计卡片和学习进度，支持响应式布局..."
        value={textPrompt}
        onChange={(e) => setTextPrompt(e.target.value)}
      />
    </div>
  )
}
