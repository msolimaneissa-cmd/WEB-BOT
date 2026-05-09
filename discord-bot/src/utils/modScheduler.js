/**
 * @file src/utils/modScheduler.js
 * @description نظام جدولة الإجراءات الإدارية المؤقتة (مثل الحظر المؤقت).
 */

const ModAction = require('../database/schemas/modActionSchema');
const logger = require('./logger');

/**
 * فحص الإجراءات منتهية الصلاحية وتنفيذها (مثل إلغاء الحظر)
 * @param {import('discord.js').Client} client - عميل ديسكورد
 */
async function checkExpiredActions(client) {
    try {
        const expiredActions = await ModAction.find({
            expiresAt: { $lte: new Date() },
            completed: false,
        });

        if (expiredActions.length === 0) return;

        logger.info(`🔄 معالجة ${expiredActions.length} إجراء إداري منتهي الصلاحية...`);

        for (const action of expiredActions) {
            const guild = client.guilds.cache.get(action.guildId);
            if (!guild) {
                action.completed = true;
                await action.save();
                continue;
            }

            if (action.type === 'tempban') {
                try {
                    const bans = await guild.bans.fetch();
                    if (bans.has(action.userId)) {
                        await guild.bans.remove(action.userId, 'انتهاء مدة الحظر المؤقت');
                        logger.success(`✅ تم إلغاء حظر ${action.userId} في سيرفر ${guild.name} (انتهاء المدة)`);
                    }
                } catch (error) {
                    logger.error(`❌ فشل في إلغاء حظر ${action.userId} في سيرفر ${guild.name}:`, error.message);
                }
            }

            // تحديد الإجراء كمكتمل
            action.completed = true;
            await action.save();
        }
    } catch (error) {
        logger.error('❌ خطأ في فحص الإجراءات المنتهية:', error.message);
    }
}

/**
 * بدء نظام الجدولة
 * @param {import('discord.js').Client} client - عميل ديسكورد
 */
function startModScheduler(client) {
    // فحص كل دقيقة
    setInterval(() => checkExpiredActions(client), 60000);
    logger.info('⏰ نظام جدولة الإجراءات الإدارية يعمل (كل 60 ثانية)');
}

module.exports = { startModScheduler };
