import { DEMO_PROMPTS } from '@/lib/constants'
import { useAppStore } from '@/stores/useAppStore'

export function DemoPrompts() {
  const setTextPrompt = useAppStore((s) => s.setTextPrompt)

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-foreground">快速示例</span>
      <div className="flex flex-col gap-1">
        {DEMO_PROMPTS.map((prompt, i) => (
          <button
            key={i}
            onClick={() => setTextPrompt(prompt)}
            className="text-left text-xs text-muted-foreground hover:text-foreground hover:bg-accent rounded px-2 py-1.5 transition-colors line-clamp-2"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  )
}
