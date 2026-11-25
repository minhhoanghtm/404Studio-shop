import { test } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { verifyQaSuiteTarget, assertConnectedQaDatabase } from './qaSuiteGuard.mjs';

test('Security Extended QA: expired JWT, customer session revocation, cross-user conversations, and no credential leaks', async () => {
  const uri = await verifyQaSuiteTarget();
  const apiOrigin = new URL(process.env.QA_API_URL).origin;
  const login = async (email) => {
    const res = await fetch(`${apiOrigin}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, passWord: process.env.QA_SEED_PASSWORD }),
    });
    assert.equal(res.status, 200);
    return (await res.json()).data;
  };

  const [superAdminSession, adminBSession, customerASession, customerBSession] = await Promise.all([
    login('qa.superadmin@atelier.local'),
    login('qa.admin@atelier.local'),
    login('qa.customer.a@atelier.local'),
    login('qa.customer.b@atelier.local'),
  ]);

  const superAdminId = jwt.verify(superAdminSession.accessToken, process.env.ACCESS_TOKEN_SECRET).userId;
  const customerBId = jwt.verify(customerBSession.accessToken, process.env.ACCESS_TOKEN_SECRET).userId;

  // 1. Expired JWT rejected (401) across customer and admin endpoints
  const expiredToken = jwt.sign(
    { userId: customerBId, role: 'user', jti: 'expired-qa-jti' },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: -60 }
  );
  for (const path of ['/api/order', '/api/cart', '/api/favorites', '/api/chat/conversations', '/api/admin/ai/designs']) {
    const res = await fetch(`${apiOrigin}${path}`, { headers: { Authorization: `Bearer ${expiredToken}` } });
    assert.equal(res.status, 401, `Expired JWT must be rejected on ${path}`);
  }

  // 2. Customer Redis session revocation on logout (isolated disposable customer so shared QA sessions are untouched)
  const [{ default: User }, { default: AdminAiConversation }, { default: Conversation }] = await Promise.all([
    import('../../users/user.model.js'),
    import('../models/adminAiConversation.model.js'),
    import('../../communication/conversations/conversation.model.js'),
  ]);
  await mongoose.connect(uri);
  assertConnectedQaDatabase(mongoose);
  let disposableCustomer;
  let adminConv;
  let customerConv;
  try {
    disposableCustomer = await User.create({
      fullName: 'QA Security Revocation Customer',
      email: `qa-sec-revocation-${Date.now()}@atelier.invalid`,
      passWord: await bcrypt.hash(process.env.QA_SEED_PASSWORD, 10),
      role: 'user',
      status: 'active',
      isActive: true,
    });
    const disposableLogin = await login(disposableCustomer.email);
    const dispHeaders = { Authorization: `Bearer ${disposableLogin.accessToken}` };
    assert.equal((await fetch(`${apiOrigin}/api/order`, { headers: dispHeaders })).status, 200);
    const logoutRes = await fetch(`${apiOrigin}/api/auth/logout`, {
      method: 'POST',
      headers: { ...dispHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: disposableLogin.refreshToken }),
    });
    assert.equal(logoutRes.status, 204);
    assert.equal((await fetch(`${apiOrigin}/api/order`, { headers: dispHeaders })).status, 401);
    assert.equal((await fetch(`${apiOrigin}/api/cart`, { headers: dispHeaders })).status, 401);
    const refreshAfterLogout = await fetch(`${apiOrigin}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: disposableLogin.refreshToken }),
    });
    assert.ok([401, 403].includes(refreshAfterLogout.status));

    // 3. Cross-user conversations (Admin AI + Customer Communication)
    adminConv = await AdminAiConversation.create({
      adminId: superAdminId,
      title: `QA Private Admin Conv ${Date.now()}`,
      mode: 'auto',
      messages: [{ role: 'user', content: 'Private admin note' }],
    });
    assert.equal(
      (await fetch(`${apiOrigin}/api/admin/ai/conversations/${adminConv._id}`, {
        headers: { Authorization: `Bearer ${superAdminSession.accessToken}` },
      })).status,
      200
    );
    assert.equal(
      (await fetch(`${apiOrigin}/api/admin/ai/conversations/${adminConv._id}`, {
        headers: { Authorization: `Bearer ${adminBSession.accessToken}` },
      })).status,
      404
    );
    await fetch(`${apiOrigin}/api/admin/ai/conversations/${adminConv._id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminBSession.accessToken}` },
    });
    assert.ok(await AdminAiConversation.exists({ _id: adminConv._id }));

    customerConv = await Conversation.create({
      customerId: customerBId,
      type: 'ai',
      status: 'open',
      channel: 'web',
    });
    const crossCustomerMsgs = await fetch(`${apiOrigin}/api/chat/messages/${customerConv._id}`, {
      headers: { Authorization: `Bearer ${customerASession.accessToken}` },
    });
    assert.ok([403, 404].includes(crossCustomerMsgs.status));

    // 4. Credential leakage checks on live auth / qa-context / settings responses
    const qaCtx = await fetch(`${apiOrigin}/api/admin/ai/qa-context`, {
      headers: { Authorization: `Bearer ${superAdminSession.accessToken}` },
    });
    const qaCtxText = await qaCtx.text();
    assert.equal(qaCtxText.includes(process.env.QA_SEED_PASSWORD), false);
    assert.equal(qaCtxText.includes(process.env.ACCESS_TOKEN_SECRET), false);
    const settingsRes = await fetch(`${apiOrigin}/api/admin/ai/settings`, {
      headers: { Authorization: `Bearer ${superAdminSession.accessToken}` },
    });
    const settingsText = await settingsRes.text();
    if (process.env.OPENAI_API_KEY) {
      assert.equal(settingsText.includes(process.env.OPENAI_API_KEY), false);
    }
    assert.equal(settingsText.includes(process.env.ACCESS_TOKEN_SECRET), false);
  } finally {
    if (disposableCustomer) await User.deleteOne({ _id: disposableCustomer._id });
    if (adminConv) await AdminAiConversation.deleteOne({ _id: adminConv._id });
    if (customerConv) await Conversation.deleteOne({ _id: customerConv._id });
    await mongoose.disconnect();
  }
});
