import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, AlertTriangle, ChevronDown, Info, Loader2, MessageSquareText, Sparkles, Zap } from 'lucide-react'

import { api } from '@/services/api'
import { useAppStore } from '@/stores/useAppStore'
import { extractCodeFromResponse, isPreviewableReactCode } from '@/lib/utils'
import type { A11yIssue as A11yIssueType } from '@/types'

interface A11yIssueProps {
  issue: A11yIssueType
}

const impactConfig = {
  critical: { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', label: '严重' },
  serious: { icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', label: '高' },
  moderate: { icon: Info, color: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-200', label: '中' },
  minor: { icon: Info, color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', label: '低' },
} as const

export function A11yIssue({ issue }: A11yIssueProps) {
  const [expanded, setExpanded] = useState(false)
  const [isFixing, setIsFixing] = useState(false)
  const [isExplaining, setIsExplaining] = useState(false)
  const [explanation, setExplanation] = useState(issue.explanation || issue.description)
  const [fixSuggestion, setFixSuggestion] = useState(issue.fixSuggestion || '')

  const generatedCode = useAppStore((state) => state.generatedCode)
  const updateGeneratedCode = useAppStore((state) => state.updateGeneratedCode)
  const addChatMessages = useAppStore((state) => state.addChatMessages)

  const config = impactConfig[issue.impact]
  const Icon = config.icon

  const shouldFetchExplanation = useMemo(() => {
    return expanded && !isExplaining && (!explanation || explanation === issue.description)
  }, [expanded, isExplaining, explanation, issue.description])

  useEffect(() => {
    if (!shouldFetchExplanation) {
      return
    }

    let cancelled = false

    const run = async () => {
      setIsExplaining(true)
      try {
        const response = await api.explainIssue({ issue, currentCode: generatedCode })
        if (!cancelled) {
          if (response.explanation?.trim()) {
            setExplanation(response.explanation.trim())
          }
          if (response.fixSuggestion?.trim()) {
            setFixSuggestion(response.fixSuggestion.trim())
          }
        }
      } catch {
        // Keep fallback text when explanation request fails.
      } finally {
        if (!cancelled) {
          setIsExplaining(false)
        }
      }
    }

    run()

    return () => {
      cancelled = true
    }
  }, [shouldFetchExplanation, generatedCode, issue])

  const handleFix = async () => {
    setIsFixing(true)
    try {
      const response = await api.fix({ issue, currentCode: generatedCode })
      const code = extractCodeFromResponse(response.fixCode)

      if (isPreviewableReactCode(code)) {
        updateGeneratedCode(code, response.css)
        addChatMessages([
          {
            role: 'assistant',
            content: `已一键修复无障碍问题：${issue.help}`,
          },
        ])
      } else {
        addChatMessages([
          {
            role: 'assistant',
            content: `模型返回的修复代码不可预览，已保留当前预览（问题：${issue.help}）。`,
          },
        ])
      }
    } catch {
      addChatMessages([
        {
          role: 'assistant',
          content: `一键修复失败，请重试（问题：${issue.help}）。`,
        },
      ])
    } finally {
      setIsFixing(false)
    }
  }

  return (
    <div className={`overflow-hidden rounded-md border ${config.border} ${config.bg}`}>
      <button
        onClick={() => setExpanded((value) => !value)}
        className="flex w-full items-start gap-2 p-2.5 text-left"
      >
        <Icon className={`mt-0.5 h-3.5 w-3.5 flex-shrink-0 ${config.color}`} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-xs font-medium text-foreground">{issue.help}</span>
            <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${config.color} ${config.bg}`}>
              {config.label}
            </span>
          </div>
          <p className="mt-0.5 text-[10px] text-muted-foreground">影响 {issue.nodes} 个元素</p>
        </div>
        <ChevronDown
          className={`h-3.5 w-3.5 flex-shrink-0 text-muted-foreground transition-transform ${expanded ? 'rotate-180' : ''}`}
        />
      </button>

      {expanded && (
        <div className="space-y-2 px-2.5 pb-2.5">
          <div className="rounded bg-background/50 p-2">
            <p className="text-[10px] font-medium text-muted-foreground">问题说明</p>
            {isExplaining ? (
              <div className="mt-1 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                正在生成解释...
              </div>
            ) : (
              <p className="mt-1 text-[10px] leading-relaxed text-foreground">{explanation}</p>
            )}
          </div>

          {(fixSuggestion || isExplaining) && (
            <div className="rounded bg-background/50 p-2">
              <div className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
                <MessageSquareText className="h-3 w-3" />
                修复建议
              </div>
              {isExplaining ? (
                <p className="mt-1 text-[10px] text-muted-foreground">正在整理建议...</p>
              ) : (
                <p className="mt-1 text-[10px] leading-relaxed text-foreground">{fixSuggestion}</p>
              )}
            </div>
          )}

          <button
            onClick={handleFix}
            disabled={isFixing}
            className="flex items-center gap-1.5 rounded bg-primary px-2.5 py-1.5 text-[10px] font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {isFixing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}
            {isFixing ? '正在应用修复...' : '一键修复'}
          </button>

          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Sparkles className="h-3 w-3" />
            修复会尽量保持当前页面结构，并直接更新预览。
          </div>
        </div>
      )}
    </div>
  )
}
