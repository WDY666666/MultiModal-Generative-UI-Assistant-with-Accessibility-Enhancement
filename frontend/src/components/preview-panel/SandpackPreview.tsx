import { AlertTriangle, RefreshCw } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as ReactRuntime from 'react'
import * as ReactDOMClient from 'react-dom/client'
import * as axe from 'axe-core'
import * as ts from 'typescript'
import { useAppStore } from '@/stores/useAppStore'

const BASE_CSS = `html,
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
}`

declare global {
  interface Window {
    __MMUI_PREVIEW_REACT__?: typeof ReactRuntime
    __MMUI_PREVIEW_REACT_DOM_CLIENT__?: typeof ReactDOMClient
    __MMUI_PREVIEW_AXE__?: typeof axe
  }
}

const REACT_EVENT_TYPES = ['FormEvent', 'ChangeEvent', 'MouseEvent', 'KeyboardEvent'] as const
const MIN_RENDERED_HTML_LENGTH = 40

type ReactEventType = (typeof REACT_EVENT_TYPES)[number]

function ensureReactTypeImport(code: string, typeName: ReactEventType): string {
  const hasTypeUsage = new RegExp(`\\b${typeName}(?:<|\\b)`).test(code)
  if (!hasTypeUsage) {
    return code
  }

  const hasTypeImport = new RegExp(
    `import\\s+(?:type\\s+)?\\{[^}]*\\b${typeName}\\b[^}]*\\}\\s+from\\s+['"]react['"]`
  ).test(code)
  if (hasTypeImport) {
    return code
  }

  return `import type { ${typeName} } from 'react'\n${code}`
}

function normalizePreviewCode(code: string) {
  let normalized = code

  for (const typeName of REACT_EVENT_TYPES) {
    const reactTypePattern = new RegExp(`React\\.${typeName}`, 'g')
    if (reactTypePattern.test(normalized)) {
      normalized = normalized.replace(reactTypePattern, typeName)
    }
    normalized = ensureReactTypeImport(normalized, typeName)
  }

  return normalized
}

function stripImports(code: string) {
  return code
    .replace(/^\s*import\s+type[\s\S]*?;\s*$/gm, '')
    .replace(/^\s*import[\s\S]*?;\s*$/gm, '')
}

function ensureDefaultExport(code: string) {
  if (/export\s+default/.test(code)) {
    return code
  }

  if (/(?:function|const|class)\s+App\b/.test(code)) {
    return `${code}\n\nexport default App\n`
  }

  return code
}

function formatTsDiagnostics(diagnostics: readonly ts.Diagnostic[]) {
  return diagnostics
    .filter((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error)
    .map((diagnostic) => {
      const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')
      if (!diagnostic.file || diagnostic.start == null) {
        return message
      }
      const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start)
      return `L${line + 1}:C${character + 1} ${message}`
    })
}

function compilePreviewRuntime(code: string) {
  const normalized = normalizePreviewCode(code)
  const withDefaultExport = ensureDefaultExport(stripImports(normalized))

  const transpiled = ts.transpileModule(withDefaultExport, {
    compilerOptions: {
      jsx: ts.JsxEmit.React,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2019,
      esModuleInterop: true,
    },
    reportDiagnostics: true,
  })

  return {
    script: transpiled.outputText,
    diagnostics: formatTsDiagnostics(transpiled.diagnostics ?? []),
  }
}

function escapeInlineScript(code: string) {
  return code.replace(/<\\\//g, '<\\\\/').replace(/<\/script/gi, '<\\/script')
}

function buildPreviewDocument(runtimeScript: string, css: string) {
  const safeScript = escapeInlineScript(runtimeScript)

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>${css || BASE_CSS}</style>
  </head>
  <body>
    <div id="root"></div>
    <script>
${safeScript}
    </script>
  </body>
</html>`
}

function buildRuntimeScript(transpiledScript: string) {
  return `(() => {
  const React = window.parent.__MMUI_PREVIEW_REACT__;
  const ReactDOMClient = window.parent.__MMUI_PREVIEW_REACT_DOM_CLIENT__;
  const axeRuntime = window.parent.__MMUI_PREVIEW_AXE__;

  const sendRuntimeError = (message) => {
    window.parent.postMessage(
      {
        type: 'PREVIEW_RUNTIME_ERROR',
        message: String(message || 'preview runtime error'),
      },
      '*'
    );
  };

  const sendError = (message) => {
    sendRuntimeError(message);
    window.parent.postMessage(
      {
        type: 'AXE_RESULTS',
        violations: [],
        passes: 0,
        incomplete: 0,
        runtimeError: String(message || 'unknown error'),
      },
      '*'
    );
  };

  window.addEventListener('error', (event) => {
    sendError(event?.error?.message || event?.message || 'preview runtime error');
  });
  window.addEventListener('unhandledrejection', (event) => {
    sendError(event?.reason?.message || event?.reason || 'preview unhandled rejection');
  });

  if (!React || !ReactDOMClient) {
    throw new Error('Preview runtime unavailable in parent window.');
  }

  const exports = {};
  const module = { exports };
  const { useState, useEffect, useMemo, useCallback, useRef, useReducer, Fragment } = React;

${transpiledScript}

  const AppComponent =
    module.exports?.default ?? exports.default ?? (typeof App !== 'undefined' ? App : null);

  if (!AppComponent) {
    throw new Error('No default App component found. Please return export default function App().');
  }

  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error('Preview root node not found.');
  }

  const sendReady = () => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const rootHtmlLength = (rootElement.innerHTML || '').trim().length;
        const rootTextLength = (rootElement.textContent || '').trim().length;
        window.parent.postMessage(
          {
            type: 'PREVIEW_READY',
            rootHtmlLength,
            rootTextLength,
          },
          '*'
        );
      });
    });
  };

  try {
    const root = ReactDOMClient.createRoot(rootElement);
    root.render(React.createElement(React.StrictMode, null, React.createElement(AppComponent)));
    sendReady();
  } catch (error) {
    sendError(error?.message || 'preview render failed');
  }

  window.addEventListener('message', async (event) => {
    if (event?.data?.type !== 'RUN_AXE_SCAN') return;

    if (!axeRuntime || typeof axeRuntime.run !== 'function') {
      window.parent.postMessage({ type: 'AXE_RESULTS', violations: [], passes: 0, incomplete: 0 }, '*');
      return;
    }

    try {
      const results = await axeRuntime.run(document);
      window.parent.postMessage(
        {
          type: 'AXE_RESULTS',
          violations: results.violations,
          passes: results.passes.length,
          incomplete: results.incomplete.length,
        },
        '*'
      );
    } catch (error) {
      sendError(error?.message || 'axe scan failed');
    }
  });
})();`
}

export function SandpackPreview() {
  const generatedCode = useAppStore((state) => state.generatedCode)
  const generatedCss = useAppStore((state) => state.generatedCss)
  const updateGeneratedCode = useAppStore((state) => state.updateGeneratedCode)
  const addChatMessages = useAppStore((state) => state.addChatMessages)

  const [reloadNonce, setReloadNonce] = useState(0)
  const [runtimeError, setRuntimeError] = useState<string | null>(null)

  const currentCodeRef = useRef(generatedCode)
  const currentCssRef = useRef(generatedCss || BASE_CSS)
  const stableRef = useRef({ code: generatedCode, css: generatedCss || BASE_CSS })
  const handledFailedCodeRef = useRef<string | null>(null)

  const rollbackToStableCode = useCallback(
    (message: string) => {
      const failedCode = currentCodeRef.current
      if (handledFailedCodeRef.current === failedCode) {
        return
      }

      handledFailedCodeRef.current = failedCode
      setRuntimeError(message)

      const stable = stableRef.current
      if (stable.code && stable.code !== failedCode) {
        updateGeneratedCode(stable.code, stable.css)
        addChatMessages([
          {
            role: 'assistant',
            content: `预览失败，已自动回滚到上一版稳定代码：${message}`,
          },
        ])
      }
    },
    [addChatMessages, updateGeneratedCode]
  )

  useEffect(() => {
    currentCodeRef.current = generatedCode
    currentCssRef.current = generatedCss || BASE_CSS
  }, [generatedCode, generatedCss])

  useEffect(() => {
    window.__MMUI_PREVIEW_REACT__ = ReactRuntime
    window.__MMUI_PREVIEW_REACT_DOM_CLIENT__ = ReactDOMClient
    window.__MMUI_PREVIEW_AXE__ = axe

    return () => {
      delete window.__MMUI_PREVIEW_REACT__
      delete window.__MMUI_PREVIEW_REACT_DOM_CLIENT__
      delete window.__MMUI_PREVIEW_AXE__
    }
  }, [])

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const data = event.data
      if (!data || typeof data !== 'object') {
        return
      }

      if (data.type === 'PREVIEW_READY') {
        const rootHtmlLength = Number((data as { rootHtmlLength?: unknown }).rootHtmlLength ?? 0)
        const rootTextLength = Number((data as { rootTextLength?: unknown }).rootTextLength ?? 0)
        const looksBlank = rootHtmlLength <= MIN_RENDERED_HTML_LENGTH && rootTextLength <= 1

        if (looksBlank) {
          rollbackToStableCode('预览渲染为空白内容。')
          return
        }

        stableRef.current = { code: currentCodeRef.current, css: currentCssRef.current }
        handledFailedCodeRef.current = null
        setRuntimeError(null)
        return
      }

      if (data.type === 'PREVIEW_RUNTIME_ERROR') {
        const message = String((data as { message?: string }).message || '预览运行失败。')
        rollbackToStableCode(message)
      }
    }

    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [rollbackToStableCode])

  const previewState = useMemo(() => {
    const { script, diagnostics } = compilePreviewRuntime(generatedCode)
    if (diagnostics.length > 0) {
      return {
        srcDoc: buildPreviewDocument('', BASE_CSS),
        diagnostics,
      }
    }

    return {
      srcDoc: buildPreviewDocument(buildRuntimeScript(script), generatedCss || BASE_CSS),
      diagnostics: [] as string[],
    }
  }, [generatedCode, generatedCss])

  const diagnosticsSignature = previewState.diagnostics.join('\n')

  useEffect(() => {
    if (!diagnosticsSignature) {
      return
    }

    rollbackToStableCode(
      `生成的 TSX 仍有语法错误。${previewState.diagnostics[0] ?? '请使用更具体的指令后重试。'}`
    )
  }, [diagnosticsSignature, previewState.diagnostics, rollbackToStableCode])

  return (
    <div className="preview-stage relative h-full min-h-0 overflow-hidden bg-white">
      <iframe
        key={reloadNonce}
        title="生成结果预览"
        className="preview-runtime-iframe h-full w-full border-0"
        srcDoc={previewState.srcDoc}
      />

      {runtimeError && previewState.diagnostics.length === 0 && (
        <div className="absolute inset-4 z-10 overflow-auto rounded-xl border border-red-400/40 bg-red-950/95 p-4 text-xs text-red-100 shadow-xl">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <AlertTriangle className="h-4 w-4" />
            预览运行错误
          </div>
          <p className="text-[11px] leading-relaxed text-red-200">{runtimeError}</p>
          <p className="mt-2 text-[11px] leading-relaxed text-red-300/90">
            已自动回滚到上一版稳定预览。
          </p>
        </div>
      )}

      {previewState.diagnostics.length > 0 && (
        <div className="absolute inset-4 z-10 overflow-auto rounded-xl border border-red-400/40 bg-red-950/95 p-4 text-xs text-red-100 shadow-xl">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <AlertTriangle className="h-4 w-4" />
            生成代码存在语法问题，暂时无法预览
          </div>
          <pre className="whitespace-pre-wrap break-words text-[11px] leading-relaxed text-red-200">
            {previewState.diagnostics.join('\n')}
          </pre>
        </div>
      )}

      <button
        type="button"
        onClick={() => setReloadNonce((value) => value + 1)}
        className="absolute bottom-4 right-4 z-20 inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white/90 px-2 py-1 text-[11px] font-medium text-slate-700 shadow hover:bg-white"
      >
        <RefreshCw className="h-3.5 w-3.5" />
        重新加载预览
      </button>
    </div>
  )
}
