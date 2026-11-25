const LOOPBACK_HOSTS = new Set(['127.0.0.1', 'localhost']);

export function isLoopbackHostname(hostname: string): boolean {
  return LOOPBACK_HOSTS.has(hostname.trim().toLowerCase());
}

export function parseRequiredPort(raw: string | undefined, name: string): number {
  if (!raw || !String(raw).trim()) {
    throw new Error(`Missing required port environment variable: ${name}`);
  }
  const trimmed = String(raw).trim();
  if (!/^\d+$/.test(trimmed)) {
    throw new Error(`Invalid port for ${name}: "${trimmed}"`);
  }
  const port = Number(trimmed);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Port out of range for ${name}: ${port}`);
  }
  return port;
}

export function getQaApiUrl(): string {
  const raw = (process.env.QA_API_URL || '').trim().replace(/\/$/, '');
  if (!raw) {
    throw new Error('QA_API_URL is required in ENV for QA E2E execution.');
  }
  const parsed = new URL(raw);
  const expectedPort = process.env.BACKEND_PORT ?? process.env.PORT;
  if (
    parsed.protocol !== 'http:' ||
    parsed.username ||
    parsed.password ||
    parsed.search ||
    parsed.hash ||
    !isLoopbackHostname(parsed.hostname) ||
    !parsed.port ||
    (expectedPort && parsed.port !== String(parseRequiredPort(expectedPort, 'BACKEND_PORT'))) ||
    parsed.pathname !== '/api'
  ) {
    throw new Error('QA preflight refused non-QA or mismatched QA_API_URL.');
  }
  return parsed.toString().replace(/\/$/, '');
}

export function getQaBackendOrigin(): string {
  return new URL(getQaApiUrl()).origin;
}

export function getQaFrontendUrl(): string {
  const raw = (process.env.QA_FRONTEND_URL || process.env.PLAYWRIGHT_BASE_URL || '').trim().replace(/\/$/, '');
  if (!raw) {
    throw new Error('QA_FRONTEND_URL or PLAYWRIGHT_BASE_URL is required in ENV for QA E2E execution.');
  }
  const parsed = new URL(raw);
  const expectedPort = process.env.FRONTEND_PORT ?? process.env.VITE_PORT;
  if (
    parsed.protocol !== 'http:' ||
    parsed.username ||
    parsed.password ||
    parsed.search ||
    parsed.hash ||
    !isLoopbackHostname(parsed.hostname) ||
    !parsed.port ||
    (expectedPort && parsed.port !== String(parseRequiredPort(expectedPort, 'FRONTEND_PORT')))
  ) {
    throw new Error('QA preflight refused non-QA or mismatched QA_FRONTEND_URL.');
  }
  return parsed.origin;
}

export function getQaDatabaseExpectation(): { database: string; port: number } {
  const database = (process.env.MONGO_DATABASE || '').trim();
  if (!database || !/(?:^|_)qa(?:_rs)?$/i.test(database)) {
    throw new Error(`QA preflight refused non-QA MONGO_DATABASE: "${database || '(empty)'}".`);
  }
  const port = parseRequiredPort(process.env.MONGO_PORT, 'MONGO_PORT');
  return { database, port };
}

export function getQaRedisPort(): number {
  return parseRequiredPort(process.env.REDIS_PORT, 'REDIS_PORT');
}
