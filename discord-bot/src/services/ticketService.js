/**
 * @file src/services/ticketService.js
 * @description خدمة إدارة التذاكر المتقدمة - أفضل من Ticket Tool
 * تدعم الفئات، الأولوية، النقل، الإغلاق، الأرشفة، والنسخ الاحتياطي
 */

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits, ThreadAutoArchiveDuration } = require('discord.js');
const Ticket = require('../database/schemas/ticketSchema');
const ServerConfig = require('../database/schemas/serverConfigSchema');
const logger = require('../utils/logger');

// تخزين مؤقت للتذاكر النشطة لمنع التكرار
const activeTickets = new Map();

// تنظيف دوري للتذاكر المغلقة من الذاكرة المؤقتة
setInterval(() => {
    const now = Date.now();
    for (const [key, data] of activeTickets.entries()) {
        if (data.closed && now - data.closedAt > 3600000) { // ساعة واحدة
            activeTickets.delete(key);
        }
    }
}, 1800000);

/**
 * إنشاء تذكرة جديدة
 * @param {Object} options - خيارات التذكرة
 * @param {string} options.guildId - معرف السيرفر
 * @param {string} options.userId - معرف المستخدم
 * @param {string} options.categoryId - معرف الفئة (اختياري)
 * @param {string} options.reason - سبب التذكرة
 * @param {string} options.priority - الأولوية (low, medium, high)
 * @param {import('discord.js').Client} client - عميل Discord
 * @returns {Promise<Object>} - نتيجة إنشاء التذكرة
 */
async function createTicket({ guildId, userId, categoryId, reason, priority = 'medium', client }) {
    try {
        const guild = client.guilds.cache.get(guildId);
        if (!guild) {
            return { success: false, error: 'السيرفر غير موجود' };
        }

        const user = await client.users.fetch(userId);
        
        // التحقق من وجود تذكرة مفتوحة للمستخدم
        const existingTicket = await Ticket.findOne({
            guildId,
            userId,
            closed: false
        });

        if (existingTicket) {
            const channel = guild.channels.cache.get(existingTicket.channelId);
            if (channel) {
                return { 
                    success: false, 
                    error: 'لديك تذكرة مفتوحة بالفعل',
                    channelId: channel.id,
                    channelUrl: channel.url
                };
            } else {
                // القناة محذوفة، تحديث الحالة
                existingTicket.closed = true;
                existingTicket.closedAt = new Date();
                existingTicket.closedReason = 'القناة محذوفة';
                await existingTicket.save();
            }
        }

        // الحصول على إعدادات التذاكر
        const config = await ServerConfig.findOne({ guildId });
        const ticketConfig = config?.ticket || {};
        
        // تحديد الفئة
        let category;
        if (categoryId) {
            category = guild.channels.cache.get(categoryId);
        } else if (ticketConfig.defaultCategory) {
            category = guild.channels.cache.get(ticketConfig.defaultCategory);
        }

        // تحديد اسم القناة
        const ticketNumber = await Ticket.countDocuments({ guildId }) + 1;
        const channelName = `ticket-${user.username.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${ticketNumber}`;

        // تحديد الصلاحيات
        const permissionOverwrites = [
            {
                id: guild.roles.everyone,
                deny: [PermissionFlagsBits.ViewChannel]
            },
            {
                id: userId,
                allow: [
                    PermissionFlagsBits.ViewChannel,
                    PermissionFlagsBits.SendMessages,
                    PermissionFlagsBits.ReadMessageHistory,
                    PermissionFlagsBits.AttachFiles,
                    PermissionFlagsBits.EmbedLinks
                ]
            }
        ];

        // إضافة صلاحيات فريق الدعم
        if (ticketConfig.supportRoles && Array.isArray(ticketConfig.supportRoles)) {
            for (const roleId of ticketConfig.supportRoles) {
                const role = guild.roles.cache.get(roleId);
                if (role) {
                    permissionOverwrites.push({
                        id: roleId,
                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.SendMessages,
                            PermissionFlagsBits.ReadMessageHistory,
                            PermissionFlagsBits.ManageChannels,
                            PermissionFlagsBits.MentionEveryone
                        ]
                    });
                }
            }
        }

        // إنشاء القناة
        const channel = await guild.channels.create({
            name: channelName,
            type: ChannelType.GuildText,
            parent: category?.id,
            permissionOverwrites,
            topic: `تذكرة دعم لـ ${user.tag} | ${reason || 'بدون سبب'}`,
            rateLimitPerUser: ticketConfig.rateLimit || 0
        });

        // حفظ التذكرة في قاعدة البيانات
        const ticket = await Ticket.create({
            guildId,
            userId,
            channelId: channel.id,
            messageId: null,
            category: categoryId || ticketConfig.defaultCategory,
            reason,
            priority,
            status: 'open',
            openedAt: new Date(),
            transcript: [],
            interactions: []
        });

        // تخزين في الذاكرة المؤقتة
        activeTickets.set(channel.id, {
            ticketId: ticket._id,
            userId,
            closed: false
        });

        // إنشاء رسالة الترحيب بالتذكرة
        const welcomeEmbed = new EmbedBuilder()
            .setColor(priority === 'high' ? '#FF0000' : priority === 'medium' ? '#FFA500' : '#00FF00')
            .setTitle('🎫 تم إنشاء تذكرتك بنجاح')
            .setDescription(
                `مرحباً **${user.username}**!\n\n` +
                `تم إنشاء تذكرتك بنجاح. فريق الدعم سيرد عليك قريباً.\n\n` +
                `**معلومات التذكرة:**\n` +
                `• رقم التذكرة: \`#${ticketNumber}\`\n` +
                `• الأولوية: \`${priority}\`\n` +
                `• السبب: \`${reason || 'غير محدد'}\`\n\n` +
                `**كيف يمكننا مساعدتك؟**\n` +
                `اشرح مشكلتك بالتفصيل وسيقوم فريق الدعم بالرد عليك.`
            )
            .setFooter({ text: `معرف التذكرة: ${ticket._id}` })
            .setTimestamp();

        const closeRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('ticket_close')
                .setLabel('إغلاق التذكرة')
                .setEmoji('🔒')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId('ticket_priority_low')
                .setLabel('منخفضة')
                .setEmoji('🟢')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('ticket_priority_medium')
                .setLabel('متوسطة')
                .setEmoji('🟡')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('ticket_priority_high')
                .setLabel('عالية')
                .setEmoji('🔴')
                .setStyle(ButtonStyle.Danger)
        );

        const supportRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('ticket_add_user')
                .setLabel('إضافة مستخدم')
                .setEmoji('➕')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('ticket_remove_user')
                .setLabel('إزالة مستخدم')
                .setLabel('إزالة مستخدم')
                .setEmoji('➖')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('ticket_rename')
                .setLabel('إعادة تسمية')
                .setEmoji('✏️')
                .setStyle(ButtonStyle.Secondary)
        );

        const message = await channel.send({
            content: `<@${userId}>`,
            embeds: [welcomeEmbed],
            components: [closeRow, supportRow]
        });

        // تحديث معرف الرسالة
        ticket.messageId = message.id;
        await ticket.save();

        // إرسال إشعار لفريق الدعم
        if (ticketConfig.notifyRole) {
            const notifyRole = guild.roles.cache.get(ticketConfig.notifyRole);
            if (notifyRole) {
                await channel.send({
                    content: `${notifyRole.toString()} تذكرة جديدة من <@${userId}>`
                }).catch(() => {});
            }
        }

        logger.info(`🎫 تم إنشاء تذكرة جديدة: ${ticket._id} في ${guild.name}`);

        return {
            success: true,
            ticket,
            channel,
            channelUrl: channel.url
        };

    } catch (error) {
        logger.error('خطأ في إنشاء التذكرة:', error);
        return { success: false, error: 'حدث خطأ أثناء إنشاء التذكرة' };
    }
}

/**
 * إغلاق تذكرة
 * @param {string} channelId - معرف القناة
 * @param {string} closedBy - معرف من أغلق التذكرة
 * @param {string} reason - سبب الإغلاق
 * @param {import('discord.js').Client} client - عميل Discord
 * @returns {Promise<Object>}
 */
async function closeTicket(channelId, closedBy, reason, client) {
    try {
        const ticket = await Ticket.findOne({ channelId });
        if (!ticket) {
            return { success: false, error: 'التذكرة غير موجودة' };
        }

        if (ticket.closed) {
            return { success: false, error: 'التذكرة مغلقة بالفعل' };
        }

        const guild = client.guilds.cache.get(ticket.guildId);
        if (!guild) {
            return { success: false, error: 'السيرفر غير موجود' };
        }

        const channel = guild.channels.cache.get(channelId);
        
        // إنشاء نسخة نصية من المحادثة
        const transcript = await generateTranscript(channel, ticket);

        // تحديث التذكرة
        ticket.closed = true;
        ticket.closedAt = new Date();
        ticket.closedBy = closedBy;
        ticket.closedReason = reason;
        ticket.transcript = transcript;
        ticket.status = 'closed';
        await ticket.save();

        // تحديث الذاكرة المؤقتة
        const cached = activeTickets.get(channelId);
        if (cached) {
            cached.closed = true;
            cached.closedAt = Date.now();
        }

        // إرسال النسخة النصية
        if (channel && channel.isTextBased()) {
            const closedEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('🔒 تم إغلاق التذكرة')
                .setDescription(
                    `تم إغلاق هذه التذكرة بواسطة <@${closedBy}>.\n\n` +
                    `**سبب الإغلاق:** ${reason || 'غير محدد'}\n\n` +
                    `سيتم حذف القناة خلال 10 ثوانٍ.`
                )
                .setFooter({ text: `أغلق بواسطة: ${closedBy}` })
                .setTimestamp();

            await channel.send({ embeds: [closedEmbed] });

            // حفظ النسخة النصية كملف
            if (transcript.length > 0) {
                const transcriptFile = new AttachmentBuilder(
                    Buffer.from(transcript.join('\n'), 'utf-8'),
                    { name: `transcript-${ticket._id}.txt` }
                );
                await channel.send({ files: [transcriptFile] }).catch(() => {});
            }
        }

        // حذف القناة بعد فترة
        setTimeout(async () => {
            if (channel && channel.deletable) {
                await channel.delete().catch(() => {});
            }
        }, 10000);

        logger.info(`🔒 تم إغلاق التذكرة: ${ticket._id}`);

        return { success: true, ticket };

    } catch (error) {
        logger.error('خطأ في إغلاق التذكرة:', error);
        return { success: false, error: 'حدث خطأ أثناء إغلاق التذكرة' };
    }
}

/**
 * توليد نسخة نصية من المحادثة
 * @param {import('discord.js').TextChannel} channel - القناة
 * @param {Object} ticket - بيانات التذكرة
 * @returns {Promise<string[]>}
 */
async function generateTranscript(channel, ticket) {
    const transcript = [];
    transcript.push(`=== نسخة نصية من التذكرة #${ticket._id} ===`);
    transcript.push(`المستخدم: ${ticket.userId}`);
    transcript.push(`تاريخ الإنشاء: ${ticket.openedAt}`);
    transcript.push(`تاريخ الإغلاق: ${ticket.closedAt || 'مفتوحة'}`);
    transcript.push(`السبب: ${ticket.reason || 'غير محدد'}`);
    transcript.push(`الأولوية: ${ticket.priority}`);
    transcript.push('========================================\n');

    try {
        const messages = await channel.messages.fetch({ limit: 100 });
        const sortedMessages = messages.reverse();

        for (const msg of sortedMessages) {
            const author = msg.author;
            const timestamp = msg.createdAt.toLocaleString('ar-SA');
            transcript.push(`[${timestamp}] ${author.tag}: ${msg.content}`);
            
            if (msg.attachments.size > 0) {
                for (const attachment of msg.attachments.values()) {
                    transcript.push(`  📎 مرفق: ${attachment.url}`);
                }
            }
        }
    } catch (error) {
        logger.debug('خطأ في جلب الرسائل للنسخة النصية:', error.message);
    }

    return transcript;
}

/**
 * إضافة مستخدم للتذكرة
 * @param {string} channelId - معرف القناة
 * @param {string} targetUserId - معرف المستخدم للإضافة
 * @param {import('discord.js').Client} client
 * @returns {Promise<Object>}
 */
async function addUserToTicket(channelId, targetUserId, client) {
    try {
        const ticket = await Ticket.findOne({ channelId });
        if (!ticket) {
            return { success: false, error: 'التذكرة غير موجودة' };
        }

        const guild = client.guilds.cache.get(ticket.guildId);
        if (!guild) {
            return { success: false, error: 'السيرفر غير موجود' };
        }

        const channel = guild.channels.cache.get(channelId);
        if (!channel) {
            return { success: false, error: 'القناة غير موجودة' };
        }

        const member = await guild.members.fetch(targetUserId).catch(() => null);
        if (!member) {
            return { success: false, error: 'المستخدم غير موجود في السيرفر' };
        }

        await channel.permissionOverwrites.edit(member, {
            ViewChannel: true,
            SendMessages: true,
            ReadMessageHistory: true
        });

        // تحديث التذكرة
        if (!ticket.participants) {
            ticket.participants = [];
        }
        if (!ticket.participants.includes(targetUserId)) {
            ticket.participants.push(targetUserId);
            await ticket.save();
        }

        await channel.send({
            content: `✅ تم إضافة <@${targetUserId}> إلى التذكرة.`
        });

        return { success: true };

    } catch (error) {
        logger.error('خطأ في إضافة مستخدم للتذكرة:', error);
        return { success: false, error: 'حدث خطأ أثناء إضافة المستخدم' };
    }
}

/**
 * إزالة مستخدم من التذكرة
 * @param {string} channelId
 * @param {string} targetUserId
 * @param {import('discord.js').Client} client
 * @returns {Promise<Object>}
 */
async function removeUserFromTicket(channelId, targetUserId, client) {
    try {
        const ticket = await Ticket.findOne({ channelId });
        if (!ticket) {
            return { success: false, error: 'التذكرة غير موجودة' };
        }

        const guild = client.guilds.cache.get(ticket.guildId);
        if (!guild) {
            return { success: false, error: 'السيرفر غير موجود' };
        }

        const channel = guild.channels.cache.get(channelId);
        if (!channel) {
            return { success: false, error: 'القناة غير موجودة' };
        }

        await channel.permissionOverwrites.delete(targetUserId);

        // تحديث التذكرة
        if (ticket.participants) {
            ticket.participants = ticket.participants.filter(id => id !== targetUserId);
            await ticket.save();
        }

        await channel.send({
            content: `✅ تم إزالة <@${targetUserId}> من التذكرة.`
        });

        return { success: true };

    } catch (error) {
        logger.error('خطأ في إزالة مستخدم من التذكرة:', error);
        return { success: false, error: 'حدث خطأ أثناء إزالة المستخدم' };
    }
}

/**
 * تغيير أولوية التذكرة
 * @param {string} channelId
 * @param {string} priority - low, medium, high
 * @returns {Promise<Object>}
 */
async function changeTicketPriority(channelId, priority) {
    try {
        const ticket = await Ticket.findOne({ channelId });
        if (!ticket) {
            return { success: false, error: 'التذكرة غير موجودة' };
        }

        if (!['low', 'medium', 'high'].includes(priority)) {
            return { success: false, error: 'الأولوية غير صحيحة' };
        }

        ticket.priority = priority;
        await ticket.save();

        return { success: true, ticket };

    } catch (error) {
        logger.error('خطأ في تغيير أولوية التذكرة:', error);
        return { success: false, error: 'حدث خطأ أثناء تغيير الأولوية' };
    }
}

/**
 * نقل تذكرة إلى فئة أخرى
 * @param {string} channelId
 * @param {string} categoryId
 * @param {import('discord.js').Client} client
 * @returns {Promise<Object>}
 */
async function moveTicket(channelId, categoryId, client) {
    try {
        const ticket = await Ticket.findOne({ channelId });
        if (!ticket) {
            return { success: false, error: 'التذكرة غير موجودة' };
        }

        const guild = client.guilds.cache.get(ticket.guildId);
        if (!guild) {
            return { success: false, error: 'السيرفر غير موجود' };
        }

        const channel = guild.channels.cache.get(channelId);
        const category = guild.channels.cache.get(categoryId);

        if (!channel || !category) {
            return { success: false, error: 'القناة أو الفئة غير موجودة' };
        }

        await channel.setParent(categoryId);

        ticket.category = categoryId;
        await ticket.save();

        await channel.send({
            content: `✅ تم نقل التذكرة إلى الفئة: ${category.name}`
        });

        return { success: true };

    } catch (error) {
        logger.error('خطأ في نقل التذكرة:', error);
        return { success: false, error: 'حدث خطأ أثناء نقل التذكرة' };
    }
}

/**
 * الحصول على إحصائيات التذاكر
 * @param {string} guildId
 * @returns {Promise<Object>}
 */
async function getTicketStats(guildId) {
    try {
        const total = await Ticket.countDocuments({ guildId });
        const open = await Ticket.countDocuments({ guildId, closed: false });
        const closed = await Ticket.countDocuments({ guildId, closed: true });
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayOpen = await Ticket.countDocuments({
            guildId,
            openedAt: { $gte: today },
            closed: false
        });
        const todayClosed = await Ticket.countDocuments({
            guildId,
            closedAt: { $gte: today },
            closed: true
        });

        // متوسط وقت الاستجابة
        const avgResponseTime = await Ticket.aggregate([
            { $match: { guildId, closed: true, firstResponseAt: { $exists: true } } },
            {
                $group: {
                    _id: null,
                    avgTime: { $avg: { $subtract: ['$firstResponseAt', '$openedAt'] } }
                }
            }
        ]);

        return {
            total,
            open,
            closed,
            todayOpen,
            todayClosed,
            avgResponseTime: avgResponseTime[0]?.avgTime || 0
        };

    } catch (error) {
        logger.error('خطأ في الحصول على إحصائيات التذاكر:', error);
        return null;
    }
}

module.exports = {
    createTicket,
    closeTicket,
    addUserToTicket,
    removeUserFromTicket,
    changeTicketPriority,
    moveTicket,
    getTicketStats,
    generateTranscript
};
