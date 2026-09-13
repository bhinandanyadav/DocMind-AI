import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FlaskConical, FileText, ArrowRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { documentService } from '@/services/documentService'
import { toast } from '@/hooks/useToast'
import type { Document } from '@/types/document'

export default function Research() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    documentService
      .list()
      .then((data) => setDocuments(data.items.filter((d) => d.status === 'READY')))
      .catch(() => toast({ title: 'Failed to load documents', variant: 'destructive' }))
      .finally(() => setIsLoading(false))
  }, [])

  return (
    <div className="mx-auto max-w-4xl p-5 lg:p-8">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600 mb-2">Research Mode</p>
        <h1 className="text-3xl font-bold text-gray-900">Research Analysis</h1>
        <p className="mt-2 text-gray-500">Select a document to extract structured research metadata (problem, methodology, results, etc.)</p>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-xl bg-gray-100 shimmer" />
          ))}
        </div>
      )}

      {!isLoading && documents.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4">
            <FlaskConical className="w-8 h-8 text-indigo-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">No documents ready</h2>
          <p className="text-gray-500 text-sm max-w-md mb-4">Upload and process a document first, then come back to extract its research structure.</p>
          <Link to="/documents" className="text-sm font-medium text-indigo-600 hover:underline">Go to Documents</Link>
        </div>
      )}

      {!isLoading && documents.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {documents.map((doc) => (
            <Link key={doc.id} to={`/documents/${doc.id}/research`}>
              <Card className="hover:border-indigo-200 hover:shadow-sm transition-all cursor-pointer group">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="w-11 h-11 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-indigo-100 transition-colors">
                    <FileText className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 truncate">{doc.filename}</p>
                    <p className="text-sm text-gray-500">{doc.page_count ?? '—'} pages</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-500 transition-colors shrink-0" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
