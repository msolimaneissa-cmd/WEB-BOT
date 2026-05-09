/**
 * @file src/events/advancedLogging.js
 * @description نظام السجلات المتقدم لبوت Family Legends.
 * يراقب أحداث السيرفر (حذف/تعديل الرسائل، القنوات، الأدوار، الحظر، تحديثات الأعضاء)
 * ويرسل تقرير مفصل إلى قناة السجلات مع حفظها في قاعدة البيانات.
 * يدعم أيضاً التخزين المؤقت للرسائل المحذوفة/المعدلة لأوامر snipe و editsnipe.
 */

const { EmbedBuilder, AuditLogEvent, ChannelType, PermissionsBitField, Collection } = require('discord.js');
const ServerConfig = require('../database/schemas/serverConfigSchema');
const AuditLog = require('../database/schemas/auditLogSchema');
const { emitToDashboard } = require('../utils/socketManager');
const logger = require('../utils/logger');
const { config } = require('../config');

// ═══════════════════════════════════════════════════════════════════════════
//  ذاكرة تخزين مؤقت للرسائل (لأوامر snipe / editsnipe)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * آخر رسالة محذوفة لكل قناة
 * @type {Collection<string, { content: string, author: { id: string, tag: string, avatarURL: string }, channelId: string, timestamp: Date, attachments: string[] }>}
 */
const deletedMessagesCache = new Collection();

/**
 * آخر رسالة معدلة لكل قناة
 * @type {Collection<string, { content: string, newContent: string, author: { id: string, tag: string, avatarURL: string }, channelId: string, timestamp: Date }>}
 */
const editedMessagesCache = new Collection();

// ═══════════════════════════════════════════════════════════════════════════
//  ألوان الأحداث
// ═══════════════════════════════════════════════════════════════════════════

const EVENT_COLORS = {
    messageDelete: 0xED4245,      // أحمر - حذف
    messageUpdate: 0xFEE75C,      // أصفر - تعديل
    channelCreate: 0x57F287,      // أخضر - إنشاء
    channelDelete: 0xED4245,      // أحمر - حذف
    channelUpdate: 0xFEE75C,      // أصفر - تعديل
    roleCreate: 0x57F287,         // أخضر - إنشاء
    roleDelete: 0xED4245,         // أحمر - حذف
    roleUpdate: 0xFEE75C,         // أصفر - تعديل
    guildBanAdd: 0xED4245,        // أحمر - حظر
    guildBanRemove: 0x57F287,     // أخضر - إزالة حظر
    guildMemberUpdate: 0xFEE75C,  // أصفر - تحديث عضو
};

// ═══════════════════════════════════════════════════════════════════════════
//  أيقونات الأحداث
// ═══════════════════════════════════════════════════════════════════════════

const EVENT_ICONS = {
    messageDelete: '🗑️',
    messageUpdate: '✏️',
    channelCreate: '📢',
    channelDelete: '🔇',
    channelUpdate: '🔧',
    roleCreate: '🆕',
    roleDelete: '💔',
    roleUpdate: '🔄',
    guildBanAdd: '🔨',
    guildBanRemove: '✅',
    guildMemberUpdate: '👤',
};

// ═══════════════════════════════════════════════════════════════════════════
//  دوال مساعدة
// ═══════════════════════════════════════════════════════════════════════════

/**
 * اقتطاع النص إذا كان طويلاً جداً
 * @param {string} text - النص المراد اقتطاعه
 * @param {number} [maxLen=1024] - الحد الأقصى للطول
 * @returns {string}
 */
function truncate(text, maxLen = 1024) {
    if (!text) return '*لا يوجد محتوى*';
    if (text.length <= maxLen) return text;
    return text.slice(0, maxLen - 3) + '...';
}

/**
 * تحويل نوع القناة إلى نص عربي
 * @param {ChannelType} type
 * @returns {string}
 */
function channelTypeLabel(type) {
    const labels = {
        [ChannelType.GuildText]: 'نصية',
        [ChannelType.GuildVoice]: 'صوتية',
        [ChannelType.GuildCategory]: 'تصنيف',
        [ChannelType.GuildAnnouncement]: 'إعلانات',
        [ChannelType.GuildStageVoice]: 'مسرح',
        [ChannelType.GuildForum]: 'منتدى',
        [ChannelType.PublicThread]: 'محادثة فرعية عامة',
        [ChannelType.PrivateThread]: 'محادثة فرعية خاصة',
    };
    return labels[type] || `نوع #${type}`;
}

/**
 * الحصول على إعدادات السجلات للسيرفر
 * @param {string} guildId
 * @returns {Promise<{ enabled: boolean, channelId: string|null, events: Object }|null>}
 */
async function getLoggingConfig(guildId) {
    try {
        const config = await ServerConfig.get();
        if (!config) return null;
        return config.logging || null;
    } catch (error) {
        logger.error(`خطأ في جلب إعدادات السجلات للسيرفر ${guildId}:`, error.message);
        return null;
    }
}

/**
 * التحقق من تفعيل حدث معين في إعدادات السجلات
 * @param {Object|null} loggingConfig
 * @param {string} eventType
 * @returns {boolean}
 */
function isEventEnabled(loggingConfig, eventType) {
    if (!loggingConfig) return false;
    if (!loggingConfig.enabled) return false;
    if (!loggingConfig.channelId) return false;
    const eventSetting = loggingConfig.events?.[eventType];
    return eventSetting === true;
}

/**
 * إرسالEmbed إلى قناة السجلات وحفظها في قاعدة البيانات
 * @param {import('discord.js').Guild} guild
 * @param {string} logChannelId
 * @param {EmbedBuilder} embed
 * @param {string} eventType
 * @param {Object} auditData - بيانات سجل المراجعة
 * @returns {Promise<void>}
 */
async function sendLogAndSave(guild, logChannelId, embed, eventType, auditData) {
    try {
        const logChannel = guild.channels.cache.get(logChannelId);
        if (logChannel && logChannel.isTextBased()) {
            await logChannel.send({ embeds: [embed] }).catch(() => {});
        }
    } catch (error) {
        logger.debug(`لا يمكن إرسال السجل إلى القناة ${logChannelId}:`, error.message);
    }

    // حفظ في قاعدة البيانات
    try {
        const logEntry = await AuditLog.logEvent({
            guildId: guild.id,
            eventType,
            executorId: auditData.executorId || null,
            executorTag: auditData.executorTag || null,
            targetId: auditData.targetId || null,
            targetTag: auditData.targetTag || null,
            channelId: auditData.channelId || null,
            reason: auditData.reason || null,
            metadata: auditData.metadata || {},
        });

        // إرسال تحديث فوري للوحة التحكم
        emitToDashboard('new_audit_log', logEntry);
    } catch (error) {
        logger.debug(`خطأ في حفظ سجل المراجعة:`, error.message);
    }
}

/**
 * الحصول على معلومات المنفذ من سجل مراجعة ديسكورد
 * @param {import('discord.js').Guild} guild
 * @param {AuditLogEvent} auditType
 * @param {Function} [filterFn] - دالة تصفية إضافية
 * @param {number} [lookbackMs=5000] - مدة البحث بالمللي ثانية
 * @returns {Promise<{ executorId: string, executorTag: string, reason: string }|null>}
 */
async function fetchExecutor(guild, auditType, filterFn, lookbackMs = 5000) {
    try {
        const fetchedLogs = await guild.fetchAuditLogs({
            type: auditType,
            limit: 5,
        });

        const auditEntry = fetchedLogs.entries.find((entry) => {
            if (filterFn) return filterFn(entry);
            return Date.now() - entry.createdTimestamp < lookbackMs;
        });

        if (auditEntry) {
            return {
                executorId: auditEntry.executorId,
                executorTag: auditEntry.executor ? `${auditEntry.executor.username}#${auditEntry.executor.discriminator}` : 'غير معروف',
                reason: auditEntry.reason || null,
            };
        }
    } catch (error) {
        logger.debug(`خطأ في جلب سجل المراجعة:`, error.message);
    }
    return null;
}

// ═══════════════════════════════════════════════════════════════════════════
//  وظائف عامة للتصدير (snipe / editsnipe)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * الحصول على آخر رسالة محذوفة في قناة معينة
 * @param {string} channelId
 * @returns {Object|null}
 */
function getLastDeleted(channelId) {
    return deletedMessagesCache.get(channelId) || null;
}

/**
 * الحصول على آخر رسالة معدلة في قناة معينة
 * @param {string} channelId
 * @returns {Object|null}
 */
function getLastEdited(channelId) {
    return editedMessagesCache.get(channelId) || null;
}

// ═══════════════════════════════════════════════════════════════════════════
//  معالجات الأحداث
// ═══════════════════════════════════════════════════════════════════════════

/**
 * تسجيل الرسائل المحتمل حذفها (لتخزين محتواها قبل الحذف)
 * @param {import('discord.js').Message} message
 */
function cacheMessageContent(message) {
    if (message.author.bot || !message.guild || !message.content) return;
    deletedMessagesCache.set(message.channel.id, {
        content: message.content,
        author: {
            id: message.author.id,
            tag: message.author.tag,
            avatarURL: message.author.displayAvatarURL({ dynamic: true }),
        },
        channelId: message.channel.id,
        timestamp: new Date(),
        attachments: message.attachments?.map(a => a.url) || [],
    });
}

// ─── 1. messageDelete ────────────────────────────────────────────────────

async function handleMessageDelete(message) {
    if (!message.guild || message.guild.id !== config.mainGuildId) return;
    if (message.author?.bot) return;

    const logConfig = await getLoggingConfig(message.guild.id);
    if (!isEventEnabled(logConfig, 'messageDelete')) return;

    // معالجة الرسائل الجزئية (partial)
    let content = message.content;
    let author = message.author;
    let authorTag = message.author?.tag || 'غير معروف';
    let authorAvatar = message.author?.displayAvatarURL({ dynamic: true }) || null;
    let attachmentURLs = [];

    if (message.partial) {
        try {
            await message.fetch();
            content = message.content;
            author = message.author;
            authorTag = message.author.tag;
            authorAvatar = message.author.displayAvatarURL({ dynamic: true });
            attachmentURLs = message.attachments?.map(a => a.url) || [];
        } catch (error) {
            content = '*رسالة جزئية - لا يمكن جلب المحتوى*';
            authorTag = 'غير معروف';
            authorAvatar = null;
        }
    } else {
        attachmentURLs = message.attachments?.map(a => a.url) || [];
    }

    // الحصول على المنفذ من سجل المراجعة
    const executor = await fetchExecutor(
        message.guild,
        AuditLogEvent.MessageDelete,
        (entry) => entry.targetId === message.author?.id && Date.now() - entry.createdTimestamp < 5000
    );

    // بناء الEmbed
    const embed = new EmbedBuilder()
        .setColor(EVENT_COLORS.messageDelete)
        .setTitle(`${EVENT_ICONS.messageDelete} تم حذف رسالة`)
        .setTimestamp()
        .setFooter({ text: `معرف الرسالة: ${message.id}` });

    if (authorAvatar) {
        embed.setAuthor({ name: authorTag, iconURL: authorAvatar });
    }

    embed.addFields(
        { name: '**المؤلف**', value: `${authorTag} (${message.author?.id || 'غير معروف'})`, inline: true },
        { name: '**القناة**', value: `${message.channel} (\`${message.channel.id}\`)`, inline: true }
    );

    embed.addFields(
        { name: '**المحتوى**', value: truncate(content, 1024) }
    );

    if (attachmentURLs.length > 0) {
        embed.addFields({
            name: `**المرفقات (${attachmentURLs.length})**`,
            value: attachmentURLs.slice(0, 3).join('\n') + (attachmentURLs.length > 3 ? `\n... و ${attachmentURLs.length - 3} أخرى` : ''),
        });
        if (attachmentURLs[0] && attachmentURLs.length === 1) {
            embed.setImage(attachmentURLs[0]);
        }
    }

    if (executor) {
        embed.addFields({ name: '**حُذفت بواسطة**', value: `${executor.executorTag} (\`${executor.executorId}\`)`, inline: true });
        if (executor.reason) {
            embed.addFields({ name: '**السبب**', value: truncate(executor.reason, 512) });
        }
    }

    await sendLogAndSave(message.guild, logConfig.channelId, embed, 'messageDelete', {
        executorId: executor?.executorId,
        executorTag: executor?.executorTag,
        targetId: message.author?.id,
        targetTag: authorTag,
        channelId: message.channel.id,
        reason: executor?.reason,
        metadata: {
            messageId: message.id,
            content: truncate(content, 2000),
            attachments: attachmentURLs,
        },
    });
}

// ─── 2. messageUpdate ────────────────────────────────────────────────────

async function handleMessageUpdate(oldMessage, newMessage) {
    if (!newMessage.guild || newMessage.guild.id !== config.mainGuildId) return;
    if (newMessage.author?.bot) return;

    // تجاهل التعديلات التي لا تغير المحتوى (مثل التضمينات)
    if (oldMessage.content === newMessage.content) return;

    const logConfig = await getLoggingConfig(newMessage.guild.id);
    if (!isEventEnabled(logConfig, 'messageUpdate')) return;

    // معالجة الرسائل الجزئية
    let oldContent = oldMessage.content;
    let newContent = newMessage.content;
    let authorTag = newMessage.author?.tag || 'غير معروف';
    let authorAvatar = newMessage.author?.displayAvatarURL({ dynamic: true }) || null;

    if (oldMessage.partial) {
        try {
            await oldMessage.fetch();
            oldContent = oldMessage.content;
        } catch (error) {
            oldContent = '*رسالة جزئية - لا يمكن جلب المحتوى القديم*';
        }
    }

    if (newMessage.partial) {
        try {
            await newMessage.fetch();
            newContent = newMessage.content;
        } catch (error) {
            newContent = '*رسالة جزئية - لا يمكن جلب المحتوى الجديد*';
        }
    }

    // تخزين في الذاكرة المؤقتة لأمر editsnipe
    editedMessagesCache.set(newMessage.channel.id, {
        content: oldContent || '*فارغ*',
        newContent: newContent || '*فارغ*',
        author: {
            id: newMessage.author?.id,
            tag: authorTag,
            avatarURL: authorAvatar,
        },
        channelId: newMessage.channel.id,
        timestamp: new Date(),
    });

    // بناء الEmbed
    const embed = new EmbedBuilder()
        .setColor(EVENT_COLORS.messageUpdate)
        .setTitle(`${EVENT_ICONS.messageUpdate} تم تعديل رسالة`)
        .setTimestamp()
        .setFooter({ text: `معرف الرسالة: ${newMessage.id}` });

    if (authorAvatar) {
        embed.setAuthor({ name: authorTag, iconURL: authorAvatar });
    }

    embed.addFields(
        { name: '**المؤلف**', value: `${authorTag} (\`${newMessage.author?.id || 'غير معروف'}\`)`, inline: true },
        { name: '**القناة**', value: `${newMessage.channel} (\`${newMessage.channel.id}\`)`, inline: true }
    );

    embed.addFields(
        { name: '**المحتوى القديم**', value: truncate(oldContent || '*فارغ*', 1024) },
        { name: '**المحتوى الجديد**', value: truncate(newContent || '*فارغ*', 1024) }
    );

    // رابط القفز للرسالة
    embed.addFields({
        name: '**رابط**',
        value: `[انتقل إلى الرسالة](https://discord.com/channels/${newMessage.guild.id}/${newMessage.channel.id}/${newMessage.id})`,
    });

    await sendLogAndSave(newMessage.guild, logConfig.channelId, embed, 'messageUpdate', {
        executorId: newMessage.author?.id,
        executorTag: authorTag,
        targetId: newMessage.author?.id,
        targetTag: authorTag,
        channelId: newMessage.channel.id,
        metadata: {
            messageId: newMessage.id,
            oldContent: truncate(oldContent, 2000),
            newContent: truncate(newContent, 2000),
        },
    });
}

// ─── 3. channelCreate ────────────────────────────────────────────────────

async function handleChannelCreate(channel) {
    if (!channel.guild || channel.guild.id !== config.mainGuildId) return;

    const logConfig = await getLoggingConfig(channel.guild.id);
    if (!isEventEnabled(logConfig, 'channelCreate')) return;

    const executor = await fetchExecutor(
        channel.guild,
        AuditLogEvent.ChannelCreate,
        (entry) => entry.targetId === channel.id && Date.now() - entry.createdTimestamp < 10000
    );

    const category = channel.parent ? channel.parent.name : 'بدون تصنيف';

    const embed = new EmbedBuilder()
        .setColor(EVENT_COLORS.channelCreate)
        .setTitle(`${EVENT_ICONS.channelCreate} تم إنشاء قناة جديدة`)
        .setTimestamp()
        .addFields(
            { name: '**اسم القناة**', value: `${channel.name}`, inline: true },
            { name: '**المعرف**', value: `\`${channel.id}\``, inline: true },
            { name: '**النوع**', value: channelTypeLabel(channel.type), inline: true },
            { name: '**التصنيف**', value: category, inline: true }
        );

    if (executor) {
        embed.addFields({ name: '**أنشئت بواسطة**', value: `${executor.executorTag} (\`${executor.executorId}\`)`, inline: true });
    }

    await sendLogAndSave(channel.guild, logConfig.channelId, embed, 'channelCreate', {
        executorId: executor?.executorId,
        executorTag: executor?.executorTag,
        targetId: channel.id,
        targetTag: channel.name,
        channelId: channel.id,
        reason: executor?.reason,
        metadata: {
            channelName: channel.name,
            channelType: channel.type,
            categoryName: category,
        },
    });
}

// ─── 4. channelDelete ────────────────────────────────────────────────────

async function handleChannelDelete(channel) {
    if (!channel.guild || channel.guild.id !== config.mainGuildId) return;

    const logConfig = await getLoggingConfig(channel.guild.id);
    if (!isEventEnabled(logConfig, 'channelDelete')) return;

    const executor = await fetchExecutor(
        channel.guild,
        AuditLogEvent.ChannelDelete,
        (entry) => entry.targetId === channel.id && Date.now() - entry.createdTimestamp < 10000
    );

    const category = channel.parent ? channel.parent.name : 'بدون تصنيف';

    const embed = new EmbedBuilder()
        .setColor(EVENT_COLORS.channelDelete)
        .setTitle(`${EVENT_ICONS.channelDelete} تم حذف قناة`)
        .setTimestamp()
        .addFields(
            { name: '**اسم القناة**', value: channel.name || '*غير معروف*', inline: true },
            { name: '**المعرف**', value: `\`${channel.id}\``, inline: true },
            { name: '**النوع**', value: channelTypeLabel(channel.type), inline: true },
            { name: '**التصنيف**', value: category, inline: true }
        );

    if (executor) {
        embed.addFields({ name: '**حُذفت بواسطة**', value: `${executor.executorTag} (\`${executor.executorId}\`)`, inline: true });
        if (executor.reason) {
            embed.addFields({ name: '**السبب**', value: truncate(executor.reason, 512) });
        }
    }

    await sendLogAndSave(channel.guild, logConfig.channelId, embed, 'channelDelete', {
        executorId: executor?.executorId,
        executorTag: executor?.executorTag,
        targetId: channel.id,
        targetTag: channel.name,
        reason: executor?.reason,
        metadata: {
            channelName: channel.name,
            channelType: channel.type,
            categoryName: category,
        },
    });
}

// ─── 5. channelUpdate ────────────────────────────────────────────────────

async function handleChannelUpdate(oldChannel, newChannel) {
    if (!newChannel.guild || newChannel.guild.id !== config.mainGuildId) return;

    // التحقق من وجود تغييرات فعلية
    if (oldChannel.name === newChannel.name
        && oldChannel.topic === newChannel.topic
        && oldChannel.parentId === newChannel.parentId
        && oldChannel.nsfw === newChannel.nsfw
        && oldChannel.rateLimitPerUser === newChannel.rateLimitPerUser
        && oldChannel.bitrate === newChannel.bitrate
        && oldChannel.userLimit === newChannel.userLimit) {
        return;
    }

    const logConfig = await getLoggingConfig(newChannel.guild.id);
    if (!isEventEnabled(logConfig, 'channelUpdate')) return;

    const executor = await fetchExecutor(
        newChannel.guild,
        AuditLogEvent.ChannelUpdate,
        (entry) => entry.targetId === newChannel.id && Date.now() - entry.createdTimestamp < 10000
    );

    const changes = [];

    if (oldChannel.name !== newChannel.name) {
        changes.push(`**الاسم:** \`${oldChannel.name}\` ← \`${newChannel.name}\``);
    }

    if (oldChannel.topic !== newChannel.topic) {
        changes.push(`**الموضوع:** ${truncate(oldChannel.topic || '*بدون موضوع*', 200)} ← ${truncate(newChannel.topic || '*بدون موضوع*', 200)}`);
    }

    if (oldChannel.parentId !== newChannel.parentId) {
        const oldParent = oldChannel.parent ? oldChannel.parent.name : 'بدون تصنيف';
        const newParent = newChannel.parent ? newChannel.parent.name : 'بدون تصنيف';
        changes.push(`**التصنيف:** \`${oldParent}\` ← \`${newParent}\``);
    }

    if (oldChannel.nsfw !== newChannel.nsfw) {
        changes.push(`**NSFW:** ${oldChannel.nsfw ? 'مفعّل' : 'معطّل'} ← ${newChannel.nsfw ? 'مفعّل' : 'معطّل'}`);
    }

    if (oldChannel.rateLimitPerUser !== newChannel.rateLimitPerUser) {
        changes.push(`**بطء الوضع:** ${oldChannel.rateLimitPerUser || 0}ث ← ${newChannel.rateLimitPerUser || 0}ث`);
    }

    if (oldChannel.userLimit !== newChannel.userLimit) {
        const oldLimit = oldChannel.userLimit === 0 ? '∞' : oldChannel.userLimit;
        const newLimit = newChannel.userLimit === 0 ? '∞' : newChannel.userLimit;
        changes.push(`**حد المستخدمين:** ${oldLimit} ← ${newLimit}`);
    }

    if (oldChannel.bitrate !== newChannel.bitrate) {
        changes.push(`**جودة الصوت:** ${oldChannel.bitrate / 1000}kbps ← ${newChannel.bitrate / 1000}kbps`);
    }

    const embed = new EmbedBuilder()
        .setColor(EVENT_COLORS.channelUpdate)
        .setTitle(`${EVENT_ICONS.channelUpdate} تم تحديث قناة`)
        .setTimestamp()
        .addFields(
            { name: '**القناة**', value: `${newChannel} (\`${newChannel.id}\`)`, inline: true },
            { name: '**النوع**', value: channelTypeLabel(newChannel.type), inline: true }
        )
        .addFields({ name: '**التغييرات**', value: changes.join('\n') });

    if (executor) {
        embed.addFields({ name: '**حُدثت بواسطة**', value: `${executor.executorTag} (\`${executor.executorId}\`)`, inline: true });
        if (executor.reason) {
            embed.addFields({ name: '**السبب**', value: truncate(executor.reason, 512) });
        }
    }

    await sendLogAndSave(newChannel.guild, logConfig.channelId, embed, 'channelUpdate', {
        executorId: executor?.executorId,
        executorTag: executor?.executorTag,
        targetId: newChannel.id,
        targetTag: newChannel.name,
        reason: executor?.reason,
        metadata: {
            channelName: newChannel.name,
            channelType: newChannel.type,
            changes: changes,
        },
    });
}

// ─── 6. roleCreate ───────────────────────────────────────────────────────

async function handleRoleCreate(role) {
    if (!role.guild || role.guild.id !== config.mainGuildId) return;

    const logConfig = await getLoggingConfig(role.guild.id);
    if (!isEventEnabled(logConfig, 'roleCreate')) return;

    const executor = await fetchExecutor(
        role.guild,
        AuditLogEvent.RoleCreate,
        (entry) => entry.targetId === role.id && Date.now() - entry.createdTimestamp < 10000
    );

    const colorHex = role.hexColor || '#000000';
    const permissions = role.permissions.toArray();

    const embed = new EmbedBuilder()
        .setColor(EVENT_COLORS.roleCreate)
        .setTitle(`${EVENT_ICONS.roleCreate} تم إنشاء دور جديد`)
        .setTimestamp()
        .addFields(
            { name: '**اسم الدور**', value: role.name || '*بدون اسم*', inline: true },
            { name: '**المعرف**', value: `\`${role.id}\``, inline: true },
            { name: '**اللون**', value: `${colorHex}`, inline: true },
            { name: '**الموضع**', value: `${role.position}`, inline: true },
            { name: '**يُعرض بشكل منفصل**', value: role.hoist ? 'نعم' : 'لا', inline: true },
            { name: '**يمكن الإشارة**', value: role.mentionable ? 'نعم' : 'لا', inline: true }
        );

    if (permissions.length > 0) {
        const permsList = permissions.slice(0, 10).map(p => `\`${p}\``).join(', ');
        embed.addFields({
            name: `**الصلاحيات (${permissions.length})**`,
            value: permsList + (permissions.length > 10 ? ` ... و ${permissions.length - 10} أخرى` : ''),
        });
    }

    if (executor) {
        embed.addFields({ name: '**أُنشئ بواسطة**', value: `${executor.executorTag} (\`${executor.executorId}\`)`, inline: true });
    }

    await sendLogAndSave(role.guild, logConfig.channelId, embed, 'roleCreate', {
        executorId: executor?.executorId,
        executorTag: executor?.executorTag,
        targetId: role.id,
        targetTag: role.name,
        metadata: {
            roleName: role.name,
            roleColor: colorHex,
            rolePosition: role.position,
            hoist: role.hoist,
            mentionable: role.mentionable,
            permissions: permissions,
        },
    });
}

// ─── 7. roleDelete ───────────────────────────────────────────────────────

async function handleRoleDelete(role) {
    if (!role.guild || role.guild.id !== config.mainGuildId) return;

    const logConfig = await getLoggingConfig(role.guild.id);
    if (!isEventEnabled(logConfig, 'roleDelete')) return;

    const executor = await fetchExecutor(
        role.guild,
        AuditLogEvent.RoleDelete,
        (entry) => entry.targetId === role.id && Date.now() - entry.createdTimestamp < 10000
    );

    const embed = new EmbedBuilder()
        .setColor(EVENT_COLORS.roleDelete)
        .setTitle(`${EVENT_ICONS.roleDelete} تم حذف دور`)
        .setTimestamp()
        .addFields(
            { name: '**اسم الدور**', value: role.name || '*بدون اسم*', inline: true },
            { name: '**المعرف**', value: `\`${role.id}\``, inline: true },
            { name: '**اللون**', value: role.hexColor || '#000000', inline: true },
            { name: '**الموضع**', value: `${role.position}`, inline: true }
        );

    if (executor) {
        embed.addFields({ name: '**حُذف بواسطة**', value: `${executor.executorTag} (\`${executor.executorId}\`)`, inline: true });
        if (executor.reason) {
            embed.addFields({ name: '**السبب**', value: truncate(executor.reason, 512) });
        }
    }

    await sendLogAndSave(role.guild, logConfig.channelId, embed, 'roleDelete', {
        executorId: executor?.executorId,
        executorTag: executor?.executorTag,
        targetId: role.id,
        targetTag: role.name,
        reason: executor?.reason,
        metadata: {
            roleName: role.name,
            roleColor: role.hexColor,
            rolePosition: role.position,
        },
    });
}

// ─── 8. roleUpdate ───────────────────────────────────────────────────────

async function handleRoleUpdate(oldRole, newRole) {
    if (!newRole.guild || newRole.guild.id !== config.mainGuildId) return;

    // التحقق من وجود تغييرات فعلية
    if (oldRole.name === newRole.name
        && oldRole.hexColor === newRole.hexColor
        && oldRole.hoist === newRole.hoist
        && oldRole.mentionable === newRole.mentionable
        && oldRole.position === newRole.position
        && oldRole.permissions.bitfield === newRole.permissions.bitfield) {
        return;
    }

    const logConfig = await getLoggingConfig(newRole.guild.id);
    if (!isEventEnabled(logConfig, 'roleUpdate')) return;

    const executor = await fetchExecutor(
        newRole.guild,
        AuditLogEvent.RoleUpdate,
        (entry) => entry.targetId === newRole.id && Date.now() - entry.createdTimestamp < 10000
    );

    const changes = [];

    if (oldRole.name !== newRole.name) {
        changes.push(`**الاسم:** \`${oldRole.name}\` ← \`${newRole.name}\``);
    }

    if (oldRole.hexColor !== newRole.hexColor) {
        changes.push(`**اللون:** \`${oldRole.hexColor}\` ← \`${newRole.hexColor}\``);
    }

    if (oldRole.hoist !== newRole.hoist) {
        changes.push(`**عرض منفصل:** ${oldRole.hoist ? 'نعم' : 'لا'} ← ${newRole.hoist ? 'نعم' : 'لا'}`);
    }

    if (oldRole.mentionable !== newRole.mentionable) {
        changes.push(`**يمكن الإشارة:** ${oldRole.mentionable ? 'نعم' : 'لا'} ← ${newRole.mentionable ? 'نعم' : 'لا'}`);
    }

    if (oldRole.position !== newRole.position) {
        changes.push(`**الموضع:** ${oldRole.position} ← ${newRole.position}`);
    }

    // مقارنة الصلاحيات
    const oldPerms = oldRole.permissions.toArray();
    const newPerms = newRole.permissions.toArray();
    const addedPerms = newPerms.filter(p => !oldPerms.includes(p));
    const removedPerms = oldPerms.filter(p => !newPerms.includes(p));

    if (addedPerms.length > 0) {
        changes.push(`**صلاحيات مضافة (+):** ${addedPerms.map(p => `\`${p}\``).join(', ')}`);
    }

    if (removedPerms.length > 0) {
        changes.push(`**صلاحيات محذوفة (-):** ${removedPerms.map(p => `\`${p}\``).join(', ')}`);
    }

    const embed = new EmbedBuilder()
        .setColor(EVENT_COLORS.roleUpdate)
        .setTitle(`${EVENT_ICONS.roleUpdate} تم تحديث دور`)
        .setTimestamp()
        .addFields(
            { name: '**الدور**', value: `${newRole} (\`${newRole.id}\`)`, inline: true },
            { name: '**اللون الجديد**', value: newRole.hexColor || '#000000', inline: true }
        )
        .addFields({ name: '**التغييرات**', value: changes.join('\n') });

    if (executor) {
        embed.addFields({ name: '**حُدث بواسطة**', value: `${executor.executorTag} (\`${executor.executorId}\`)`, inline: true });
        if (executor.reason) {
            embed.addFields({ name: '**السبب**', value: truncate(executor.reason, 512) });
        }
    }

    await sendLogAndSave(newRole.guild, logConfig.channelId, embed, 'roleUpdate', {
        executorId: executor?.executorId,
        executorTag: executor?.executorTag,
        targetId: newRole.id,
        targetTag: newRole.name,
        reason: executor?.reason,
        metadata: {
            roleName: newRole.name,
            roleColor: newRole.hexColor,
            changes: changes,
            addedPermissions: addedPerms,
            removedPermissions: removedPerms,
        },
    });
}

// ─── 9. guildBanAdd ─────────────────────────────────────────────────────

async function handleGuildBanAdd(ban) {
    if (!ban.guild || ban.guild.id !== config.mainGuildId) return;

    const logConfig = await getLoggingConfig(ban.guild.id);
    if (!isEventEnabled(logConfig, 'guildBanAdd')) return;

    const executor = await fetchExecutor(
        ban.guild,
        AuditLogEvent.MemberBanAdd,
        (entry) => {
            // محاولة مطابقة المستخدم المحظور
            try {
                return entry.target?.id === ban.user.id && Date.now() - entry.createdTimestamp < 10000;
            } catch {
                return Date.now() - entry.createdTimestamp < 5000;
            }
        }
    );

    const embed = new EmbedBuilder()
        .setColor(EVENT_COLORS.guildBanAdd)
        .setTitle(`${EVENT_ICONS.guildBanAdd} تم حظر عضو`)
        .setTimestamp()
        .setThumbnail(ban.user.displayAvatarURL({ dynamic: true }))
        .addFields(
            { name: '**العضو**', value: `${ban.user.tag} (\`${ban.user.id}\`)`, inline: true },
            { name: '**تم الإنشاء**', value: `<t:${Math.floor(ban.user.createdAt.getTime() / 1000)}:R>`, inline: true }
        );

    if (ban.reason) {
        embed.addFields({ name: '**السبب**', value: truncate(ban.reason, 512) });
    }

    if (executor) {
        embed.addFields({ name: '**حُظر بواسطة**', value: `${executor.executorTag} (\`${executor.executorId}\`)`, inline: true });
    }

    await sendLogAndSave(ban.guild, logConfig.channelId, embed, 'guildBanAdd', {
        executorId: executor?.executorId,
        executorTag: executor?.executorTag,
        targetId: ban.user.id,
        targetTag: ban.user.tag,
        reason: ban.reason || executor?.reason,
        metadata: {
            userTag: ban.user.tag,
            userCreatedAt: ban.user.createdAt,
        },
    });
}

// ─── 10. guildBanRemove ──────────────────────────────────────────────────

async function handleGuildBanRemove(ban) {
    if (!ban.guild || ban.guild.id !== config.mainGuildId) return;

    const logConfig = await getLoggingConfig(ban.guild.id);
    if (!isEventEnabled(logConfig, 'guildBanRemove')) return;

    const executor = await fetchExecutor(
        ban.guild,
        AuditLogEvent.MemberBanRemove,
        (entry) => {
            try {
                return entry.target?.id === ban.user.id && Date.now() - entry.createdTimestamp < 10000;
            } catch {
                return Date.now() - entry.createdTimestamp < 5000;
            }
        }
    );

    const embed = new EmbedBuilder()
        .setColor(EVENT_COLORS.guildBanRemove)
        .setTitle(`${EVENT_ICONS.guildBanRemove} تم إلغاء حظر عضو`)
        .setTimestamp()
        .setThumbnail(ban.user.displayAvatarURL({ dynamic: true }))
        .addFields(
            { name: '**العضو**', value: `${ban.user.tag} (\`${ban.user.id}\`)`, inline: true }
        );

    if (executor) {
        embed.addFields({ name: '**أُلغي الحظر بواسطة**', value: `${executor.executorTag} (\`${executor.executorId}\`)`, inline: true });
        if (executor.reason) {
            embed.addFields({ name: '**السبب**', value: truncate(executor.reason, 512) });
        }
    }

    await sendLogAndSave(ban.guild, logConfig.channelId, embed, 'guildBanRemove', {
        executorId: executor?.executorId,
        executorTag: executor?.executorTag,
        targetId: ban.user.id,
        targetTag: ban.user.tag,
        reason: executor?.reason,
        metadata: {
            userTag: ban.user.tag,
        },
    });
}

// ─── 11. guildMemberUpdate ───────────────────────────────────────────────

async function handleGuildMemberUpdate(oldMember, newMember) {
    if (!newMember.guild || newMember.guild.id !== config.mainGuildId) return;
    // لا نحتاج لتجاهل البوتات هنا لأننا نريد تسجيل تغييرات البوتات أيضاً

    const logConfig = await getLoggingConfig(newMember.guild.id);
    if (!isEventEnabled(logConfig, 'guildMemberUpdate')) return;

    const changes = [];

    // ─── تغيير اللقب (Nickname) ───
    if (oldMember.nickname !== newMember.nickname) {
        const oldNick = oldMember.nickname || '*بدون لقب*';
        const newNick = newMember.nickname || '*بدون لقب*';
        changes.push(`**اللقب:** \`${oldNick}\` ← \`${newNick}\``);
    }

    // ─── إضافة/إزالة أدوار ───
    const oldRoles = oldMember.roles.cache;
    const newRoles = newMember.roles.cache;
    const addedRoles = newRoles.filter(role => !oldRoles.has(role.id));
    const removedRoles = oldRoles.filter(role => !newRoles.has(role.id));

    if (addedRoles.size > 0) {
        const roleList = addedRoles.map(r => `${r} (\`${r.id}\`)`).join(', ');
        changes.push(`**أدوار مضافة (+):** ${roleList}`);
    }

    if (removedRoles.size > 0) {
        const roleList = removedRoles.map(r => `${r} (\`${r.id}\`)`).join(', ');
        changes.push(`**أدوار محذوفة (-):** ${roleList}`);
    }

    // ─── تغيير حالة الإسكات (Timeout) ───
    const wasTimedOut = oldMember.communicationDisabledUntilTimestamp && oldMember.communicationDisabledUntilTimestamp > Date.now();
    const isTimedOut = newMember.communicationDisabledUntilTimestamp && newMember.communicationDisabledUntilTimestamp > Date.now();

    if (!wasTimedOut && isTimedOut) {
        const duration = newMember.communicationDisabledUntilTimestamp - Date.now();
        const durationStr = duration >= 86400000 ? `${Math.floor(duration / 86400000)} يوم`
            : duration >= 3600000 ? `${Math.floor(duration / 3600000)} ساعة`
            : `${Math.floor(duration / 60000)} دقيقة`;
        changes.push(`**⏰ تم إسكات العضو:** ${durationStr}`);
    } else if (wasTimedOut && !isTimedOut) {
        changes.push('**⏰ تم إلغاء الإسكات عن العضو**');
    }

    // ─── تغيير الاسم (Username) ───
    if (oldMember.user.username !== newMember.user.username) {
        changes.push(`**اسم المستخدم:** \`${oldMember.user.username}\` ← \`${newMember.user.username}\``);
    }

    // ─── تغيير الصورة الرمزية (Avatar) ───
    if (oldMember.user.avatar !== newMember.user.avatar) {
        changes.push('**الصورة الرمزية:** تم تغييرها');
    }

    // ─── تغيير الصورة الرمزية للسيرفر (Guild Avatar) ───
    if (oldMember.avatar !== newMember.avatar) {
        changes.push('**صورة السيرفر:** تم تغييرها');
    }

    // تجاهل إذا لم تكن هناك تغييرات ذات معنى
    if (changes.length === 0) return;

    // الحصول على المنفذ من سجل المراجعة (للأدوار والإسكات)
    const executor = await fetchExecutor(
        newMember.guild,
        AuditLogEvent.MemberUpdate,
        (entry) => entry.targetId === newMember.id && Date.now() - entry.createdTimestamp < 10000
    );

    const embed = new EmbedBuilder()
        .setColor(EVENT_COLORS.guildMemberUpdate)
        .setTitle(`${EVENT_ICONS.guildMemberUpdate} تم تحديث عضو`)
        .setTimestamp()
        .setThumbnail(newMember.user.displayAvatarURL({ dynamic: true }))
        .addFields(
            { name: '**العضو**', value: `${newMember.user.tag} (\`${newMember.user.id}\`)`, inline: true }
        )
        .addFields({ name: '**التغييرات**', value: changes.join('\n') });

    if (executor) {
        embed.addFields({ name: '**حُدث بواسطة**', value: `${executor.executorTag} (\`${executor.executorId}\`)`, inline: true });
        if (executor.reason) {
            embed.addFields({ name: '**السبب**', value: truncate(executor.reason, 512) });
        }
    }

    await sendLogAndSave(newMember.guild, logConfig.channelId, embed, 'guildMemberUpdate', {
        executorId: executor?.executorId,
        executorTag: executor?.executorTag,
        targetId: newMember.user.id,
        targetTag: newMember.user.tag,
        reason: executor?.reason,
        metadata: {
            changes: changes,
            addedRoles: addedRoles.map(r => r.id),
            removedRoles: removedRoles.map(r => r.id),
            wasTimedOut,
            isTimedOut,
        },
    });
}

// ═══════════════════════════════════════════════════════════════════════════
//  إعداد نظام السجلات المتقدم
// ═══════════════════════════════════════════════════════════════════════════

/**
 * تسجيل جميع معالجات أحداث السجلات المتقدمة
 * @param {import('discord.js').Client} client - عميل ديسكورد
 */
function setupAdvancedLogging(client) {
    logger.info('📡 جاري تفعيل نظام السجلات المتقدم...');

    // ─── تخزين محتوى الرسائل قبل حذفها ───
    client.on('messageCreate', (message) => {
        cacheMessageContent(message);
    });

    // ─── 1. حذف الرسائل ───
    client.on('messageDelete', async (message) => {
        try {
            await handleMessageDelete(message);
        } catch (error) {
            logger.error('خطأ في معالجة حدث messageDelete:', error);
        }
    });

    // ─── 2. تعديل الرسائل ───
    client.on('messageUpdate', async (oldMessage, newMessage) => {
        try {
            await handleMessageUpdate(oldMessage, newMessage);
        } catch (error) {
            logger.error('خطأ في معالجة حدث messageUpdate:', error);
        }
    });

    // ─── 3. إنشاء قناة ───
    client.on('channelCreate', async (channel) => {
        try {
            await handleChannelCreate(channel);
        } catch (error) {
            logger.error('خطأ في معالجة حدث channelCreate:', error);
        }
    });

    // ─── 4. حذف قناة ───
    client.on('channelDelete', async (channel) => {
        try {
            await handleChannelDelete(channel);
        } catch (error) {
            logger.error('خطأ في معالجة حدث channelDelete:', error);
        }
    });

    // ─── 5. تحديث قناة ───
    client.on('channelUpdate', async (oldChannel, newChannel) => {
        try {
            await handleChannelUpdate(oldChannel, newChannel);
        } catch (error) {
            logger.error('خطأ في معالجة حدث channelUpdate:', error);
        }
    });

    // ─── 6. إنشاء دور ───
    client.on('roleCreate', async (role) => {
        try {
            await handleRoleCreate(role);
        } catch (error) {
            logger.error('خطأ في معالجة حدث roleCreate:', error);
        }
    });

    // ─── 7. حذف دور ───
    client.on('roleDelete', async (role) => {
        try {
            await handleRoleDelete(role);
        } catch (error) {
            logger.error('خطأ في معالجة حدث roleDelete:', error);
        }
    });

    // ─── 8. تحديث دور ───
    client.on('roleUpdate', async (oldRole, newRole) => {
        try {
            await handleRoleUpdate(oldRole, newRole);
        } catch (error) {
            logger.error('خطأ في معالجة حدث roleUpdate:', error);
        }
    });

    // ─── 9. حظر عضو ───
    client.on('guildBanAdd', async (ban) => {
        try {
            await handleGuildBanAdd(ban);
        } catch (error) {
            logger.error('خطأ في معالجة حدث guildBanAdd:', error);
        }
    });

    // ─── 10. إلغاء حظر عضو ───
    client.on('guildBanRemove', async (ban) => {
        try {
            await handleGuildBanRemove(ban);
        } catch (error) {
            logger.error('خطأ في معالجة حدث guildBanRemove:', error);
        }
    });

    // ─── 11. تحديث عضو ───
    client.on('guildMemberUpdate', async (oldMember, newMember) => {
        try {
            await handleGuildMemberUpdate(oldMember, newMember);
        } catch (error) {
            logger.error('خطأ في معالجة حدث guildMemberUpdate:', error);
        }
    });

    logger.success('✅ تم تفعيل نظام السجلات المتقدم بنجاح');
}

// ═══════════════════════════════════════════════════════════════════════════
//  التصدير
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {
    setupAdvancedLogging,
    getLastDeleted,
    getLastEdited,
};
