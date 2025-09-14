import { run, get, all } from "../config/database.js";

export interface ChatMessage {
  id: number;
  project_id: number;
  role: "user" | "assistant";
  content: string;
  message_type?: string;
  metadata?: string; // JSON string
  created_at: string;
}

export interface CreateChatMessageData {
  project_id: number;
  role: "user" | "assistant";
  content: string;
  message_type?: string;
  metadata?: Record<string, any>;
}

export class ChatRepository {
  /**
   * Get all chat messages for a project, ordered by creation time
   */
  async getByProjectId(projectId: number, limit?: number, offset?: number): Promise<ChatMessage[]> {
    let sql = `
      SELECT id, project_id, role, content, message_type, metadata, created_at
      FROM chat_messages 
      WHERE project_id = ?
      ORDER BY created_at ASC
    `;
    
    const params: any[] = [projectId];
    
    if (limit) {
      sql += ` LIMIT ?`;
      params.push(limit);
      
      if (offset) {
        sql += ` OFFSET ?`;
        params.push(offset);
      }
    }

    return all<ChatMessage>(sql, params);
  }

  /**
   * Create a new chat message
   */
  async create(data: CreateChatMessageData): Promise<ChatMessage> {
    const metadataJson = data.metadata ? JSON.stringify(data.metadata) : null;
    
    const result = await run(
      `INSERT INTO chat_messages (project_id, role, content, message_type, metadata)
       VALUES (?, ?, ?, ?, ?)`,
      [data.project_id, data.role, data.content, data.message_type || 'message', metadataJson]
    );

    const created = await get<ChatMessage>(
      `SELECT id, project_id, role, content, message_type, metadata, created_at
       FROM chat_messages WHERE id = ?`,
      [result.lastID]
    );

    if (!created) {
      throw new Error("Failed to create chat message");
    }

    return created;
  }

  /**
   * Get a specific chat message by ID
   */
  async getById(id: number): Promise<ChatMessage | undefined> {
    return get<ChatMessage>(
      `SELECT id, project_id, role, content, message_type, metadata, created_at
       FROM chat_messages WHERE id = ?`,
      [id]
    );
  }

  /**
   * Delete all chat messages for a project
   */
  async deleteByProjectId(projectId: number): Promise<number> {
    const result = await run(
      `DELETE FROM chat_messages WHERE project_id = ?`,
      [projectId]
    );
    return result.changes;
  }

  /**
   * Delete a specific chat message
   */
  async deleteById(id: number): Promise<boolean> {
    const result = await run(
      `DELETE FROM chat_messages WHERE id = ?`,
      [id]
    );
    return result.changes > 0;
  }

  /**
   * Get the count of chat messages for a project
   */
  async getCountByProjectId(projectId: number): Promise<number> {
    const result = await get<{ count: number }>(
      `SELECT COUNT(*) as count FROM chat_messages WHERE project_id = ?`,
      [projectId]
    );
    return result?.count || 0;
  }

  /**
   * Get recent chat messages for a project (last N messages)
   */
  async getRecentByProjectId(projectId: number, limit: number = 50): Promise<ChatMessage[]> {
    return all<ChatMessage>(
      `SELECT id, project_id, role, content, message_type, metadata, created_at
       FROM chat_messages 
       WHERE project_id = ?
       ORDER BY created_at DESC
       LIMIT ?`,
      [projectId, limit]
    );
  }
}
