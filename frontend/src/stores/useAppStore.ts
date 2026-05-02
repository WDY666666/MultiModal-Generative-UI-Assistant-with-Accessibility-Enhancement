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
    if (!textPrompt.trim() && !uploadedImage) {
      return
    }

    set({ isGenerating: true, generationError: null })

    try {
      const imageBase64 = uploadedImage ? await fileToBase64(uploadedImage) : undefined
      const fullPrompt = imageDescription
        ? `${textPrompt}\n\nDetected layout hints from uploaded image:\n${imageDescription}`
        : textPrompt

      const response = await api.generate({
        prompt: fullPrompt,
        imageBase64,
      })

      const candidateCode = extractCodeFromResponse(response.code)
      const hasPreviewableCode = isPreviewableReactCode(candidateCode)
      const code = hasPreviewableCode ? candidateCode : DEFAULT_GENERATED_CODE

      const assistantContent = hasPreviewableCode
        ? response.explanation || 'Code generated successfully. Check the preview panel.'
        : 'The model did not return complete previewable code. A local fallback preview was loaded. Please retry with a more specific prompt.'

      set({
        generatedCode: code,
        generatedCss: response.css || DEFAULT_PREVIEW_CSS,
        isGenerating: false,
        generationError: null,
        a11yResults: null,
        chatMessages: appendMessages(get().chatMessages, [
          { role: 'user', content: textPrompt || '[Image-driven generation request]' },
          { role: 'assistant', content: assistantContent },
        ]),
      })
    } catch (error) {
      set({
        isGenerating: false,
        generationError: error instanceof Error ? error.message : 'Generation failed',
      })
    }
  },

  sendMessage: async (message) => {
    const { generatedCode, chatMessages, imageDescription } = get()
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
      const code = isPreviewableReactCode(candidateCode) ? candidateCode : ''
      const nextCode = code || generatedCode || DEFAULT_GENERATED_CODE

      const reply = code
        ? response.reply || 'Code updated. Check the preview panel.'
        : 'The model did not return complete previewable code. Current preview was kept. Please retry with a more specific edit instruction.'

      set({
        generatedCode: nextCode,
        generatedCss: response.css || get().generatedCss,
        isChatLoading: false,
        a11yResults: null,
        chatMessages: appendMessages(get().chatMessages, [{ role: 'assistant', content: reply }]),
      })
    } catch (error) {
      set({
        isChatLoading: false,
        chatMessages: appendMessages(get().chatMessages, [
          {
            role: 'assistant',
            content: `Error: ${error instanceof Error ? error.message : 'Request failed'}`,
          },
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
  addChatMessages: (messages) => set({ chatMessages: appendMessages(get().chatMessages, messages) }),
  setGenerationError: (error) => set({ generationError: error }),
  setIsGenerating: (isGenerating) => set({ isGenerating }),
  setIsChatLoading: (isChatLoading) => set({ isChatLoading }),
}))
