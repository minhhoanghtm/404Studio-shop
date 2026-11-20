import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { healthRouter } from './routes/health.route.js';
import { chatRouter } from './routes/chat.route.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env hierarchy: root .env, backend .env, local .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../backend/.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

const app = express();
const PORT = Number(process.env.AI_SERVICE_PORT || 8081);

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

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✨ [AI-SERVICE] TypeScript Shopping Agent running on http://0.0.0.0:${PORT}`);
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
