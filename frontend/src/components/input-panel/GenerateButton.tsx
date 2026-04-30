import { Sparkles, Loader2, AlertCircle } from 'lucide-react'
import { useAppStore } from '@/stores/useAppStore'

export function GenerateButton() {
  const generate = useAppStore((s) => s.generate)
  const isGenerating = useAppStore((s) => s.isGenerating)
  const generationError = useAppStore((s) => s.generationError)
  const textPrompt = useAppStore((s) => s.textPrompt)
  const uploadedImage = useAppStore((s) => s.uploadedImage)

  const disabled = isGenerating || (!textPrompt.trim() && !uploadedImage)

  return (
    <div className="space-y-2">
      <button
        onClick={generate}
        disabled={disabled}
        className="w-full h-9 rounded-md bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-2 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>正在生成...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            <span>生成 UI</span>
          </>
        )}
      </button>

      {generationError && (
        <div className="flex items-start gap-2 p-2 rounded-md bg-destructive/10 text-destructive animate-in">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          <p className="text-xs leading-relaxed">{generationError}</p>
        </div>
      )}
    </div>
  )
}
