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

const parseRequiredPort = (raw: string | undefined, label: string): number => {
  if (!raw || !String(raw).trim()) {
    throw new Error(`[AI-SERVICE] Missing required port environment variable: ${label}`);
  }
  const trimmed = String(raw).trim();
  if (!/^\d+$/.test(trimmed)) {
    throw new Error(`[AI-SERVICE] Invalid port for ${label}: "${trimmed}"`);
  }
  const port = Number(trimmed);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`[AI-SERVICE] Port out of range for ${label}: ${port}`);
  }
  return port;
};

const app = express();
const PORT = parseRequiredPort(process.env.AI_SERVICE_PORT ?? process.env.PORT, 'AI_SERVICE_PORT');
const HOST = (process.env.AI_SERVICE_HOST || '0.0.0.0').trim();
const PUBLIC_BASE_URL = `http://${HOST}:${PORT}`;

if (!process.env.NODE_BACKEND_BASE_URL || !process.env.NODE_BACKEND_BASE_URL.trim()) {
  throw new Error('[AI-SERVICE] Missing required environment variable: NODE_BACKEND_BASE_URL');
}

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
