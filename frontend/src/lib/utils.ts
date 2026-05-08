import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15)
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.split(',')[1])
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function hasReactEntryPoint(text: string): boolean {
  return /export\s+default/.test(text) && (/<[A-Za-z][\w.-]*(?:\s|>|\/)/.test(text) || text.includes('<>'))
}

function sliceProbableReactCode(text: string): string {
  const exportMatches = Array.from(text.matchAll(/export\s+default/g))
  if (exportMatches.length === 0) {
    return text.trim()
  }

  const exportIndex = exportMatches[exportMatches.length - 1].index ?? 0
  const importIndex = text.lastIndexOf('\nimport ', exportIndex)
  const typeImportIndex = text.lastIndexOf('\nimport type ', exportIndex)
  const startIndex = Math.max(importIndex, typeImportIndex)
  const candidateStart = startIndex >= 0 ? startIndex + 1 : exportIndex

  return text.slice(candidateStart).trim()
}

export function extractCodeFromResponse(text: string): string {
  const normalized = text.replace(/<!--\s*MMUI_APPLY_CODE\s*-->/g, '').trim()
  const codeBlockRegex = /```(?:tsx?|jsx?|typescript|javascript|react)?\s*\n?([\s\S]*?)```/gi
  const blocks = Array.from(normalized.matchAll(codeBlockRegex))
    .map((match) => match[1]?.trim() ?? '')
    .filter(Boolean)

  const previewableBlock = [...blocks].reverse().find(hasReactEntryPoint)
  if (previewableBlock) {
    return previewableBlock
  }

  if (blocks.length > 0) {
    return blocks[blocks.length - 1]
  }

  return sliceProbableReactCode(normalized)
}

export function isPreviewableReactCode(code: string): boolean {
  const normalized = code.trim()
  if (normalized.length < 120 || !normalized.includes('export default')) {
    return false
  }

  const hasJsx = /<[A-Za-z][\w.-]*(?:\s|>|\/)/.test(normalized) || normalized.includes('<>')
  const hasComponent =
    /(?:function|const)\s+[A-Z][A-Za-z0-9_]*/.test(normalized) ||
    /export\s+default\s+(?:function|\(\s*\)|[A-Z][A-Za-z0-9_]*)/.test(normalized)

  return hasJsx && hasComponent
}
