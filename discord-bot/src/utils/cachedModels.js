/**
 * @file src/utils/cachedModels.js
 * @description نظام لتغليف نماذج Mongoose مع Redis لتقليل الاستعلامات.
 */

const cache = require('./redis');
const logger = require('./logger');

/**
 * جلب بيانات السيرفر مع التخزين المؤقت
 * @param {import('mongoose').Model} GuildModel 
 * @param {string} guildId 
 */
async function getCachedGuild(GuildModel, guildId) {
    const cacheKey = `guild:${guildId}`;
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    try {
        const guild = await GuildModel.findOne({ guildId }).lean();
        if (guild) {
            await cache.set(cacheKey, guild, cache.TTL.GUILD_SETTINGS);
        }
        return guild;
    } catch (error) {
        logger.error(`Error fetching cached guild ${guildId}:`, error);
        return null;
    }
}

/**
 * جلب بيانات المستخدم مع التخزين المؤقت
 * @param {import('mongoose').Model} UserModel 
 * @param {string} userId 
 * @param {string} guildId 
 */
async function getCachedUser(UserModel, userId, guildId) {
    const cacheKey = `user:${guildId}:${userId}`;
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    try {
        const user = await UserModel.findOne({ userId, guildId }).lean();
        if (user) {
            await cache.set(cacheKey, user, cache.TTL.USER_DATA);
        }
        return user;
    } catch (error) {
        logger.error(`Error fetching cached user ${userId} in ${guildId}:`, error);
        return null;
    }
}

/**
 * تحديث البيانات وحذفها من التخزين المؤقت لضمان الـ Consistency
 * @param {string} key 
 */
async function invalidateCache(key) {
    return await cache.del(key);
}

module.exports = {
    getCachedGuild,
    getCachedUser,
    invalidateCache
};
