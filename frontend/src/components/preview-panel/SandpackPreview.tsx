import {
  SandpackLayout,
  SandpackPreview as SandpackFrame,
  SandpackProvider,
} from '@codesandbox/sandpack-react'
import { useMemo } from 'react'
import { useAppStore } from '@/stores/useAppStore'

const INDEX_CODE = `import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
`

const HTML_CODE = `<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Generated UI</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
`

const CSS_CODE = `html,
body,
#root {
  width: 100%;
  min-height: 100vh;
  margin: 0;
}

body {
  overflow-x: hidden;
  background: #fff;
}

* {
  box-sizing: border-box;
}
`

const PACKAGE_JSON = `{
  "dependencies": {
    "@types/react": "^18.3.17",
    "@types/react-dom": "^18.3.5",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-scripts": "^5.0.1",
    "typescript": "~5.7.2"
  },
  "devDependencies": {},
  "main": "/index.tsx"
}
`

function normalizePreviewCode(code: string) {
  let normalized = code

  if (normalized.includes('React.FormEvent')) {
    normalized = normalized.replace(/React\.FormEvent/g, 'FormEvent')
    if (!/import\s+(?:type\s+)?\{[^}]*\bFormEvent\b[^}]*\}\s+from\s+['"]react['"]/.test(normalized)) {
      normalized = `import type { FormEvent } from 'react'\n${normalized}`
    }
  }

  if (normalized.includes('React.ChangeEvent')) {
    normalized = normalized.replace(/React\.ChangeEvent/g, 'ChangeEvent')
    if (!/import\s+(?:type\s+)?\{[^}]*\bChangeEvent\b[^}]*\}\s+from\s+['"]react['"]/.test(normalized)) {
      normalized = `import type { ChangeEvent } from 'react'\n${normalized}`
    }
  }

  return normalized
}

export function SandpackPreview() {
  const generatedCode = useAppStore((s) => s.generatedCode)
  const generatedCss = useAppStore((s) => s.generatedCss)
  const previewCode = useMemo(() => normalizePreviewCode(generatedCode), [generatedCode])
  const files = useMemo(
    () => ({
      '/App.tsx': { code: previewCode, active: true },
      '/index.tsx': { code: INDEX_CODE, hidden: true },
      '/public/index.html': { code: HTML_CODE, hidden: true },
      '/styles.css': { code: generatedCss || CSS_CODE, hidden: true },
      '/package.json': { code: PACKAGE_JSON, hidden: true },
    }),
    [generatedCss, previewCode]
  )

  return (
    <div className="preview-stage h-full min-h-0 overflow-hidden bg-[#0d0f14]">
      <SandpackProvider
        key={previewCode}
        className="preview-provider h-full min-h-0"
        style={{ height: '100%' }}
        template="react-ts"
        files={files}
        options={{
          activeFile: '/App.tsx',
          visibleFiles: ['/App.tsx'],
          autorun: true,
          recompileMode: 'immediate',
        }}
        theme={{
          colors: {
            surface1: '#0d0f14',
            surface2: '#151922',
            surface3: '#202635',
            clickable: '#93c5fd',
            base: '#f8fafc',
            disabled: '#64748b',
            hover: '#1f2937',
            accent: '#3b82f6',
            error: '#f87171',
            errorSurface: '#450a0a',
          },
        }}
      >
        <SandpackLayout className="preview-sandbox h-full min-h-0" style={{ height: '100%' }}>
          <SandpackFrame
            className="h-full min-h-0"
            style={{ height: '100%' }}
            showNavigator={false}
            showOpenInCodeSandbox={false}
            showSandpackErrorOverlay
            showRefreshButton
          />
        </SandpackLayout>
      </SandpackProvider>
    </div>
  )
}
