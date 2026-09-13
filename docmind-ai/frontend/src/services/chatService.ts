import api from './api'
import type { ChatRequest, ChatResponse, Conversation, Message } from '@/types/chat'

export const chatService = {
  async send(request: ChatRequest): Promise<ChatResponse> {
    const response = await api.post<ChatResponse>('/chat', request)
    return response.data
  },

  async listConversations(): Promise<{ items: Conversation[]; total: number }> {
    const response = await api.get<{ items: Conversation[]; total: number }>('/conversations')
    return response.data
  },

  async createConversation(): Promise<Conversation> {
    const response = await api.post<Conversation>('/conversations')
    return response.data
  },

  async getConversation(id: string): Promise<Conversation & { messages: Message[] }> {
    const response = await api.get<Conversation & { messages: Message[] }>(`/conversations/${id}`)
    return response.data
  },

  async renameConversation(id: string, title: string): Promise<Conversation> {
    const response = await api.patch<Conversation>(`/conversations/${id}`, { title })
    return response.data
  },

  async deleteConversation(id: string): Promise<void> {
    await api.delete(`/conversations/${id}`)
  },
}