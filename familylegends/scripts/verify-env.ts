// Script to verify environment variables before build
// Supports "soft fail" mode for development/preview environments

const requiredEnvVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
  'NEXTAUTH_SECRET',
  'DISCORD_CLIENT_ID',
  'DISCORD_CLIENT_SECRET',
];

// Optional but recommended for full functionality
const recommendedEnvVars = [
  'DISCORD_WEBHOOK_SECRET',
  'BOT_CONTROL_SECRET',
  'ENCRYPTION_KEY',
];

function verify() {
  const isNetlifyProduction = process.env.CONTEXT === 'production' || process.env.NETLIFY === 'true';
  const missingRequired = requiredEnvVars.filter(v => !process.env[v]);
  const missingRecommended = recommendedEnvVars.filter(v => !process.env[v]);

  if (missingRequired.length > 0) {
    console.warn('⚠️ Warning: Missing REQUIRED environment variables:');
    missingRequired.forEach(v => console.warn(`   - ${v}`));

    if (isNetlifyProduction) {
      console.error('❌ Error: Missing variables are REQUIRED for production builds. Failing build.');
      process.exit(1);
    }
  }

  if (missingRecommended.length > 0) {
    console.warn('⚠️ Warning: Missing recommended environment variables (some features may not work):');
    missingRecommended.forEach(v => console.warn(`   - ${v}`));
  }

  if (missingRequired.length === 0) {
    console.log('✅ All required environment variables are present.');
  }

  // Validate NEXT_PUBLIC_BOT_SERVER_URL format
  const botUrl = process.env.NEXT_PUBLIC_BOT_SERVER_URL;
  if (botUrl) {
    try {
      const parsed = new URL(botUrl);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        console.warn(`⚠️ NEXT_PUBLIC_BOT_SERVER_URL must use http or https protocol, got: ${parsed.protocol}`);
      }
    } catch {
      console.warn(`⚠️ NEXT_PUBLIC_BOT_SERVER_URL is not a valid URL: ${botUrl}`);
    }
  } else {
    console.warn('⚠️ NEXT_PUBLIC_BOT_SERVER_URL is not set. Socket.IO connections to the bot will use localhost:3001 fallback.');
  }
}

verify();
