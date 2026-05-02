import { useEffect, useCallback } from 'react'
import { useAppStore } from '@/stores/useAppStore'
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
  const setA11yResults = useAppStore((state) => state.setA11yResults)
  const setIsScanning = useAppStore((state) => state.setIsScanning)

  const processResults = useCallback(
    (data: AxeMessage) => {
      if (data.type !== 'AXE_RESULTS') {
        return
      }

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

      const violations: A11yIssue[] = (data.violations || []).map((violation) => ({
        id: violation.id,
        impact: violation.impact as A11yIssue['impact'],
        description: violation.description,
        help: violation.help,
        helpUrl: violation.helpUrl,
        nodes: violation.nodes.length,
      }))

      const passes = data.passes || 0
      const total = passes + violations.length

      const results: A11yResults = {
        violations,
        passes,
        incomplete: data.incomplete || 0,
        score: total > 0 ? Math.round((passes / total) * 100) : 100,
      }

      setA11yResults(results)
      setIsScanning(false)
    },
    [setA11yResults, setIsScanning]
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
      return
    }

    setTimeout(() => {
      const retryIframe = getPreviewIframe()
      if (retryIframe) {
        retryIframe.contentWindow.postMessage({ type: 'RUN_AXE_SCAN' }, '*')
      } else {
        window.clearTimeout(fallbackTimer)
        setIsScanning(false)
      }
    }, 3000)
  }, [getPreviewIframe, setIsScanning])

  return { triggerScan }
}
