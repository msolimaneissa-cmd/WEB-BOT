// Script to verify BOT_CONTROL_SECRET matches between discord-bot and familylegends
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');

interface EnvFile {
  path: string;
  name: string;
}

const envFiles: EnvFile[] = [
  { path: resolve(rootDir, 'discord-bot', '.env'), name: 'discord-bot' },
  { path: resolve(rootDir, 'discord-bot', '.env.local'), name: 'discord-bot (local)' },
  { path: resolve(rootDir, 'familylegends', '.env'), name: 'familylegends' },
  { path: resolve(rootDir, 'familylegends', '.env.local'), name: 'familylegends (local)' },
];

function parseEnv(content: string): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();
    // Remove surrounding quotes
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    vars[key] = value;
  }
  return vars;
}

function verify() {
  const secrets: { file: string; value: string | null }[] = [];

  for (const envFile of envFiles) {
    if (!existsSync(envFile.path)) continue;
    try {
      const content = readFileSync(envFile.path, 'utf-8');
      const parsed = parseEnv(content);
      const secret = parsed['BOT_CONTROL_SECRET'] || null;
      secrets.push({ file: envFile.name, value: secret });
    } catch (err) {
      console.warn(`⚠️ Could not read ${envFile.path}: ${err}`);
    }
  }

  if (secrets.length === 0) {
    console.error('❌ No .env files found. Run this script from the monorepo root.');
    process.exit(1);
  }

  console.log(`📋 Found ${secrets.length} .env file(s) with BOT_CONTROL_SECRET:\n`);

  const validSecrets = secrets.filter(s => s.value !== null && s.value !== '' && !s.value.startsWith('YOUR_'));
  if (validSecrets.length === 0) {
    console.warn('⚠️ No valid BOT_CONTROL_SECRET values found (all are empty or placeholder).');
    console.warn('   Set BOT_CONTROL_SECRET in discord-bot/.env and familylegends/.env');
    process.exit(1);
  }

  for (const s of secrets) {
    const status = s.value
      ? (s.value.startsWith('YOUR_') ? '⚠️ PLACEHOLDER' : '✅ SET')
      : '❌ MISSING';
    console.log(`   ${s.file.padEnd(25)} ${status}`);
  }

  // Compare all non-placeholder secrets
  const firstValid = validSecrets[0].value;
  const allMatch = validSecrets.every(s => s.value === firstValid);

  if (allMatch) {
    console.log('\n✅ BOT_CONTROL_SECRET is consistent across all projects.');
  } else {
    console.error('\n❌ BOT_CONTROL_SECRET MISMATCH! Values differ between projects.');
    for (const s of validSecrets) {
      const match = s.value === firstValid ? '✅' : '❌';
      console.error(`   ${match} ${s.file}: ${s.value?.slice(0, 20)}...`);
    }
    console.error('\n   Fix: Set the same BOT_CONTROL_SECRET value in all project .env files.');
    process.exit(1);
  }
}

verify();
