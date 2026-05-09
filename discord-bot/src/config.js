/**
 * @file src/config.js
 * @description الإعدادات المركزية للبوت.
 * يقرأ جميع الإعدادات من متغيرات البيئة مع التحقق من صحتها.
 */

require('dotenv').config();

/** المتغيرات المطلوبة */
const requiredEnvVars = ['DISCORD_TOKEN', 'CLIENT_ID', 'BOT_CONTROL_SECRET', 'GUILD_ID', 'MAIN_GUILD_ID', 'ADMIN_ROLE_ID'];

/** المتغيرات الموصى بها (تحذير فقط) */
const recommendedEnvVars = ['MONGODB_URI', 'DASHBOARD_URL', 'TWITCH_CLIENT_ID', 'YOUTUBE_API_KEY'];

/** @type {Object} إعدادات البوت */
const config = {
    token: process.env.DISCORD_TOKEN || '',
    clientId: process.env.CLIENT_ID || '',
    guildId: process.env.GUILD_ID || '',
    mainGuildId: process.env.MAIN_GUILD_ID || process.env.GUILD_ID || '',
    adminRoleId: process.env.ADMIN_ROLE_ID || '',
    dashboardAccessRoleId: process.env.DASHBOARD_ACCESS_ROLE_ID || process.env.ADMIN_ROLE_ID || '',
    mongoUri: process.env.MONGODB_URI || '',
    botStatus: process.env.BOT_STATUS || 'إدارة السيرفر',
    botActivityType: process.env.BOT_ACTIVITY_TYPE || 'PLAYING',
    environment: process.env.NODE_ENV || 'production',
    isDevelopment: (process.env.NODE_ENV || 'production') === 'development',
    websiteWebhookUrl: process.env.WEBSITE_WEBHOOK_URL || '',
    websiteWebhookSecret: process.env.WEBSITE_WEBHOOK_SECRET || '',
    dashboardUrl: process.env.DASHBOARD_URL || '',
    botControlSecret: process.env.BOT_CONTROL_SECRET || '',
};

/**
 * التحقق من متغيرات البيئة المطلوبة
 * @returns {{ valid: boolean, missing: string[], warnings: string[] }}
 */
function validateConfig() {
    const missing = requiredEnvVars.filter(key => !process.env[key]);
    const warnings = recommendedEnvVars.filter(key => !process.env[key]);
    return {
        valid: missing.length === 0,
        missing,
        warnings,
    };
}

module.exports = { config, validateConfig };
