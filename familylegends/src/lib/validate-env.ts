const REQUIRED: string[] = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXTAUTH_SECRET',
  'DISCORD_CLIENT_ID',
  'DISCORD_CLIENT_SECRET',
];

export function validateEnv(): { valid: boolean; missing: string[] } {
  const missing = REQUIRED.filter(k => !process.env[k]);
  if (missing.length > 0) {
    console.warn(`[validateEnv] Missing required env vars: ${missing.join(', ')}`);
  }
  return { valid: missing.length === 0, missing };
}

validateEnv();
