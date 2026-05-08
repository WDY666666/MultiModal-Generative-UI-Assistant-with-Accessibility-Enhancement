import { useCopilotAction, useCopilotReadable } from '@copilotkit/react-core'

import { DEFAULT_GENERATED_CODE } from '@/lib/constants'
import { api } from '@/services/api'
import { extractCodeFromResponse, isPreviewableReactCode } from '@/lib/utils'
import { useAppStore } from '@/stores/useAppStore'
import type { A11yIssue } from '@/types'

function summarizeA11yIssue(issue: A11yIssue) {
  return `${issue.impact}: ${issue.help}（影响 ${issue.nodes} 个元素）`
}

export function CopilotActions() {
  const textPrompt = useAppStore((state) => state.textPrompt)
  const generatedCode = useAppStore((state) => state.generatedCode)
  const previousGeneratedCode = useAppStore((state) => state.previousGeneratedCode)
  const imageDescription = useAppStore((state) => state.imageDescription)
  const imageAnalysis = useAppStore((state) => state.imageAnalysis)
  const interactionPlan = useAppStore((state) => state.interactionPlan)
  const a11yResults = useAppStore((state) => state.a11yResults)

  const setTextPrompt = useAppStore((state) => state.setTextPrompt)
  const setInteractionPlan = useAppStore((state) => state.setInteractionPlan)
  const restorePreviousGeneratedCode = useAppStore((state) => state.restorePreviousGeneratedCode)
  const updateGeneratedCode = useAppStore((state) => state.updateGeneratedCode)
  const addChatMessages = useAppStore((state) => state.addChatMessages)
  const setGenerationError = useAppStore((state) => state.setGenerationError)
  const setIsGenerating = useAppStore((state) => state.setIsGenerating)
  const sendMessage = useAppStore((state) => state.sendMessage)

  useCopilotReadable(
    {
      description: '当前多模态 UI 生成工作区状态',
      value: {
        textPrompt,
        hasGeneratedCode: Boolean(generatedCode),
        generatedCodePreview: generatedCode,
        previousGeneratedCodePreview: previousGeneratedCode,
        imageDescription,
        imageAnalysis,
        interactionPlan,
        a11yScore: a11yResults?.score ?? null,
        a11yViolations: a11yResults?.violations.map(summarizeA11yIssue) ?? [],
      },
    },
    [textPrompt, generatedCode, previousGeneratedCode, imageDescription, imageAnalysis, interactionPlan, a11yResults]
  )

  useCopilotAction(
    {
      name: 'generateAccessibleReactUI',
      description: '根据自然语言提示生成完整可访问的 React + TypeScript + Tailwind 界面，并更新实时预览。',
      parameters: [
        {
          name: 'prompt',
          type: 'string',
          description: '界面需求、布局、风格和无障碍要求。',
          required: true,
        },
      ],
      handler: async ({ prompt }) => {
        const normalizedPrompt = String(prompt ?? '').trim()
        if (!normalizedPrompt) {
          return '未提供生成提示词。'
        }

        setTextPrompt(normalizedPrompt)
        setIsGenerating(true)
        setGenerationError(null)

        try {
          const response = await api.generate({ prompt: normalizedPrompt })
          const candidateCode = extractCodeFromResponse(response.code)
          const code = isPreviewableReactCode(candidateCode) ? candidateCode : DEFAULT_GENERATED_CODE
          updateGeneratedCode(code, response.css)
          setInteractionPlan(response.plan ?? null)
          addChatMessages([
            { role: 'user', content: normalizedPrompt },
            { role: 'assistant', content: response.explanation || 'CopilotKit action 已生成代码，请在预览区查看效果。' },
          ])
          return '已生成可访问 React 界面，并更新实时预览。'
        } catch (error) {
          const message = error instanceof Error ? error.message : '生成失败'
          setGenerationError(message)
          return `生成失败：${message}`
        } finally {
          setIsGenerating(false)
        }
      },
    },
    [setTextPrompt, setIsGenerating, setGenerationError, updateGeneratedCode, setInteractionPlan, addChatMessages]
  )

  useCopilotAction(
    {
      name: 'iterateGeneratedUI',
      description: '根据自然语言指令修改当前生成的界面，并更新实时预览。',
      parameters: [
        {
          name: 'instruction',
          type: 'string',
          description: '需要修改的内容，例如颜色、布局、动画、文案、跳转或弹窗流程。',
          required: true,
        },
      ],
      handler: async ({ instruction }) => {
        const message = String(instruction ?? '').trim()
        if (!message) {
          return '未提供迭代指令。'
        }

        try {
          await sendMessage(message)
          return '已更新当前界面并刷新实时预览。'
        } catch (error) {
          const fallback = error instanceof Error ? error.message : '请求失败'
          return `迭代失败：${fallback}`
        }
      },
    },
    [sendMessage]
  )

  useCopilotAction(
    {
      name: 'restorePreviousPreviewVersion',
      description: '恢复到上一版生成结果。',
      handler: async () => {
        restorePreviousGeneratedCode()
        return '已恢复到上一版预览。'
      },
    },
    [restorePreviousGeneratedCode]
  )

  useCopilotAction(
    {
      name: 'fixAccessibilityIssue',
      description: '根据当前 axe-core 扫描结果中的问题 ID，对生成代码应用无障碍修复。',
      parameters: [
        {
          name: 'issueId',
          type: 'string',
          description: '要修复的 axe-core 问题 ID，例如 color-contrast 或 button-name。',
          required: true,
        },
      ],
      handler: async ({ issueId }) => {
        const id = String(issueId ?? '').trim()
        const issue = a11yResults?.violations.find((item) => item.id === id)
        if (!issue) {
          return `当前扫描中不存在 ID 为 "${id}" 的无障碍问题。`
        }

        try {
          const response = await api.fix({ issue, currentCode: generatedCode })
          const code = extractCodeFromResponse(response.fixCode)
          if (!isPreviewableReactCode(code)) {
            return `问题 ${id} 的修复结果未返回可预览代码，已保留当前预览。`
          }

          updateGeneratedCode(code, response.css)
          addChatMessages([
            { role: 'assistant', content: `已通过 CopilotKit action 修复无障碍问题：${issue.help}` },
          ])
          return `已修复无障碍问题 ${id}，并更新实时预览。`
        } catch (error) {
          const fallback = error instanceof Error ? error.message : '修复失败'
          return `无障碍修复失败：${fallback}`
        }
      },
    },
    [a11yResults, generatedCode, updateGeneratedCode, addChatMessages]
  )

  return null
}
