/**
 * @file commands/rules.js
 * @description عرض قوانين السيرفر المزامنة مع الموقع.
 */

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const logger = require('../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('قوانين')
        .setDescription('عرض قوانين السيرفر (مزامنة مع الموقع)'),

    async execute(interaction) {
        await interaction.deferReply();

        try {
            // جلب القوانين من الـ API الخاص بالموقع
            // ملاحظة: يجب التأكد من أن رابط الموقع والسر موجودان في .env
            const DASHBOARD_URL = process.env.DASHBOARD_API_URL || 'http://localhost:3000';
            const BOT_SECRET = process.env.BOT_CONTROL_SECRET;

            const response = await axios.get(`${DASHBOARD_URL}/api/bot/rules`, {
                headers: { 'x-bot-secret': BOT_SECRET }
            });

            if (!response.data.success || !response.data.rules.length) {
                return interaction.editReply('❌ لم يتم العثور على قوانين مسجلة في الموقع حالياً.');
            }

            const rules = response.data.rules;
            const embed = new EmbedBuilder()
                .setColor('#FFD700')
                .setTitle(`📜 قوانين مجتمع ${interaction.guild.name}`)
                .setDescription('يرجى الالتزام بالقوانين التالية لتجنب العقوبات:')
                .setThumbnail(interaction.guild.iconURL())
                .setTimestamp()
                .setFooter({ text: 'Family Legends Sync System' });

            rules.forEach((rule, index) => {
                embed.addFields({
                    name: `${index + 1}. ${rule.title}`,
                    value: rule.description || 'لا يوجد وصف',
                    inline: false
                });
            });

            return interaction.editReply({ embeds: [embed] });
        } catch (error) {
            logger.error('Error fetching rules from API:', error.message);
            return interaction.editReply('❌ حدث خطأ أثناء جلب القوانين من الموقع. يرجى المحاولة لاحقاً.');
        }
    },
};
