export interface Source {
  document_id: string
  document_name: string
  page_number: number
  line_start?: number
  line_end?: number
  section: string | null
  text: string
  score?: number
}

export interface Message {
  id: string
  conversation_id?: string
  role: 'user' | 'assistant' | 'system'
  content: string
  sources: Source[] | null
  created_at: string
}

export interface Conversation {
  id: string
  title: string
  created_at: string
  updated_at: string
}

export interface ChatRequest {
  question: string
  document_ids: string[]
  conversation_id?: string
}

export interface ChatResponse {
  answer: string
  sources: Source[]
  conversation_id: string
  message_id: string
}
