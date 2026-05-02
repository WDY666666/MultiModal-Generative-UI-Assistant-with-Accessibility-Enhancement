import { useCallback, useMemo, useState } from 'react'
import { AlertCircle, Image as ImageIcon, Loader2, RefreshCw, Upload, X } from 'lucide-react'

import { api } from '@/services/api'
import { fileToBase64 } from '@/lib/utils'
import { useAppStore } from '@/stores/useAppStore'

export function ImageUpload() {
  const uploadedImage = useAppStore((state) => state.uploadedImage)
  const imagePreview = useAppStore((state) => state.imagePreview)
  const imageDescription = useAppStore((state) => state.imageDescription)
  const setUploadedImage = useAppStore((state) => state.setUploadedImage)
  const setImageDescription = useAppStore((state) => state.setImageDescription)

  const [isDragOver, setIsDragOver] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisError, setAnalysisError] = useState<string | null>(null)

  const analyzeFile = useCallback(
    async (file: File) => {
      setIsAnalyzing(true)
      setAnalysisError(null)
      try {
        const base64 = await fileToBase64(file)
        const result = await api.analyzeImage({ imageBase64: base64 })
        setImageDescription(result.description || '')
      } catch (error) {
        setImageDescription('')
        setAnalysisError(error instanceof Error ? error.message : 'Image analysis failed.')
      } finally {
        setIsAnalyzing(false)
      }
    },
    [setImageDescription]
  )

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) {
        setAnalysisError('Only image files are supported.')
        return
      }

      setUploadedImage(file)
      await analyzeFile(file)
    },
    [analyzeFile, setUploadedImage]
  )

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
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
    (event: React.ChangeEvent<HTMLInputElement>) => {
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
    setAnalysisError(null)
  }, [setImageDescription, setUploadedImage])

  const canReanalyze = useMemo(() => Boolean(uploadedImage) && !isAnalyzing, [uploadedImage, isAnalyzing])

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-foreground">Reference image (optional)</label>

      {imagePreview ? (
        <div className="relative overflow-hidden rounded-md border border-border">
          <img src={imagePreview} alt="Uploaded reference" className="h-32 w-full object-cover" />
          {isAnalyzing && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="flex items-center gap-2 text-xs text-white">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Analyzing image...
              </div>
            </div>
          )}
          <button
            onClick={removeImage}
            className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
            aria-label="Remove reference image"
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
            <span className="text-xs text-muted-foreground">Drag image here or click to upload</span>
            <span className="text-[10px] text-muted-foreground/60">Supports PNG and JPG</span>
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
            onClick={() => canReanalyze && void analyzeFile(uploadedImage)}
            disabled={!canReanalyze}
            className="inline-flex items-center gap-1 rounded px-1.5 py-1 text-[10px] hover:bg-accent disabled:opacity-50"
          >
            {isAnalyzing ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
            Re-analyze
          </button>
        </div>
      )}

      {analysisError && (
        <div className="flex items-start gap-1.5 rounded-md bg-destructive/10 p-2 text-xs text-destructive">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
          <span>{analysisError}</span>
        </div>
      )}

      {uploadedImage && (
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label htmlFor="image-analysis" className="text-[11px] font-medium text-foreground">
              AI layout notes (editable)
            </label>
            <span className="text-[10px] text-muted-foreground">Used for generation and iteration</span>
          </div>
          <textarea
            id="image-analysis"
            value={imageDescription}
            onChange={(event) => setImageDescription(event.target.value)}
            placeholder="AI-recognized layout hints will appear here. You can edit this text to correct the model before generating UI."
            className="h-24 w-full resize-none rounded-md border border-border bg-background px-2.5 py-2 text-xs leading-relaxed text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      )}
    </div>
  )
}
