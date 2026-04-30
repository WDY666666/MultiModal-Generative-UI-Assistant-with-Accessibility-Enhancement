export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
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

export interface GenerateResponse {
  code: string
  explanation?: string
}

export interface AnalyzeImageRequest {
  imageBase64: string
}

export interface AnalyzeImageResponse {
  description: string
  layout: string
}

export interface ChatRequest {
  message: string
  currentCode: string
  chatHistory: ChatMessage[]
}

export interface ChatResponse {
  code: string
  reply: string
}

export interface FixRequest {
  issue: A11yIssue
  currentCode: string
}

export interface FixResponse {
  fixCode: string
  explanation: string
}
