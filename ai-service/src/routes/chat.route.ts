import '../config/env.js';
import express, { Request, Response, NextFunction } from 'express';
import { verifyIncomingNodeSignature } from '../security/HmacAuth.js';
import { ChatClient } from '../client/ChatClient.js';
import { ShoppingMemoryAdvisor } from '../memory/ShoppingMemoryAdvisor.js';
import { InMemoryChatMemory } from '../memory/ChatMemory.js';
import { QuestionAnswerAdvisor } from '../rag/QuestionAnswerAdvisor.js';
import { NodeVectorStore } from '../vector/VectorStore.js';
import { ToolRegistry } from '../tools/ToolRegistry.js';
import { ShoppingTools } from '../tools/ShoppingTools.js';
import { NodeBackendClient } from '../tools/NodeBackendClient.js';

export const chatRouter = express.Router();

// Initialize Spring AI architectural singletons
const memory = new InMemoryChatMemory();
const memoryAdvisor = new ShoppingMemoryAdvisor(memory);
const vectorStore = new NodeVectorStore();
const ragAdvisor = new QuestionAnswerAdvisor(vectorStore);
const backendClient = new NodeBackendClient();
const shoppingTools = new ShoppingTools(backendClient);
const toolRegistry = new ToolRegistry(shoppingTools);

const chatClient = ChatClient.builder()
  .defaultMemoryAdvisor(memoryAdvisor)
  .defaultRagAdvisor(ragAdvisor)
  .defaultToolRegistry(toolRegistry)
  .build();

/**
 * Internal HMAC-protected Chat Endpoint called by Node.js Backend
 */
chatRouter.post(
  '/internal/v1/chat',
  verifyIncomingNodeSignature,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const payload = req.body || {};
      const authContext = (req as any).authContext || { userId: null, role: 'guest' };

      const conversationId = String(payload.conversationId || authContext.userId || 'session_default');

      const response = await chatClient
        .prompt()
        .user(String(payload.content || ''))
        .conversation(conversationId)
        .auth(authContext)
        .confirmation(payload.confirmAction, payload.cancelAction)
        .call();

      const result = await response.chatResponse();
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * Public/Dev Chat Endpoint
 */
chatRouter.post(
  '/api/v1/chat',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const payload = req.body || {};
      const authContext = {
        userId: req.get('X-AI-End-User-Id') || null,
        role: req.get('X-AI-End-User-Role') || 'guest',
      };

      const conversationId = String(payload.conversationId || authContext.userId || 'dev_session');

      const response = await chatClient
        .prompt()
        .user(String(payload.content || ''))
        .conversation(conversationId)
        .auth(authContext)
        .confirmation(payload.confirmAction, payload.cancelAction)
        .call();

      const result = await response.chatResponse();
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
);
