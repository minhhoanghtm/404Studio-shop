import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateDesignPayload } from '../designPayload.validator.js';

const layer = (changes = {}) => ({ id: 'one', type: 'text', name: 'Title', x: 1, y: 2, width: 100, height: 100, rotation: 0, opacity: 1, zIndex: 1, visible: true, locked: false, content: 'Title', styles: {}, ...changes });
const document = (layers) => ({ name: 'QA', width: 1080, height: 1350, background: { type: 'color', value: '#fff' }, layers });
const rejects = (payload) => assert.throws(() => validateDesignPayload(payload), (error) => error.statusCode === 400);

test('accepts a valid editable design with a public image and flat group', () => {
  assert.doesNotThrow(() => validateDesignPayload(document([layer(), layer({ id: 'two', type: 'image', content: 'https://example.com/product.png' }), layer({ id: 'group', type: 'group', content: '["one","two"]' })])));
});
test('rejects invalid IDs, group graphs, geometry, opacity and excessive layers', () => {
  rejects({ ...document([layer()]), schemaVersion: 999 });
  rejects(document([layer(), layer()]));
  rejects(document([layer(), layer({ id: 'group', type: 'group', content: '["one","missing"]' })]));
  rejects(document([layer(), layer({ id: 'group', type: 'group', content: '["one","group"]' })]));
  rejects(document([layer({ width: -1 })]));
  rejects(document([layer({ opacity: 2 })]));
  for (const styles of [{ cropX: -1 }, { cropY: 101 }, { cropZoom: 3.1 }, { cropZoom: 'bad' }]) rejects(document([layer({ styles })]));
  for (const styles of [{ fontSize: 0 }, { fontSize: 'bad' }]) rejects(document([layer({ styles })]));
  rejects(document(Array.from({ length: 201 }, (_, index) => layer({ id: `id${index}` }))));
});
test('rejects script, SVG and unsafe image protocols including background layers', () => {
  for (const type of ['image', 'product', 'logo', 'background']) {
    for (const content of ['javascript:alert(1)', 'data:image/svg+xml;base64,PHN2Zz4=', '<svg onload="alert(1)">']) rejects(document([layer({ type, content })]));
  }
  rejects({ ...document([layer()]), background: { type: 'image', value: 'javascript:alert(1)' } });
  rejects(document([layer({ type: 'image', content: 'data:image/png;base64,PGh0bWw+' })]));
  rejects(document([layer({ content: '<script>alert(1)</script>' })]));
  rejects(document([layer({ styles: { backgroundColor: 'url(https://untrusted.invalid/x)' } })]));
  rejects(document([layer({ type: 'image', content: 'https://user:password@example.com/image.png' })]));
  rejects(document([layer({ styles: JSON.parse('{"__proto__":{"polluted":true}}') })]));
  assert.equal({}.polluted, undefined);
});
test('validates editable color fields without rejecting supported CSS colors', () => {
  assert.doesNotThrow(() => validateDesignPayload(document([layer({ styles: { color: '#abc', backgroundColor: 'transparent', shadowColor: 'rgba(0,0,0,0.5)' } })])));
  rejects(document([layer({ styles: { color: 'not-a-color' } })]));
  rejects({ ...document([layer()]), background: { type: 'gradient', value: '#fff', secondaryValue: 'not-a-color' } });
  rejects({ ...document([layer()]), background: { type: 'color', value: 'not-a-color' } });
});
