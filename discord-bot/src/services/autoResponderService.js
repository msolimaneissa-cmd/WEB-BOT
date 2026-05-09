/**
 * @file src/services/autoResponderService.js
 * @description خدمة الردود التلقائية المتقدمة - أفضل من Carl-bot
 * تدعم Regex، Wildcards، Variables، وTriggers متعددة
 */

const AutoResponder = require('../database/schemas/autoResponderSchema');
const logger = require('../utils/logger');

// تخزين مؤقت للردود السريعة
const responseCache = new Map();

// تنظيف دوري للكاش
setInterval(() => {
    const now = Date.now();
    for (const [key, data] of responseCache.entries()) {
        if (now - data.timestamp > 600000) { // 10 دقائق
            responseCache.delete(key);
        }
    }
}, 300000);

/**
 * إضافة رد تلقائي جديد
 * @param {Object} options
 * @param {string} options.guildId
 * @param {string} options.trigger - الكلمة المحفزة
 * @param {string} options.response - الرد
 * @param {string} options.type - نوع المطابقة (exact, contains, regex, wildcard)
 * @param {boolean} options.caseSensitive - حساس لحالة الأحرف
 * @param {string[]} options.roles - الأدوار المسموحة (اختياري)
 * @param {string[]} options.channels - القنوات المسموحة (اختياري)
 * @returns {Promise<Object>}
 */
async function addAutoResponse({
    guildId,
    trigger,
    response,
    type = 'contains',
    caseSensitive = false,
    roles = [],
    channels = []
}) {
    try {
        // التحقق من صحة الـ regex إذا كان النوع regex
        if (type === 'regex') {
            try {
                new RegExp(trigger);
            } catch (error) {
                return { success: false, error: 'تعبير Regex غير صحيح' };
            }
        }

        const autoResponse = await AutoResponder.create({
            guildId,
            trigger,
            response,
            type,
            caseSensitive,
            allowedRoles: roles,
            allowedChannels: channels,
            enabled: true,
            usageCount: 0
        });

        // مسح الكاش
        responseCache.delete(guildId);

        return { success: true, autoResponse };

    } catch (error) {
        logger.error('خطأ في إضافة رد تلقائي:', error);
        return { success: false, error: error.message };
    }
}

/**
 * حذف رد تلقائي
 * @param {string} guildId
 * @param {string} responseId
 * @returns {Promise<Object>}
 */
async function removeAutoResponse(guildId, responseId) {
    try {
        const result = await AutoResponder.deleteOne({ _id: responseId, guildId });
        
        if (result.deletedCount === 0) {
            return { success: false, error: 'الرد غير موجود' };
        }

        // مسح الكاش
        responseCache.delete(guildId);

        return { success: true };

    } catch (error) {
        logger.error('خطأ في حذف رد تلقائي:', error);
        return { success: false, error: error.message };
    }
}

/**
 * تحديث رد تلقائي
 * @param {string} guildId
 * @param {string} responseId
 * @param {Object} updates
 * @returns {Promise<Object>}
 */
async function updateAutoResponse(guildId, responseId, updates) {
    try {
        const updateData = { ...updates };
        
        // التحقق من صحة regex إذا تم تغييره
        if (updates.trigger && updates.type === 'regex') {
            try {
                new RegExp(updates.trigger);
            } catch (error) {
                return { success: false, error: 'تعبير Regex غير صحيح' };
            }
        }

        const result = await AutoResponder.findOneAndUpdate(
            { _id: responseId, guildId },
            updateData,
            { new: true }
        );

        if (!result) {
            return { success: false, error: 'الرد غير موجود' };
        }

        // مسح الكاش
        responseCache.delete(guildId);

        return { success: true, autoResponse: result };

    } catch (error) {
        logger.error('خطأ في تحديث رد تلقائي:', error);
        return { success: false, error: error.message };
    }
}

/**
 * الحصول على جميع الردود لسيرفر معين
 * @param {string} guildId
 * @returns {Promise<Array>}
 */
async function getAutoResponses(guildId) {
    try {
        // التحقق من الكاش
        if (responseCache.has(guildId)) {
            return responseCache.get(guildId);
        }

        const responses = await AutoResponder.find({ guildId }).sort({ createdAt: -1 });
        
        // تخزين في الكاش
        responseCache.set(guildId, responses);

        return responses;

    } catch (error) {
        logger.error('خطأ في الحصول على الردود:', error);
        return [];
    }
}

/**
 * البحث عن رد لمطابقة رسالة
 * @param {string} guildId
 * @param {string} messageContent
 * @param {Object} context - سياق الرسالة (member, channel)
 * @returns {Promise<Object|null>}
 */
async function findMatchingResponse(guildId, messageContent, context) {
    try {
        const responses = await getAutoResponses(guildId);
        
        for (const response of responses) {
            if (!response.enabled) continue;

            // التحقق من الصلاحيات (الأدوار)
            if (response.allowedRoles && response.allowedRoles.length > 0) {
                const memberRoles = context.member?.roles.cache.map(r => r.id) || [];
                const hasRole = response.allowedRoles.some(roleId => 
                    memberRoles.includes(roleId)
                );
                
                if (!hasRole) continue;
            }

            // التحقق من القنوات
            if (response.allowedChannels && response.allowedChannels.length > 0) {
                if (!response.allowedChannels.includes(context.channelId)) {
                    continue;
                }
            }

            // المطابقة بناءً على النوع
            let matched = false;
            const text = response.caseSensitive ? messageContent : messageContent.toLowerCase();
            const trigger = response.caseSensitive ? response.trigger : response.trigger.toLowerCase();

            switch (response.type) {
                case 'exact':
                    matched = text === trigger;
                    break;
                    
                case 'contains':
                    matched = text.includes(trigger);
                    break;
                    
                case 'regex':
                    try {
                        const flags = response.caseSensitive ? '' : 'i';
                        const regex = new RegExp(response.trigger, flags);
                        matched = regex.test(messageContent);
                    } catch (error) {
                        logger.debug('Regex error:', error.message);
                        matched = false;
                    }
                    break;
                    
                case 'wildcard':
                    // تحويل wildcard إلى regex
                    const pattern = trigger
                        .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
                        .replace(/\*/g, '.*');
                    const regex = new RegExp(`^${pattern}$`, response.caseSensitive ? '' : 'i');
                    matched = regex.test(text);
                    break;
            }

            if (matched) {
                // زيادة عداد الاستخدام
                response.usageCount = (response.usageCount || 0) + 1;
                await response.save();
                
                return {
                    response: processVariables(response.response, context),
                    id: response._id
                };
            }
        }

        return null;

    } catch (error) {
        logger.error('خطأ في البحث عن رد:', error);
        return null;
    }
}

/**
 * معالجة المتغيرات في الرد
 * @param {string} template - النص القالب
 * @param {Object} context - السياق
 * @returns {string}
 */
function processVariables(template, context) {
    const variables = {
        '{user}': context.user?.username || 'Unknown',
        '{mention}': context.user ? `<@${context.user.id}>` : '',
        '{tag}': context.user?.tag || 'Unknown#0000',
        '{server}': context.guild?.name || 'Unknown Server',
        '{channel}': context.channel?.name || 'Unknown Channel',
        '{timestamp}': new Date().toLocaleString('ar-SA'),
        '{date}': new Date().toLocaleDateString('ar-SA')
    };

    let result = template;
    
    for (const [placeholder, value] of Object.entries(variables)) {
        result = result.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value);
    }

    return result;
}

/**
 * تبديل حالة الرد (تفعيل/تعطيل)
 * @param {string} guildId
 * @param {string} responseId
 * @returns {Promise<Object>}
 */
async function toggleAutoResponse(guildId, responseId) {
    try {
        const response = await AutoResponder.findOne({ _id: responseId, guildId });
        
        if (!response) {
            return { success: false, error: 'الرد غير موجود' };
        }

        response.enabled = !response.enabled;
        await response.save();

        // مسح الكاش
        responseCache.delete(guildId);

        return { success: true, enabled: response.enabled };

    } catch (error) {
        logger.error('خطأ في تبديل حالة الرد:', error);
        return { success: false, error: error.message };
    }
}

/**
 * إعادة تعيين عداد الاستخدام لرد معين
 * @param {string} guildId
 * @param {string} responseId
 * @returns {Promise<Object>}
 */
async function resetUsageCount(guildId, responseId) {
    try {
        const result = await AutoResponder.findOneAndUpdate(
            { _id: responseId, guildId },
            { usageCount: 0 },
            { new: true }
        );

        if (!result) {
            return { success: false, error: 'الرد غير موجود' };
        }

        return { success: true, usageCount: 0 };

    } catch (error) {
        logger.error('خطأ في إعادة تعيين العداد:', error);
        return { success: false, error: error.message };
    }
}

/**
 * الحصول على إحصائيات الردود
 * @param {string} guildId
 * @returns {Promise<Object>}
 */
async function getAutoResponseStats(guildId) {
    try {
        const responses = await AutoResponses.find({ guildId });
        
        const total = responses.length;
        const enabled = responses.filter(r => r.enabled).length;
        const disabled = total - enabled;
        const totalUsage = responses.reduce((sum, r) => sum + (r.usageCount || 0), 0);
        
        const byType = {
            exact: responses.filter(r => r.type === 'exact').length,
            contains: responses.filter(r => r.type === 'contains').length,
            regex: responses.filter(r => r.type === 'regex').length,
            wildcard: responses.filter(r => r.type === 'wildcard').length
        };

        const mostUsed = [...responses]
            .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
            .slice(0, 5)
            .map(r => ({
                id: r._id,
                trigger: r.trigger,
                usageCount: r.usageCount
            }));

        return {
            total,
            enabled,
            disabled,
            totalUsage,
            byType,
            mostUsed
        };

    } catch (error) {
        logger.error('خطأ في الحصول على الإحصائيات:', error);
        return null;
    }
}

module.exports = {
    addAutoResponse,
    removeAutoResponse,
    updateAutoResponse,
    getAutoResponses,
    findMatchingResponse,
    processVariables,
    toggleAutoResponse,
    resetUsageCount,
    getAutoResponseStats
};
