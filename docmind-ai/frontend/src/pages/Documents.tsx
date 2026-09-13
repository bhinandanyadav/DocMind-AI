import { useState, useEffect, useCallback } from 'react'
import { Upload, Search, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import DocumentCard from '@/components/documents/DocumentCard'
import UploadZone from '@/components/documents/UploadZone'
import { documentService } from '@/services/documentService'
import { toast } from '@/hooks/useToast'
import type { Document } from '@/types/document'

export default function Documents() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showUpload, setShowUpload] = useState(false)

  const loadDocuments = useCallback(async () => {
    try {
      const data = await documentService.list()
      setDocuments(data.items)
    } catch {
      toast({ title: 'Failed to load documents', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { loadDocuments() }, [loadDocuments])

  const handleUploadComplete = (doc: Document) => {
    setDocuments((prev) => [doc, ...prev])
    setShowUpload(false)
  }

  const handleDelete = (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id))
  }

  const handleRename = (id: string, name: string) => {
    setDocuments((prev) => prev.map((d) => d.id === id ? { ...d, filename: name } : d))
  }

  const handleRetry = async (id: string) => {
    try {
      await documentService.reprocess(id)
      setDocuments((prev) => prev.map((document) => (
        document.id === id ? { ...document, status: 'PROCESSING' } : document
      )))
      toast({ title: 'Processing restarted' })
    } catch {
      toast({ title: 'Could not restart processing', variant: 'destructive' })
    }
  }

  const filtered = documents.filter((d) =>
    d.filename.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
          <p className="text-gray-500 mt-1">{documents.length} document{documents.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => setShowUpload(!showUpload)} className="gap-2">
          <Upload size={16} />
          Upload Document
        </Button>
      </div>

      {/* Upload Zone */}
      {showUpload && (
        <div className="mb-6 p-6 border border-dashed border-indigo-200 rounded-xl bg-indigo-50/30">
          <UploadZone onUploadComplete={handleUploadComplete} />
        </div>
      )}

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <Input
          placeholder="Search documents..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-40 rounded-xl bg-gray-100 shimmer" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {search ? 'No documents found' : 'No documents yet'}
          </h3>
          <p className="text-gray-500 text-sm mb-6">
            {search ? 'Try a different search term' : 'Upload your first document to get started'}
          </p>
          {!search && (
            <Button onClick={() => setShowUpload(true)} className="gap-2">
              <Upload size={16} /> Upload Document
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((doc) => (
            <DocumentCard
              key={doc.id}
              document={doc}
              onDelete={handleDelete}
              onRename={handleRename}
              onRetry={handleRetry}
            />
          ))}
        </div>
      )}
    </div>
  )
}
