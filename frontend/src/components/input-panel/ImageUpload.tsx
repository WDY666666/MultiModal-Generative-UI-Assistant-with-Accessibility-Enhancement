import { useCallback, useMemo, useState, type ChangeEvent, type DragEvent } from 'react'
import { AlertCircle, Image as ImageIcon, Loader2, RefreshCw, Upload, WandSparkles, X } from 'lucide-react'

import { api } from '@/services/api'
import { fileToBase64 } from '@/lib/utils'
import { useAppStore } from '@/stores/useAppStore'

function TagList({
  title,
  items,
}: {
  title: string
  items: string[]
}) {
  if (!items.length) {
    return null
  }

  return (
    <div className="space-y-1">
      <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
        {title}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <span
            key={item}
            className="rounded-full border border-border bg-background px-2 py-1 text-[10px] text-foreground"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}

export function ImageUpload() {
  const uploadedImage = useAppStore((state) => state.uploadedImage)
  const imagePreview = useAppStore((state) => state.imagePreview)
  const imageDescription = useAppStore((state) => state.imageDescription)
  const imageAnalysis = useAppStore((state) => state.imageAnalysis)
  const setUploadedImage = useAppStore((state) => state.setUploadedImage)
  const setImageDescription = useAppStore((state) => state.setImageDescription)
  const setImageAnalysis = useAppStore((state) => state.setImageAnalysis)

  const [isDragOver, setIsDragOver] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisError, setAnalysisError] = useState<string | null>(null)

  const applySuggestion = useCallback(() => {
    const suggestion = imageAnalysis?.promptSuggestion || imageAnalysis?.description || imageDescription
    if (suggestion) {
      setImageDescription(suggestion)
    }
  }, [imageAnalysis, imageDescription, setImageDescription])

  const analyzeFile = useCallback(
    async (file: File) => {
      setIsAnalyzing(true)
      setAnalysisError(null)

      try {
        const base64 = await fileToBase64(file)
        const result = await api.analyzeImage({ imageBase64: base64 })
        setImageAnalysis(result)
        setImageDescription(result.promptSuggestion || result.description || '')
      } catch (error) {
        setImageAnalysis(null)
        setImageDescription('')
        setAnalysisError(error instanceof Error ? error.message : '图片分析失败，请稍后重试。')
      } finally {
        setIsAnalyzing(false)
      }
    },
    [setImageAnalysis, setImageDescription]
  )

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) {
        setAnalysisError('仅支持图片文件。')
        return
      }

      setUploadedImage(file)
      await analyzeFile(file)
    },
    [analyzeFile, setUploadedImage]
  )

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      setIsDragOver(false)
      const file = event.dataTransfer.files[0]
      if (file) {
        void handleFile(file)
      }
    },
    [handleFile]
  )

  const handleInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (file) {
        void handleFile(file)
      }
    },
    [handleFile]
  )

  const removeImage = useCallback(() => {
    setUploadedImage(null)
    setImageDescription('')
    setImageAnalysis(null)
    setAnalysisError(null)
  }, [setImageAnalysis, setImageDescription, setUploadedImage])

  const canReanalyze = useMemo(() => Boolean(uploadedImage) && !isAnalyzing, [uploadedImage, isAnalyzing])

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor="image-input" className="text-xs font-medium text-foreground">
        参考图片（可选）
      </label>

      {imagePreview ? (
        <div className="relative overflow-hidden rounded-md border border-border">
          <img src={imagePreview} alt="上传的参考图" className="h-32 w-full object-cover" />
          {isAnalyzing && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="flex items-center gap-2 text-xs text-white">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                正在分析图片...
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={removeImage}
            className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
            aria-label="移除参考图片"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <div
          className={`cursor-pointer rounded-md border-2 border-dashed p-4 text-center transition-colors ${
            isDragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
          }`}
          onDragOver={(event) => {
            event.preventDefault()
            setIsDragOver(true)
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => document.getElementById('image-input')?.click()}
        >
          <div className="flex flex-col items-center gap-1.5">
            <Upload className="h-5 w-5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">拖拽图片到此处，或点击上传</span>
            <span className="text-[10px] text-muted-foreground/60">支持 PNG / JPG</span>
          </div>
          <input
            id="image-input"
            type="file"
            accept="image/png,image/jpeg"
            className="hidden"
            onChange={handleInputChange}
          />
        </div>
      )}

      {uploadedImage && (
        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5 truncate">
            <ImageIcon className="h-3 w-3" />
            <span className="truncate">{uploadedImage.name}</span>
          </div>
          <button
            type="button"
            onClick={() => canReanalyze && void analyzeFile(uploadedImage)}
            disabled={!canReanalyze}
            className="inline-flex items-center gap-1 rounded px-1.5 py-1 text-[10px] hover:bg-accent disabled:opacity-50"
          >
            {isAnalyzing ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
            重新识别
          </button>
        </div>
      )}

      {analysisError && (
        <div className="flex items-start gap-1.5 rounded-md bg-destructive/10 p-2 text-xs text-destructive">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
          <span>{analysisError}</span>
        </div>
      )}

      {imageAnalysis && (
        <div className="space-y-2 rounded-md border border-border bg-muted/25 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-foreground">识别结果</p>
            <button
              type="button"
              onClick={applySuggestion}
              className="inline-flex items-center gap-1 rounded px-2 py-1 text-[10px] font-medium text-primary transition-colors hover:bg-primary/10"
            >
              <WandSparkles className="h-3 w-3" />
              采用识别建议
            </button>
          </div>

          <div className="space-y-1.5 text-[11px] text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">布局：</span>
              {imageAnalysis.layout || imageAnalysis.description}
            </p>
            {imageAnalysis.promptSuggestion && (
              <p>
                <span className="font-medium text-foreground">建议提示词：</span>
                {imageAnalysis.promptSuggestion}
              </p>
            )}
          </div>

          <TagList title="组件" items={imageAnalysis.components} />
          <TagList title="风格" items={imageAnalysis.style} />
          <TagList title="可访问性提示" items={imageAnalysis.accessibilityHints} />

          <p className="text-[10px] leading-relaxed text-muted-foreground">
            识别结果会同步到下方说明框，你也可以直接手动修改后再生成。
          </p>
        </div>
      )}

      {uploadedImage && (
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label htmlFor="image-analysis" className="text-[11px] font-medium text-foreground">
              图片识别布局说明（可编辑）
            </label>
            <span className="text-[10px] text-muted-foreground">会参与生成与迭代</span>
          </div>
          <textarea
            id="image-analysis"
            value={imageDescription}
            onChange={(event) => setImageDescription(event.target.value)}
            placeholder="AI 识别到的布局信息会显示在这里。你可以手动修正，再点击生成 UI。"
            className="h-24 w-full resize-none rounded-md border border-border bg-background px-2.5 py-2 text-xs leading-relaxed text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      )}
    </div>
  )
}
