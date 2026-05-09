/**
 * @file commands/verify.js
 * @description نظام التحقق (Verification) لمنع دخول البوتات والحسابات الوهمية.
 */

const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { createSuccessEmbed, createErrorEmbed } = require('../utils/embeds');
const ServerConfig = require('../database/schemas/serverConfigSchema');
const { isDatabaseConnected } = require('../database/connect');
const logger = require('../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('تحقق')
        .setDescription('إعداد نظام التحقق في السيرفر')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(sub =>
            sub.setName('اعداد')
                .setDescription('ضبط إعدادات التحقق')
                .addRoleOption(opt => opt.setName('الرتبة').setDescription('الرتبة التي سيحصل عليها العضو بعد التحقق').setRequired(true))
                .addChannelOption(opt => opt.setName('القناة').setDescription('القناة التي ستظهر فيها رسالة التحقق').setRequired(false))
                .addStringOption(opt => opt.setName('الرسالة').setDescription('رسالة التحقق المخصصة').setRequired(false))
        )
        .addSubcommand(sub =>
            sub.setName('تعطيل')
                .setDescription('تعطيل نظام التحقق')
        ),

    async execute(interaction) {
        if (!isDatabaseConnected()) {
            return interaction.reply({ embeds: [createErrorEmbed('❌ خطأ', 'قاعدة البيانات غير متصلة.')], ephemeral: true });
        }

        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({ embeds: [createErrorEmbed('❌ صلاحية مرفوضة', 'تحتاج لصلاحية مدير لإعداد النظام.')], ephemeral: true });
        }

        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'اعداد') {
            const role = interaction.options.getRole('الرتبة');
            const channel = interaction.options.getChannel('القناة') || interaction.channel;
            const messageText = interaction.options.getString('الرسالة') || 'اضغط على الزر بالأسفل للتحقق والدخول للسيرفر.';

            await ServerConfig.update({
                        'protection.verification.enabled': true,
                        'protection.verification.roleId': role.id,
                        'protection.verification.channelId': channel.id,
                        'protection.verification.message': messageText
                    });

            const embed = new EmbedBuilder()
                .setColor('#2F3136')
                .setTitle('🛡️ نظام التحقق')
                .setDescription(messageText)
                .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL() })
                .setTimestamp();

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('verify_member')
                    .setLabel('تحقق الآن')
                    .setEmoji('✅')
                    .setStyle(ButtonStyle.Success)
            );

            await channel.send({ embeds: [embed], components: [row] });

            return interaction.reply({ embeds: [createSuccessEmbed('✅ تم الإعداد', `تم تفعيل نظام التحقق بنجاح!\n**القناة:** ${channel}\n**الرتبة:** ${role}`)], ephemeral: true });
        }

        if (subcommand === 'تعطيل') {
            await ServerConfig.update({ 'protection.verification.enabled': false });
            return interaction.reply({ embeds: [createSuccessEmbed('🗑️ تم التعطيل', 'تم تعطيل نظام التحقق في السيرفر.')], ephemeral: true });
        }
    },
};
