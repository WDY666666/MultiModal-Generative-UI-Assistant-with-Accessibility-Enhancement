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

export function extractCodeFromResponse(text: string): string {
  const codeBlockRegex = /```(?:tsx?|jsx?|react)?\n([\s\S]*?)```/
  const match = text.match(codeBlockRegex)
  if (match) {
    return match[1].trim()
  }
  return text.trim()
}
