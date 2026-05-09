/**
 * @file commands/controlPanelGames.js
 * @description لوحة الألعاب التفاعلية — Slash Command
 */

const { SlashCommandBuilder } = require('discord.js');
const { EmbedBuilder, ButtonStyle } = require('discord.js');
const {
    createGamesMenuPanel,
    createRockPaperScissorsPanel,
    createDicePanel,
} = require('../utils/controlPanels');
const { createSuccessEmbed } = require('../utils/embeds');

const data = new SlashCommandBuilder()
    .setName('العاب')
    .setDescription('🎮 الألعاب التفاعلية')
    .addSubcommand((sub) =>
        sub.setName('حجر_ورقة_مقص').setDescription('🎮 لعبة حجر ورقة مقص')
    )
    .addSubcommand((sub) =>
        sub.setName('نرد').setDescription('🎲 رمي النرد')
    )
    .addSubcommand((sub) =>
        sub.setName('عملة').setDescription('🪙 رمي العملة')
    );

/**
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {import('discord.js').Client} client
 */
async function execute(interaction, client) {
    const userId = interaction.user.id;
    const subcommand = interaction.options.getSubcommand();

    // حجر ورقة مقص
    if (subcommand === 'حجر_ورقة_مقص') {
        const panel = createRockPaperScissorsPanel(userId);
        return interaction.reply(panel);
    }

    // نرد
    if (subcommand === 'نرد') {
        const panel = createDicePanel(userId);
        return interaction.reply(panel);
    }

    // عملة
    if (subcommand === 'عملة') {
        const result = Math.random() < 0.5 ? 'رأس 👤' : 'كتابة ✍️';
        return interaction.reply({
            embeds: [createSuccessEmbed('🪙 رمي العملة', `سقطت العملة على **${result}**!`)],
        });
    }

    // القائمة الرئيسية للألعاب (default — no subcommand)
    const panel = createGamesMenuPanel(userId);
    return interaction.reply(panel);
}

module.exports = { data, execute };
