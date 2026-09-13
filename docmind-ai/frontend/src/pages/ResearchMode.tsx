import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { FlaskConical, Loader2, ArrowLeft, BookOpen, Target, Database, BarChart3, AlertTriangle, Lightbulb, Calendar, Users, Trophy } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { documentService } from '@/services/documentService'

interface ResearchField {
  value: string
  found: boolean
}

const FIELD_META: Record<string, { label: string; icon: typeof FlaskConical; color: string; bg: string }> = {
  problem: { label: 'Problem', icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
  objective: { label: 'Objective', icon: Target, color: 'text-blue-600', bg: 'bg-blue-50' },
  methodology: { label: 'Methodology', icon: FlaskConical, color: 'text-purple-600', bg: 'bg-purple-50' },
  dataset: { label: 'Dataset', icon: Database, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  models: { label: 'Models', icon: BarChart3, color: 'text-orange-600', bg: 'bg-orange-50' },
  metrics: { label: 'Metrics', icon: BarChart3, color: 'text-cyan-600', bg: 'bg-cyan-50' },
  results: { label: 'Results', icon: Trophy, color: 'text-yellow-600', bg: 'bg-yellow-50' },
  limitations: { label: 'Limitations', icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50' },
  future_work: { label: 'Future Work', icon: Lightbulb, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  authors: { label: 'Authors', icon: Users, color: 'text-gray-600', bg: 'bg-gray-50' },
  year: { label: 'Year', icon: Calendar, color: 'text-teal-600', bg: 'bg-teal-50' },
  key_findings: { label: 'Key Findings', icon: BookOpen, color: 'text-violet-600', bg: 'bg-violet-50' },
}

export default function ResearchMode() {
  const { documentId } = useParams<{ documentId: string }>()
  const [fields, setFields] = useState<Record<string, ResearchField>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [docName, setDocName] = useState('')

  useEffect(() => {
    if (!documentId) return
    documentService.get(documentId).then((doc) => setDocName(doc.filename)).catch(() => {})
  }, [documentId])

  const extractResearch = async () => {
    if (!documentId) return
    setIsLoading(true)
    setError('')
    try {
      const result = await documentService.getResearch(documentId)
      setFields(result.fields)
    } catch {
      setError('Unable to extract research structure. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl p-5 lg:p-8">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link to={`/documents/${documentId}`} className="text-gray-400 hover:text-gray-600">
              <ArrowLeft size={18} />
            </Link>
            <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">Research Mode</p>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Research Analysis</h1>
          <p className="mt-2 text-gray-500">Extract structured metadata from {docName || 'your document'}</p>
        </div>
        <Button onClick={extractResearch} disabled={isLoading || !documentId} className="gap-2">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FlaskConical className="h-4 w-4" />}
          {isLoading ? 'Extracting...' : 'Extract Research Structure'}
        </Button>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      {!isLoading && Object.keys(fields).length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4">
            <FlaskConical className="w-8 h-8 text-indigo-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Extract Research Structure</h2>
          <p className="text-gray-500 text-sm max-w-md">
            Click the button above to analyze your document and extract the problem, methodology, results, and more.
          </p>
        </div>
      )}

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.keys(FIELD_META).map((key) => (
            <div key={key} className="h-32 rounded-xl bg-gray-100 shimmer" />
          ))}
        </div>
      )}

      {Object.keys(fields).length > 0 && !isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(fields).map(([key, field]) => {
            const meta = FIELD_META[key] || { label: key, icon: FlaskConical, color: 'text-gray-600', bg: 'bg-gray-50' }
            const Icon = meta.icon
            return (
              <Card key={key} className={!field.found ? 'opacity-60' : ''}>
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 ${meta.bg} rounded-lg flex items-center justify-center shrink-0`}>
                      <Icon className={`w-5 h-5 ${meta.color}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-gray-900 text-sm">{meta.label}</h3>
                      <p className="mt-1.5 text-sm leading-6 text-gray-600 whitespace-pre-wrap">
                        {field.value || 'Not found'}
                      </p>
                      {!field.found && (
                        <span className="mt-2 inline-block text-xs text-gray-400">Not found in document</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
