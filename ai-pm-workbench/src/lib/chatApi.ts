/**
 * API client for chat messages
 */

import { api } from './api';

export interface ChatMessage {
  id: number;
  project_id: number;
  role: "user" | "assistant";
  content: string;
  message_type?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface CreateChatMessageData {
  role: "user" | "assistant";
  content: string;
  message_type?: string;
  metadata?: Record<string, any>;
}

export interface ChatMessagesResponse {
  messages: ChatMessage[];
  total: number;
}

class ChatApi {
  /**
   * Get all chat messages for a project
   */
  async getMessages(projectId: number, limit?: number, offset?: number): Promise<ChatMessagesResponse> {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());
    
    const queryString = params.toString();
    const url = `/projects/${projectId}/chat/messages${queryString ? `?${queryString}` : ''}`;
    
    return api.get(url);
  }

  /**
   * Get recent chat messages for a project
   */
  async getRecentMessages(projectId: number, limit: number = 50): Promise<ChatMessagesResponse> {
    return api.get(`/projects/${projectId}/chat/messages/recent?limit=${limit}`);
  }

  /**
   * Create a new chat message
   */
  async createMessage(projectId: number, data: CreateChatMessageData): Promise<ChatMessage> {
    return api.post(`/projects/${projectId}/chat/messages`, data);
  }

  /**
   * Clear all chat messages for a project
   */
  async clearMessages(projectId: number): Promise<{ message: string; deletedCount: number }> {
    return api.delete(`/projects/${projectId}/chat/messages`);
  }

  /**
   * Delete a specific chat message
   */
  async deleteMessage(projectId: number, messageId: number): Promise<{ message: string }> {
    return api.delete(`/projects/${projectId}/chat/messages/${messageId}`);
  }

  /**
   * Get chat message count for a project
   */
  async getMessageCount(projectId: number): Promise<{ count: number }> {
    return api.get(`/projects/${projectId}/chat/count`);
  }

  /**
   * Save multiple messages (batch operation)
   */
  async saveMessages(projectId: number, messages: CreateChatMessageData[]): Promise<ChatMessage[]> {
    const savedMessages: ChatMessage[] = [];
    
    // Save messages sequentially to maintain order
    for (const message of messages) {
      try {
        const saved = await this.createMessage(projectId, message);
        savedMessages.push(saved);
      } catch (error) {
        console.error('Failed to save message:', error);
        // Continue with other messages even if one fails
      }
    }
    
    return savedMessages;
  }

  /**
   * Convert frontend message format to API format
   */
  convertToApiFormat(message: {
    role: "user" | "assistant";
    content: string;
    type?: string;
    metadata?: Record<string, any>;
  }): CreateChatMessageData {
    return {
      role: message.role,
      content: message.content,
      message_type: message.type || 'message',
      metadata: message.metadata
    };
  }

  /**
   * Convert API message format to frontend format
   */
  convertFromApiFormat(message: ChatMessage): {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
    type?: string;
    metadata?: Record<string, any>;
  } {
    return {
      id: message.id.toString(),
      role: message.role,
      content: message.content,
      timestamp: new Date(message.created_at),
      type: message.message_type,
      metadata: message.metadata
    };
  }
}

export const chatApi = new ChatApi();
