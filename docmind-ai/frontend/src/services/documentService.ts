import api from './api'
import type { Document, DocumentListResponse } from '@/types/document'

export const documentService = {
  async upload(
    file: File,
    onProgress?: (percent: number) => void
  ): Promise<Document> {
    const formData = new FormData()
    formData.append('file', file)
    const response = await api.post<Document>('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (e.total && onProgress) {
          onProgress(Math.round((e.loaded * 100) / e.total))
        }
      },
    })
    return response.data
  },

  async list(page = 1, pageSize = 20): Promise<DocumentListResponse> {
    const response = await api.get<DocumentListResponse>('/documents', {
      params: { page, page_size: pageSize },
    })
    return response.data
  },

  async get(id: string): Promise<Document> {
    const response = await api.get<Document>(`/documents/${id}`)
    return response.data
  },

  async getFile(id: string): Promise<Blob> {
    const response = await api.get<Blob>(`/documents/${id}/file`, { responseType: 'blob' })
    return response.data
  },

  async getStatus(id: string): Promise<{ id: string; status: string; page_count: number | null; error_msg: string | null }> {
    const response = await api.get(`/documents/${id}/status`)
    return response.data
  },

  async reprocess(id: string): Promise<void> {
    await api.post(`/documents/${id}/process`)
  },

  async rename(id: string, filename: string): Promise<Document> {
    const response = await api.patch<Document>(`/documents/${id}`, { filename })
    return response.data
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/documents/${id}`)
  },

  async getStats(): Promise<{ document_count: number; total_pages: number; question_count: number }> {
    const response = await api.get('/documents/stats')
    return response.data
  },

  async getSummary(id: string): Promise<{ summary: string; detailed_summary: string; key_topics: string[] }> {
    const response = await api.post(`/documents/${id}/summary`)
    return response.data
  },

  async getResearch(id: string): Promise<{ fields: Record<string, { value: string; found: boolean }>; document_id: string }> {
    const response = await api.post(`/documents/${id}/research`)
    return response.data
  },

  async getStudyMaterial(id: string): Promise<{
    notes: string
    mcqs: Array<{ question: string; options: string[]; answer: string; explanation: string }>
    short_questions: Array<{ question: string; answer: string }>
    long_questions: Array<{ question: string; answer: string }>
    flashcards: Array<{ front: string; back: string }>
  }> {
    const response = await api.post(`/documents/${id}/study`)
    return response.data
  },
}
