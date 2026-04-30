import { useCopilotAction, useCopilotReadable } from '@copilotkit/react-core'
import { api } from '@/services/api'
import { extractCodeFromResponse } from '@/lib/utils'
import { useAppStore } from '@/stores/useAppStore'
import type { A11yIssue } from '@/types'

function summarizeA11yIssue(issue: A11yIssue) {
  return `${issue.impact}: ${issue.help} (${issue.nodes} affected node${issue.nodes === 1 ? '' : 's'})`
}

export function CopilotActions() {
  const textPrompt = useAppStore((s) => s.textPrompt)
  const generatedCode = useAppStore((s) => s.generatedCode)
  const a11yResults = useAppStore((s) => s.a11yResults)
  const imageDescription = useAppStore((s) => s.imageDescription)
  const chatMessages = useAppStore((s) => s.chatMessages)

  const setTextPrompt = useAppStore((s) => s.setTextPrompt)
  const updateGeneratedCode = useAppStore((s) => s.updateGeneratedCode)
  const addChatMessages = useAppStore((s) => s.addChatMessages)
  const setGenerationError = useAppStore((s) => s.setGenerationError)
  const setIsGenerating = useAppStore((s) => s.setIsGenerating)
  const setIsChatLoading = useAppStore((s) => s.setIsChatLoading)

  useCopilotReadable(
    {
      description: 'Current multimodal UI generation workspace state',
      value: {
        textPrompt,
        hasGeneratedCode: Boolean(generatedCode),
        generatedCodePreview: generatedCode.slice(0, 2000),
        imageDescription,
        a11yScore: a11yResults?.score ?? null,
        a11yViolations: a11yResults?.violations.map(summarizeA11yIssue) ?? [],
      },
    },
    [textPrompt, generatedCode, imageDescription, a11yResults]
  )

  useCopilotAction(
    {
      name: 'generateAccessibleReactUI',
      description:
        'Generate a complete accessible React + TypeScript + Tailwind UI from a natural language prompt. Updates the live Sandpack preview.',
      parameters: [
        {
          name: 'prompt',
          type: 'string',
          description: 'The UI requirement, layout, style, and accessibility expectations.',
          required: true,
        },
      ],
      handler: async ({ prompt }) => {
        const normalizedPrompt = String(prompt ?? '').trim()
        if (!normalizedPrompt) {
          return 'No prompt was provided.'
        }

        setTextPrompt(normalizedPrompt)
        setIsGenerating(true)
        setGenerationError(null)

        try {
          const response = await api.generate({ prompt: normalizedPrompt })
          const code = extractCodeFromResponse(response.code)
          updateGeneratedCode(code)
          addChatMessages([
            { role: 'user', content: normalizedPrompt },
            { role: 'assistant', content: response.explanation || 'CopilotKit action 已生成代码，请在预览区查看效果。' },
          ])
          return 'Generated accessible React UI and updated the live preview.'
        } catch (error) {
          const message = error instanceof Error ? error.message : '生成失败'
          setGenerationError(message)
          return `Generation failed: ${message}`
        } finally {
          setIsGenerating(false)
        }
      },
    },
    [setTextPrompt, setIsGenerating, setGenerationError, updateGeneratedCode, addChatMessages]
  )

  useCopilotAction(
    {
      name: 'iterateGeneratedUI',
      description:
        'Modify the currently generated UI according to a short natural language instruction, then update the live preview.',
      parameters: [
        {
          name: 'instruction',
          type: 'string',
          description: 'The requested UI change, such as changing colors, layout, animation, copy, or accessibility behavior.',
          required: true,
        },
      ],
      handler: async ({ instruction }) => {
        const message = String(instruction ?? '').trim()
        if (!message) {
          return 'No iteration instruction was provided.'
        }

        setIsChatLoading(true)
        addChatMessages([{ role: 'user', content: message }])

        try {
          const response = await api.chat({
            message,
            currentCode: generatedCode,
            chatHistory: chatMessages,
          })
          const code = extractCodeFromResponse(response.code)
          updateGeneratedCode(code)
          addChatMessages([
            { role: 'assistant', content: response.reply || 'CopilotKit action 已更新代码，请在预览区查看效果。' },
          ])
          return 'Updated the generated UI and refreshed the live preview.'
        } catch (error) {
          const fallback = error instanceof Error ? error.message : '请求失败'
          addChatMessages([{ role: 'assistant', content: `错误：${fallback}` }])
          return `Iteration failed: ${fallback}`
        } finally {
          setIsChatLoading(false)
        }
      },
    },
    [generatedCode, chatMessages, setIsChatLoading, addChatMessages, updateGeneratedCode]
  )

  useCopilotAction(
    {
      name: 'fixAccessibilityIssue',
      description:
        'Apply an accessibility fix to the generated code using one axe-core issue id from the current accessibility scan.',
      parameters: [
        {
          name: 'issueId',
          type: 'string',
          description: 'The axe-core violation id to fix, for example color-contrast or button-name.',
          required: true,
        },
      ],
      handler: async ({ issueId }) => {
        const id = String(issueId ?? '').trim()
        const issue = a11yResults?.violations.find((item) => item.id === id)
        if (!issue) {
          return `No accessibility issue with id "${id}" is available in the current scan.`
        }

        try {
          const response = await api.fix({ issue, currentCode: generatedCode })
          const code = extractCodeFromResponse(response.fixCode)
          updateGeneratedCode(code)
          addChatMessages([
            { role: 'assistant', content: `已通过 CopilotKit action 修复无障碍问题：${issue.help}` },
          ])
          return `Fixed accessibility issue ${id} and updated the live preview.`
        } catch (error) {
          const fallback = error instanceof Error ? error.message : '修复失败'
          return `Accessibility fix failed: ${fallback}`
        }
      },
    },
    [a11yResults, generatedCode, updateGeneratedCode, addChatMessages]
  )

  return null
}
