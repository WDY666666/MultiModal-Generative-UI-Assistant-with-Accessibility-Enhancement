import { create } from 'zustand'
import { api } from '@/services/api'
import { fileToBase64, generateId, extractCodeFromResponse, isPreviewableReactCode } from '@/lib/utils'
import { DEFAULT_GENERATED_CODE, DEFAULT_PREVIEW_CSS } from '@/lib/constants'
import type { ChatMessage, A11yResults } from '@/types'

interface AppState {
  textPrompt: string
  uploadedImage: File | null
  imagePreview: string | null
  imageDescription: string

  generatedCode: string
  generatedCss: string
  isGenerating: boolean
  generationError: string | null

  chatMessages: ChatMessage[]
  isChatLoading: boolean

  a11yResults: A11yResults | null
  isScanning: boolean

  setTextPrompt: (text: string) => void
  setUploadedImage: (file: File | null) => void
  setImageDescription: (desc: string) => void
  generate: () => Promise<void>
  sendMessage: (message: string) => Promise<void>
  setA11yResults: (results: A11yResults) => void
  setIsScanning: (scanning: boolean) => void
  updateGeneratedCode: (code: string, css?: string) => void
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

  generatedCode: DEFAULT_GENERATED_CODE,
  generatedCss: DEFAULT_PREVIEW_CSS,
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
      set({ uploadedImage: file, imagePreview: URL.createObjectURL(file) })
    } else {
      set({ uploadedImage: null, imagePreview: null })
    }
  },

  setImageDescription: (desc) => set({ imageDescription: desc }),

  generate: async () => {
    const { textPrompt, uploadedImage, imageDescription } = get()
    if (!textPrompt.trim() && !uploadedImage) return

    set({ isGenerating: true, generationError: null })

    try {
      const imageBase64 = uploadedImage ? await fileToBase64(uploadedImage) : undefined
      const fullPrompt = imageDescription
        ? `${textPrompt}\n\n参考图片中识别到的布局信息：\n${imageDescription}`
        : textPrompt

      const response = await api.generate({
        prompt: fullPrompt,
        imageBase64,
      })
      const candidateCode = extractCodeFromResponse(response.code)
      const code = isPreviewableReactCode(candidateCode) ? candidateCode : DEFAULT_GENERATED_CODE
      const assistantContent = isPreviewableReactCode(candidateCode)
        ? response.explanation || '代码已生成，请在预览区查看效果。'
        : '模型这次没有返回完整可预览代码，已显示本地兜底预览，建议换一个更具体的描述后重试。'

      set({
        generatedCode: code,
        generatedCss: response.css || DEFAULT_PREVIEW_CSS,
        isGenerating: false,
        generationError: null,
        a11yResults: null,
        chatMessages: appendMessages(get().chatMessages, [
          { role: 'user', content: textPrompt },
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
    const { generatedCode, chatMessages } = get()
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
      })
      const candidateCode = extractCodeFromResponse(response.code)
      const code = isPreviewableReactCode(candidateCode) ? candidateCode : ''
      const nextCode = code || generatedCode || DEFAULT_GENERATED_CODE
      const reply = code
        ? response.reply
        : '模型这次没有返回完整可预览代码，已保留当前预览。请换一个更具体的修改指令重试。'

      set({
        generatedCode: nextCode,
        generatedCss: response.css || get().generatedCss,
        isChatLoading: false,
        a11yResults: null,
        chatMessages: appendMessages(get().chatMessages, [
          { role: 'assistant', content: reply || '代码已更新，请在预览区查看效果。' },
        ]),
      })
    } catch (error) {
      set({
        isChatLoading: false,
        chatMessages: appendMessages(get().chatMessages, [
          { role: 'assistant', content: `错误：${error instanceof Error ? error.message : '请求失败'}` },
        ]),
      })
    }
  },

  setA11yResults: (results) => set({ a11yResults: results }),
  setIsScanning: (scanning) => set({ isScanning: scanning }),
  updateGeneratedCode: (code, css) =>
    set((state) => ({
      generatedCode: code,
      generatedCss: css ?? state.generatedCss,
      a11yResults: null,
    })),
  setGeneratedCss: (css) => set({ generatedCss: css }),
  addChatMessages: (messages) =>
    set({ chatMessages: appendMessages(get().chatMessages, messages) }),
  setGenerationError: (error) => set({ generationError: error }),
  setIsGenerating: (isGenerating) => set({ isGenerating }),
  setIsChatLoading: (isChatLoading) => set({ isChatLoading }),
}))
