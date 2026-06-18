import api from './api'

export interface Friend {
  friend_id: number
  username: string
  avatar?: string
  rating: number
  solved_count: number
  bio?: string
  since: string
}

export interface FriendRequest {
  id: number
  message?: string
  created_at: string
  from_id?: number
  to_id?: number
  username: string
  avatar?: string
  rating?: number
  bio?: string
  status?: string
}

export interface Conversation {
  conversation_id: number
  type: string
  last_message?: string
  last_message_at?: string
  unread_count: number
  participants: { user_id: number; username: string; avatar?: string; rating?: number }[]
}

export interface Message {
  id: number
  sender_id: number
  content: string
  created_at: string
  username?: string
  avatar?: string
}

const friendService = {
  search: (q: string): Promise<{ users: any[] }> =>
    api.get('/friends/search', { params: { q } }).then(res => res.data.data),

  list: (): Promise<{ friends: Friend[] }> =>
    api.get('/friends').then(res => res.data.data),

  listRequests: (direction: 'incoming' | 'outgoing' = 'incoming'): Promise<{ requests: FriendRequest[] }> =>
    api.get('/friends/requests', { params: { direction } }).then(res => res.data.data),

  unread: (): Promise<{ messages: number; friendRequests: number }> =>
    api.get('/friends/unread').then(res => res.data.data),

  sendRequest: (addressee_id: number, message?: string) =>
    api.post('/friends/request', { addressee_id, message }).then(res => res.data),

  respondRequest: (id: number, action: 'accept' | 'decline') =>
    api.post(`/friends/request/${id}/respond`, { action }).then(res => res.data),

  remove: (id: number) =>
    api.delete(`/friends/${id}`).then(res => res.data),

  status: (id: number): Promise<{ status: string }> =>
    api.get(`/friends/status/${id}`).then(res => res.data.data),

  listConversations: (): Promise<{ conversations: Conversation[] }> =>
    api.get('/friends/conversations').then(res => res.data.data),

  getMessages: (conversationId: number, before?: string): Promise<{ messages: Message[] }> =>
    api.get(`/friends/conversations/${conversationId}/messages`, { params: before ? { before } : {} }).then(res => res.data.data),

  sendMessage: (data: { recipient_id?: number; conversation_id?: number; content: string }) =>
    api.post('/friends/messages', data).then(res => res.data.data),
}

export default friendService
