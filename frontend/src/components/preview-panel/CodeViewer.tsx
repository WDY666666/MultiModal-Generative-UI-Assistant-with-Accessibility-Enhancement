import { useMemo, useState } from 'react'
import { Check, Copy, Download, FileDown, RotateCcw } from 'lucide-react'

import {
  buildGeneratedProjectFiles,
  downloadCodeDiff,
  downloadProjectZip,
  downloadSingleFile,
} from '@/lib/project-export'
import { useAppStore } from '@/stores/useAppStore'

export function CodeViewer() {
  const generatedCode = useAppStore((s) => s.generatedCode)
  const previousGeneratedCode = useAppStore((s) => s.previousGeneratedCode)
  const restorePreviousGeneratedCode = useAppStore((s) => s.restorePreviousGeneratedCode)
  const [copied, setCopied] = useState(false)

  const diffText = useMemo(() => {
    if (!previousGeneratedCode) {
      return ''
    }

    return buildGeneratedProjectFiles(generatedCode, previousGeneratedCode)['diff/App.diff'] ?? ''
  }, [generatedCode, previousGeneratedCode])

  const diffLines = useMemo(() => diffText.split('\n'), [diffText])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedCode)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  const handleDownloadSingle = () => {
    downloadSingleFile('App.tsx', generatedCode, 'text/typescript;charset=utf-8')
  }

  const handleDownloadProject = async () => {
    await downloadProjectZip(generatedCode, previousGeneratedCode, 'generated-ui-project')
  }

  const handleDownloadDiff = () => {
    if (!previousGeneratedCode) {
      return
    }
    downloadCodeDiff(previousGeneratedCode, generatedCode, 'App.diff')
  }

  const handleRestorePrevious = () => {
    restorePreviousGeneratedCode()
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-shrink-0 items-center justify-between border-b border-border bg-card px-3 py-1.5">
        <span className="font-mono text-xs text-muted-foreground">App.tsx</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 rounded px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {copied ? '已复制' : '复制'}
          </button>
          <button
            type="button"
            onClick={handleDownloadSingle}
            className="flex items-center gap-1 rounded px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <Download className="h-3 w-3" />
            下载文件
          </button>
          <button
            type="button"
            onClick={handleDownloadProject}
            className="flex items-center gap-1 rounded px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <FileDown className="h-3 w-3" />
            导出项目 ZIP
          </button>
          <button
            type="button"
            onClick={handleDownloadDiff}
            disabled={!previousGeneratedCode}
            className="flex items-center gap-1 rounded px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Download className="h-3 w-3" />
            导出差异
          </button>
          <button
            type="button"
            onClick={handleRestorePrevious}
            disabled={!previousGeneratedCode}
            className="flex items-center gap-1 rounded px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
          >
            <RotateCcw className="h-3 w-3" />
            恢复上一版
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        <div className="grid h-full min-h-0 grid-rows-[minmax(0,1fr)_auto]">
          <pre className="overflow-auto bg-background p-4 font-mono text-xs leading-relaxed">
            <code>{generatedCode}</code>
          </pre>

          {previousGeneratedCode ? (
            <section className="max-h-64 overflow-auto border-t border-border bg-muted/20">
              <div className="flex items-center justify-between gap-3 border-b border-border px-3 py-2">
                <div>
                  <p className="text-xs font-medium text-foreground">最近一次变更对比</p>
                  <p className="text-[10px] text-muted-foreground">绿色为新增，红色为删除。</p>
                </div>
                <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-medium text-primary">
                  diff 已生成
                </span>
              </div>
              <div className="overflow-auto px-3 py-2 font-mono text-[11px] leading-5">
                {diffLines.map((line, index) => {
                  const isAdd = line.startsWith('+') && !line.startsWith('+++')
                  const isRemove = line.startsWith('-') && !line.startsWith('---')
                  const isHeader = line.startsWith('@@') || line.startsWith('diff ')

                  return (
                    <div
                      key={`${index}-${line}`}
                      className={`whitespace-pre-wrap rounded px-2 ${
                        isAdd
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                          : isRemove
                            ? 'bg-red-500/10 text-red-700 dark:text-red-300'
                            : isHeader
                              ? 'text-muted-foreground'
                              : 'text-foreground'
                      }`}
                    >
                      {line}
                    </div>
                  )
                })}
              </div>
            </section>
          ) : (
            <section className="border-t border-border bg-muted/20 px-3 py-2 text-[11px] text-muted-foreground">
              当前还没有上一版代码，生成或修复一次后，这里会显示前后对比。
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
