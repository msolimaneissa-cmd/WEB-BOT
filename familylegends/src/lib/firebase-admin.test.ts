import { test, describe } from 'node:test';
import assert from 'node:assert';
import { serializeFirestoreData } from './firebase-admin';

describe('serializeFirestoreData', () => {
  test('should handle null and undefined', () => {
    assert.strictEqual(serializeFirestoreData(null), null);
    assert.strictEqual(serializeFirestoreData(undefined), undefined);
  });

  test('should serialize Firestore Timestamp objects', () => {
    const mockTimestamp = {
      _seconds: 1625097600,
      _nanoseconds: 0,
      toDate: () => new Date(1625097600 * 1000)
    };
    const data = { timestamp: mockTimestamp };
    const result = serializeFirestoreData<{ timestamp: string }>(data);
    assert.strictEqual(typeof result.timestamp, 'string');
    assert.strictEqual(result.timestamp, new Date(1625097600 * 1000).toISOString());
  });

  test('should serialize Date objects', () => {
    const date = new Date();
    const data = { createdAt: date };
    const result = serializeFirestoreData<{ createdAt: string }>(data);
    assert.strictEqual(result.createdAt, date.toISOString());
  });

  test('should recursively serialize nested objects and arrays', () => {
    const date = new Date();
    const data = {
      user: {
        id: '123',
        joinedAt: date,
        posts: [
          { id: '1', date: date }
        ]
      }
    };
    const result = serializeFirestoreData<any>(data);
    assert.strictEqual(result.user.joinedAt, date.toISOString());
    assert.strictEqual(result.user.posts[0].date, date.toISOString());
  });

  test('should not affect plain strings and numbers', () => {
    const data = { name: 'Test', count: 10 };
    const result = serializeFirestoreData<any>(data);
    assert.strictEqual(result.name, 'Test');
    assert.strictEqual(result.count, 10);
  });
});
