/**
 * @file src/database/schemas/serverConfigSchema.js
 * @description Singleton Adapter for Existing guildSchema.
 *
 * هذا الملف يوفر واجهة Singleton فوق الـ guildSchema الحالي.
 * بدلاً من الاستعلام بـ { guildId } ديناميكي من المستخدم،
 * جميع العمليات تستخدم config.mainGuildId.
 *
 * الاستخدام:
 *   - القديم: await Guild.findOne({ guildId })
 *   - الجديد: await ServerConfig.get()
 *   - القديم: await Guild.findOneAndUpdate({ guildId }, data, opts)
 *   - الجديد: await ServerConfig.update(data)
 */

const Guild = require('./guildSchema');
const { config } = require('../../config');

/**
 * يُعيد معرف السيرفر الرئيسي من متغيرات البيئة.
 * يُوقف التطبيق إذا لم يكن موجوداً — لأن العمل بدونه مستحيل.
 * @returns {string}
 */
function getMainGuildId() {
    const guildId = config.mainGuildId;
    if (!guildId) {
        throw new Error('MAIN_GUILD_ID is not defined in environment variables. Cannot start in single-guild mode.');
    }
    return guildId;
}

/** Cache في الذاكرة لتجنب استعلامات DB متكررة */
let _configCache = null;
let _cacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 دقائق

const ServerConfig = {
    /**
     * جلب إعدادات السيرفر الرئيسي (مع Cache).
     * إذا لم يوجد مستند في DB، يُنشئه تلقائياً.
     * @returns {Promise<import('mongoose').Document>}
     */
    async get() {
        const now = Date.now();
        if (_configCache && (now - _cacheTimestamp) < CACHE_TTL_MS) {
            return _configCache;
        }

        const guildId = getMainGuildId();
        let config = await Guild.findOne({ guildId });
        if (!config) {
            console.log(`[ServerConfig] Creating new singleton config for guild ${guildId}`);
            config = await Guild.create({ guildId });
        }

        _configCache = config;
        _cacheTimestamp = now;
        return config;
    },

    /**
     * تحديث الإعدادات.
     * @param {object} updateData - كائن التحديث (يُستخدم كـ $set)
     * @returns {Promise<import('mongoose').Document>}
     */
    async update(updateData) {
        const guildId = getMainGuildId();
        const updated = await Guild.findOneAndUpdate(
            { guildId },
            { $set: updateData },
            { new: true, upsert: true, runValidators: true }
        );

        // مسح الـ Cache بعد كل تحديث
        _configCache = updated;
        _cacheTimestamp = Date.now();
        return updated;
    },

    /**
     * يمسح الـ Cache ويُجبر على إعادة القراءة من DB في المرة القادمة.
     * يُستدعى عند تلقي إشارة CONFIG_UPDATE من الداشبورد.
     */
    invalidateCache() {
        _configCache = null;
        _cacheTimestamp = 0;
        console.log('[ServerConfig] Cache invalidated — will reload from DB on next access.');
    },

    /**
     * جلب لون الـ embed للسيرفر الرئيسي.
     * @returns {Promise<string>}
     */
    async getEmbedColor() {
        const config = await this.get();
        return config?.general?.embedColor ?? '#5865F2';
    },
};

module.exports = ServerConfig;
