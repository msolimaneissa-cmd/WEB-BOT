/**
 * @file commands/ticket.js
 * @description نظام التذاكر الاحترافي - إنشاء وإدارة تذاكر الدعم الفني.
 */

const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, AttachmentBuilder } = require('discord.js');
const { createSuccessEmbed, createErrorEmbed, createInfoEmbed } = require('../utils/embeds');
const ServerConfig = require('../database/schemas/serverConfigSchema');
const Ticket = require('../database/schemas/ticketSchema');
const { isDatabaseConnected } = require('../database/connect');
const { isStaff } = require('../utils/permissions');
const logger = require('../utils/logger');

/**
 * دالة بسيطة لإنشاء Transcript نصي للتذكرة
 * @param {import('discord.js').TextChannel} channel 
 */
async function generateTranscript(channel) {
    const messages = await channel.messages.fetch({ limit: 100 });
    let transcript = `Transcript for Ticket: ${channel.name}\nGenerated at: ${new Date().toISOString()}\n\n`;
    
    messages.reverse().forEach(m => {
        const time = m.createdAt.toLocaleString('ar-EG');
        transcript += `[${time}] ${m.author.tag}: ${m.content}\n`;
        if (m.attachments.size > 0) {
            transcript += `Attachments: ${m.attachments.map(a => a.url).join(', ')}\n`;
        }
    });
    
    return transcript;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('تذكرة')
        .setDescription('نظام تذاكر الدعم الفني')
        
        // ─── إعداد النظام ───
        .addSubcommand(sub =>
            sub.setName('اعداد')
                .setDescription('إعداد نظام التذاكر في السيرفر')
                .addChannelOption(opt => opt.setName('القسم').setDescription('القسم الذي ستفتح فيه التذاكر').setRequired(true).addChannelTypes(ChannelType.GuildCategory))
                .addRoleOption(opt => opt.setName('رتبة_الدعم').setDescription('رتبة فريق الدعم').setRequired(true))
                .addChannelOption(opt => opt.setName('قناة_السجلات').setDescription('قناة سجلات التذاكر').setRequired(false))
        )
        
        // ─── إرسال لوحة الفتح ───
        .addSubcommand(sub =>
            sub.setName('لوحة')
                .setDescription('إرسال لوحة فتح التذاكر')
                .addChannelOption(opt => opt.setName('القناة').setDescription('القناة التي ستظهر فيها اللوحة').setRequired(false))
        )
        
        // ─── إغلاق التذكرة ───
        .addSubcommand(sub =>
            sub.setName('اغلاق')
                .setDescription('إغلاق التذكرة الحالية')
                .addStringOption(opt => opt.setName('السبب').setDescription('سبب إغلاق التذكرة').setRequired(false))
        ),

    async execute(interaction) {
        if (!isDatabaseConnected()) {
            return interaction.reply({ embeds: [createErrorEmbed('❌ خطأ', 'قاعدة البيانات غير متصلة.')], ephemeral: true });
        }

        const subcommand = interaction.options.getSubcommand();

        // ─── إعداد النظام ───
        if (subcommand === 'اعداد') {
            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator) && !await isStaff(interaction.member)) {
                return interaction.reply({ embeds: [createErrorEmbed('❌ صلاحية مرفوضة', 'تحتاج لصلاحية مدير أو رتبة طاقم معتمدة لإعداد النظام.')], ephemeral: true });
            }

            const category = interaction.options.getChannel('القسم');
            const staffRole = interaction.options.getRole('رتبة_الدعم');
            const logChannel = interaction.options.getChannel('قناة_السجلات');

            await ServerConfig.update({
                        'tickets.enabled': true,
                        'tickets.categoryId': category.id,
                        'tickets.staffRoleId': staffRole.id,
                        'tickets.logChannelId': logChannel?.id || null
                    });

            return interaction.reply({ embeds: [createSuccessEmbed('✅ تم الإعداد', `تم تفعيل نظام التذاكر بنجاح!\n**القسم:** ${category}\n**رتبة الدعم:** ${staffRole}`)] });
        }

        // ─── إرسال اللوحة ───
        if (subcommand === 'لوحة') {
            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator) && !await isStaff(interaction.member)) {
                return interaction.reply({ embeds: [createErrorEmbed('❌ صلاحية مرفوضة', 'تحتاج لصلاحية مدير أو رتبة طاقم معتمدة لإرسال اللوحة.')], ephemeral: true });
            }

            const targetChannel = interaction.options.getChannel('القناة') || interaction.channel;
            const guildConfig = await ServerConfig.get();

            if (!guildConfig?.tickets?.enabled) {
                return interaction.reply({ embeds: [createErrorEmbed('❌ نظام غير مفعل', 'يرجى إعداد نظام التذاكر أولاً باستخدام `/تذكرة اعداد`.')], ephemeral: true });
            }

            const embed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle('🎫 تذاكر الدعم الفني')
                .setDescription('إذا كنت تحتاج للمساعدة أو لديك استفسار، اضغط على الزر بالأسفل لفتح تذكرة جديدة.')
                .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL() })
                .setTimestamp();

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('ticket_open')
                    .setLabel('فتح تذكرة')
                    .setEmoji('🎫')
                    .setStyle(ButtonStyle.Primary)
            );

            await targetChannel.send({ embeds: [embed], components: [row] });
            return interaction.reply({ content: '✅ تم إرسال لوحة التذاكر.', ephemeral: true });
        }

        // ─── إغلاق التذكرة ───
        if (subcommand === 'اغلاق') {
            const ticket = await Ticket.findOne({ channelId: interaction.channel.id, status: 'open' });
            if (!ticket) {
                return interaction.reply({ embeds: [createErrorEmbed('❌ خطأ', 'هذه القناة ليست تذكرة نشطة.')], ephemeral: true });
            }

            const guildConfig = await ServerConfig.get();
            const isStaff = interaction.member.roles.cache.has(guildConfig?.tickets?.staffRoleId);
            const isOwner = interaction.user.id === ticket.creatorId;

            if (!isStaff && !isOwner) {
                return interaction.reply({ embeds: [createErrorEmbed('❌ صلاحية مرفوضة', 'لا يمكنك إغلاق هذه التذكرة.')], ephemeral: true });
            }

            const reason = interaction.options.getString('السبب') || 'لم يتم تحديد سبب';
            
            await interaction.reply({ embeds: [createInfoEmbed('🔄 جاري الإغلاق', 'جاري إنشاء النسخة النصية وإغلاق التذكرة خلال 5 ثوانٍ...')] });

            const transcriptContent = await generateTranscript(interaction.channel);
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

            // إرسال النسخة للمستخدم أيضاً
            const user = await interaction.client.users.fetch(ticket.userId).catch(() => null);
            if (user) {
                user.send({ 
                    content: `🔒 تم إغلاق تذكرتك في **${interaction.guild.name}**.\n**السبب:** ${reason}`,
                    files: [transcriptAttachment] 
                }).catch(() => {});
            }

            setTimeout(() => {
                interaction.channel.delete().catch(() => {});
            }, 5000);
        }
    },
    generateTranscript,
};
