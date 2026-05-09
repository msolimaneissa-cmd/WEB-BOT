/**
 * @file src/utils/webhook.js
 * @description أدوات إرسال webhook للموقع الإلكتروني.
 * يرسل أحداث البث والإحصائيات عبر طلبات POST إلى نقطة نهاية webhook المحددة.
 */

const axios = require('axios');
const { config } = require('../config');
const logger = require('./logger');

/** عنوان webhook الموقع */
const WEBHOOK_URL = config.websiteWebhookUrl;

/** مفتاح مصادقة webhook */
const WEBHOOK_SECRET = config.websiteWebhookSecret;

/**
 * إرسال طلب webhook عام إلى الموقع
 * @async
 * @param {Object} payload - البيانات المرسلة
 * @returns {Promise<boolean>} هل نجح الإرسال
 */
async function sendWebhook(payload) {
    if (!payload || typeof payload !== 'object') {
        logger.error('❌ فشل إرسال webhook: البيانات المرسلة غير صالحة');
        return false;
    }
    if (!payload.event || typeof payload.event !== 'string') {
        logger.error('❌ فشل إرسال webhook: نوع الحدث (event) مفقود أو غير صالح');
        return false;
    }
    try {
        const payloadSize = Buffer.byteLength(JSON.stringify(payload));
        if (payloadSize > 50 * 1024) { // 50 KB max size
            logger.error('❌ فشل إرسال webhook: حجم البيانات كبير جداً');
            return false;
        }
    } catch (e) {
        logger.error('❌ فشل إرسال webhook: خطأ في تسلسل البيانات');
        return false;
    }

    if (!WEBHOOK_URL) {
        logger.debug('⏭️ لم يتم تكوين webhook للموقع - تم تخطي الإرسال.');
        return false;
    }

    try {
        const headers = { 'Content-Type': 'application/json' };
        if (WEBHOOK_SECRET) {
            headers['Authorization'] = `Bearer ${WEBHOOK_SECRET}`;
        }

        const response = await axios.post(WEBHOOK_URL, payload, {
            headers,
            timeout: 10000,
        });

        logger.debug(`📤 تم إرسال webhook (${payload.event}) بنجاح - الحالة: ${response.status}`);
        return true;
    } catch (error) {
        logger.error(`❌ فشل إرسال webhook (${payload.event}):`, error.message);
        return false;
    }
}

/**
 * إرسال حدث بدء البث
 * @async
 * @param {Object} data
 * @param {string} data.userId - معرف المستخدم
 * @param {string} data.username - اسم المستخدم
 * @param {string} data.streamUrl - رابط البث
 * @param {string} data.platform - المنصة
 * @param {string} [data.guildId] - معرف السيرفر
 * @param {string} [data.startedAt] - وقت البدء
 * @returns {Promise<boolean>}
 */
async function sendStreamStart(data) {
    return sendWebhook({
        event: 'stream_start',
        userId: data.userId,
        username: data.username,
        streamUrl: data.streamUrl,
        platform: data.platform,
        guildId: data.guildId || null,
        startedAt: data.startedAt || new Date().toISOString(),
    });
}

/**
 * إرسال حدث انتهاء البث
 * @async
 * @param {Object} data
 * @param {string} data.userId - معرف المستخدم
 * @param {string} data.username - اسم المستخدم
 * @param {string} data.streamUrl - رابط البث
 * @param {string} data.platform - المنصة
 * @param {string} [data.guildId] - معرف السيرفر
 * @param {string} [data.endedAt] - وقت الانتهاء
 * @returns {Promise<boolean>}
 */
async function sendStreamEnd(data) {
    return sendWebhook({
        event: 'stream_end',
        userId: data.userId,
        username: data.username,
        streamUrl: data.streamUrl,
        platform: data.platform,
        guildId: data.guildId || null,
        endedAt: data.endedAt || new Date().toISOString(),
    });
}

/**
 * إرسال إحصائيات السيرفر
 * @async
 * @param {Object} data
 * @param {string} data.guildId - معرف السيرفر
 * @param {string} data.guildName - اسم السيرفر
 * @param {number} data.memberCount - عدد الأعضاء
 * @param {number} data.onlineCount - عدد المتصلين
 * @param {number} data.botCount - عدد البوتات
 * @returns {Promise<boolean>}
 */
async function sendServerStats(data) {
    return sendWebhook({
        event: 'server_stats',
        guildId: data.guildId,
        guildName: data.guildName,
        memberCount: data.memberCount,
        onlineCount: data.onlineCount,
        botCount: data.botCount,
        totalMembers: data.memberCount,
        onlineMembers: data.onlineCount,
        timestamp: new Date().toISOString(),
    });
}

/**
 * إرسال نشاط عام
 * @async
 * @param {Object} data
 * @param {string} data.event - نوع الحدث
 * @param {Object} [data.data] - بيانات إضافية
 * @returns {Promise<boolean>}
 */
async function sendActivity(data) {
    return sendWebhook({
        event: data.event || 'activity',
        ...data.data,
        timestamp: new Date().toISOString(),
    });
}

module.exports = {
    sendWebhook,
    sendStreamStart,
    sendStreamEnd,
    sendServerStats,
    sendActivity,
};
