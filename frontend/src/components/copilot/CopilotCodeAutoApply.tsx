import { useCallback, useEffect, useRef } from 'react'
import { useCopilotMessagesContext } from '@copilotkit/react-core'
import { extractCodeFromResponse, isPreviewableReactCode } from '@/lib/utils'
import { useAppStore } from '@/stores/useAppStore'

function extractTextFromContent(content: unknown, depth = 0): string {
  if (depth > 6) {
    return ''
  }

  if (typeof content === 'string') {
    return content
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => extractTextFromContent(part, depth + 1))
      .filter(Boolean)
      .join('\n')
  }

  if (content && typeof content === 'object') {
    const record = content as Record<string, unknown>
    return ['text', 'content', 'value', 'delta']
      .map((key) => extractTextFromContent(record[key], depth + 1))
      .filter(Boolean)
      .join('\n')
  }

  return ''
}

function findLatestAssistantText(messages: unknown[]): { id: string; text: string } | null {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index] as Record<string, unknown>
    if (message.role !== 'assistant') {
      continue
    }

    const text = extractTextFromContent(message.content).trim()
    if (!text) {
      continue
    }

    const id = typeof message.id === 'string' ? message.id : `assistant-${index}`
    return { id, text }
  }

  return null
}

function hasCompleteCodeFence(text: string): boolean {
  const fences = text.match(/```/g)
  if (!fences) {
    return true
  }
  return fences.length >= 2
}

function hasBalancedDelimiters(code: string): boolean {
  const pairs: Record<string, string> = {
    '(': ')',
    '[': ']',
    '{': '}',
  }
  const stack: string[] = []
  let quote: '"' | "'" | '`' | null = null
  let escaped = false

  for (const char of code) {
    if (quote) {
      if (escaped) {
        escaped = false
        continue
      }
      if (char === '\\') {
        escaped = true
        continue
      }
      if (char === quote) {
        quote = null
      }
      continue
    }

    if (char === '"' || char === "'" || char === '`') {
      quote = char
      continue
    }

    if (pairs[char]) {
      stack.push(pairs[char])
      continue
    }

    if ((char === ')' || char === ']' || char === '}') && stack.pop() !== char) {
      return false
    }
  }

  return !quote && stack.length === 0
}

function isCompletePreviewableCode(code: string): boolean {
  const normalized = code.trim()
  return (
    isPreviewableReactCode(normalized) &&
    /[})]\s*$/.test(normalized) &&
    hasBalancedDelimiters(normalized)
  )
}

function findDomCodeCandidate(root: Element): string {
  const codeElements = Array.from(root.querySelectorAll('pre code, pre, code'))
  const codeTexts = codeElements
    .map((element) => element.textContent?.trim() ?? '')
    .filter(Boolean)

  for (const rawText of codeTexts.reverse()) {
    const candidate = extractCodeFromResponse(rawText)
    if (isCompletePreviewableCode(candidate)) {
      return candidate
    }
  }

  const fullText = root.textContent?.trim() ?? ''
  const fallbackCandidate = extractCodeFromResponse(fullText)
  return isCompletePreviewableCode(fallbackCandidate) ? fallbackCandidate : ''
}

export function CopilotCodeAutoApply() {
  const { messages } = useCopilotMessagesContext()
  const generatedCode = useAppStore((state) => state.generatedCode)
  const isChatLoading = useAppStore((state) => state.isChatLoading)
  const updateGeneratedCode = useAppStore((state) => state.updateGeneratedCode)
  const addChatMessages = useAppStore((state) => state.addChatMessages)

  const lastHandledSignatureRef = useRef<string>('')

  const applyCandidate = useCallback(
    (candidateCode: string, source: string) => {
      const normalizedCode = candidateCode.trim()
      const signature = `${source}:${normalizedCode}`

      if (signature === lastHandledSignatureRef.current) {
        return
      }

      if (!isCompletePreviewableCode(normalizedCode)) {
        return
      }

      if (normalizedCode === generatedCode.trim()) {
        lastHandledSignatureRef.current = signature
        return
      }

      updateGeneratedCode(normalizedCode)
      addChatMessages([
        {
          role: 'assistant',
          content: '检测到 Copilot 返回完整可预览 TSX，已自动应用到中间预览区。',
        },
      ])

      lastHandledSignatureRef.current = signature
    },
    [generatedCode, updateGeneratedCode, addChatMessages]
  )

  useEffect(() => {
    if (isChatLoading) {
      return
    }

    if (!Array.isArray(messages) || messages.length === 0) {
      return
    }

    const latestAssistant = findLatestAssistantText(messages)
    if (!latestAssistant) {
      return
    }

    const signature = `${latestAssistant.id}:${latestAssistant.text}`
    if (signature === lastHandledSignatureRef.current) {
      return
    }

    if (!hasCompleteCodeFence(latestAssistant.text)) {
      return
    }

    applyCandidate(extractCodeFromResponse(latestAssistant.text), signature)
  }, [messages, isChatLoading, applyCandidate])

  useEffect(() => {
    if (isChatLoading) {
      return
    }

    const root = document.querySelector('.copilot-chat-window')
    if (!root) {
      return
    }

    let timeoutId = window.setTimeout(() => {
      applyCandidate(findDomCodeCandidate(root), 'dom-initial')
    }, 500)

    const scheduleScan = () => {
      window.clearTimeout(timeoutId)
      timeoutId = window.setTimeout(() => {
        applyCandidate(findDomCodeCandidate(root), 'dom')
      }, 800)
    }

    const observer = new MutationObserver(scheduleScan)
    observer.observe(root, {
      childList: true,
      characterData: true,
      subtree: true,
    })

    return () => {
      window.clearTimeout(timeoutId)
      observer.disconnect()
    }
  }, [isChatLoading, applyCandidate])

  return null
}
