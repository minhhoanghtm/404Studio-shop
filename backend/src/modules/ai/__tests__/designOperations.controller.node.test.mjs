import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import AdminDesignProject from '../models/adminDesignProject.model.js';
import aiRouter from '../services/aiRouter.service.js';
import { applyAdminDesignOperationsController } from '../adminAi.controller.js';

const document = () => ({ _id: '000000000000000000000001', name: 'QA', preset: 'instagram_portrait', width: 1080, height: 1350, background: { type: 'color', value: '#ffffff' }, layers: [{ id: 'locked', type: 'text', name: 'Locked', content: 'original', x: 20, y: 30, width: 100, height: 100, rotation: 0, opacity: 1, visible: true, locked: true, zIndex: 1, styles: {} }, { id: 'open', type: 'text', name: 'Open', content: 'original', x: 20, y: 150, width: 100, height: 100, rotation: 0, opacity: 1, visible: true, locked: false, zIndex: 2, styles: {} }] });

test('controller applies safe operations and rejects mixed locked batches without saving', async () => {
  let plan = []; let saveCount = 0;
  const stored = document();
  const model = { ...structuredClone(stored), versionHistory: [], promptHistory: [], toObject() { return structuredClone(stored); }, async save() { saveCount++; } };
  const find = mock.method(AdminDesignProject, 'findOne', async () => model);
  const execute = mock.method(aiRouter, 'executeChatWithFallback', async () => ({ message: JSON.stringify({ operations: plan }) }));
  const invoke = async () => { const response = { code: 200, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } }; let error; await applyAdminDesignOperationsController({ body: { designId: stored._id, request: 'QA edit' }, user: { userId: 'qa' }, socket: { localAddress: '127.0.0.1', localPort: 5002 } }, response, (err) => { error = err; }); if (error) throw error; return response; };
  try {
    plan = [{ operation: 'UPDATE_LAYER', layerId: 'open', changes: { content: 'changed' } }, { operation: 'REORDER_LAYER', layerId: 'locked', toIndex: 1 }];
    const denied = await invoke(); assert.equal(denied.code, 422); assert.equal(saveCount, 0); assert.equal(model.layers[1].content, 'original');
    plan = [{ operation: 'UPDATE_LAYER', layerId: 'open', changes: { content: 'changed' } }];
    const accepted = await invoke(); assert.equal(accepted.code, 200); assert.equal(saveCount, 1); assert.equal(model.layers[1].content, 'changed');
  } finally { find.mock.restore(); execute.mock.restore(); }
});

test('controller rejects designs outside the authenticated owner before calling a provider', async () => {
  let query; let calls = 0;
  const find = mock.method(AdminDesignProject, 'findOne', async (filter) => { query = filter; return null; });
  const execute = mock.method(aiRouter, 'executeChatWithFallback', async () => { calls++; return {}; });
  const response = { code: 200, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
  try {
    await applyAdminDesignOperationsController({ body: { designId: '000000000000000000000002', request: 'QA edit' }, user: { userId: 'other-admin' } }, response, (error) => { throw error; });
    assert.equal(response.code, 404); assert.equal(query.adminId, 'other-admin'); assert.equal(calls, 0);
  } finally { find.mock.restore(); execute.mock.restore(); }
});
