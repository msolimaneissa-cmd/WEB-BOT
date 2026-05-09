/**
 * @file src/commands/giveaway.js
 * @description نظام الهبات (Giveaways) الاحترافي - إنشاء وسحب الهبات.
 */

const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { createSuccessEmbed, createErrorEmbed } = require('../utils/embeds');
const Giveaway = require('../database/schemas/giveawaySchema');
const ms = require('ms');
const { isStaff } = require('../utils/permissions');
const logger = require('../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('هبة')
        .setDescription('نظام الهبات')
        .addSubcommand(sub =>
            sub.setName('بدء')
                .setDescription('بدء هبة جديدة')
                .addStringOption(opt => opt.setName('المدة').setDescription('مدة الهبة (مثال: 1h, 1d)').setRequired(true))
                .addIntegerOption(opt => opt.setName('الفائزين').setDescription('عدد الفائزين').setRequired(true).setMinValue(1).setMaxValue(10))
                .addStringOption(opt => opt.setName('الجائزة').setDescription('الجائزة').setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName('سحب_جديد')
                .setDescription('إعادة سحب فائز لهبة منتهية')
                .addStringOption(opt => opt.setName('معرف_الرسالة').setDescription('معرف رسالة الهبة').setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName('قائمة')
                .setDescription('عرض الهبات النشطة')
        ),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages) && !await isStaff(interaction.member)) {
            return interaction.reply({ embeds: [createErrorEmbed('❌ صلاحية مرفوضة', 'ليس لديك صلاحية لإدارة الهبات (أو رتبة طاقم معتمدة)')], ephemeral: true });
        }

        if (subcommand === 'بدء') {
            const durationStr = interaction.options.getString('المدة');
            const winnerCount = interaction.options.getInteger('الفائزين');
            const prize = interaction.options.getString('الجائزة');
            const durationMs = ms(durationStr);

            if (!durationMs) return interaction.reply({ embeds: [createErrorEmbed('❌ تنسيق غير صالح', 'يرجى تقديم مدة صالحة (مثال: 1h, 1d)')], ephemeral: true });

            const endAt = new Date(Date.now() + durationMs);
            const endTimestamp = Math.floor(endAt.getTime() / 1000);

            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle(`🎉 هبة: ${prize}`)
                .setDescription(`تفاعل مع الرمز 🎉 للمشاركة!\n\n**تنتهي في:** <t:${endTimestamp}:R> (<t:${endTimestamp}:f>)\n**عدد الفائزين:** ${winnerCount}\n**بواسطة:** ${interaction.user}`)
                .setTimestamp();

            const message = await interaction.reply({ embeds: [embed], fetchReply: true });
            await message.react('🎉');

            // حفظ الهبة في قاعدة البيانات
            try {
                await Giveaway.create({
                    guildId: interaction.guild.id,
                    channelId: interaction.channel.id,
                    messageId: message.id,
                    hostId: interaction.user.id,
                    hostTag: interaction.user.tag,
                    prize: prize,
                    winners: winnerCount,
                    endAt: endAt
                });
            } catch (error) {
                logger.error('Error saving giveaway to DB:', error);
            }
        }

        if (subcommand === 'سحب_جديد') {
            const messageId = interaction.options.getString('معرف_الرسالة');
            try {
                const result = await Giveaway.rerollGiveaway(messageId);
                if (!result || result.newWinners.length === 0) {
                    return interaction.reply({ embeds: [createErrorEmbed('❌ خطأ', 'لم أتمكن من العثور على الهبة أو لم يشارك أحد.')], ephemeral: true });
                }

                const winnerMentions = result.newWinners.map(id => `<@${id}>`).join(', ');
                return interaction.reply(`🎉 الفائزين الجدد هم: ${winnerMentions}! مبروك!`);
            } catch (error) {
                logger.error('Error rerolling giveaway:', error);
                return interaction.reply({ embeds: [createErrorEmbed('❌ خطأ', 'حدث خطأ أثناء إعادة السحب.')], ephemeral: true });
            }
        }

        if (subcommand === 'قائمة') {
            const activeGiveaways = await Giveaway.find({ guildId: interaction.guild.id, ended: false });
            
            if (activeGiveaways.length === 0) {
                return interaction.reply({ content: 'لا توجد هبات نشطة حالياً.', ephemeral: true });
            }

            const embed = new EmbedBuilder()
                .setColor('#3498DB')
                .setTitle('📋 الهبات النشطة')
                .setDescription(activeGiveaways.map((g, i) => 
                    `**${i + 1}.** [${g.prize}](https://discord.com/channels/${g.guildId}/${g.channelId}/${g.messageId}) - تنتهي <t:${Math.floor(g.endAt.getTime() / 1000)}:R>`
                ).join('\n'))
                .setTimestamp();

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
    },
};
