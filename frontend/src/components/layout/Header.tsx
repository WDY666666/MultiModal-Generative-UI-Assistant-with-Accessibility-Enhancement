import { Sparkles, ExternalLink } from 'lucide-react'

export function Header() {
  return (
    <header className="h-14 border-b border-border flex items-center justify-between px-4 bg-card">
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-primary" />
        <h1 className="text-sm font-semibold text-foreground">
          多模态生成式 UI 助手
        </h1>
        <span className="text-xs text-muted-foreground bg-accent px-2 py-0.5 rounded-full">
          带包容性增强
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground">
          React + Tailwind / AI 驱动 / 无障碍优先
        </span>
        <a
          href="https://github.com/WDY666666/MultiModal-Generative-UI-Assistant-with-Accessibility-Enhancement"
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label="打开 GitHub 仓库"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </header>
  )
}
