import { useEffect, useRef } from 'react'
import { Shield, Loader2, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react'
import { useAppStore } from '@/stores/useAppStore'
import { useA11yScan } from '@/hooks/useA11yScan'
import { A11yIssue } from './A11yIssue'

export function A11yReport() {
  const a11yResults = useAppStore((s) => s.a11yResults)
  const isScanning = useAppStore((s) => s.isScanning)
  const generatedCode = useAppStore((s) => s.generatedCode)
  const { triggerScan } = useA11yScan()
  const prevCodeRef = useRef(generatedCode)

  useEffect(() => {
    if (generatedCode !== prevCodeRef.current) {
      prevCodeRef.current = generatedCode
      const timer = window.setTimeout(() => {
        triggerScan()
      }, 3000)
      return () => window.clearTimeout(timer)
    }
  }, [generatedCode, triggerScan])

  if (isScanning) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
        <span className="text-xs text-muted-foreground">正在扫描无障碍问题...</span>
      </div>
    )
  }

  if (!a11yResults) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 px-4">
        <Shield className="w-8 h-8 text-muted-foreground/40" />
        <p className="text-xs text-muted-foreground text-center">
          生成 UI 后将自动进行无障碍扫描
        </p>
        <button onClick={triggerScan} className="text-xs text-primary hover:underline">
          手动触发扫描
        </button>
      </div>
    )
  }

  const hasViolations = a11yResults.violations.length > 0

  return (
    <div className="p-3 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-foreground">扫描结果</h3>
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              hasViolations
                ? 'bg-destructive/10 text-destructive'
                : 'bg-success/10 text-success'
            }`}
          >
            {hasViolations ? `${a11yResults.violations.length} 个问题` : '全部通过'}
          </span>
          <button
            onClick={triggerScan}
            className="text-muted-foreground hover:text-foreground transition-colors"
            title="重新扫描"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {a11yResults.score !== undefined && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">无障碍评分：</span>
          <span
            className={`text-sm font-bold ${
              a11yResults.score >= 90
                ? 'text-success'
                : a11yResults.score >= 70
                  ? 'text-warning'
                  : 'text-destructive'
            }`}
          >
            {a11yResults.score}/100
          </span>
        </div>
      )}

      <div className="flex gap-3 text-xs">
        <div className="flex items-center gap-1 text-success">
          <CheckCircle className="w-3.5 h-3.5" />
          <span>{a11yResults.passes} 通过</span>
        </div>
        <div className="flex items-center gap-1 text-destructive">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>{a11yResults.violations.length} 失败</span>
        </div>
      </div>

      <div className="space-y-2">
        {hasViolations && (
          <p className="text-[11px] text-muted-foreground">
            展开每条问题可查看 AI 解释与修复建议，再按需一键修复。
          </p>
        )}
        {a11yResults.violations.map((issue) => (
          <A11yIssue key={issue.id} issue={issue} />
        ))}
      </div>
    </div>
  )
}
