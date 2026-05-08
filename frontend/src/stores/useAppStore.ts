import { create } from 'zustand'

import { api } from '@/services/api'
import { DEFAULT_GENERATED_CODE, DEFAULT_PREVIEW_CSS } from '@/lib/constants'
import { extractCodeFromResponse, fileToBase64, generateId, isPreviewableReactCode } from '@/lib/utils'
import type { A11yResults, ChatMessage, ImageAnalysis, InteractionPlan } from '@/types'

interface AppState {
  textPrompt: string
  uploadedImage: File | null
  imagePreview: string | null
  imageDescription: string
  imageAnalysis: ImageAnalysis | null
  interactionPlan: InteractionPlan | null

  generatedCode: string
  generatedCss: string
  previousGeneratedCode: string | null
  previousGeneratedCss: string | null
  isGenerating: boolean
  generationError: string | null

  chatMessages: ChatMessage[]
  isChatLoading: boolean

  a11yResults: A11yResults | null
  isScanning: boolean

  setTextPrompt: (text: string) => void
  setUploadedImage: (file: File | null) => void
  setImageDescription: (desc: string) => void
  setImageAnalysis: (analysis: ImageAnalysis | null) => void
  setInteractionPlan: (plan: InteractionPlan | null) => void
  generate: () => Promise<void>
  sendMessage: (message: string) => Promise<void>
  setA11yResults: (results: A11yResults) => void
  setIsScanning: (scanning: boolean) => void
  updateGeneratedCode: (code: string, css?: string) => void
  restorePreviousGeneratedCode: () => void
  setGeneratedCss: (css: string) => void
  addChatMessages: (messages: Omit<ChatMessage, 'id' | 'timestamp'>[]) => void
  setGenerationError: (error: string | null) => void
  setIsGenerating: (isGenerating: boolean) => void
  setIsChatLoading: (isChatLoading: boolean) => void
}

function appendMessages(existing: ChatMessage[], messages: Omit<ChatMessage, 'id' | 'timestamp'>[]) {
  return [
    ...existing,
    ...messages.map((message) => ({
      ...message,
      id: generateId(),
      timestamp: Date.now(),
    })),
  ]
}

export const useAppStore = create<AppState>((set, get) => ({
  textPrompt: '',
  uploadedImage: null,
  imagePreview: null,
  imageDescription: '',
  imageAnalysis: null,
  interactionPlan: null,

  generatedCode: DEFAULT_GENERATED_CODE,
  generatedCss: DEFAULT_PREVIEW_CSS,
  previousGeneratedCode: null,
  previousGeneratedCss: null,
  isGenerating: false,
  generationError: null,

  chatMessages: [],
  isChatLoading: false,

  a11yResults: null,
  isScanning: false,

  setTextPrompt: (text) => set({ textPrompt: text }),

  setUploadedImage: (file) => {
    const previousPreview = get().imagePreview
    if (previousPreview) {
      URL.revokeObjectURL(previousPreview)
    }

    if (file) {
      set({
        uploadedImage: file,
        imagePreview: URL.createObjectURL(file),
        imageDescription: '',
        imageAnalysis: null,
      })
      return
    }

    set({
      uploadedImage: null,
      imagePreview: null,
      imageDescription: '',
      imageAnalysis: null,
    })
  },

  setImageDescription: (desc) => set({ imageDescription: desc }),
  setImageAnalysis: (analysis) => set({ imageAnalysis: analysis }),
  setInteractionPlan: (plan) => set({ interactionPlan: plan }),

  generate: async () => {
    const { textPrompt, uploadedImage, imageDescription, updateGeneratedCode } = get()
    if (!textPrompt.trim() && !uploadedImage) {
      return
    }

    set({ isGenerating: true, generationError: null })

    try {
      const imageBase64 = uploadedImage ? await fileToBase64(uploadedImage) : undefined
      const fullPrompt = imageDescription
        ? `${textPrompt}\n\n从上传图片识别到的布局提示：\n${imageDescription}`
        : textPrompt

      const response = await api.generate({
        prompt: fullPrompt,
        imageBase64,
      })

      const candidateCode = extractCodeFromResponse(response.code)
      const hasPreviewableCode = isPreviewableReactCode(candidateCode)
      const code = hasPreviewableCode ? candidateCode : DEFAULT_GENERATED_CODE

      updateGeneratedCode(code, response.css || DEFAULT_PREVIEW_CSS)

      const assistantContent = hasPreviewableCode
        ? response.explanation || '代码已生成，请在中间预览区查看。'
        : '模型未返回完整可预览代码，已加载本地兜底预览。请尝试更具体的描述。'

      set({
        isGenerating: false,
        generationError: null,
        a11yResults: null,
        interactionPlan: response.plan ?? null,
        chatMessages: appendMessages(get().chatMessages, [
          { role: 'user', content: textPrompt || '[基于图片的生成请求]' },
          { role: 'assistant', content: assistantContent },
        ]),
      })
    } catch (error) {
      set({
        isGenerating: false,
        generationError: error instanceof Error ? error.message : '生成失败',
      })
    }
  },

  sendMessage: async (message) => {
    const { generatedCode, chatMessages, imageDescription, updateGeneratedCode } = get()
    const userMsg: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: message,
      timestamp: Date.now(),
    }

    set({ isChatLoading: true, chatMessages: [...chatMessages, userMsg] })

    try {
      const response = await api.chat({
        message,
        currentCode: generatedCode,
        chatHistory: [...chatMessages, userMsg],
        imageDescription: imageDescription || undefined,
      })

      const candidateCode = extractCodeFromResponse(response.code)
      const previewableCode = isPreviewableReactCode(candidateCode) ? candidateCode : ''
      const nextCode = previewableCode || generatedCode || DEFAULT_GENERATED_CODE

      updateGeneratedCode(nextCode, response.css || get().generatedCss)

      const reply = previewableCode
        ? response.reply || '代码已更新，请查看中间预览区。'
        : '模型未返回完整可预览代码，已保留当前预览。请给出更具体的修改要求。'

      set({
        isChatLoading: false,
        a11yResults: null,
        interactionPlan: response.plan ?? get().interactionPlan,
        chatMessages: appendMessages(get().chatMessages, [{ role: 'assistant', content: reply }]),
      })
    } catch (error) {
      set({
        isChatLoading: false,
        chatMessages: appendMessages(get().chatMessages, [
          {
            role: 'assistant',
            content: `错误：${error instanceof Error ? error.message : '请求失败'}`,
          },
        ]),
      })
    }
  },

  setA11yResults: (results) => set({ a11yResults: results }),
  setIsScanning: (scanning) => set({ isScanning: scanning }),

  updateGeneratedCode: (code, css) =>
    set((state) => {
      const nextCode = code.trim() ? code : DEFAULT_GENERATED_CODE
      const nextCss = css ?? state.generatedCss

      if (state.generatedCode.trim() === nextCode.trim() && state.generatedCss.trim() === nextCss.trim()) {
        return state
      }

      return {
        generatedCode: nextCode,
        generatedCss: nextCss,
        previousGeneratedCode: state.generatedCode,
        previousGeneratedCss: state.generatedCss,
        a11yResults: null,
      }
    }),

  restorePreviousGeneratedCode: () =>
    set((state) => {
      if (!state.previousGeneratedCode) {
        return state
      }

      return {
        generatedCode: state.previousGeneratedCode,
        generatedCss: state.previousGeneratedCss ?? state.generatedCss,
        previousGeneratedCode: state.generatedCode,
        previousGeneratedCss: state.generatedCss,
        a11yResults: null,
      }
    }),

  setGeneratedCss: (css) => set({ generatedCss: css }),
  addChatMessages: (messages) => set({ chatMessages: appendMessages(get().chatMessages, messages) }),
  setGenerationError: (error) => set({ generationError: error }),
  setIsGenerating: (isGenerating) => set({ isGenerating }),
  setIsChatLoading: (isChatLoading) => set({ isChatLoading }),
}))
