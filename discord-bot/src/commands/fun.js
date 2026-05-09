/**
 * @file commands/fun.js
 * @description Fun slash commands including 8ball, coinflip, dice, roll,
 * meme (from Reddit), and rock-paper-scissors.
 */

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { randomInt } = require('node:crypto');
const axios = require('axios');
const { createSuccessEmbed, createErrorEmbed } = require('../utils/embeds');
const logger = require('../utils/logger');

/**
 * @module commands/fun
 * @description Fun and entertainment commands.
 */
module.exports = {
    /** @type {SlashCommandBuilder} Slash command definition */
    data: new SlashCommandBuilder()
        .setName('ترفيه')
        .setDescription('أوامر ترفيهية')
        .addSubcommand(subcommand =>
            subcommand
                .setName('كرة_الحظ')
                .setDescription('اسأل كرة الحظ سؤالاً')
                .addStringOption(option => option.setName('السؤال').setDescription('سؤالك').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('عملة')
                .setDescription('رمي عملة')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('نرد')
                .setDescription('رمي نرد واحد')
                .addIntegerOption(option => option.setName('الوجوه').setDescription('عدد الوجوه (الافتراضي 6)').setMinValue(2).setMaxValue(100))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('رمي_النرد')
                .setDescription('رمي عدة نرد (مثال: 2d6)')
                .addIntegerOption(option => option.setName('العدد').setDescription('عدد النرد').setRequired(true).setMinValue(1).setMaxValue(20))
                .addIntegerOption(option => option.setName('الوجوه').setDescription('عدد الوجوه لكل نردة').setRequired(true).setMinValue(2).setMaxValue(100))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('ميم')
                .setDescription('ميم عشوائي من Reddit')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('حجر_ورقة_مقص')
                .setDescription('لعبة حجر ورقة مقص')
                .addStringOption(option =>
                    option.setName('الاختيار')
                        .setDescription('اختيارك')
                        .setRequired(true)
                        .addChoices(
                            { name: 'حجر 🪨', value: 'rock' },
                            { name: 'ورقة 📄', value: 'paper' },
                            { name: 'مقص ✂️', value: 'scissors' }
                        )
                )
        ),

    /**
     * Executes the fun command based on the chosen subcommand.
     * @async
     * @param {import('discord.js').ChatInputCommandInteraction} interaction - The interaction instance.
     * @returns {Promise<void>}
     */
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'كرة_الحظ') {
            const question = interaction.options.getString('السؤال');
            const responses = [
                "أكيد.", "بالتأكيد نعم.", "بدون شك.", "نعم - بالتأكيد.",
                "يمكنك الاعتماد عليه.", "كما أرى، نعم.", "غالباً.", "الآفاق واعدة.",
                "نعم.", "كل المؤشرات تشير إلى نعم.", "الإجابة غير واضحة، حاول مرة أخرى.", "اسأل مرة أخرى لاحقاً.",
                "من الأفضل عدم إخبارك الآن.", "لا يمكن التنبؤ الآن.", "ركز واسأل مرة أخرى.",
                "لا تعتمد عليه.", "إجابتي لا.", "مصادري تقول لا.",
                "الآفاق ليست جيدة.", "مشكوك فيه جداً."
            ];

            const response = responses[randomInt(responses.length)];

            const embed = new EmbedBuilder()
                .setColor('#000000')
                .setTitle('🎱 كرة الحظ السحرية')
                .addFields(
                    { name: 'السؤال', value: question },
                    { name: 'الإجابة', value: response }
                );

            return interaction.reply({ embeds: [embed] });
        }

        if (subcommand === 'عملة') {
            const result = randomInt(2) === 0 ? 'رأس' : 'كتابة';
            const embed = createSuccessEmbed('🪙 رمي العملة', `سقطت العملة على **${result}**!`);
            return interaction.reply({ embeds: [embed] });
        }

        if (subcommand === 'نرد') {
            const sides = interaction.options.getInteger('الوجوه') || 6;
            const result = randomInt(1, sides + 1);

            let msg = `رميت **${result}** (1d${sides}).`;
            if (result === sides) msg += ' نجاح ساحق! 🎉';
            if (result === 1) msg += ' فشل ذريع! 💀';

            const embed = createSuccessEmbed('🎲 رمي النرد', msg);
            return interaction.reply({ embeds: [embed] });
        }

        if (subcommand === 'رمي_النرد') {
            const count = interaction.options.getInteger('العدد');
            const sides = interaction.options.getInteger('الوجوه');

            const rolls = [];
            let total = 0;

            for (let i = 0; i < count; i++) {
                const roll = randomInt(1, sides + 1);
                rolls.push(roll);
                total += roll;
            }

            const average = (total / count).toFixed(2);

            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle(`🎲 جاري الرمي ${count}d${sides}`)
                .setDescription(`**النتائج:** ${rolls.join(', ')}`)
                .addFields(
                    { name: 'المجموع', value: `${total}`, inline: true },
                    { name: 'المتوسط', value: `${average}`, inline: true }
                );

            return interaction.reply({ embeds: [embed] });
        }

        if (subcommand === 'ميم') {
            await interaction.deferReply();
            try {
                const response = await axios.get('https://meme-api.com/gimme');
                const data = response.data;

                const embed = new EmbedBuilder()
                    .setColor('#FF4500')
                    .setTitle(data.title)
                    .setURL(data.postLink)
                    .setImage(data.url)
                    .setFooter({ text: `👍 ${data.ups} | r/${data.subreddit}` });

                return interaction.editReply({ embeds: [embed] });
            } catch (error) {
                return interaction.editReply({ embeds: [createErrorEmbed('❌ خطأ', 'فشل في جلب الميم من Reddit API.')] });
            }
        }

        if (subcommand === 'حجر_ورقة_مقص') {
            const userChoice = interaction.options.getString('الاختيار');
            const choices = ['rock', 'paper', 'scissors'];
            const botChoice = choices[randomInt(choices.length)];

            const emojis = { rock: '🪨', paper: '📄', scissors: '✂️' };

            let result;
            if (userChoice === botChoice) result = 'تعادل!';
            else if (
                (userChoice === 'rock' && botChoice === 'scissors') ||
                (userChoice === 'paper' && botChoice === 'rock') ||
                (userChoice === 'scissors' && botChoice === 'paper')
            ) result = 'فزت! 🎉';
            else result = 'فزت أنا! 🤖';

            const embed = new EmbedBuilder()
                .setColor(result.includes('فزت') ? '#00FF00' : result.includes('تعادل') ? '#FFFF00' : '#FF0000')
                .setTitle('✊✋✌️ حجر ورقة مقص')
                .addFields(
                    { name: 'اختيارك', value: `${emojis[userChoice]} ${userChoice === 'rock' ? 'حجر' : userChoice === 'paper' ? 'ورقة' : 'مقص'}`, inline: true },
                    { name: 'اختياري', value: `${emojis[botChoice]} ${botChoice === 'rock' ? 'حجر' : botChoice === 'paper' ? 'ورقة' : 'مقص'}`, inline: true },
                    { name: 'النتيجة', value: result, inline: false }
                );

            return interaction.reply({ embeds: [embed] });
        }
    },
};
