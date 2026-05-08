import { Bot, Layers3, Route, Sparkles } from 'lucide-react'

import { useAppStore } from '@/stores/useAppStore'

function getModeLabel(mode: string) {
  if (mode === 'modal') return '弹窗流'
  if (mode === 'history-routes') return '真实跳转'
  if (mode === 'state-routes') return '状态切页'
  return '单屏交互'
}

export function InteractionPlanCard() {
  const interactionPlan = useAppStore((state) => state.interactionPlan)

  if (!interactionPlan) {
    return null
  }

  return (
    <section className="rounded-2xl border border-border bg-card/70 p-3 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Bot className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">智能任务拆解</h3>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
              {getModeLabel(interactionPlan.navigationMode)}
            </span>
          </div>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">{interactionPlan.summary}</p>
        </div>
      </div>

      <div className="mt-3 grid gap-2">
        <div className="rounded-xl border border-border bg-background px-3 py-2">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            实现策略
          </div>
          <p className="mt-1 text-[11px] leading-5 text-muted-foreground">{interactionPlan.implementationStrategy}</p>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="rounded-xl border border-border bg-background px-3 py-2">
            <div className="flex items-center gap-1.5 font-medium text-foreground">
              <Layers3 className="h-3.5 w-3.5 text-primary" />
              主视图
            </div>
            <p className="mt-1 leading-5 text-muted-foreground">
              {interactionPlan.primaryViews.join('、') || '暂无'}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-background px-3 py-2">
            <div className="flex items-center gap-1.5 font-medium text-foreground">
              <Route className="h-3.5 w-3.5 text-primary" />
              流程任务
            </div>
            <p className="mt-1 leading-5 text-muted-foreground">
              {interactionPlan.taskBreakdown.slice(0, 2).join('；') || '暂无'}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
