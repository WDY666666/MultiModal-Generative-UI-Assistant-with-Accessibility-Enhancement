import { useState } from 'react'
import { Copy, Check, Download, FileDown } from 'lucide-react'
import { useAppStore } from '@/stores/useAppStore'

const PACKAGE_JSON = `{
  "name": "generated-ui",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    "tailwindcss": "^3.4.17",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.49",
    "typescript": "^5.5.0",
    "vite": "^5.4.11"
  }
}`

export function CodeViewer() {
  const generatedCode = useAppStore((s) => s.generatedCode)
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownloadSingle = () => {
    const blob = new Blob([generatedCode], { type: 'text/typescript' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'App.tsx'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleDownloadProject = () => {
    const files = [
      { name: 'package.json', content: PACKAGE_JSON },
      { name: 'src/App.tsx', content: generatedCode },
      { name: 'src/main.tsx', content: `import React from 'react'\nimport ReactDOM from 'react-dom/client'\nimport App from './App'\nimport './index.css'\n\nReactDOM.createRoot(document.getElementById('root')!).render(\n  <React.StrictMode>\n    <App />\n  </React.StrictMode>,\n)` },
      { name: 'src/index.css', content: `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\nbody {\n  margin: 0;\n  font-family: system-ui, sans-serif;\n}` },
      { name: 'index.html', content: `<!DOCTYPE html>\n<html lang="zh-CN">\n<head>\n  <meta charset="UTF-8" />\n  <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n  <title>Generated UI</title>\n</head>\n<body>\n  <div id="root"></div>\n  <script type="module" src="/src/main.tsx"></script>\n</body>\n</html>` },
      { name: 'vite.config.ts', content: `import { defineConfig } from 'vite'\nimport react from '@vitejs/plugin-react'\n\nexport default defineConfig({\n  plugins: [react()],\n})` },
      { name: 'tailwind.config.js', content: `/** @type {import('tailwindcss').Config} */\nexport default {\n  content: ['./index.html', './src/**/*.{ts,tsx}'],\n  theme: {\n    extend: {},\n  },\n  plugins: [],\n}` },
      { name: 'postcss.config.js', content: `export default {\n  plugins: {\n    tailwindcss: {},\n    autoprefixer: {},\n  },\n}` },
      { name: 'tsconfig.json', content: `{\n  "compilerOptions": {\n    "target": "ES2020",\n    "useDefineForClassFields": true,\n    "lib": ["ES2020", "DOM", "DOM.Iterable"],\n    "module": "ESNext",\n    "skipLibCheck": true,\n    "moduleResolution": "bundler",\n    "allowImportingTsExtensions": true,\n    "isolatedModules": true,\n    "moduleDetection": "force",\n    "noEmit": true,\n    "jsx": "react-jsx",\n    "strict": true\n  },\n  "include": ["src"]\n}` },
    ]

    files.forEach((file, i) => {
      setTimeout(() => {
        const blob = new Blob([file.content], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = file.name.split('/').pop()!
        a.click()
        URL.revokeObjectURL(url)
      }, i * 200)
    })
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-card flex-shrink-0">
        <span className="text-xs text-muted-foreground font-mono">App.tsx</span>
        <div className="flex items-center gap-1">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied ? '已复制' : '复制'}
          </button>
          <button
            onClick={handleDownloadSingle}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <Download className="w-3 h-3" />
            下载文件
          </button>
          <button
            onClick={handleDownloadProject}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <FileDown className="w-3 h-3" />
            导出项目
          </button>
        </div>
      </div>
      <pre className="flex-1 overflow-auto p-4 text-xs leading-relaxed bg-background font-mono">
        <code>{generatedCode}</code>
      </pre>
    </div>
  )
}
