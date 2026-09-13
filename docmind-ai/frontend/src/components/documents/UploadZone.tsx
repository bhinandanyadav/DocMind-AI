import { useState, useRef, type DragEvent, type ChangeEvent } from 'react'
import { Upload, FileText, X, Loader2, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn, formatFileSize } from '@/lib/utils'
import { documentService } from '@/services/documentService'
import { toast } from '@/hooks/useToast'
import type { Document } from '@/types/document'

interface UploadZoneProps {
  onUploadComplete?: (document: Document) => void
}

const ACCEPTED = ['.pdf', '.docx', '.txt']
const MAX_MB = 50

export default function UploadZone({ onUploadComplete }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [progress, setProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadDone, setUploadDone] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): string | null => {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!ACCEPTED.includes(ext)) return `File type not supported. Use PDF, DOCX, or TXT.`
    if (file.size > MAX_MB * 1024 * 1024) return `File exceeds ${MAX_MB}MB limit.`
    return null
  }

  const handleFile = (file: File) => {
    setError('')
    setUploadDone(false)
    setProgress(0)
    const err = validateFile(file)
    if (err) { setError(err); return }
    setSelectedFile(file)
  }

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const handleUpload = async () => {
    if (!selectedFile) return
    setIsUploading(true)
    setError('')
    try {
      const doc = await documentService.upload(selectedFile, setProgress)
      setUploadDone(true)
      toast({ title: 'Upload successful', description: `${selectedFile.name} is being processed.` })
      onUploadComplete?.(doc)
      setTimeout(() => {
        setSelectedFile(null)
        setUploadDone(false)
        setProgress(0)
      }, 2000)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(msg || 'Upload failed. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const reset = () => {
    setSelectedFile(null)
    setError('')
    setProgress(0)
    setUploadDone(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="w-full">
      {!selectedFile ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all',
            isDragging
              ? 'border-indigo-500 bg-indigo-50'
              : 'border-gray-300 bg-gray-50 hover:border-indigo-400 hover:bg-indigo-50/50'
          )}
        >
          <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-700 mb-1">Drag and drop your file here</p>
          <p className="text-xs text-gray-400 mb-4">or click to browse</p>
          <Button variant="outline" size="sm" type="button">Browse Files</Button>
          <p className="text-xs text-gray-400 mt-3">PDF, DOCX, TXT &middot; Max {MAX_MB}MB</p>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-xl p-5 bg-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{selectedFile.name}</p>
              <p className="text-xs text-gray-400">{formatFileSize(selectedFile.size)}</p>
            </div>
            {!isUploading && !uploadDone && (
              <button onClick={reset} className="text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            )}
          </div>

          {isUploading && (
            <div className="mb-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Uploading...</span>
                <span>{progress}%</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {uploadDone && (
            <div className="flex items-center gap-2 text-emerald-600 text-sm mb-4">
              <CheckCircle size={16} />
              <span>Uploaded! Processing in background...</span>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-600 mb-4">{error}</p>
          )}

          {!isUploading && !uploadDone && (
            <Button onClick={handleUpload} className="w-full" size="sm">
              Upload Document
            </Button>
          )}

          {isUploading && (
            <Button disabled className="w-full" size="sm">
              <Loader2 className="w-4 h-4 animate-spin" /> Uploading...
            </Button>
          )}
        </div>
      )}

      {error && !selectedFile && (
        <p className="text-sm text-red-600 mt-2">{error}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,.txt"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  )
}
