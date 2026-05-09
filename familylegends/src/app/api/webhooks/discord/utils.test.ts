import test from 'node:test';
import assert from 'node:assert/strict';
import { getActivityTimeMs } from './utils';

test('getActivityTimeMs returns 0 when missing timestamp', () => {
  assert.equal(getActivityTimeMs({ timestamp: undefined }), 0);
});

test('getActivityTimeMs supports Firestore-like seconds timestamp', () => {
  assert.equal(getActivityTimeMs({ timestamp: { seconds: 10 } }), 10_000);
});

test('getActivityTimeMs supports ISO string', () => {
  const ms = getActivityTimeMs({ timestamp: '2026-01-01T00:00:00.000Z' });
  assert.equal(ms, new Date('2026-01-01T00:00:00.000Z').getTime());
});

test('getActivityTimeMs supports Date', () => {
  const d = new Date('2026-01-01T00:00:00.000Z');
  assert.equal(getActivityTimeMs({ timestamp: d }), d.getTime());
});

test('getActivityTimeMs supports toDate()', () => {
  const d = new Date('2026-01-01T00:00:00.000Z');
  assert.equal(getActivityTimeMs({ timestamp: { toDate: () => d } }), d.getTime());
});

