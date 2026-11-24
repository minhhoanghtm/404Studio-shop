import { expect, type Page } from '@playwright/test';

export type QaLayer = {
  id: string;
  type: 'text' | 'image' | 'shape' | 'group' | 'badge' | 'button' | 'product';
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  zIndex: number;
  visible: boolean;
  locked: boolean;
  content: string;
  styles: Record<string, unknown>;
};

export type QaDesign = {
  _id: string;
  name: string;
  background: { type: 'color' | 'gradient'; value: string; secondaryValue?: string };
  layers: QaLayer[];
  versionHistory?: Array<{ version: number; name: string; layers: QaLayer[]; background: QaDesign['background'] }>;
};

const qaPassword = process.env.QA_SEED_PASSWORD;
const qaApiBase = (process.env.QA_API_URL || process.env.VITE_API_URL || 'http://127.0.0.1:5002/api').replace(/\/$/, '');

const browserApi = async <T>(page: Page, path: string, method: 'GET' | 'POST', body?: unknown): Promise<T> => {
  const apiPath = path.startsWith('/api/') ? path.slice(4) : path;
  const result = await page.evaluate(async ({ url, method, body }) => {
    const raw = localStorage.getItem('atelier_patron_auth');
    const token = raw ? (JSON.parse(raw)?.state?.token || JSON.parse(raw)?.state?.accessToken) : null;
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      credentials: 'include',
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return { ok: response.ok, status: response.status, payload: await response.json() };
  }, { url: `${qaApiBase}${apiPath}`, method, body });
  expect(result.ok, `${method} ${apiPath} should be authorized (${result.status})`).toBeTruthy();
  return result.payload.data as T;
};

export const loginQaUser = async (page: Page, email: string) => {
  testSkipIfMissingPassword();
  await page.goto('/login');
  const acceptCookies = page.getByRole('button', { name: 'Chấp nhận tất cả' });
  if (await acceptCookies.isVisible().catch(() => false)) await acceptCookies.click();
  await page.getByPlaceholder('patron@domain.com').fill(email);
  await page.getByPlaceholder('Tối thiểu 8 ký tự').fill(qaPassword!);
  await page.getByRole('button', { name: 'Đăng Nhập', exact: true }).click();
  await expect(page).toHaveURL(/\/(admin|profile|)$/);
};

export const loginQaAdmin = async (page: Page) => loginQaUser(page, 'qa.superadmin@atelier.local');

const testSkipIfMissingPassword = () => {
  if (!qaPassword) throw new Error('QA_SEED_PASSWORD is required for authenticated QA browser tests.');
};

export const createIsolatedDesign = async (page: Page, name: string, layers: QaLayer[]): Promise<QaDesign> => browserApi<QaDesign>(page, '/api/admin/ai/designs', 'POST', {
  name,
  preset: 'instagram_portrait',
  width: 1080,
  height: 1350,
  background: { type: 'gradient', value: '#241B3B', secondaryValue: '#101827' },
  layers,
});

export const readDesign = async (page: Page, designId: string): Promise<QaDesign> => {
  const designs = await browserApi<QaDesign[]>(page, '/api/admin/ai/designs', 'GET');
  const design = designs.find((item) => item._id === designId);
  expect(design, `isolated design ${designId} must exist for the authenticated owner`).toBeTruthy();
  return design!;
};

export const openDesignInStudio = async (page: Page, expectedName: string) => {
  await page.goto('/admin/ai-assistant?tab=creative');
  await expect(page.getByRole('button', { name: 'Creative Studio (Poster & Banner)' })).toBeVisible();
  await expect(page.getByLabel('Tên thiết kế')).toHaveValue(expectedName);
};

export const saveDesign = async (page: Page, designId: string): Promise<QaDesign> => {
  const response = page.waitForResponse((candidate) => candidate.url().includes('/api/admin/ai/designs') && candidate.request().method() === 'POST' && candidate.ok());
  await page.getByRole('button', { name: 'Lưu', exact: true }).click();
  await response;
  return readDesign(page, designId);
};

export const seededLayer = (overrides: Partial<QaLayer> & Pick<QaLayer, 'id' | 'type' | 'name'>): QaLayer => ({
  x: 120,
  y: 120,
  width: 240,
  height: 120,
  rotation: 0,
  opacity: 1,
  zIndex: 1,
  visible: true,
  locked: false,
  content: overrides.type === 'text' ? overrides.name : '',
  styles: overrides.type === 'text'
    ? { fontFamily: 'Inter', fontSize: 32, fontWeight: '700', color: '#FFFFFF', textAlign: 'left' }
    : { backgroundColor: '#D4AF37', borderRadius: 12 },
  ...overrides,
});
