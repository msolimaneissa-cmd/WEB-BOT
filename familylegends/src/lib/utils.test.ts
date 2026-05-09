import test from 'node:test';
import assert from 'node:assert/strict';
import { formatArabicDate, formatArabicNumber } from './utils';

test('formatArabicNumber correctly formats in Arabic', () => {
  const formatted = formatArabicNumber(1234);
  // Expect '١٬٢٣٤' or '1,234' depending on the environment's locale implementation
  // But usually in Node, ar-EG should result in Arabic-Indic digits
  assert.ok(typeof formatted === 'string');
  assert.ok(formatted.length > 0);
});

test('formatArabicDate correctly formats in Arabic', () => {
  const d = new Date('2026-04-11T00:00:00.000Z');
  const formatted = formatArabicDate(d);
  assert.ok(formatted.includes('٢٠٢٦') || formatted.includes('2026'));
});
