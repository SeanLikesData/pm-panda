import { Request, Response } from "express";
import { ChatRepository, CreateChatMessageData } from "../repositories/ChatRepository.js";

export class ChatController {
  private chatRepository: ChatRepository;

  constructor() {
    this.chatRepository = new ChatRepository();
  }

  /**
   * Get chat messages for a project
   * GET /api/projects/:projectId/chat/messages
   */
  getMessages = async (req: Request, res: Response): Promise<void> => {
    try {
      const projectId = parseInt(req.params.projectId);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : undefined;

      if (isNaN(projectId)) {
        res.status(400).json({ error: "Invalid project ID" });
        return;
      }

      const messages = await this.chatRepository.getByProjectId(projectId, limit, offset);
      
      // Parse metadata JSON strings back to objects
      const parsedMessages = messages.map(message => ({
        ...message,
        metadata: message.metadata ? JSON.parse(message.metadata) : null
      }));

      res.json({
        messages: parsedMessages,
        total: await this.chatRepository.getCountByProjectId(projectId)
      });
    } catch (error) {
      console.error("Error getting chat messages:", error);
      res.status(500).json({ error: "Failed to get chat messages" });
    }
  };

  /**
   * Create a new chat message
   * POST /api/projects/:projectId/chat/messages
   */
  createMessage = async (req: Request, res: Response): Promise<void> => {
    try {
      const projectId = parseInt(req.params.projectId);
      const { role, content, message_type, metadata } = req.body;

      if (isNaN(projectId)) {
        res.status(400).json({ error: "Invalid project ID" });
        return;
      }

      if (!role || !content) {
        res.status(400).json({ error: "Role and content are required" });
        return;
      }

      if (!["user", "assistant"].includes(role)) {
        res.status(400).json({ error: "Role must be 'user' or 'assistant'" });
        return;
      }

      const messageData: CreateChatMessageData = {
        project_id: projectId,
        role,
        content,
        message_type,
        metadata
      };

      const message = await this.chatRepository.create(messageData);
      
      // Parse metadata JSON string back to object
      const parsedMessage = {
        ...message,
        metadata: message.metadata ? JSON.parse(message.metadata) : null
      };

      res.status(201).json(parsedMessage);
    } catch (error) {
      console.error("Error creating chat message:", error);
      res.status(500).json({ error: "Failed to create chat message" });
    }
  };

  /**
   * Get recent chat messages for a project
   * GET /api/projects/:projectId/chat/messages/recent
   */
  getRecentMessages = async (req: Request, res: Response): Promise<void> => {
    try {
      const projectId = parseInt(req.params.projectId);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

      if (isNaN(projectId)) {
        res.status(400).json({ error: "Invalid project ID" });
        return;
      }

      const messages = await this.chatRepository.getRecentByProjectId(projectId, limit);
      
      // Parse metadata JSON strings back to objects and reverse to get chronological order
      const parsedMessages = messages.reverse().map(message => ({
        ...message,
        metadata: message.metadata ? JSON.parse(message.metadata) : null
      }));

      res.json({
        messages: parsedMessages,
        total: await this.chatRepository.getCountByProjectId(projectId)
      });
    } catch (error) {
      console.error("Error getting recent chat messages:", error);
      res.status(500).json({ error: "Failed to get recent chat messages" });
    }
  };

  /**
   * Clear all chat messages for a project
   * DELETE /api/projects/:projectId/chat/messages
   */
  clearMessages = async (req: Request, res: Response): Promise<void> => {
    try {
      const projectId = parseInt(req.params.projectId);

      if (isNaN(projectId)) {
        res.status(400).json({ error: "Invalid project ID" });
        return;
      }

      const deletedCount = await this.chatRepository.deleteByProjectId(projectId);

      res.json({ 
        message: "Chat messages cleared successfully",
        deletedCount 
      });
    } catch (error) {
      console.error("Error clearing chat messages:", error);
      res.status(500).json({ error: "Failed to clear chat messages" });
    }
  };

  /**
   * Delete a specific chat message
   * DELETE /api/projects/:projectId/chat/messages/:messageId
   */
  deleteMessage = async (req: Request, res: Response): Promise<void> => {
    try {
      const projectId = parseInt(req.params.projectId);
      const messageId = parseInt(req.params.messageId);

      if (isNaN(projectId) || isNaN(messageId)) {
        res.status(400).json({ error: "Invalid project ID or message ID" });
        return;
      }

      // Verify the message belongs to the project
      const message = await this.chatRepository.getById(messageId);
      if (!message) {
        res.status(404).json({ error: "Message not found" });
        return;
      }

      if (message.project_id !== projectId) {
        res.status(403).json({ error: "Message does not belong to this project" });
        return;
      }

      const deleted = await this.chatRepository.deleteById(messageId);
      
      if (deleted) {
        res.json({ message: "Message deleted successfully" });
      } else {
        res.status(404).json({ error: "Message not found" });
      }
    } catch (error) {
      console.error("Error deleting chat message:", error);
      res.status(500).json({ error: "Failed to delete chat message" });
    }
  };

  /**
   * Get chat message count for a project
   * GET /api/projects/:projectId/chat/count
   */
  getMessageCount = async (req: Request, res: Response): Promise<void> => {
    try {
      const projectId = parseInt(req.params.projectId);

      if (isNaN(projectId)) {
        res.status(400).json({ error: "Invalid project ID" });
        return;
      }

      const count = await this.chatRepository.getCountByProjectId(projectId);

      res.json({ count });
    } catch (error) {
      console.error("Error getting chat message count:", error);
      res.status(500).json({ error: "Failed to get chat message count" });
    }
  };
}
