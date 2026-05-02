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

async function post<T>(endpoint: string, body: unknown, timeoutMs = 65000): Promise<T> {
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs)

  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('请求超时，请稍后重试。')
    }
    throw error
  } finally {
    window.clearTimeout(timeoutId)
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: '请求失败' }))
    throw new Error(error.detail || `HTTP ${response.status}`)
  }
  return response.json()
}

export const api = {
  generate: (data: GenerateRequest) =>
    post<GenerateResponse>('/generate', data, 190000),

  analyzeImage: (data: AnalyzeImageRequest) =>
    post<AnalyzeImageResponse>('/analyze-image', data, 120000),

  chat: (data: ChatRequest) =>
    post<ChatResponse>('/chat', data, 140000),

  fix: (data: FixRequest) =>
    post<FixResponse>('/fix', data, 140000),

  explainIssue: (data: ExplainIssueRequest) =>
    post<ExplainIssueResponse>('/a11y/explain', data, 90000),
}
