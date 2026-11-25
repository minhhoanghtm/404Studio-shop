import { describe, expect, it } from 'vitest';
import { validateAiServiceRuntimeEnv } from '../config/env.js';

const buildValidAiEnv = (overrides: Record<string, string | undefined> = {}): NodeJS.ProcessEnv => ({
  NODE_ENV: 'development',
  AI_SERVICE_HOST: '127.0.0.1',
  AI_SERVICE_PORT: '18081',
  NODE_BACKEND_BASE_URL: 'http://127.0.0.1:15000',
  AI_SERVICE_SHARED_SECRET: 's'.repeat(32),
  ...overrides,
});

describe('AI Service ENV Bootstrap & Validation', () => {
  it('accepts valid runtime ENV configuration without hardcoded fallback ports', () => {
    const config = validateAiServiceRuntimeEnv(buildValidAiEnv());
    expect(config.port).toBe(18081);
    expect(config.host).toBe('127.0.0.1');
    expect(config.nodeBackendBaseUrl).toBe('http://127.0.0.1:15000');
    expect(config.publicBaseUrl).toBe('http://127.0.0.1:18081');
  });

  it('strips trailing slash on NODE_BACKEND_BASE_URL cleanly', () => {
    const config = validateAiServiceRuntimeEnv(
      buildValidAiEnv({ NODE_BACKEND_BASE_URL: 'http://127.0.0.1:15000/' })
    );
    expect(config.nodeBackendBaseUrl).toBe('http://127.0.0.1:15000');
  });

  it('fails fast when NODE_BACKEND_BASE_URL is missing', () => {
    expect(() => validateAiServiceRuntimeEnv(buildValidAiEnv({ NODE_BACKEND_BASE_URL: '' }))).toThrow(
      /NODE_BACKEND_BASE_URL/
    );
  });

  it('rejects NODE_BACKEND_BASE_URL ending with /api to avoid double /api prefix', () => {
    expect(() =>
      validateAiServiceRuntimeEnv(
        buildValidAiEnv({ NODE_BACKEND_BASE_URL: 'http://127.0.0.1:15000/api' })
      )
    ).toThrow(/without a trailing \/api suffix/);
  });

  it('fails fast when AI_SERVICE_PORT or AI_SERVICE_SHARED_SECRET is missing or invalid', () => {
    expect(() => validateAiServiceRuntimeEnv(buildValidAiEnv({ AI_SERVICE_PORT: '' }))).toThrow(
      /AI_SERVICE_PORT/
    );
    expect(() =>
      validateAiServiceRuntimeEnv(buildValidAiEnv({ AI_SERVICE_SHARED_SECRET: 'short' }))
    ).toThrow(/AI_SERVICE_SHARED_SECRET/);
  });
});
