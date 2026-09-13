import { useEffect, useState } from 'react'
import { ArrowLeft, Eye, MessageSquare, Pencil, Trash2, Sparkles, FlaskConical, GraduationCap } from 'lucide-react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { documentService } from '@/services/documentService'
import { toast } from '@/hooks/useToast'
import { formatFileSize, formatRelativeTime } from '@/lib/utils'
import type { Document } from '@/types/document'

export default function DocumentDetails() {
  const { documentId } = useParams<{ documentId: string }>()
  const navigate = useNavigate()
  const [document, setDocument] = useState<Document>()
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showRename, setShowRename] = useState(false)
  const [newName, setNewName] = useState('')
  const [summary, setSummary] = useState<string | null>(null)
  const [isSummarizing, setIsSummarizing] = useState(false)

  useEffect(() => {
    if (!documentId) return
    const load = async () => {
      try {
        const doc = await documentService.get(documentId)
        setDocument(doc)
        setNewName(doc.filename)
      } catch {
        toast({ title: 'Unable to load document details', variant: 'destructive' })
      } finally {
        setIsLoading(false)
      }
    }
    void load()
  }, [documentId])

  const handleDelete = async () => {
    if (!documentId || !confirm(`Delete "${document?.filename}"? This cannot be undone.`)) return
    setIsDeleting(true)
    try {
      await documentService.remove(documentId)
      toast({ title: 'Document deleted' })
      navigate('/documents')
    } catch {
      toast({ title: 'Delete failed', variant: 'destructive' })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleRename = async () => {
    if (!documentId || !newName.trim() || newName === document?.filename) return
    try {
      await documentService.rename(documentId, newName.trim())
      setDocument((prev) => (prev ? { ...prev, filename: newName.trim() } : prev))
      setShowRename(false)
      toast({ title: 'Document renamed' })
    } catch {
      toast({ title: 'Rename failed', variant: 'destructive' })
    }
  }

  const handleGenerateSummary = async () => {
    if (!documentId) return
    setIsSummarizing(true)
    try {
      const data = await documentService.getSummary(documentId)
      setSummary(data.summary || data.detailed_summary)
      toast({ title: 'Summary generated' })
    } catch {
      toast({ title: 'Failed to generate summary', variant: 'destructive' })
    } finally {
      setIsSummarizing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          Loading document details...
        </div>
      </div>
    )
  }

  if (!document) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <h2 className="text-lg font-semibold text-gray-900">Document not found</h2>
        <Link to="/documents" className="mt-4 text-sm font-medium text-indigo-600 hover:underline">
          Back to Documents
        </Link>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <Link to="/documents" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600 mb-4">
          <ArrowLeft size={16} /> Back to Documents
        </Link>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center">
              <Eye className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{document.filename}</h1>
              <p className="text-sm text-gray-500">
                {document.file_type.toUpperCase()} · {formatFileSize(document.file_size)} ·{" "}
                {formatRelativeTime(document.created_at)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to={`/documents/${documentId}/view`}>
              <Button variant="outline" size="sm" className="gap-2">
                <Eye size={16} /> Open Viewer
              </Button>
            </Link>
            <Link to={`/chat?doc=${documentId}`}>
              <Button variant="outline" size="sm" className="gap-2">
                <MessageSquare size={16} /> Ask AI
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 mb-8">
        <Button onClick={() => void handleGenerateSummary()} disabled={isSummarizing} className="gap-2">
          {isSummarizing ? (
            <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Generating...</>
          ) : (
            <><Sparkles size={16} /> Generate Summary</>
          )}
        </Button>
        <Link to={`/research/${documentId}`}>
          <Button variant="outline" className="gap-2">
            <FlaskConical size={16} /> Research Mode
          </Button>
        </Link>
        <Link to={`/study/${documentId}`}>
          <Button variant="outline" className="gap-2">
            <GraduationCap size={16} /> Study Mode
          </Button>
        </Link>
        <button
          onClick={() => setShowRename(!showRename)}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <Pencil size={16} /> Rename
        </button>
        <button
          onClick={() => void handleDelete()}
          disabled={isDeleting}
          className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
        >
          <Trash2 size={16} /> {isDeleting ? 'Deleting...' : 'Delete'}
        </button>
      </div>

      {/* Rename inline */}
      {showRename && (
        <div className="mb-6 flex items-center gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            placeholder="New name..."
          />
          <Button size="sm" onClick={() => void handleRename()}>Save</Button>
          <Button size="sm" variant="ghost" onClick={() => setShowRename(false)}>Cancel</Button>
        </div>
      )}

      {/* Summary */}
      {summary && (
        <Card className="mb-6 border-indigo-100 bg-indigo-50/30">
          <CardContent className="p-5">
            <h2 className="font-semibold text-gray-900 mb-2">Quick Summary</h2>
            <p className="text-sm leading-6 text-gray-700">{summary}</p>
          </CardContent>
        </Card>
      )}

      {/* Metadata */}
      <Card className="mb-6">
        <CardContent className="p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Metadata</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Status</p>
              <p className={`font-medium ${
                document.status === 'READY' ? 'text-emerald-600' :
                document.status === 'PROCESSING' ? 'text-amber-600' :
                document.status === 'FAILED' ? 'text-red-600' : 'text-gray-600'
              }`}>
                {document.status === 'READY' ? 'Ready' : document.status === 'PROCESSING' ? 'Processing...' : document.status === 'FAILED' ? 'Failed' : 'Uploaded'}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Pages</p>
              <p className="font-medium text-gray-900">{document.page_count ?? '—'}</p>
            </div>
            <div>
              <p className="text-gray-500">File Type</p>
              <p className="font-medium text-gray-900 uppercase">{document.file_type}</p>
            </div>
            <div>
              <p className="text-gray-500">Uploaded</p>
              <p className="font-medium text-gray-900">{formatRelativeTime(document.created_at)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer actions */}
      <div className="flex items-center justify-between text-sm text-gray-400">
        <span>Document ID: {document.id}</span>
        <Link to={`/documents/${documentId}/view`} className="text-indigo-600 hover:underline">
          Open in viewer →
        </Link>
      </div>
    </div>
  )
}