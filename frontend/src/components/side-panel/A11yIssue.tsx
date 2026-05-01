import { useState } from 'react'
import { ChevronDown, AlertTriangle, AlertCircle, Info, Zap } from 'lucide-react'
import { api } from '@/services/api'
import { useAppStore } from '@/stores/useAppStore'
import type { A11yIssue as A11yIssueType } from '@/types'

interface A11yIssueProps {
  issue: A11yIssueType
}

const impactConfig = {
  critical: { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
  serious: { icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
  moderate: { icon: Info, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' },
  minor: { icon: Info, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
}

export function A11yIssue({ issue }: A11yIssueProps) {
  const [expanded, setExpanded] = useState(false)
  const [isFixing, setIsFixing] = useState(false)
  const generatedCode = useAppStore((s) => s.generatedCode)
  const updateGeneratedCode = useAppStore((s) => s.updateGeneratedCode)

  const config = impactConfig[issue.impact]
  const Icon = config.icon

  const handleFix = async () => {
    setIsFixing(true)
    try {
      const response = await api.fix({ issue, currentCode: generatedCode })
      updateGeneratedCode(response.fixCode, response.css)
    } catch {
      // The report stays visible so the user can retry.
    } finally {
      setIsFixing(false)
    }
  }

  return (
    <div className={`rounded-md border ${config.border} ${config.bg} overflow-hidden`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-start gap-2 p-2.5 text-left"
      >
        <Icon className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${config.color}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-foreground truncate">
              {issue.help}
            </span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${config.color} ${config.bg}`}>
              {issue.impact}
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            影响 {issue.nodes} 个元素
          </p>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-muted-foreground transition-transform flex-shrink-0 ${
            expanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      {expanded && (
        <div className="px-2.5 pb-2.5 space-y-2">
          <p className="text-[10px] text-foreground leading-relaxed">
            {issue.explanation || issue.description}
          </p>

          {issue.fixSuggestion && (
            <div className="bg-background/50 rounded p-2">
              <p className="text-[10px] text-muted-foreground">
                {issue.fixSuggestion}
              </p>
            </div>
          )}

          <button
            onClick={handleFix}
            disabled={isFixing}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[10px] font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            <Zap className="w-3 h-3" />
            {isFixing ? '正在修复...' : '一键修复'}
          </button>
        </div>
      )}
    </div>
  )
}
