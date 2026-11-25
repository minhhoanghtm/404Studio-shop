import type { FullConfig } from '@playwright/test';
import {
  getQaApiUrl,
  getQaDatabaseExpectation,
  getQaFrontendUrl,
  getQaRedisPort,
  isLoopbackHostname,
} from './qaEnv';

export function assertQaTarget(apiUrl: string, frontendUrl: string) {
  const expectedApi = getQaApiUrl();
  const expectedFrontend = getQaFrontendUrl();
  if (apiUrl.replace(/\/$/, '') !== expectedApi || new URL(frontendUrl).origin !== expectedFrontend) {
    throw new Error('QA preflight refused non-QA frontend or API endpoint.');
  }
}

export default async function qaGlobalSetup(_config: FullConfig) {
  if (process.env.QA_E2E_ENABLED !== 'true') {
    throw new Error('QA preflight requires QA_E2E_ENABLED=true.');
  }
  const apiUrl = getQaApiUrl();
  const frontendUrl = getQaFrontendUrl();
  assertQaTarget(apiUrl, frontendUrl);

  const expectedDb = getQaDatabaseExpectation();
  const expectedRedisPort = getQaRedisPort();

  if (!process.env.QA_SEED_PASSWORD) {
    throw new Error('QA preflight requires QA credentials.');
  }
  const response = await fetch(`${apiUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'qa.superadmin@atelier.local',
      passWord: process.env.QA_SEED_PASSWORD,
    }),
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) {
    throw new Error(`QA preflight authentication failed (${response.status}).`);
  }
  const login = await response.json();
  if (!login.data?.accessToken) {
    throw new Error('QA preflight received no access token.');
  }
  const contextResponse = await fetch(`${apiUrl}/admin/ai/qa-context`, {
    headers: { Authorization: `Bearer ${login.data.accessToken}` },
    signal: AbortSignal.timeout(10000),
  });
  if (!contextResponse.ok) {
    throw new Error(`QA preflight context verification failed (${contextResponse.status}).`);
  }
  const { data } = await contextResponse.json();
  if (
    data?.environment !== 'qa' ||
    data.database !== expectedDb.database ||
    !isLoopbackHostname(String(data.databaseHost || '')) ||
    Number(data.databasePort) !== expectedDb.port ||
    !data.connected ||
    !data.redisQa ||
    (data.redisPort !== undefined && Number(data.redisPort) !== expectedRedisPort)
  ) {
    throw new Error('QA preflight refused the running database or Redis target.');
  }
}
