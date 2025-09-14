import { Router } from "express";
import { ChatController } from "../controllers/ChatController.js";

const router = Router({ mergeParams: true }); // mergeParams to access :projectId from parent route
const chatController = new ChatController();

// GET /api/projects/:projectId/chat/messages - Get all chat messages for a project
router.get("/messages", chatController.getMessages);

// POST /api/projects/:projectId/chat/messages - Create a new chat message
router.post("/messages", chatController.createMessage);

// GET /api/projects/:projectId/chat/messages/recent - Get recent chat messages
router.get("/messages/recent", chatController.getRecentMessages);

// DELETE /api/projects/:projectId/chat/messages - Clear all chat messages for a project
router.delete("/messages", chatController.clearMessages);

// DELETE /api/projects/:projectId/chat/messages/:messageId - Delete a specific message
router.delete("/messages/:messageId", chatController.deleteMessage);

// GET /api/projects/:projectId/chat/count - Get chat message count
router.get("/count", chatController.getMessageCount);

export default router;
