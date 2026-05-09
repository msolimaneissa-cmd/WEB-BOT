/**
 * @file src/utils/cache.js
 * @description نظام تخزين مؤقت لإعدادات السيرفر لتقليل الضغط على MongoDB.
 */

const ServerConfig = require('../database/schemas/serverConfigSchema');

/** @type {Map<string, {data: Object, timestamp: number}>} تخزين الإعدادات في الذاكرة */
const settingsCache = new Map();

// إبطال الكاش بعد 5 دقائق (300000 ملي ثانية) لتجنب تقادم البيانات
const CACHE_TTL = 5 * 60 * 1000;

/**
 * تحديث الكاش لسيرفر معين
 * @param {string} guildId 
 */
async function updateGuildCache(guildId) {
    try {
        const settings = await ServerConfig.get();
        if (settings) {
            settingsCache.set(guildId, { data: settings.toObject(), timestamp: Date.now() });
            console.log(`[Cache] Updated cache for guild: ${guildId}`);
            return settings.toObject();
        }
        return null;
    } catch (error) {
        console.error(`[Cache Error] Failed to update cache for ${guildId}:`, error);
        return null;
    }
}

/**
 * الحصول على الإعدادات من الكاش، والتحميل من الداتابيز إذا لم تكن موجودة أو كانت قديمة
 * @param {string} guildId 
 */
async function getGuildSettings(guildId) {
    if (settingsCache.has(guildId)) {
        const cached = settingsCache.get(guildId);
        if (Date.now() - cached.timestamp < CACHE_TTL) {
            return cached.data;
        }
        // Cache expired, remove it and re-fetch
        settingsCache.delete(guildId);
    }
    return await updateGuildCache(guildId);
}

/**
 * تهيئة الكاش عند بدء التشغيل
 * @param {string} guildId 
 */
async function initCache(guildId) {
    if (!guildId) return;
    console.log(`[Cache] Initializing cache for guild: ${guildId}`);
    await updateGuildCache(guildId);
}

module.exports = {
    getGuildSettings,
    updateGuildCache,
    initCache,
    settingsCache
};
