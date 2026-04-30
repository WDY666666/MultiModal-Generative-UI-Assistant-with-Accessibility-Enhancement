import { useEffect, useCallback } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import { api } from '@/services/api'
import type { A11yResults, A11yIssue } from '@/types'

interface AxeViolation {
  id: string
  impact: string
  description: string
  help: string
  helpUrl: string
  nodes: { target: string[] }[]
}

interface AxeMessage {
  type: string
  violations?: AxeViolation[]
  passes?: number
  incomplete?: number
}

export function useA11yScan() {
  const setA11yResults = useAppStore((s) => s.setA11yResults)
  const setIsScanning = useAppStore((s) => s.setIsScanning)
  const generatedCode = useAppStore((s) => s.generatedCode)

  const processResults = useCallback(
    async (data: AxeMessage) => {
      if (data.type !== 'AXE_RESULTS') return

      const violations: A11yIssue[] = (data.violations || []).map((v) => ({
        id: v.id,
        impact: v.impact as A11yIssue['impact'],
        description: v.description,
        help: v.help,
        helpUrl: v.helpUrl,
        nodes: v.nodes.length,
      }))

      const results: A11yResults = {
        violations,
        passes: data.passes || 0,
        incomplete: data.incomplete || 0,
        score:
          data.passes && data.passes + violations.length > 0
            ? Math.round((data.passes / (data.passes + violations.length)) * 100)
            : 100,
      }

      setA11yResults(results)
      setIsScanning(false)

      // 请求 LLM 解释每个问题
      if (violations.length > 0) {
        try {
          const explained = await Promise.all(
            violations.map(async (issue) => {
              try {
                const res = await api.fix({
                  issue,
                  currentCode: generatedCode,
                })
                return {
                  ...issue,
                  explanation: res.explanation,
                  fixCode: res.fixCode,
                }
              } catch {
                return issue
              }
            })
          )
          setA11yResults({ ...results, violations: explained })
        } catch {
          // 解释失败不影响主流程
        }
      }
    },
    [setA11yResults, setIsScanning, generatedCode]
  )

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data?.type === 'AXE_RESULTS') {
        processResults(event.data)
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [processResults])

  const triggerScan = useCallback(() => {
    setIsScanning(true)
    const fallbackTimer = window.setTimeout(() => {
      setIsScanning(false)
    }, 5000)

    const iframe = document.querySelector('.sp-preview-iframe') as HTMLIFrameElement
    if (iframe?.contentWindow) {
      iframe.contentWindow.postMessage({ type: 'RUN_AXE_SCAN' }, '*')
    } else {
      // iframe 未就绪，延迟重试
      setTimeout(() => {
        const retryIframe = document.querySelector('.sp-preview-iframe') as HTMLIFrameElement
        if (retryIframe?.contentWindow) {
          retryIframe.contentWindow.postMessage({ type: 'RUN_AXE_SCAN' }, '*')
        } else {
          window.clearTimeout(fallbackTimer)
          setIsScanning(false)
        }
      }, 3000)
    }
  }, [setIsScanning])

  return { triggerScan }
}
