import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let envBootstrapped = false;

export function loadAiServiceEnv(): void {
  if (envBootstrapped) return;
  envBootstrapped = true;

  if (process.env.NODE_ENV === 'test' || process.env.APP_ENV === 'ci' || process.env.VITEST) {
    return;
  }

  // Precedence: explicit process.env > ai-service/.env > backend/.env > root .env
  const candidates = [
    path.resolve(__dirname, '../../.env'),
    path.resolve(__dirname, '../../../backend/.env'),
    path.resolve(__dirname, '../../../.env'),
  ];

  for (const envPath of candidates) {
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath, quiet: true });
    }
  }
}

export function parseRequiredPort(raw: string | undefined, label: string): number {
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
}

export function validateAiServiceRuntimeEnv(env: NodeJS.ProcessEnv = process.env) {
  const port = parseRequiredPort(env.AI_SERVICE_PORT ?? env.PORT, 'AI_SERVICE_PORT');
  const host = String(env.AI_SERVICE_HOST || '').trim();
  if (!host) {
    throw new Error('[AI-SERVICE] Missing required environment variable: AI_SERVICE_HOST');
  }

  const rawBackendUrl = String(env.NODE_BACKEND_BASE_URL || '').trim().replace(/\/$/, '');
  if (!rawBackendUrl) {
    throw new Error('[AI-SERVICE] Missing required environment variable: NODE_BACKEND_BASE_URL');
  }

  let parsedBackendUrl: URL;
  try {
    parsedBackendUrl = new URL(rawBackendUrl);
  } catch {
    throw new Error(`[AI-SERVICE] Invalid NODE_BACKEND_BASE_URL: "${rawBackendUrl}"`);
  }
  if (parsedBackendUrl.protocol !== 'http:' && parsedBackendUrl.protocol !== 'https:') {
    throw new Error(`[AI-SERVICE] Unsupported NODE_BACKEND_BASE_URL protocol: "${parsedBackendUrl.protocol}"`);
  }
  if (parsedBackendUrl.pathname.replace(/\/$/, '') === '/api') {
    throw new Error(
      '[AI-SERVICE] NODE_BACKEND_BASE_URL must be the backend origin without a trailing /api suffix.'
    );
  }

  const sharedSecret = String(env.AI_SERVICE_SHARED_SECRET || '').trim();
  if (sharedSecret.length < 32) {
    throw new Error(
      '[AI-SERVICE] Missing or invalid AI_SERVICE_SHARED_SECRET (minimum 32 characters required).'
    );
  }

  return {
    port,
    host,
    nodeBackendBaseUrl: rawBackendUrl,
    publicBaseUrl: `http://${host}:${port}`,
  };
}

loadAiServiceEnv();
