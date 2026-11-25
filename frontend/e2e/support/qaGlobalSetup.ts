import type { FullConfig } from '@playwright/test';

export function assertQaTarget(apiUrl: string, frontendUrl: string) {
  const api = new URL(apiUrl); const frontend = new URL(frontendUrl);
  const local = (host: string) => ['127.0.0.1', 'localhost'].includes(host);
  if (api.protocol !== 'http:' || api.username || api.password || api.search || api.hash || !local(api.hostname) || api.port !== '5002' || api.pathname.replace(/\/$/, '') !== '/api' || frontend.protocol !== 'http:' || frontend.username || frontend.password || frontend.search || frontend.hash || !local(frontend.hostname) || frontend.port !== '5174') throw new Error('QA preflight refused non-QA frontend or API endpoint.');
}

export default async function qaGlobalSetup(_config: FullConfig) {
  if (process.env.QA_E2E_ENABLED !== 'true') throw new Error('QA preflight requires QA_E2E_ENABLED=true.');
  const apiUrl = (process.env.QA_API_URL || '').replace(/\/$/, '');
  const frontendUrl = process.env.QA_FRONTEND_URL || '';
  assertQaTarget(apiUrl, frontendUrl);
  if (!process.env.QA_SEED_PASSWORD) throw new Error('QA preflight requires QA credentials.');
  const response = await fetch(`${apiUrl}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'qa.superadmin@atelier.local', passWord: process.env.QA_SEED_PASSWORD }), signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error(`QA preflight authentication failed (${response.status}).`);
  const login = await response.json();
  if (!login.data?.accessToken) throw new Error('QA preflight received no access token.');
  const contextResponse = await fetch(`${apiUrl}/admin/ai/qa-context`, { headers: { Authorization: `Bearer ${login.data.accessToken}` }, signal: AbortSignal.timeout(10000) });
  if (!contextResponse.ok) throw new Error(`QA preflight context verification failed (${contextResponse.status}).`);
  const { data } = await contextResponse.json();
  if (data?.environment !== 'qa' || data.database !== 'atelier_verite_qa' || !['127.0.0.1', 'localhost'].includes(data.databaseHost) || data.databasePort !== 27018 || !data.connected || !data.redisQa) throw new Error('QA preflight refused the running database or Redis target.');
}
