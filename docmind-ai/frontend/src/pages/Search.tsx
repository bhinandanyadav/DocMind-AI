import { FormEvent, useEffect, useRef, useState } from 'react'
import { FileText, Loader2, Search as SearchIcon, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { documentService } from '@/services/documentService'
import { searchService } from '@/services/searchService'
import type { Document } from '@/types/document'
import type { Source } from '@/types/chat'

/** Extract a 2-3 line snippet (≈ 300 chars) centred on the first keyword match */
function extractSnippet(text: string, query: string): { snippet: string; matchStart: number; matchEnd: number } {
  const terms = query
    .split(/\s+/)
    .filter((t) => t.length > 2)
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const pattern = terms.length ? new RegExp(terms.join('|'), 'i') : null
  const match = pattern ? pattern.exec(text) : null

  const SNIPPET_CHARS = 320
  const HALF = SNIPPET_CHARS / 2

  if (!match) {
    const snippet = text.slice(0, SNIPPET_CHARS)
    return { snippet: text.length > SNIPPET_CHARS ? snippet + '…' : snippet, matchStart: -1, matchEnd: -1 }
  }

  const center = match.index + match[0].length / 2
  const start = Math.max(0, Math.floor(center - HALF))
  const end = Math.min(text.length, Math.floor(center + HALF))
  const prefix = start > 0 ? '…' : ''
  const suffix = end < text.length ? '…' : ''
  const snippet = prefix + text.slice(start, end) + suffix
  // Adjust match indices relative to snippet
  return {
    snippet,
    matchStart: match.index - start + prefix.length,
    matchEnd: match.index + match[0].length - start + prefix.length,
  }
}

/** Render snippet with query keywords highlighted in amber */
function HighlightedSnippet({ text, query }: { text: string; query: string }) {
  const terms = query
    .split(/\s+/)
    .filter((t) => t.length > 2)
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  if (!terms.length) return <span>{text}</span>
  const pattern = new RegExp(`(${terms.join('|')})`, 'gi')
  const parts = text.split(pattern)
  return (
    <>
      {parts.map((part, i) =>
        new RegExp(`^${terms.join('|')}$`, 'i').test(part) ? (
          <mark key={i} className="rounded bg-amber-100 px-0.5 font-semibold text-amber-800">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  )
}

export default function Search() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [selectedDocument, setSelectedDocument] = useState('')
  const [query, setQuery] = useState('')
  const [submittedQuery, setSubmittedQuery] = useState('')
  const [results, setResults] = useState<Source[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    documentService
      .list()
      .then((response) => setDocuments(response.items.filter((d) => d.status === 'READY')))
      .catch(() => setError('Unable to load your documents.'))
  }, [])

  const handleSearch = async (event: FormEvent) => {
    event.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) return
    setIsLoading(true)
    setError('')
    setSubmittedQuery(trimmed)
    try {
      setResults(
        await searchService.search(trimmed, selectedDocument ? [selectedDocument] : undefined)
      )
    } catch {
      setError('Search is temporarily unavailable. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const clearSearch = () => {
    setQuery('')
    setResults([])
    setSubmittedQuery('')
    inputRef.current?.focus()
  }

  return (
    <div className="mx-auto max-w-5xl p-5 lg:p-8">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">Semantic search</p>
        <h1 className="mt-2 text-3xl font-bold text-gray-900">Find meaning across your documents</h1>
        <p className="mt-2 max-w-2xl text-gray-500">
          Search by concept, not just exact keywords. Matching words are highlighted and you'll see a focused 2-3 line
          snippet around each match.
        </p>
      </div>

      <form
        onSubmit={handleSearch}
        className="grid min-w-0 grid-cols-1 gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:grid-cols-[minmax(0,1fr)_14rem_auto] sm:items-center"
      >
        <div className="relative min-w-0">
          <SearchIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask a question or enter a concept…"
            className="h-11 w-full rounded-lg border border-gray-200 pl-10 pr-10 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
          {query && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              aria-label="Clear search"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        <select
          value={selectedDocument}
          onChange={(e) => setSelectedDocument(e.target.value)}
          className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-600 outline-none focus:border-indigo-500"
        >
          <option value="">All ready documents</option>
          {documents.map((d) => (
            <option key={d.id} value={d.id}>
              {d.filename}
            </option>
          ))}
        </select>
        <Button type="submit" disabled={isLoading || !query.trim()}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <SearchIcon className="h-4 w-4" />} Search
        </Button>
      </form>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {isLoading && (
        <div className="mt-10 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
        </div>
      )}

      {!isLoading && submittedQuery && results.length === 0 && !error && (
        <div className="py-20 text-center text-sm text-gray-500">No matching content found for "{submittedQuery}".</div>
      )}

      {!isLoading && results.length > 0 && (
        <div className="mt-4 mb-2 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            <span className="font-semibold text-gray-800">{results.length}</span> result{results.length !== 1 ? 's' : ''}{' '}
            for "<span className="font-semibold text-indigo-700">{submittedQuery}</span>"
          </p>
        </div>
      )}

      <div className="mt-3 space-y-3">
        {results.map((result, idx) => {
          const { snippet } = extractSnippet(result.text, submittedQuery)
          const scorePercent = Math.round((result.score ?? 0) * 100)
          return (
            <Card
              key={`${result.document_id}-${result.page_number}-${idx}`}
              className="border-l-4 border-l-indigo-500 p-5 transition-shadow hover:shadow-md"
            >
              <div className="flex items-start gap-3">
                <FileText className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-gray-900">{result.document_name}</p>
                    <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                      Page {result.page_number}
                    </span>
                    {result.section && <span className="text-xs text-gray-500">{result.section}</span>}
                    <span
                      className={`ml-auto rounded-full px-2 py-0.5 text-xs font-semibold ${
                        scorePercent >= 70
                          ? 'bg-emerald-50 text-emerald-700'
                          : scorePercent >= 40
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {scorePercent}% match
                    </span>
                  </div>
                  {/* 2-3 line snippet with keyword highlighting */}
                  <p className="mt-2 text-sm leading-6 text-gray-600">
                    <HighlightedSnippet text={snippet} query={submittedQuery} />
                  </p>
                  <Link
                    to={`/documents/${result.document_id}/view?page=${result.page_number}`}
                    className="mt-3 inline-block text-xs font-semibold text-indigo-600 hover:underline"
                  >
                    Open in viewer →
                  </Link>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}