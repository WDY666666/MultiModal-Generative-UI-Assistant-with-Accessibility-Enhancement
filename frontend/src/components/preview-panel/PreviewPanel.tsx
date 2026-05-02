import { useState } from 'react'
import { SandpackPreview } from './SandpackPreview'
import { CodeViewer } from './CodeViewer'
import { Eye, Code } from 'lucide-react'

export function PreviewPanel() {
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview')

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#0b0d12]">
      <div className="h-12 flex-shrink-0 border-b border-white/10 bg-[#11141b] px-4 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors ${
              activeTab === 'preview'
                ? 'bg-white text-slate-950 shadow-sm'
                : 'text-slate-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            预览
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors ${
              activeTab === 'code'
                ? 'bg-white text-slate-950 shadow-sm'
                : 'text-slate-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            代码
          </button>
        </div>
        <div className="hidden items-center gap-2 text-[11px] text-slate-500 md:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]" />
          Live preview
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden bg-[#0d0f14]">
        {activeTab === 'preview' ? <SandpackPreview /> : <CodeViewer />}
      </div>
    </div>
  )
}
