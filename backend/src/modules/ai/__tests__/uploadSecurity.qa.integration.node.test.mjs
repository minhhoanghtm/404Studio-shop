import { test } from 'node:test';
import assert from 'node:assert/strict';
import { unlink } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { verifyQaSuiteTarget } from './qaSuiteGuard.mjs';

test('QA upload rejects disguised content and serves a verified image with a canonical extension', async () => {
  await verifyQaSuiteTarget();
  const api = new URL(process.env.QA_API_URL);
  const login = await fetch(`${api.origin}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'qa.superadmin@atelier.local', passWord: process.env.QA_SEED_PASSWORD }) });
  const token = (await login.json()).data.accessToken;
  const created = [];
  const upload = async (bytes, filename, mime) => {
    const form = new FormData(); form.append('image', new Blob([bytes], { type: mime }), filename);
    const response = await fetch(`${api.origin}/api/admin/ai/images/upload`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form });
    const body = await response.json();
    if (response.ok && /^ref_[a-zA-Z0-9_.-]+$/.test(body.data?.filename)) created.push(body.data.filename);
    return { response, body };
  };
  try {
    const invalid = await upload(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'), 'attack.svg', 'image/png');
    assert.equal(invalid.response.status, 400);
    assert.equal((await upload(Buffer.from('not an image'), 'broken.jpg', 'image/jpeg')).response.status, 400);
    assert.equal((await upload(Buffer.from('plain text'), 'note.txt', 'text/plain')).response.status, 400);
    assert.equal((await upload(Buffer.alloc(10 * 1024 * 1024 + 1), 'oversized.png', 'image/png')).response.status, 413);
    const png = await sharp({ create: { width: 8, height: 8, channels: 3, background: '#cc2200' } }).png().toBuffer();
    const valid = await upload(png, 'misleading.svg', 'image/png');
    assert.equal(valid.response.status, 200); assert.match(valid.body.data.filename, /\.png$/);
    const served = await fetch(valid.body.data.url);
    assert.equal(served.status, 200); assert.match(served.headers.get('content-type'), /^image\/png/);
    assert.deepEqual(Buffer.from(await served.arrayBuffer()), png);
    for (const [mime, extension, format] of [['image/jpeg', 'jpg', 'jpeg'], ['image/webp', 'webp', 'webp'], ['image/gif', 'gif', 'gif']]) {
      const bytes = await sharp({ create: { width: 8, height: 8, channels: 3, background: '#cc2200' } }).toFormat(format).toBuffer();
      const result = await upload(bytes, 'misleading.svg', mime);
      assert.equal(result.response.status, 200); assert.ok(result.body.data.filename.endsWith(`.${extension}`));
      const download = await fetch(result.body.data.url);
      assert.equal(download.status, 200); assert.deepEqual(Buffer.from(await download.arrayBuffer()), bytes);
    }
  } finally {
    for (const filename of created) await unlink(path.resolve('uploads', 'ai_references', filename)).catch(() => {});
  }
});
