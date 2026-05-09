/**
 * @file src/utils/ticketHelper.js
 * @description Helper functions for managing the ticket system.
 */

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, ChannelType } = require('discord.js');
const Ticket = require('../database/schemas/ticketSchema');
const ServerConfig = require('../database/schemas/serverConfigSchema');
const { createSuccessEmbed, createErrorEmbed } = require('./embeds');
const logger = require('./logger');

/**
 * فتح تذكرة جديدة للمستخدم
 * @param {import('discord.js').ButtonInteraction} interaction 
 */
async function handleTicketOpen(interaction) {
    const { guild, user } = interaction;
    
    // جلب إعدادات السيرفر
    const guildConfig = await ServerConfig.get();
    if (!guildConfig?.tickets?.enabled) {
        return interaction.reply({ embeds: [createErrorEmbed('❌ نظام غير مفعل', 'نظام التذاكر غير مفعل في هذا السيرفر.')], ephemeral: true });
    }

    // التحقق من وجود تذكرة مفتوحة بالفعل
    const activeTicket = await Ticket.getActiveTicket(user.id, guild.id);
    if (activeTicket) {
        const channel = guild.channels.cache.get(activeTicket.channelId);
        if (channel) {
            return interaction.reply({ content: `⚠️ لديك تذكرة مفتوحة بالفعل في ${channel}`, ephemeral: true });
        } else {
            // تنظيف التذكرة القديمة إذا كانت القناة محذوفة
            activeTicket.status = 'closed';
            await activeTicket.save();
        }
    }

    try {
        await interaction.deferReply({ ephemeral: true });

        const categoryId = guildConfig.tickets.categoryId;
        const staffRoleId = guildConfig.tickets.staffRoleId;
        
        // إعداد الصلاحيات للقناة
        const permissionOverwrites = [
            { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] }, // منع الجميع
            { id: user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks, PermissionFlagsBits.AttachFiles] }, // السماح للمستخدم
            { id: guild.members.me.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels] } // السماح للبوت
        ];

        if (staffRoleId) {
            permissionOverwrites.push({ id: staffRoleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages] });
        }

        // إنشاء القناة
        const channelName = `ticket-${user.username.slice(0, 10)}`;
        const channel = await guild.channels.create({
            name: channelName,
            type: ChannelType.GuildText,
            parent: categoryId,
            topic: `تذكرة دعم لـ ${user.tag} (${user.id})`,
            permissionOverwrites
        });

        // حفظ التذكرة في قاعدة البيانات
        await Ticket.create({
            guildId: guild.id,
            userId: user.id,
            channelId: channel.id
        });

        // إرسال رسالة الترحيب في التذكرة
        const welcomeEmbed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle('🎫 تذكرة جديدة')
            .setDescription(guildConfig.tickets.welcomeMessage || 'مرحباً بك، سيقوم فريق الدعم بالرد عليك قريباً.')
            .addFields(
                { name: 'المستخدم', value: `${user}`, inline: true },
                { name: 'المعرف', value: `\`${user.id}\``, inline: true }
            )
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('ticket_close')
                .setLabel('إغلاق')
                .setEmoji('🔒')
                .setStyle(ButtonStyle.Danger)
        );

        await channel.send({ content: `${user} ${staffRoleId ? `<@&${staffRoleId}>` : ''}`, embeds: [welcomeEmbed], components: [row] });

        return interaction.editReply({ content: `✅ تم فتح التذكرة بنجاح: ${channel}` });
    } catch (error) {
        logger.error('Error opening ticket:', error);
        return interaction.editReply({ content: '❌ حدث خطأ أثناء فتح التذكرة. يرجى التأكد من صلاحيات البوت.' });
    }
}

/**
 * معالجة إغلاق التذكرة عبر الأزرار
 * @param {import('discord.js').ButtonInteraction} interaction 
 */
async function handleTicketClose(interaction) {
    const ticket = await Ticket.findOne({ channelId: interaction.channel.id, status: 'open' });
    if (!ticket) return interaction.reply({ content: '⚠️ هذه القناة ليست تذكرة نشطة.', ephemeral: true });

    const guildConfig = await ServerConfig.get();
    const isStaff = interaction.member.roles.cache.has(guildConfig?.tickets?.staffRoleId);
    const isOwner = interaction.user.id === ticket.userId;

    if (!isStaff && !isOwner) {
        return interaction.reply({ content: '❌ لا يمكنك إغلاق هذه التذكرة.', ephemeral: true });
    }

    // إغلاق التذكرة مباشرة بدلاً من محاكاة استدعاء الأمر
    const reason = 'إغلاق عبر الزر';
    
    await interaction.reply({ content: '🔄 جاري إغلاق التذكرة...', ephemeral: true });

    const { generateTranscript } = require('../commands/ticket');
    const transcriptContent = await generateTranscript(interaction.channel);
    const { AttachmentBuilder } = require('discord.js');
    const transcriptAttachment = new AttachmentBuilder(Buffer.from(transcriptContent), { name: `transcript-${ticket.channelId}.txt` });

    ticket.status = 'closed';
    ticket.closedBy = interaction.user.id;
    ticket.closedAt = new Date();
    await ticket.save();

    // تسجيل الإغلاق
    const logChannelId = guildConfig?.tickets?.logChannelId;
    if (logChannelId) {
        const logChannel = interaction.guild.channels.cache.get(logChannelId);
        if (logChannel) {
            const { EmbedBuilder } = require('discord.js');
            const logEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('🔒 تذكرة مغلقة')
                .addFields(
                    { name: 'المستخدم', value: `<@${ticket.userId}>`, inline: true },
                    { name: 'أغلقت بواسطة', value: `${interaction.user}`, inline: true },
                    { name: 'السبب', value: reason, inline: false }
                )
                .setTimestamp();
            logChannel.send({ embeds: [logEmbed], files: [transcriptAttachment] }).catch(() => {});
        }
    }

    setTimeout(() => {
        interaction.channel.delete().catch(() => {});
    }, 5000);
}

module.exports = { handleTicketOpen, handleTicketClose };
