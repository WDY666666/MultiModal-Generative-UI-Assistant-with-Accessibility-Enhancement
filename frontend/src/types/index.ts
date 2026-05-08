export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

export interface ImageAnalysis {
  description: string
  layout: string
  components: string[]
  style: string[]
  accessibilityHints: string[]
  promptSuggestion?: string | null
}

export interface A11yIssue {
  id: string
  impact: 'minor' | 'moderate' | 'serious' | 'critical'
  description: string
  help: string
  helpUrl: string
  nodes: number
  explanation?: string
  fixSuggestion?: string
  fixCode?: string
}

export interface A11yResults {
  violations: A11yIssue[]
  passes: number
  incomplete: number
  score: number
}

export interface GenerateRequest {
  prompt: string
  imageBase64?: string
  currentCode?: string
  chatHistory?: ChatMessage[]
}

export interface InteractionPlan {
  summary: string
  pageType: string
  navigationMode: string
  implementationStrategy: string
  primaryViews: string[]
  popupViews: string[]
  routes: string[]
  userFlows: string[]
  taskBreakdown: string[]
}

export interface GenerateResponse {
  code: string
  explanation?: string
  css?: string
  plan?: InteractionPlan
}

export interface AnalyzeImageRequest {
  imageBase64: string
}

export type AnalyzeImageResponse = ImageAnalysis

export interface ChatRequest {
  message: string
  currentCode: string
  chatHistory: ChatMessage[]
  imageDescription?: string
}

export interface ChatResponse {
  code: string
  reply: string
  css?: string
  plan?: InteractionPlan
}

export interface FixRequest {
  issue: A11yIssue
  currentCode: string
}

export interface FixResponse {
  fixCode: string
  explanation: string
  css?: string
}

export interface ExplainIssueRequest {
  issue: A11yIssue
  currentCode?: string
}

export interface ExplainIssueResponse {
  explanation: string
  fixSuggestion?: string
}
