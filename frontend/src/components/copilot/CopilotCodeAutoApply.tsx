import { useEffect, useRef } from 'react'
import { useCopilotMessagesContext } from '@copilotkit/react-core'
import { extractCodeFromResponse, isPreviewableReactCode } from '@/lib/utils'
import { useAppStore } from '@/stores/useAppStore'

function extractTextFromContent(content: unknown): string {
  if (typeof content === 'string') {
    return content
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === 'string') {
          return part
        }

        if (part && typeof part === 'object') {
          const record = part as Record<string, unknown>
          if (typeof record.text === 'string') {
            return record.text
          }
        }

        return ''
      })
      .filter(Boolean)
      .join('\n')
  }

  if (content && typeof content === 'object') {
    const record = content as Record<string, unknown>
    if (typeof record.text === 'string') {
      return record.text
    }
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

export function CopilotCodeAutoApply() {
  const { messages } = useCopilotMessagesContext()
  const generatedCode = useAppStore((state) => state.generatedCode)
  const updateGeneratedCode = useAppStore((state) => state.updateGeneratedCode)
  const addChatMessages = useAppStore((state) => state.addChatMessages)

  const lastHandledSignatureRef = useRef<string>('')

  useEffect(() => {
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

    const candidateCode = extractCodeFromResponse(latestAssistant.text)
    if (!isPreviewableReactCode(candidateCode)) {
      return
    }

    if (candidateCode.trim() === generatedCode.trim()) {
      lastHandledSignatureRef.current = signature
      return
    }

    updateGeneratedCode(candidateCode)
    addChatMessages([
      {
        role: 'assistant',
        content: '检测到 Copilot 返回可预览 TSX，已自动应用到中间预览区。',
      },
    ])

    lastHandledSignatureRef.current = signature
  }, [messages, generatedCode, updateGeneratedCode, addChatMessages])

  return null
}
