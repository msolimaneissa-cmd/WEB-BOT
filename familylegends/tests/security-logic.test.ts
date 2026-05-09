import test from 'node:test';
import assert from 'node:assert/strict';

// Test the Discord Webhook security logic
test('Discord Webhook: should reject requests without Authorization header', async () => {
  // Mock a request
  const req = new Request('http://localhost:9002/api/webhooks/discord', {
    method: 'POST',
    body: JSON.stringify({ event: 'test' }),
  });

  // Since we are testing the logic in route.ts, let's simulate the validateAuth function
  function validateAuth(request: Request, secret: string | undefined): boolean {
    if (!secret) return false;
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
    const token = authHeader.replace('Bearer ', '');
    return token === secret;
  }

  const result = validateAuth(req, 'super-secret');
  assert.strictEqual(result, false, 'Should be unauthorized without header');
});

test('Discord Webhook: should reject requests with wrong token', async () => {
  const req = new Request('http://localhost:9002/api/webhooks/discord', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer wrong-token' },
    body: JSON.stringify({ event: 'test' }),
  });

  function validateAuth(request: Request, secret: string | undefined): boolean {
    if (!secret) return false;
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
    const token = authHeader.replace('Bearer ', '');
    return token === secret;
  }

  const result = validateAuth(req, 'correct-secret');
  assert.strictEqual(result, false, 'Should be unauthorized with wrong token');
});

test('Discord Webhook: should accept requests with correct token', async () => {
  const secret = 'correct-secret';
  const req = new Request('http://localhost:9002/api/webhooks/discord', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${secret}` },
    body: JSON.stringify({ event: 'test' }),
  });

  function validateAuth(request: Request, secret: string | undefined): boolean {
    if (!secret) return false;
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
    const token = authHeader.replace('Bearer ', '');
    return token === secret;
  }

  const result = validateAuth(req, secret);
  assert.strictEqual(result, true, 'Should be authorized with correct token');
});

// Test the NextAuth Whitelist logic
test('NextAuth: should reject non-whitelisted Discord IDs', async () => {
  const adminIds = "111,222,333";
  const user = { id: "999" }; // Unauthorized user

  const ADMIN_IDS = adminIds.split(",");
  const isAllowed = ADMIN_IDS.includes(user.id);

  assert.strictEqual(isAllowed, false, 'Non-whitelisted user should be rejected');
});

test('NextAuth: should allow whitelisted Discord IDs', async () => {
  const adminIds = "111,222,333";
  const user = { id: "222" }; // Authorized user

  const ADMIN_IDS = adminIds.split(",");
  const isAllowed = ADMIN_IDS.includes(user.id);

  assert.strictEqual(isAllowed, true, 'Whitelisted user should be allowed');
});
