import { useCallback, useState } from 'react'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
import { useAppStore } from '@/stores/useAppStore'
import { api } from '@/services/api'
import { fileToBase64 } from '@/lib/utils'

export function ImageUpload() {
  const uploadedImage = useAppStore((s) => s.uploadedImage)
  const imagePreview = useAppStore((s) => s.imagePreview)
  const setUploadedImage = useAppStore((s) => s.setUploadedImage)
  const setImageDescription = useAppStore((s) => s.setImageDescription)
  const [isDragOver, setIsDragOver] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) return
    setUploadedImage(file)

    setIsAnalyzing(true)
    try {
      const base64 = await fileToBase64(file)
      const result = await api.analyzeImage({ imageBase64: base64 })
      setImageDescription(result.description)
    } catch {
      setImageDescription('')
    } finally {
      setIsAnalyzing(false)
    }
  }, [setUploadedImage, setImageDescription])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }, [handleFile])

  const removeImage = useCallback(() => {
    setUploadedImage(null)
    setImageDescription('')
  }, [setUploadedImage, setImageDescription])

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-foreground">
        参考图片（可选）
      </label>

      {imagePreview ? (
        <div className="relative rounded-md border border-border overflow-hidden">
          <img
            src={imagePreview}
            alt="上传的参考图"
            className="w-full h-32 object-cover"
          />
          {isAnalyzing && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white text-xs">AI 正在分析图片...</span>
            </div>
          )}
          <button
            onClick={removeImage}
            className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
            aria-label="移除参考图片"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div
          className={`border-2 border-dashed rounded-md p-4 text-center cursor-pointer transition-colors ${
            isDragOver
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50'
          }`}
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => document.getElementById('image-input')?.click()}
        >
          <div className="flex flex-col items-center gap-1.5">
            <Upload className="w-5 h-5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              拖拽图片到此处，或点击上传
            </span>
            <span className="text-[10px] text-muted-foreground/60">
              支持 PNG、JPG 格式
            </span>
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

      {uploadedImage && !isAnalyzing && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <ImageIcon className="w-3 h-3" />
          <span>{uploadedImage.name}</span>
        </div>
      )}
    </div>
  )
}
