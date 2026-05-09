/**
 * @file commands/chat.js
 * @description أمر المحادثة مع البوت الذكي - يدعم محادثات طبيعية (Slash Command)
 */

const { SlashCommandBuilder } = require('discord.js');
const { processAIMessage } = require('../utils/aiChat');
const { createInfoEmbed } = require('../utils/embeds');
const ServerConfig = require('../database/schemas/serverConfigSchema');

const data = new SlashCommandBuilder()
    .setName('تكلم')
    .setDescription('🤖 تحدث مع البوت الذكي')
    .addStringOption(option =>
        option
            .setName('الرسالة')
            .setDescription('الرسالة التي تريد إرسالها للبوت')
            .setRequired(true)
            .setMinLength(1)
    );

async function execute(interaction, client) {
    const query = interaction.options.getString('الرسالة');
    const guildId = interaction.guild.id;

    // إظهار حالة الكتابة
    await interaction.deferReply();

    // جلب الإعدادات
    const config = await ServerConfig.get();

    // معالجة الرسالة
    const response = await processAIMessage(
        query,
        interaction.user.id,
        guildId,
        interaction.user.username,
        config?.ai?.systemPrompt,
        config?.ai?.model
    );

    // إرسال الرد
    await interaction.editReply(response);
}

/**
 * للرد عند منشن البوت
 * يتم استخدامه في messageCreate event
 */
async function handleBotMention(message, client) {
    // إزالة المنشن من الرسالة
    const content = message.content
        .replace(/<@!?(\d+)>/g, '')
        .trim();

    if (!content) {
        return message.reply('أهلاً! 👋 كيف أقدر أساعدك؟');
    }

    message.channel.sendTyping();

    const config = await ServerConfig.get();

    const response = await processAIMessage(
        content,
        message.author.id,
        message.guild.id,
        message.author.username,
        config?.ai?.systemPrompt,
        config?.ai?.model
    );

    return message.reply(response);
}

module.exports = { data, execute };
module.exports.handleBotMention = handleBotMention;
