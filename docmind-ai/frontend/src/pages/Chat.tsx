import { FormEvent, KeyboardEvent, useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import ReactMarkdown from 'react-markdown'
import { FileText, Loader2, MessageSquare, Send, Sparkles } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { documentService } from '@/services/documentService'
import { chatService } from '@/services/chatService'
import type { Document } from '@/types/document'
import type { Conversation, Message, Source } from '@/types/chat'

const NOT_FOUND = "I couldn't find sufficient information about this in the uploaded documents."

export default function Chat() {
  const [searchParams] = useSearchParams()
  const [documents, setDocuments] = useState<Document[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [question, setQuestion] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState('')
  const [conversationId, setConversationId] = useState<string>()

  const readyDocuments = useMemo(
    () => documents.filter((document) => document.status === 'READY'),
    [documents]
  )

  useEffect(() => {
    const loadDocuments = async () => {
      try {
        const [response, conversationResponse] = await Promise.all([
          documentService.list(),
          chatService.listConversations(),
        ])
        const ready = response.items.filter((document) => document.status === 'READY')
        setDocuments(response.items)
        setConversations(conversationResponse.items)
        const requestedDocument = searchParams.get('doc')
        setSelectedIds(
          requestedDocument && ready.some((document) => document.id === requestedDocument)
            ? [requestedDocument]
            : ready.slice(0, 1).map((document) => document.id)
        )
      } catch {
        setError('Unable to load your documents. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }
    void loadDocuments()
  }, [searchParams])

  useEffect(() => {
    const requestedConversation = searchParams.get('conversation')
    if (!requestedConversation) return
    const loadConversation = async () => {
      try {
        const conversation = await chatService.getConversation(requestedConversation)
        setConversationId(conversation.id)
        setMessages(conversation.messages)
      } catch {
        setError('Unable to load that conversation.')
      }
    }
    void loadConversation()
  }, [searchParams])

  const toggleDocument = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((selectedId) => selectedId !== id) : [...current, id]
    )
  }

  const startConversation = async () => {
    try {
      const conversation = await chatService.createConversation()
      setConversations((current) => [conversation, ...current])
      setConversationId(conversation.id)
      setMessages([])
    } catch {
      setError('Unable to start a new conversation.')
    }
  }

  const openConversation = async (id: string) => {
    try {
      const conversation = await chatService.getConversation(id)
      setConversationId(conversation.id)
      setMessages(conversation.messages)
    } catch {
      setError('Unable to load that conversation.')
    }
  }

  const removeConversation = async (id: string) => {
    if (!window.confirm('Delete this conversation?')) return
    try {
      await chatService.deleteConversation(id)
      setConversations((current) => current.filter((conversation) => conversation.id !== id))
      if (conversationId === id) {
        setConversationId(undefined)
        setMessages([])
      }
    } catch {
      setError('Unable to delete that conversation.')
    }
  }

  const sendMessage = async () => {
    const trimmedQuestion = question.trim()
    if (!trimmedQuestion || selectedIds.length === 0 || isSending) return

    const optimisticMessage: Message = {
      id: `local-${Date.now()}`,
      role: 'user',
      content: trimmedQuestion,
      sources: null,
      created_at: new Date().toISOString(),
    }
    setMessages((current) => [...current, optimisticMessage])
    setQuestion('')
    setError('')
    setIsSending(true)

    try {
      const response = await chatService.send({
        question: trimmedQuestion,
        document_ids: selectedIds,
        conversation_id: conversationId,
      })
      setConversationId(response.conversation_id)
      setMessages((current) => [
        ...current,
        {
          id: response.message_id,
          role: 'assistant',
          content: response.answer,
          sources: response.sources,
          created_at: new Date().toISOString(),
        },
      ])
    } catch (caught) {
      const detail = axios.isAxiosError(caught) ? caught.response?.data?.detail : undefined
      setError(detail || 'Unable to answer that question right now. Please try again.')
    } finally {
      setIsSending(false)
    }
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    void sendMessage()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void sendMessage()
    }
  }

  return (
    <div className="flex h-full min-h-[calc(100vh-2rem)] flex-col lg:flex-row">
      <aside className="w-full shrink-0 border-b border-gray-200 bg-white p-5 lg:w-72 lg:border-b-0 lg:border-r">
        <div className="mb-6 flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-indigo-600" />
          <h1 className="font-semibold text-gray-900">AI Chat</h1>
        </div>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Documents</p>
          <span className="text-xs text-gray-400">{selectedIds.length} selected</span>
        </div>
        <div className="space-y-2">
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-gray-400"><Loader2 className="h-4 w-4 animate-spin" /> Loading documents...</div>
          ) : readyDocuments.length === 0 ? (
            <p className="text-sm leading-6 text-gray-500">Upload and process a document before starting a chat.</p>
          ) : readyDocuments.map((document) => (
            <label key={document.id} className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 p-3 hover:bg-gray-50">
              <input
                type="checkbox"
                checked={selectedIds.includes(document.id)}
                onChange={() => toggleDocument(document.id)}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <FileText className="h-4 w-4 shrink-0 text-indigo-500" />
              <span className="truncate text-sm text-gray-700" title={document.filename}>{document.filename}</span>
            </label>
          ))}
        </div>
        <Link to="/documents" className="mt-5 inline-block text-sm font-medium text-indigo-600 hover:underline">Manage documents</Link>
        <div className="mt-8 border-t border-gray-100 pt-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">History</p>
            <button onClick={() => void startConversation()} className="text-xs font-semibold text-indigo-600 hover:underline">New</button>
          </div>
          <div className="chat-history-scroll max-h-64 space-y-1 overflow-y-auto pr-1">
            {conversations.map((conversation) => (
              <div key={conversation.id} className={`group flex items-center gap-2 rounded-lg px-2 py-2 ${conversation.id === conversationId ? 'bg-indigo-50' : 'hover:bg-gray-50'}`}>
                <button onClick={() => void openConversation(conversation.id)} className="flex min-w-0 flex-1 items-center gap-2 text-left text-xs text-gray-700">
                  <MessageSquare className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                  <span className="truncate">{conversation.title}</span>
                </button>
                <button onClick={() => void removeConversation(conversation.id)} aria-label={`Delete ${conversation.title}`} className="hidden text-xs text-gray-400 hover:text-red-500 group-hover:block">×</button>
              </div>
            ))}
            {conversations.length === 0 && <p className="text-xs text-gray-400">No conversations yet.</p>}
          </div>
        </div>
      </aside>

      <section className="flex min-h-0 flex-1 flex-col bg-gray-50">
        <div className="border-b border-gray-200 bg-white px-5 py-4 lg:px-8">
          <p className="text-sm text-gray-500">Ask questions grounded in your selected documents.</p>
        </div>
        <div className="flex-1 space-y-5 overflow-y-auto p-5 lg:p-8">
          {messages.length === 0 ? (
            <div className="mx-auto flex max-w-lg flex-col items-center justify-center py-20 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50"><Sparkles className="h-7 w-7 text-indigo-600" /></div>
              <h2 className="text-lg font-semibold text-gray-900">Ask about your documents</h2>
              <p className="mt-2 text-sm leading-6 text-gray-500">Select one or more ready documents, then ask a question. Answers include the retrieved source pages.</p>
            </div>
          ) : messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          {isSending && <div className="flex items-center gap-2 text-sm text-gray-500"><Loader2 className="h-4 w-4 animate-spin text-indigo-600" /> DocMind AI is thinking...</div>}
        </div>
        <div className="border-t border-gray-200 bg-white p-5 lg:px-8">
          {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
          {selectedIds.length === 0 && <p className="mb-3 text-sm text-amber-700">Select at least one ready document to ask a question.</p>}
          <form onSubmit={handleSubmit} className="flex items-end gap-3">
            <textarea
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isSending || selectedIds.length === 0}
              placeholder="Ask a question about your documents..."
              rows={2}
              className="min-h-12 flex-1 resize-none rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-gray-50"
            />
            <Button type="submit" disabled={isSending || !question.trim() || selectedIds.length === 0} size="icon" aria-label="Send question"><Send className="h-4 w-4" /></Button>
          </form>
        </div>
      </section>
    </div>
  )
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-3xl ${isUser ? 'items-end' : 'items-start'}`}>
        <Card className={`px-4 py-3 ${isUser ? 'rounded-br-sm bg-indigo-600 text-white' : 'rounded-bl-sm bg-white'}`}>
          {isUser ? <p className="whitespace-pre-wrap text-sm leading-6">{message.content}</p> : <div className="prose prose-sm max-w-none text-gray-800"><ReactMarkdown>{message.content}</ReactMarkdown></div>}
        </Card>
        {!isUser && message.content !== NOT_FOUND && message.sources && message.sources.length > 0 && (
          <div className="mt-3 space-y-2">
            {message.sources.map((source, index) => <SourceCard key={`${source.document_id}-${source.page_number}-${index}`} source={source} />)}
          </div>
        )}
      </div>
    </div>
  )
}

function SourceCard({ source }: { source: Source }) {
  return (
    <Card className="border-l-4 border-l-indigo-500 bg-gray-50 px-4 py-3">
      <div className="flex items-start gap-3">
        <FileText className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-gray-900">{source.document_name}</p>
          <p className="mt-1 text-xs text-gray-500">Page {source.page_number} · Lines {source.line_start ?? 1}-{source.line_end ?? source.line_start ?? 1}{source.section ? ` · ${source.section}` : ''}</p>
          <Link className="mt-2 inline-block text-xs font-semibold text-indigo-600 hover:underline" to={`/documents/${source.document_id}/view?page=${source.page_number}`}>View source</Link>
        </div>
      </div>
    </Card>
  )
}