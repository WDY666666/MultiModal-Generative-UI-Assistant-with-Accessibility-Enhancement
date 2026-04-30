import type { ReactNode } from 'react'

interface ThreeColumnLayoutProps {
  left: ReactNode
  center: ReactNode
  right: ReactNode
}

export function ThreeColumnLayout({ left, center, right }: ThreeColumnLayoutProps) {
  return (
    <div className="flex-1 flex overflow-hidden">
      <aside className="w-80 min-w-[280px] border-r border-border bg-card overflow-y-auto flex-shrink-0">
        {left}
      </aside>
      <main className="flex-1 min-w-0 overflow-hidden flex flex-col">
        {center}
      </main>
      <aside className="w-96 min-w-[320px] border-l border-border bg-card overflow-y-auto flex-shrink-0">
        {right}
      </aside>
    </div>
  )
}
