export type DocumentStatus = 'UPLOADED' | 'PROCESSING' | 'READY' | 'FAILED'
export type DocumentType = 'pdf' | 'docx' | 'txt'

export interface Document {
  id: string
  filename: string
  file_type: DocumentType
  file_size: number
  page_count: number | null
  status: DocumentStatus
  summary: string | null
  created_at: string
  updated_at: string
}

export interface DocumentListResponse {
  items: Document[]
  total: number
  page: number
  page_size: number
}
