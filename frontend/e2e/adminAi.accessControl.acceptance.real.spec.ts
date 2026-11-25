import { expect, test } from '@playwright/test';

test('admin AI endpoints deny anonymous, malformed and customer sessions', async ({ request }) => {
  test.skip(process.env.QA_E2E_ENABLED !== 'true', 'Requires isolated QA.');
  const root = 'http://127.0.0.1:5002/api';
  const login = async (email: string) => {
    const response = await request.post(`${root}/auth/login`, { data: { email, passWord: process.env.QA_SEED_PASSWORD } });
    expect(response.ok()).toBeTruthy();
    return (await response.json()).data.accessToken as string;
  };
  const [admin, customer] = await Promise.all([login('qa.superadmin@atelier.local'), login('qa.customer.a@atelier.local')]);
  const target = `${root}/admin/ai/designs`;
  expect((await request.get(target)).status()).toBe(401);
  expect((await request.get(target, { headers: { Authorization: 'Bearer invalid.token.value' } })).status()).toBe(401);
  expect((await request.get(target, { headers: { Authorization: `Bearer ${customer}` } })).status()).toBe(403);
  expect((await request.get(target, { headers: { Authorization: `Bearer ${admin}` } })).status()).toBe(200);
  expect((await request.get(`${root}/admin/ai/analytics?period=today`, { headers: { Authorization: `Bearer ${customer}` } })).status()).toBe(403);
  expect((await request.get(`${root}/admin/ai/analytics?period=invalid`, { headers: { Authorization: `Bearer ${admin}` } })).status()).toBe(400);
  expect((await request.get(`${root}/admin/ai/analytics?period=custom&startDate=2020-01-01&endDate=2025-01-01`, { headers: { Authorization: `Bearer ${admin}` } })).status()).toBe(400);
  const forbidden = await request.post(`${root}/admin/ai/confirm-action`, { headers: { Authorization: `Bearer ${customer}` }, data: { actionId: 'invalid', actionType: 'prepare_voucher', confirmationToken: 'invalid', payload: {} } });
  expect(forbidden.status()).toBe(403);
  const forged = await request.post(`${root}/admin/ai/confirm-action`, { headers: { Authorization: `Bearer ${admin}` }, data: { actionId: 'invalid', actionType: 'prepare_voucher', confirmationToken: 'invalid', payload: {} } });
  expect(forged.status()).toBe(403);
});

test('logout revokes its own admin session and refresh token', async ({ request }) => {
  test.skip(process.env.QA_E2E_ENABLED !== 'true', 'Requires isolated QA.');
  const root = 'http://127.0.0.1:5002/api';
  const login = await request.post(`${root}/auth/login`, { data: { email: 'qa.superadmin@atelier.local', passWord: process.env.QA_SEED_PASSWORD } });
  expect(login.status()).toBe(200);
  const session = (await login.json()).data;
  const headers = { Authorization: `Bearer ${session.accessToken}` };
  expect((await request.get(`${root}/admin/ai/designs`, { headers })).status()).toBe(200);
  expect((await request.post(`${root}/auth/logout`, { headers, data: { refreshToken: session.refreshToken } })).status()).toBe(204);
  expect((await request.get(`${root}/admin/ai/designs`, { headers })).status()).toBe(401);
  const refresh = await request.post(`${root}/auth/refresh`, { data: { refreshToken: session.refreshToken } });
  expect([401, 403]).toContain(refresh.status());
});
