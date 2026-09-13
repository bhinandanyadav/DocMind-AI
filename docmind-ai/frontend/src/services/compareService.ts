import api from './api'

export interface ComparisonItem {
  text: string
  document_id: string
  document_name: string
  page_number: number
  section: string | null
  before_text?: string | null
  after_text?: string | null
}

export interface ComparisonResult {
  summary: string
  added: ComparisonItem[]
  removed: ComparisonItem[]
  modified: ComparisonItem[]
}

export const compareService = {
  async compare(documentIdA: string, documentIdB: string, question?: string): Promise<ComparisonResult> {
    const response = await api.post<ComparisonResult>('/documents/compare', {
      document_id_a: documentIdA,
      document_id_b: documentIdB,
      question: question?.trim() || undefined,
    })
    return response.data
  },
}