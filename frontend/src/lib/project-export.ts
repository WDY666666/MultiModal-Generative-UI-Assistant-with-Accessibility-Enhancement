import JSZip from 'jszip'
import { createTwoFilesPatch } from 'diff'

const PACKAGE_JSON = {
  name: 'generated-ui',
  private: true,
  version: '1.0.0',
  type: 'module',
  scripts: {
    dev: 'vite',
    build: 'tsc && vite build',
    preview: 'vite preview',
  },
  dependencies: {
    react: '^18.3.1',
    'react-dom': '^18.3.1',
  },
  devDependencies: {
    '@types/react': '^18.3.17',
    '@types/react-dom': '^18.3.5',
    '@vitejs/plugin-react': '^4.3.4',
    autoprefixer: '^10.4.20',
    postcss: '^8.4.49',
    tailwindcss: '^3.4.17',
    typescript: '~5.7.2',
    vite: '^5.4.11',
  },
}

const INDEX_HTML = `<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>生成的 UI</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`

const MAIN_TSX = `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`

const INDEX_CSS = `@tailwind base;
@tailwind components;
@tailwind utilities;

html,
body,
#root {
  width: 100%;
  min-height: 100%;
  margin: 0;
}

body {
  overflow-x: hidden;
  background: #ffffff;
}`

const VITE_CONFIG = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})`

const TAILWIND_CONFIG = `/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
}`

const POSTCSS_CONFIG = `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`

const TSCONFIG_JSON = `{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true
  },
  "include": ["src"]
}`

function buildProjectReadme(previousCodeExists: boolean) {
  return `# 生成的 UI 项目

## 启动方式

\`\`\`bash
npm install
npm run dev
\`\`\`

## 说明

- 该项目由 MultiModal Generative UI Assistant 导出
- 入口文件：\`src/App.tsx\`
- 如果需要对比修复前后代码，请查看 \`diff/App.diff\`
${previousCodeExists ? '- ZIP 中已附带最近一次变更的 diff 文件' : ''}
`
}

function buildUnifiedDiff(previousCode: string, currentCode: string) {
  return createTwoFilesPatch(
    'before/src/App.tsx',
    'after/src/App.tsx',
    previousCode,
    currentCode,
    '旧版',
    '新版',
    { context: 3 },
  )
}

function downloadBlob(filename: string, content: BlobPart, mimeType = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export function buildGeneratedProjectFiles(currentCode: string, previousCode?: string | null) {
  const hasPreviousCode = Boolean(previousCode?.trim() && previousCode.trim() !== currentCode.trim())

  const files: Record<string, string> = {
    'package.json': JSON.stringify(PACKAGE_JSON, null, 2),
    'index.html': INDEX_HTML,
    'vite.config.ts': VITE_CONFIG,
    'tailwind.config.js': TAILWIND_CONFIG,
    'postcss.config.js': POSTCSS_CONFIG,
    'tsconfig.json': TSCONFIG_JSON,
    'src/main.tsx': MAIN_TSX,
    'src/index.css': INDEX_CSS,
    'src/App.tsx': currentCode,
    'README.md': buildProjectReadme(hasPreviousCode),
  }

  if (hasPreviousCode && previousCode) {
    files['diff/App.diff'] = buildUnifiedDiff(previousCode, currentCode)
  }

  return files
}

export function downloadSingleFile(filename: string, content: string, mimeType = 'text/plain;charset=utf-8') {
  downloadBlob(filename, content, mimeType)
}

export async function downloadProjectZip(
  currentCode: string,
  previousCode?: string | null,
  projectName = 'generated-ui',
) {
  const zip = new JSZip()
  const files = buildGeneratedProjectFiles(currentCode, previousCode)

  for (const [path, content] of Object.entries(files)) {
    zip.file(path, content)
  }

  const blob = await zip.generateAsync({ type: 'blob' })
  downloadBlob(`${projectName}.zip`, blob, 'application/zip')
}

export function downloadCodeDiff(previousCode: string, currentCode: string, filename = 'App.diff') {
  const diff = buildUnifiedDiff(previousCode, currentCode)
  downloadBlob(filename, diff)
}
