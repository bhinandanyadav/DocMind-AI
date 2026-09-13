import { useEffect, useState } from 'react'
import { AlertCircle, ArrowRight, Check, FileDiff, Loader2, Minus, Plus, RefreshCw } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { documentService } from '@/services/documentService'
import { compareService, type ComparisonItem, type ComparisonResult } from '@/services/compareService'
import type { Document } from '@/types/document'

export default function Compare() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [documentA, setDocumentA] = useState('')
  const [documentB, setDocumentB] = useState('')
  const [question, setQuestion] = useState('')
  const [result, setResult] = useState<ComparisonResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isComparing, setIsComparing] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    documentService.list()
      .then((response) => setDocuments(response.items.filter((document) => document.status === 'READY')))
      .catch(() => setError('Unable to load your ready documents.'))
      .finally(() => setIsLoading(false))
  }, [])

  const compare = async () => {
    if (!documentA || !documentB || documentA === documentB) return
    setIsComparing(true)
    setError('')
    try {
      setResult(await compareService.compare(documentA, documentB, question))
    } catch (requestError: unknown) {
      const detail = (requestError as { response?: { data?: { detail?: string } } }).response?.data?.detail
      setError(detail || 'Unable to compare these documents.')
    } finally {
      setIsComparing(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl p-5 lg:p-8">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">Document comparison</p>
          <h1 className="mt-2 text-3xl font-bold text-gray-900">See what changed</h1>
          <p className="mt-2 max-w-2xl text-gray-500">Compare two processed documents and inspect additions, removals, and modified content with page references.</p>
        </div>
        <Link to="/documents" className="text-sm font-semibold text-indigo-600 hover:underline">Manage documents</Link>
      </div>

      <Card className="p-5 lg:p-6">
        <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-end">
          <DocumentSelect label="Document A" value={documentA} documents={documents} disabled={isLoading} onChange={setDocumentA} />
          <ArrowRight className="hidden h-5 w-5 text-gray-300 md:block" />
          <DocumentSelect label="Document B" value={documentB} documents={documents} disabled={isLoading} onChange={setDocumentB} />
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button onClick={() => void compare()} disabled={isComparing || !documentA || !documentB || documentA === documentB} className="gap-2">
            {isComparing ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDiff className="h-4 w-4" />}
            {isComparing ? 'Comparing...' : 'Compare documents'}
          </Button>
          {documentA && documentB && documentA === documentB && <p className="text-sm text-amber-700">Choose two different documents.</p>}
          {documents.length < 2 && !isLoading && <p className="text-sm text-gray-500">You need at least two ready documents.</p>}
        </div>
        <label className="mt-5 block">
          <span className="mb-2 block text-sm font-semibold text-gray-700">Question or topic (optional)</span>
          <input
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Compare sentences related to a question or topic..."
            className="h-11 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </label>
      </Card>

      {error && <div className="mt-5 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"><AlertCircle className="h-4 w-4 shrink-0" />{error}<button className="ml-auto" onClick={() => setError('')} aria-label="Dismiss error">×</button></div>}

      {!result && !error && <div className="flex flex-col items-center justify-center py-20 text-center"><FileDiff className="h-12 w-12 text-gray-300" /><h2 className="mt-4 font-semibold text-gray-800">Select two documents to begin</h2><p className="mt-2 max-w-md text-sm leading-6 text-gray-500">The comparison will preserve the source document and page for every detected change.</p></div>}

      {result && <section className="mt-8 space-y-5">
        <Card className="border-indigo-100 bg-indigo-50/60 p-5"><p className="text-sm font-medium text-indigo-900">Comparison summary</p><p className="mt-1 text-sm text-indigo-800">{result.summary}</p></Card>
        <div className="grid gap-5 lg:grid-cols-3">
          <ChangeSection title="Added" count={result.added.length} items={result.added} tone="green" icon={<Plus className="h-4 w-4" />} />
          <ChangeSection title="Removed" count={result.removed.length} items={result.removed} tone="red" icon={<Minus className="h-4 w-4" />} />
          <ChangeSection title="Modified" count={result.modified.length} items={result.modified} tone="amber" icon={<RefreshCw className="h-4 w-4" />} />
        </div>
      </section>}
    </div>
  )
}

function DocumentSelect({ label, value, documents, disabled, onChange }: { label: string; value: string; documents: Document[]; disabled: boolean; onChange: (value: string) => void }) {
  return <label className="block"><span className="mb-2 block text-sm font-semibold text-gray-700">{label}</span><select value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-gray-50"><option value="">Choose a document...</option>{documents.map((document) => <option key={document.id} value={document.id}>{document.filename}</option>)}</select></label>
}

function ChangeSection({ title, count, items, tone, icon }: { title: string; count: number; items: ComparisonItem[]; tone: 'green' | 'red' | 'amber'; icon: React.ReactNode }) {
  const colors = { green: 'border-emerald-200 text-emerald-700', red: 'border-red-200 text-red-700', amber: 'border-amber-200 text-amber-700' }
  return <div className={`rounded-xl border bg-white ${colors[tone].split(' ')[0]}`}><div className={`flex items-center justify-between border-b p-4 ${colors[tone]}`}><h2 className="flex items-center gap-2 font-semibold">{icon}{title}</h2><span className="rounded-full bg-white/80 px-2 py-0.5 text-xs font-semibold">{count}</span></div><div className="max-h-[32rem] space-y-3 overflow-y-auto p-4">{items.length === 0 ? <div className="py-8 text-center text-sm text-gray-400"><Check className="mx-auto mb-2 h-5 w-5" />No changes</div> : items.map((item, index) => <div key={`${item.document_id}-${item.page_number}-${index}`} className="rounded-lg bg-gray-50 p-3">{item.before_text ? <><p className="text-xs font-semibold uppercase text-red-600">Before</p><p className="mt-1 text-sm leading-6 text-gray-700">{item.before_text}</p><p className="mt-2 text-xs font-semibold uppercase text-emerald-600">After</p><p className="mt-1 text-sm leading-6 text-gray-700">{item.after_text}</p></> : <p className="line-clamp-5 text-sm leading-6 text-gray-700">{item.text}</p>}<div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500"><span className="font-medium">{item.document_name}</span><span>Page {item.page_number}</span>{item.section && <span>{item.section}</span>}</div><Link to={`/documents/${item.document_id}/view?page=${item.page_number}`} className="mt-2 inline-block text-xs font-semibold text-indigo-600 hover:underline">View source</Link></div>)}</div></div>
}