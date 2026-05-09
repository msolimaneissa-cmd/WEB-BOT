/**
 * @file src/events/messageCreate.js
 * @description معالج حدث إنشاء الرسائل. يوفر نظام الحماية التلقائية
 * (مكافحة السبام، الروابط، الدعوات، الحروف الكبيرة، الشتائم)
 * ونظام الخبرة والتقدم.
 * يدعم التحكم الفردي في كل نظام حماية من لوحة التحكم.
 */

const { EmbedBuilder, Collection } = require('discord.js');
const ServerConfig = require('../database/schemas/serverConfigSchema');
const User = require('../database/schemas/userSchema');
const Warning = require('../database/schemas/warningSchema');
const AutoResponder = require('../database/schemas/autoResponderSchema');
const { isDatabaseConnected } = require('../database/connect');
const { hasPermission } = require('../utils/permissions');
const { processAIMessage } = require('../utils/aiChat');
const { getGuildSettings } = require('../utils/cache');
const { config: botConfig } = require('../config');
const logger = require('../utils/logger');

// ─── تتبع السبام: guildId -> userId -> { count, firstMessageTimestamp, messages } ───
/** @type {Collection<string, Collection<string, {count: number, firstMessageTimestamp: number, messages: Array}>>} */
const spamMap = new Collection();

// تنظيف spamMap كل ساعة لمنع تسرب الذاكرة
setInterval(() => {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    for (const [guildId, guildSpam] of spamMap.entries()) {
        for (const [userId, userSpam] of guildSpam.entries()) {
            if (userSpam.firstMessageTimestamp < oneHourAgo) {
                guildSpam.delete(userId);
            }
        }
        if (guildSpam.size === 0) spamMap.delete(guildId);
    }
}, 60 * 60 * 1000);

// ─── تتبع الخبرة: منع إهدار الخبرة بكثرة ───
/** @type {Collection<string, number>} آخر وقت حصول على خبرة لكل مستخدم */
const xpCooldowns = new Collection();

// تنظيف xpCooldowns كل 30 دقيقة لمنع تسريب الذاكرة
setInterval(() => {
    const fifteenMinutesAgo = Date.now() - 15 * 60 * 1000;
    for (const [key, ts] of xpCooldowns.entries()) {
        if (ts < fifteenMinutesAgo) xpCooldowns.delete(key);
    }
}, 30 * 60 * 1000);

// ─── كلمات الشتائم العربية الأساسية ───
const DEFAULT_SWEAR_WORDS = [
    'كس', 'زبي', 'خرا', 'قحب', 'طيز', 'نيك', 'لعنة',
    'حمار', 'كلب', 'حيوان', 'غبي', 'أحمق', 'متخلف',
    'ابن', 'أمك', 'اختك', 'عاهر', 'شرموط',
];

/**
 * الحصول على إعدادات الحماية الفعالة
 * يدعم كلاً من الهيكل الجديد (protection.*) والهيكل القديم (antiSpam/antiLink)
 */
function getProtectionConfig(config) {
    return {
        antiSpam: {
            enabled: config?.protection?.antiSpam?.enabled ?? config?.antiSpam?.enabled ?? false,
            maxMessages: config?.protection?.antiSpam?.maxMessages ?? config?.antiSpam?.maxMessages ?? 5,
            interval: config?.protection?.antiSpam?.interval ?? config?.antiSpam?.interval ?? 5000,
            punishment: config?.protection?.antiSpam?.punishment ?? config?.antiSpam?.punishment ?? 'timeout',
        },
        antiLink: {
            enabled: config?.protection?.antiLink?.enabled ?? config?.antiLink?.enabled ?? false,
            allowedChannels: config?.protection?.antiLink?.allowedChannels ?? config?.antiLink?.allowedChannels ?? [],
            allowedRoles: config?.protection?.antiLink?.allowedRoles ?? config?.antiLink?.allowedRoles ?? [],
        },
        antiInvite: {
            enabled: config?.protection?.antiInvite?.enabled ?? false,
        },
        antiCaps: {
            enabled: config?.protection?.antiCaps?.enabled ?? false,
            minCapsPercentage: config?.protection?.antiCaps?.minCapsPercentage ?? 70,
            minCapsLength: config?.protection?.antiCaps?.minCapsLength ?? 5,
        },
        antiSwear: {
            enabled: config?.protection?.antiSwear?.enabled ?? false,
            customWords: config?.protection?.antiSwear?.customWords ?? [],
        },
        antiMention: {
            enabled: config?.protection?.antiMention?.enabled ?? false,
            maxMentions: config?.protection?.antiMention?.maxMentions ?? 5,
            action: config?.protection?.antiMention?.action ?? 'timeout',
        },
    };
}

/**
 * @module events/messageCreate
 * @description معالج حدث إنشاء الرسائل مع حماية تلقائية ونظام خبرة.
 */
module.exports = {
    /** @type {string} اسم الحدث */
    name: 'messageCreate',

    /**
     * ينفذ عند إنشاء رسالة في السيرفر.
     * @async
     * @param {import('discord.js').Message} message - الرسالة المنشأة.
     * @param {import('discord.js').Client} client - عميل ديسكورد.
     * @returns {Promise<void>}
     */
    async execute(message, client) {
        // ─── بوابة الأمان (Security Gate) ───
        if (!message.guild || message.guild.id !== botConfig.mainGuildId) return;
        
        // تجاهل رسائل البوتات
        if (message.author.bot) return;

        // ─── أنظمة الحماية (استخدام الكاش) ───
        let config = null;
        let prot = null;
        try {
            config = await getGuildSettings(message.guild.id);
            prot = getProtectionConfig(config);
        } catch (error) {
            // تجاهل
        }

        // ═══════════════════════════════════════════════════════════════
        // 🤖 نظام الرد على المنشن - البوت الذكي (AI)
        // ═══════════════════════════════════════════════════════════════
        const aiEnabled = config?.ai?.enabled ?? false;
        const aiChannelId = config?.ai?.channelId;
        const isMentioned = message.mentions.has(client.user, { ignoreEveryone: true, ignoreRoles: true });
        const isInAiChannel = aiChannelId ? message.channel.id === aiChannelId : true;

        if (aiEnabled && isInAiChannel && isMentioned) {
            try {
                const content = message.content
                    .replace(/<@!?(\d+)>/g, '')
                    .trim();

                if (!content) {
                    return message.reply('أهلاً! 👋 كيف أقدر أساعدك؟ اكتب `!مساعدة` لمعرفة أوامري!');
                }

                message.channel.sendTyping();

                const response = await processAIMessage(
                    content,
                    message.author.id,
                    message.guild.id,
                    message.author.username,
                    config?.ai?.systemPrompt,
                    config?.ai?.model
                );

                return message.reply(response);
            } catch (error) {
                logger.error('خطأ في الرد على المنشن:', error);
            }
        }

        // ─── نظام الخبرة والتقدم ───
        if (isDatabaseConnected() && (config?.leveling?.enabled !== false)) {
            try {
                const leveling = config?.leveling || {};
                const now = Date.now();
                const lastXp = xpCooldowns.get(message.author.id) || 0;
                const cooldown = leveling.cooldown || 60000;

                if (now - lastXp > cooldown) {
                    const xpMin = leveling.xpRange?.min || 15;
                    const xpMax = leveling.xpRange?.max || 25;
                    const xpGain = Math.floor(Math.random() * (xpMax - xpMin + 1)) + xpMin;

                    // تحديث بيانات المستخدم
                    const updatedUser = await User.findOneAndUpdate(
                        { userId: message.author.id, guildId: message.guild.id },
                        {
                            $inc: { totalMessages: 1, xp: xpGain },
                        },
                        { new: true, upsert: true, setDefaultsOnInsert: true }
                    );

                    // التحقق من صعود المستوى
                    const xpNeeded = Math.floor(100 * Math.pow(updatedUser.level, 1.5));

                    if (updatedUser.xp >= xpNeeded) {
                        updatedUser.level += 1;
                        updatedUser.xp -= xpNeeded;

                        // ─── نظام الرتب التلقائي (Role Rewards) ───
                        // Support both array format (leveling.rewards) and Map format (leveling.roles)
                        let roleToAward = null;
                        if (Array.isArray(leveling.rewards)) {
                            const reward = leveling.rewards.find(r => r.level === updatedUser.level);
                            if (reward && reward.roleIds && reward.roleIds.length > 0) {
                                roleToAward = reward.roleIds;
                            }
                        } else if (leveling.roles instanceof Map || (leveling.roles && typeof leveling.roles.get === 'function')) {
                            const roleId = leveling.roles.get(updatedUser.level.toString());
                            if (roleId) roleToAward = [roleId];
                        }
                        if (roleToAward) {
                            try {
                                const member = await message.guild.members.fetch(message.author.id);
                                if (member) {
                                    for (const roleId of roleToAward) {
                                        await member.roles.add(roleId);
                                    }
                                }
                            } catch (e) {
                                logger.error(`Error awarding role ${roleToAward} to ${message.author.id}:`, e);
                            }
                        }

                        await updatedUser.save();

                        // إرسال إشعار صعود المستوى
                        try {
                            const msgTemplate = leveling.message || 'مبروك {user}! لقد وصلت للمستوى {level} 🎊';
                            const msgText = msgTemplate
                                .replace(/{user}/g, `<@${message.author.id}>`)
                                .replace(/{level}/g, updatedUser.level)
                                .replace(/{xp}/g, updatedUser.xp);

                            const levelUpEmbed = new EmbedBuilder()
                                .setColor('#FFD700')
                                .setTitle('🎉 صعود مستوى!')
                                .setDescription(msgText)
                                .setTimestamp();

                            const targetChannelId = leveling.channelId;
                            const targetChannel = targetChannelId ? message.guild.channels.cache.get(targetChannelId) : message.channel;
                            
                            if (targetChannel) {
                                await targetChannel.send({ embeds: [levelUpEmbed] });
                            }
                        } catch (e) {
                            // تجاهل
                        }
                    }

                    xpCooldowns.set(message.author.id, now);
                } else {
                    await User.findOneAndUpdate(
                        { userId: message.author.id, guildId: message.guild.id },
                        { $inc: { totalMessages: 1 } },
                        { upsert: true }
                    );
                }
            } catch (error) {
                logger.error('Error in leveling system:', error);
            }
        }

        // تخطي الحماية للمشرفين
        const isMod = hasPermission(message.member, 'ManageMessages');
        if (isMod) return;

        // ─── 1. مكافحة الروابط ───
        if (prot?.antiLink?.enabled) {
            const urlRegex = /(https?:\/\/[^\s]+)/g;
            if (urlRegex.test(message.content)) {
                let allowed = false;
                if (prot.antiLink.allowedChannels && prot.antiLink.allowedChannels.includes(message.channel.id)) allowed = true;
                if (prot.antiLink.allowedRoles && message.member.roles.cache.some(r => prot.antiLink.allowedRoles.includes(r.id))) allowed = true;

                if (!allowed) {
                    await message.delete().catch(() => {});
                    const warning = await message.channel.send(`<@${message.author.id}>, نشر الروابط غير مسموح في هذه القناة!`).catch(() => {});
                    setTimeout(() => warning?.delete().catch(() => {}), 5000);

                    try {
                        const dmEmbed = new EmbedBuilder()
                            .setColor('#FF0000')
                            .setTitle('⚠️ تم حذف رابط')
                            .setDescription(`رسالتك في **${message.guild.name}** احتوت على رابط وهو غير مسموح.\n\n**المحتوى المحذوف:** ${message.content.length > 500 ? message.content.slice(0, 500) + '...' : message.content}`)
                            .setTimestamp();
                        await message.author.send({ embeds: [dmEmbed] }).catch(() => {
                            logger.debug('Could not send DM to user (DMs closed or bot blocked)');
                        });
                    } catch (e) {}

                    return;
                }
            }
        }

        // ─── 2. مكافحة دعوات ديسكورد ───
        if (prot?.antiInvite?.enabled) {
            const inviteRegex = /(discord\.(gg|io|me|li)|discordapp\.com\/invite)\/[a-zA-Z0-9]+/g;
            if (inviteRegex.test(message.content)) {
                await message.delete().catch(() => {});
                const warning = await message.channel.send(`<@${message.author.id}>, نشر روابط دعوات ديسكورد غير مسموح!`).catch(() => {});
                setTimeout(() => warning?.delete().catch(() => {}), 5000);

                try {
                    const dmEmbed = new EmbedBuilder()
                        .setColor('#FF0000')
                        .setTitle('⚠️ تم حذف دعوة ديسكورد')
                        .setDescription(`رسالتك في **${message.guild.name}** احتوت على رابط دعوة ديسكورد وهو غير مسموح.`)
                        .setTimestamp();
                    await message.author.send({ embeds: [dmEmbed] }).catch(() => { logger.debug('Could not send DM to user (DMs closed or bot blocked)'); });
                } catch (e) {}

                return;
            }
        }

        // ─── 3. مكافحة الحروف الكبيرة ───
        if (prot?.antiCaps?.enabled && message.content.length >= (prot.antiCaps.minCapsLength || 5)) {
            const upperCount = (message.content.match(/[A-Z\u0600-\u06FF]/g) || []).length;
            const totalLetters = (message.content.match(/[A-Za-z\u0600-\u06FF]/g) || []).length;
            const capsPercentage = totalLetters > 0 ? upperCount / totalLetters : 0;
            const minPercentage = (prot.antiCaps.minCapsPercentage || 70) / 100;

            if (upperCount >= 10 && capsPercentage >= minPercentage) {
                await message.delete().catch(() => {});
                const warning = await message.channel.send(`<@${message.author.id}>, يرجى عدم استخدام الحروف الكبيرة بشكل مفرط!`).catch(() => {});
                setTimeout(() => warning?.delete().catch(() => {}), 5000);

                try {
                    const dmEmbed = new EmbedBuilder()
                        .setColor('#FF0000')
                        .setTitle('⚠️ استخدام مفرط للحروف الكبيرة')
                        .setDescription(`يرجى عدم استخدام الحروف الكبيرة بشكل مفرط في **${message.guild.name}**.`)
                        .setTimestamp();
                    await message.author.send({ embeds: [dmEmbed] }).catch(() => { logger.debug('Could not send DM to user (DMs closed or bot blocked)'); });
                } catch (e) {}

                return;
            }
        }

        // ─── 4. مكافحة السبام ───
        if (prot?.antiSpam?.enabled) {
            const maxMessages = prot.antiSpam.maxMessages || 5;
            const interval = prot.antiSpam.interval || 5000;
            const punishment = prot.antiSpam.punishment || 'timeout';

            if (!spamMap.has(message.guild.id)) {
                spamMap.set(message.guild.id, new Collection());
            }

            const guildSpam = spamMap.get(message.guild.id);

            if (!guildSpam.has(message.author.id)) {
                guildSpam.set(message.author.id, { count: 1, firstMessageTimestamp: Date.now(), messages: [message] });
            } else {
                const userSpam = guildSpam.get(message.author.id);
                userSpam.count++;
                userSpam.messages.push(message);

                if (Date.now() - userSpam.firstMessageTimestamp > interval) {
                    userSpam.count = 1;
                    userSpam.firstMessageTimestamp = Date.now();
                    userSpam.messages = [message];
                } else if (userSpam.count >= maxMessages) {
                    // تم اكتشاف السبام!
                    const messagesToDelete = userSpam.messages.filter(m => !m.deleted);
                    if (messagesToDelete.length > 0 && message.channel.permissionsFor(message.guild.members.me).has('ManageMessages')) {
                        await message.channel.bulkDelete(messagesToDelete, true).catch(() => {});
                    }

                    // معاقبة المستخدم
                    if (punishment === 'timeout' && message.guild.members.me.permissions.has('ModerateMembers')) {
                        try {
                            await message.member.timeout(5 * 60 * 1000, 'نظام الحماية: سبام');
                            const warnMsg = await message.channel.send(`<@${message.author.id}> تم إسكاتك لمدة 5 دقائق بسبب السبام.`).catch(() => {});
                            setTimeout(() => warnMsg?.delete().catch(() => {}), 5000);
                        } catch (err) {
                            logger.error('فشل في إسكات مرتكب السبام:', err);
                        }
                    } else if (punishment === 'kick' && message.guild.members.me.permissions.has('KickMembers')) {
                        try {
                            await message.member.kick('نظام الحماية: سبام');
                            const warnMsg = await message.channel.send(`<@${message.author.id}> تم طردك بسبب السبام.`).catch(() => {});
                            setTimeout(() => warnMsg?.delete().catch(() => {}), 5000);
                        } catch (err) {
                            logger.error('فشل في طرد مرتكب السبام:', err);
                        }
                    } else if (punishment === 'ban' && message.guild.members.me.permissions.has('BanMembers')) {
                        try {
                            await message.member.ban({ reason: 'نظام الحماية: سبام' });
                            const warnMsg = await message.channel.send(`<@${message.author.id}> تم حظرك بسبب السبام.`).catch(() => {});
                            setTimeout(() => warnMsg?.delete().catch(() => {}), 5000);
                        } catch (err) {
                            logger.error('فشل في حظر مرتكب السبام:', err);
                        }
                    }

                    // تسجيل في قناة السجلات
                    const logChannelId = config?.mod?.logChannelId;
                    if (logChannelId) {
                        const logChannel = message.guild.channels.cache.get(logChannelId);
                        if (logChannel) {
                            const embed = new EmbedBuilder()
                                .setColor('#FFA500')
                                .setTitle('🚨 تم تفعيل الحماية من السبام')
                                .setDescription(`**العضو:** ${message.author}\n**القناة:** ${message.channel}\n**عدد الرسائل:** ${userSpam.count}\n**الإجراء:** ${punishment}`)
                                .setTimestamp();
                            logChannel.send({ embeds: [embed] }).catch(() => {});
                        }
                    }

                    // تسجيل في Activity Log
                    if (config?.activityLog?.enabled !== false) {
                        try {
                            const AuditLog = require('../database/schemas/auditLogSchema');
                            await AuditLog.create({
                                guildId: message.guild.id,
                                action: 'anti_spam',
                                executorId: message.author.id,
                                targetId: message.author.id,
                                reason: `سبام: ${userSpam.count} رسائل في ${interval}ms`,
                                timestamp: new Date()
                            });
                        } catch (e) {}
                    }

                    guildSpam.delete(message.author.id);
                }
            }
        }

        // ─── 5. مكافحة الشتائم ───
        if (prot?.antiSwear?.enabled) {
            const swearWords = [...DEFAULT_SWEAR_WORDS, ...(prot.antiSwear.customWords || [])];
            const lowerContent = message.content.toLowerCase();
            const foundSwear = swearWords.find(word => {
                const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const regex = new RegExp(`(?:^|\\s|\\p{P})${escapedWord}(?:$|\\s|\\p{P})`, 'giu');
                return regex.test(lowerContent);
            });

            if (foundSwear) {
                await message.delete().catch(() => {});
                const warning = await message.channel.send(`<@${message.author.id}>, يرجى مراعاة الآداب وعدم استخدام الشتائم!`).catch(() => {});
                setTimeout(() => warning?.delete().catch(() => {}), 5000);

                try {
                    const dmEmbed = new EmbedBuilder()
                        .setColor('#FF0000')
                        .setTitle('⚠️ تم حذف رسالة بسبب الشتائم')
                        .setDescription(`يرجى الالتزام بالقوانين وعدم استخدام لغة غير لائقة في **${message.guild.name}**.`)
                        .setTimestamp();
                    await message.author.send({ embeds: [dmEmbed] }).catch(() => { logger.debug('Could not send DM to user (DMs closed or bot blocked)'); });
                } catch (e) {}

                return;
            }
        }

        // ─── 6. مكافحة كثرة المنشن ───
        if (prot?.antiMention?.enabled) {
            const mentionsCount = message.mentions.users.size + message.mentions.roles.size;
            if (mentionsCount >= prot.antiMention.maxMentions) {
                await message.delete().catch(() => {});
                const action = prot.antiMention.action || 'timeout';
                const reason = `حماية المنشن المفرط: ${mentionsCount} منشن`;

                try {
                    const warning = await message.channel.send(`<@${message.author.id}>, يرجى عدم استخدام المنشن بكثرة!`).catch(() => {});
                    setTimeout(() => warning?.delete().catch(() => {}), 5000);

                    if (action === 'timeout' && message.guild.members.me.permissions.has('ModerateMembers')) {
                        await message.member.timeout(5 * 60 * 1000, reason);
                    } else if (action === 'kick' && message.guild.members.me.permissions.has('KickMembers')) {
                        await message.member.kick(reason);
                    } else if (action === 'ban' && message.guild.members.me.permissions.has('BanMembers')) {
                        await message.member.ban({ reason });
                    }

                    // سجل في قناة السجلات
                    const logChannelId = config?.mod?.logChannelId;
                    if (logChannelId) {
                        const logChannel = message.guild.channels.cache.get(logChannelId);
                        if (logChannel) {
                            const embed = new EmbedBuilder()
                                .setColor('#FFA500')
                                .setTitle('🚨 تم تفعيل الحماية من كثرة المنشن')
                                .setDescription(`**العضو:** ${message.author}\n**عدد المنشن:** ${mentionsCount}\n**الإجراء:** ${action}`)
                                .setTimestamp();
                            logChannel.send({ embeds: [embed] }).catch(() => {});
                        }
                    }
                } catch (err) {
                    logger.error('فشل في تنفيذ عقوبة المنشن المفرط:', err);
                }
                return;
            }
        }

        // ─── 7. الرد التلقائي (Auto Responder) ───
        if (isDatabaseConnected()) {
            try {
                const responders = await AutoResponder.find({ guildId: message.guild.id });
                const content = message.content.toLowerCase();
                
                for (const responder of responders) {
                    const trigger = responder.trigger.toLowerCase();
                    if (responder.exact) {
                        if (content === trigger) {
                            return message.reply(responder.response);
                        }
                    } else {
                        // استخدام includes() البسيط بدلاً من RegExp لمنع هجمات ReDoS
                        if (content.includes(trigger)) {
                            return message.reply(responder.response);
                        }
                    }
                }
            } catch (error) {
                // تجاهل أخطاء الرد التلقائي
            }
        }
    },
};
