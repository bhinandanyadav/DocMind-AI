import { FileText, MoreVertical, MessageSquare, Eye, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import ProcessingStatus from './ProcessingStatus'
import { formatFileSize, formatRelativeTime } from '@/lib/utils'
import { documentService } from '@/services/documentService'
import { toast } from '@/hooks/useToast'
import type { Document } from '@/types/document'

interface DocumentCardProps {
  document: Document
  onDelete: (id: string) => void
  onRename: (id: string, name: string) => void
  onRetry: (id: string) => void
}

const typeColors: Record<string, string> = {
  pdf:  'text-red-600 bg-red-50',
  docx: 'text-blue-600 bg-blue-50',
  txt:  'text-gray-600 bg-gray-100',
}

export default function DocumentCard({ document, onDelete, onRename, onRetry }: DocumentCardProps) {
  const navigate = useNavigate()
  const [showMenu, setShowMenu] = useState(false)
  const [isRenaming, setIsRenaming] = useState(false)
  const [newName, setNewName] = useState(document.filename)

  const handleRename = async () => {
    if (!newName.trim() || newName === document.filename) { setIsRenaming(false); return }
    try {
      await documentService.rename(document.id, newName.trim())
      onRename(document.id, newName.trim())
      toast({ title: 'Document renamed' })
    } catch {
      toast({ title: 'Rename failed', variant: 'destructive' })
    }
    setIsRenaming(false)
  }

  const handleDelete = async () => {
    if (!confirm(`Delete "${document.filename}"? This cannot be undone.`)) return
    try {
      await documentService.remove(document.id)
      onDelete(document.id)
      toast({ title: 'Document deleted' })
    } catch {
      toast({ title: 'Delete failed', variant: 'destructive' })
    }
  }

  const colorClass = typeColors[document.file_type] || typeColors.txt

  return (
    <Card className="hover:shadow-md transition-shadow relative">
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${colorClass}`}>
            <FileText size={20} />
          </div>
          <div className="flex-1 min-w-0">
            {isRenaming ? (
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onBlur={handleRename}
                onKeyDown={(e) => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') setIsRenaming(false) }}
                className="w-full text-sm font-medium border-b border-indigo-400 outline-none bg-transparent"
              />
            ) : (
              <p className="text-sm font-medium text-gray-900 truncate" title={document.filename}>
                {document.filename}
              </p>
            )}
            <p className="text-xs text-gray-400 uppercase font-medium mt-0.5">{document.file_type}</p>
          </div>
          {/* Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 rounded hover:bg-gray-100 text-gray-400"
            >
              <MoreVertical size={16} />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-7 z-10 bg-white border border-gray-200 rounded-lg shadow-lg py-1 w-36">
                <button onClick={() => { navigate(`/documents/${document.id}`); setShowMenu(false) }} className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
                  <Eye size={14} /> View Details
                </button>
                <button onClick={() => { navigate(`/chat?doc=${document.id}`); setShowMenu(false) }} className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
                  <MessageSquare size={14} /> Ask AI
                </button>
                <button onClick={() => { setIsRenaming(true); setShowMenu(false) }} className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
                  <Pencil size={14} /> Rename
                </button>
                <button onClick={() => { handleDelete(); setShowMenu(false) }} className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-red-600 hover:bg-red-50">
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Status */}
        <div className="mb-3">
          <ProcessingStatus
            documentId={document.id}
            initialStatus={document.status}
          />
        </div>

        {document.status === 'FAILED' && (
          <button
            type="button"
            onClick={() => onRetry(document.id)}
            className="mb-3 text-xs font-semibold text-indigo-600 hover:underline"
          >
            Retry processing
          </button>
        )}

        {/* Meta */}
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>{document.page_count ? `${document.page_count} pages` : formatFileSize(document.file_size)}</span>
          <span>{formatRelativeTime(document.created_at)}</span>
        </div>
      </CardContent>
    </Card>
  )
}
