import { useEffect, useState } from 'react'
import { ArrowLeft, ChevronLeft, ChevronRight, FileText, Loader2 } from 'lucide-react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { documentService } from '@/services/documentService'
import type { Document } from '@/types/document'

export default function DocumentViewer() {
  const { documentId } = useParams<{ documentId: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const [document, setDocument] = useState<Document>()
  const [fileUrl, setFileUrl] = useState('')
  const [page, setPage] = useState(Math.max(1, Number(searchParams.get('page')) || 1))
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!documentId) return
    let objectUrl = ''
    const loadFile = async () => {
      try {
        const [documentResponse, file] = await Promise.all([
          documentService.get(documentId),
          documentService.getFile(documentId),
        ])
        objectUrl = URL.createObjectURL(file)
        setDocument(documentResponse)
        setFileUrl(objectUrl)
      } catch {
        setError('Unable to open this document.')
      } finally {
        setIsLoading(false)
      }
    }
    void loadFile()
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [documentId])

  const updatePage = (nextPage: number) => {
    const maximum = document?.page_count || Number.MAX_SAFE_INTEGER
    const safePage = Math.max(1, Math.min(maximum, nextPage))
    setPage(safePage)
    setSearchParams({ page: String(safePage) })
  }

  return (
    <div className="flex min-h-full flex-col bg-gray-100">
      <header className="flex flex-wrap items-center gap-4 border-b border-gray-200 bg-white px-5 py-4 lg:px-8">
        <Link to="/documents" aria-label="Back to documents"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <div className="flex min-w-0 items-center gap-3">
          <FileText className="h-5 w-5 text-indigo-600" />
          <h1 className="truncate font-semibold text-gray-900">{document?.filename || 'Document viewer'}</h1>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => updatePage(page - 1)} disabled={page <= 1} aria-label="Previous page"><ChevronLeft className="h-4 w-4" /></Button>
          <label className="flex items-center gap-2 text-sm text-gray-600">Page <input value={page} onChange={(event) => updatePage(Number(event.target.value) || 1)} type="number" min={1} max={document?.page_count || undefined} className="w-16 rounded border border-gray-200 px-2 py-1 text-center" />{document?.page_count ? ` / ${document.page_count}` : ''}</label>
          <Button variant="outline" size="icon" onClick={() => updatePage(page + 1)} disabled={Boolean(document?.page_count && page >= document.page_count)} aria-label="Next page"><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center p-4 lg:p-8">
        {isLoading && <div className="flex items-center gap-2 text-sm text-gray-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading document...</div>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {!isLoading && !error && fileUrl && document?.file_type === 'pdf' && <iframe title={document.filename} src={`${fileUrl}#page=${page}`} className="h-[calc(100vh-10rem)] w-full max-w-5xl rounded-lg border border-gray-200 bg-white shadow-sm" />}
        {!isLoading && !error && fileUrl && document?.file_type !== 'pdf' && <a href={fileUrl} download={document?.filename} className="rounded-lg bg-white px-5 py-3 text-sm font-semibold text-indigo-600 shadow-sm hover:underline">Download {document?.filename}</a>}
      </main>
    </div>
  )
}