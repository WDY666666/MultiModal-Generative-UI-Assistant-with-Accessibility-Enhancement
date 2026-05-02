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
  runtimeError?: string
}

export function useA11yScan() {
  const setA11yResults = useAppStore((s) => s.setA11yResults)
  const setIsScanning = useAppStore((s) => s.setIsScanning)
  const generatedCode = useAppStore((s) => s.generatedCode)

  const processResults = useCallback(
    async (data: AxeMessage) => {
      if (data.type !== 'AXE_RESULTS') return

      if (data.runtimeError) {
        setA11yResults({
          violations: [],
          passes: 0,
          incomplete: 0,
          score: 0,
        })
        setIsScanning(false)
        return
      }

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
          // Explanation failures should not block the main scanning flow.
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

  const getPreviewIframe = useCallback(() => {
    const iframe = document.querySelector(
      '.preview-runtime-iframe, .preview-sandbox .sp-preview-iframe'
    ) as HTMLIFrameElement | null
    if (!iframe || !iframe.isConnected || !iframe.contentWindow) {
      return null
    }
    return iframe
  }, [])

  const triggerScan = useCallback(() => {
    setIsScanning(true)
    const fallbackTimer = window.setTimeout(() => {
      setIsScanning(false)
    }, 5000)

    const iframe = getPreviewIframe()
    if (iframe) {
      iframe.contentWindow.postMessage({ type: 'RUN_AXE_SCAN' }, '*')
    } else {
      setTimeout(() => {
        const retryIframe = getPreviewIframe()
        if (retryIframe) {
          retryIframe.contentWindow.postMessage({ type: 'RUN_AXE_SCAN' }, '*')
        } else {
          window.clearTimeout(fallbackTimer)
          setIsScanning(false)
        }
      }, 3000)
    }
  }, [getPreviewIframe, setIsScanning])

  return { triggerScan }
}
