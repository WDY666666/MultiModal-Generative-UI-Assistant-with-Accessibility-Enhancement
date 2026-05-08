import { API_BASE_URL } from '@/lib/constants'
import type {
  GenerateRequest,
  GenerateResponse,
  AnalyzeImageRequest,
  AnalyzeImageResponse,
  ChatRequest,
  ChatResponse,
  FixRequest,
  FixResponse,
  ExplainIssueRequest,
  ExplainIssueResponse,
} from '@/types'

async function post<T>(endpoint: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: '请求失败' }))
    throw new Error(error.detail || `HTTP ${response.status}`)
  }
  return response.json()
}

export const api = {
  generate: (data: GenerateRequest) =>
    post<GenerateResponse>('/generate', data),

  analyzeImage: (data: AnalyzeImageRequest) =>
    post<AnalyzeImageResponse>('/analyze-image', data),

  chat: (data: ChatRequest) =>
    post<ChatResponse>('/chat', data),

  fix: (data: FixRequest) =>
    post<FixResponse>('/fix', data),

  explainIssue: (data: ExplainIssueRequest) =>
    post<ExplainIssueResponse>('/a11y/explain', data),
}
