import './config/env.js';
import express from 'express';
import cors from 'cors';
import { validateAiServiceRuntimeEnv } from './config/env.js';
import { healthRouter } from './routes/health.route.js';
import { chatRouter } from './routes/chat.route.js';

const { port: PORT, host: HOST, publicBaseUrl: PUBLIC_BASE_URL } = validateAiServiceRuntimeEnv(process.env);
const app = express();

app.use(cors());
app.use(express.json({ limit: '5mb' }));

// Mount routes
app.use(healthRouter);
app.use(chatRouter);

// Global Error Handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[AI-SERVICE ERROR]:', err);
  res.status(err.status || 500).json({
    success: false,
    code: err.code || 'AI_SERVICE_INTERNAL_ERROR',
    message: err.message || 'Lỗi xử lý nội bộ tại AI Service',
  });
});

const server = app.listen(PORT, HOST, () => {
  console.log(`✨ [AI-SERVICE] TypeScript Shopping Agent running on ${PUBLIC_BASE_URL}`);
  console.log(`✨ [AI-SERVICE] Concept: Spring AI Chapter 7 architecture (Node.js/TypeScript)`);
});

// Graceful termination
const shutdown = () => {
  console.log('🛑 [AI-SERVICE] Shutting down gracefully...');
  server.close(() => {
    console.log('✅ [AI-SERVICE] Server closed.');
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
