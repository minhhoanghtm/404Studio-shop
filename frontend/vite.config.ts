import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
const envDir = path.resolve(__dirname, '..');

function parseEnvPort(raw: string | undefined, name: string): number {
  if (!raw || !String(raw).trim()) {
    throw new Error(`[ViteConfig] Missing required port environment variable: ${name}`);
  }
  const trimmed = String(raw).trim();
  if (!/^\d+$/.test(trimmed)) {
    throw new Error(`[ViteConfig] Invalid port for ${name}: "${trimmed}"`);
  }
  const port = Number(trimmed);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`[ViteConfig] Port out of range for ${name}: ${port}`);
  }
  return port;
}

function resolveProxyTarget(env: Record<string, string | undefined>): string {
  const direct = (env.VITE_BACKEND_URL || env.BACKEND_URL || '').trim().replace(/\/$/, '');
  if (direct) return direct;
  if (env.BACKEND_HOST && env.BACKEND_PORT) {
    const port = parseEnvPort(env.BACKEND_PORT, 'BACKEND_PORT');
    return `http://${env.BACKEND_HOST.trim()}:${port}`;
  }
  throw new Error('[ViteConfig] Missing VITE_BACKEND_URL (or BACKEND_HOST + BACKEND_PORT) for Vite proxy.');
}

export default defineConfig(({ mode, command }) => {
  const rootEnv = loadEnv(mode, envDir, '');
  const localEnv = loadEnv(mode, __dirname, '');
  const env: Record<string, string | undefined> = {
    ...rootEnv,
    ...localEnv,
    ...process.env,
  };

  const requiresServerEnv = command === 'serve' && mode !== 'test';
  const port = requiresServerEnv
    ? parseEnvPort(env.VITE_PORT || env.FRONTEND_PORT, 'VITE_PORT')
    : Number(env.VITE_PORT || env.FRONTEND_PORT || 0) || undefined;
  const previewPort = requiresServerEnv
    ? parseEnvPort(
        env.VITE_PREVIEW_PORT || env.FRONTEND_PREVIEW_PORT || env.VITE_PORT || env.FRONTEND_PORT,
        'VITE_PREVIEW_PORT'
      )
    : undefined;
  const rawHost = (env.VITE_HOST || env.FRONTEND_HOST || '').trim();
  if (requiresServerEnv && !rawHost) {
    throw new Error('[ViteConfig] Missing required host environment variable: VITE_HOST / FRONTEND_HOST.');
  }
  const host = rawHost === 'true' ? true : rawHost || undefined;
  const strictPort = env.VITE_STRICT_PORT !== 'false';
  const backendTarget = requiresServerEnv ? resolveProxyTarget(env) : undefined;

  return {
    envDir,
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    ...(requiresServerEnv
      ? {
          server: {
            host,
            port,
            strictPort,
            proxy: {
              '/socket.io': {
                target: backendTarget,
                ws: true,
                changeOrigin: true,
              },
              '/api': {
                target: backendTarget,
                changeOrigin: true,
                secure: false,
              },
              '/uploads': {
                target: backendTarget,
                changeOrigin: true,
                secure: false,
              },
            },
          },
          preview: {
            host,
            port: previewPort,
            strictPort,
          },
        }
      : {}),
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/test/setup.ts',
      include: ['src/test/**/*.{test,spec}.{ts,tsx}'],
      exclude: ['e2e/**', 'node_modules/**'],
    },
  };
});
