import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyDesignOperations, applyDesignOperationsAtomically } from '../services/designOperations.service.js';
import { validateDesignPayload } from '../designPayload.validator.js';

test('locked layers cannot be updated, removed, or reordered', () => {
  const design = { background: { type: 'color', value: '#fff' }, layers: [
    { id: 'locked', type: 'text', name: 'Locked', content: 'original', x: 0, y: 0, width: 100, height: 100, locked: true, zIndex: 1 },
    { id: 'other', type: 'text', name: 'Other', content: 'other', x: 0, y: 0, width: 100, height: 100, locked: false, zIndex: 2 },
  ] };
  for (const operation of [
    { operation: 'UPDATE_LAYER', layerId: 'locked', changes: { content: 'tampered' } },
    { operation: 'REMOVE_LAYER', layerId: 'locked' },
    { operation: 'REORDER_LAYER', layerId: 'locked', toIndex: 1 },
  ]) {
    const result = applyDesignOperations(design, [operation]);
    assert.deepEqual(result.applied, []);
    assert.deepEqual(result.document, design);
  }
  const mixed = applyDesignOperationsAtomically(design, [{ operation: 'UPDATE_LAYER', layerId: 'other', changes: { content: 'changed' } }, { operation: 'REMOVE_LAYER', layerId: 'locked' }]);
  assert.equal(mixed, null);
  assert.equal(design.layers[1].content, 'other');
  assert.equal(applyDesignOperationsAtomically(design, [{ operation: 'UPDATE_LAYER', layerId: 'other', changes: { opacity: 5 } }]), null);
  assert.equal(applyDesignOperationsAtomically(design, [{ operation: 'UPDATE_LAYER', layerId: 'other', changes: { styles: { cropZoom: 5 } } }]), null);
});

test('valid deterministic operations change a copy and preserve a valid design', () => {
  const design = { name: 'QA', preset: 'instagram_portrait', width: 1080, height: 1350, background: { type: 'color', value: '#ffffff' }, layers: [{ id: 'title', type: 'text', name: 'Title', content: 'Original', x: 20, y: 30, width: 100, height: 100, rotation: 0, opacity: 1, visible: true, locked: false, zIndex: 1, styles: {} }] };
  const operations = [
    { operation: 'UPDATE_LAYER', layerId: 'title', changes: { content: 'Xin chào', rotation: 30, opacity: 0.5, styles: { fontFamily: 'Inter', color: '#123456' } } },
    { operation: 'ADD_LAYER', layer: { type: 'shape', name: 'Shape', width: 120, height: 80 } },
    { operation: 'DUPLICATE_LAYER', layerId: 'title' },
    { operation: 'REORDER_LAYER', layerId: 'title', toIndex: 1 },
    { operation: 'CHANGE_BACKGROUND', background: { type: 'color', value: '#112233' } },
  ];
  const result = applyDesignOperations(design, operations);
  assert.deepEqual(result.applied, operations.map((item) => item.operation));
  assert.equal(design.layers[0].content, 'Original');
  assert.equal(result.document.layers.find((item) => item.id === 'title').content, 'Xin chào');
  assert.equal(result.document.background.value, '#112233');
  assert.doesNotThrow(() => validateDesignPayload(result.document));
  const removed = applyDesignOperations(result.document, [{ operation: 'REMOVE_LAYER', layerId: 'title' }]);
  assert.equal(removed.document.layers.some((item) => item.id === 'title'), false);
  assert.deepEqual(removed.applied, ['REMOVE_LAYER']);
});
