import api from './api'
import type { Source } from '@/types/chat'

export const searchService = {
  async search(query: string, documentIds?: string[]): Promise<Source[]> {
    const response = await api.post<{ results: Source[] }>('/search', {
      query,
      document_ids: documentIds && documentIds.length > 0 ? documentIds : undefined,
    })
    return response.data.results
  },
}