/**
 * @file commands/leveling.js
 * @description أوامر السلاش لنظام المستويات والخبرة تشمل:
 * عرض (rank card) و المتصدرون (leaderboard).
 */

const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder, PermissionsBitField } = require('discord.js');
const User = require('../database/schemas/userSchema');
const ServerConfig = require('../database/schemas/serverConfigSchema');
const { isDatabaseConnected } = require('../database/connect');
const { createErrorEmbed, createSuccessEmbed, createInfoEmbed } = require('../utils/embeds');
const { drawRankCard, xpForLevel, getLevelColor, getTierName, canvasAvailable } = require('../utils/rankCard');
const logger = require('../utils/logger');

/**
 * @module commands/leveling
 * @description أوامر نظام المستويات مع كروت الرتبة ولوحة المتصدرين.
 */
module.exports = {
    /** @type {SlashCommandBuilder} تعريف أمر السلاش */
    data: new SlashCommandBuilder()
        .setName('مستوى')
        .setDescription('أوامر نظام المستويات والخبرة')
        // ─── عرض الرتبة (Rank) ───
        .addSubcommand(subcommand =>
            subcommand
                .setName('عرض')
                .setDescription('عرض كرت الرتبة الخاص بك أو لعضو آخر')
                .addUserOption(option =>
                    option
                        .setName('العضو')
                        .setDescription('العضو لعرض كرت رتبته')
                        .setRequired(false)
                )
        )
        // ─── المتصدرون (Leaderboard) ───
        .addSubcommand(subcommand =>
            subcommand
                .setName('المتصدرون')
                .setDescription('عرض لوحة المتصدرين')
                .addIntegerOption(option =>
                    option
                        .setName('صفحة')
                        .setDescription('رقم الصفحة')
                        .setRequired(false)
                        .setMinValue(1)
                        .setMaxValue(100)
                )
        ),

    /**
     * ينفذ أمر المستوى بناءً على الأمر الفرعي المختار.
     * @async
     * @param {import('discord.js').ChatInputCommandInteraction} interaction - نسخة التفاعل.
     * @returns {Promise<void>}
     */
    async execute(interaction) {
        if (!isDatabaseConnected()) {
            return interaction.reply({
                embeds: [createErrorEmbed('❌ قاعدة البيانات غير متصلة', 'أوامر المستويات معطلة حالياً لأن قاعدة البيانات غير متصلة.')],
                ephemeral: true,
            });
        }

        const subcommand = interaction.options.getSubcommand();

        // ─── عرض الرتبة (Rank) ───
        if (subcommand === 'عرض') {
            await handleRank(interaction);
            return;
        }

        // ─── المتصدرون (Leaderboard) ───
        if (subcommand === 'المتصدرون') {
            await handleLeaderboard(interaction);
            return;
        }
    },
};

// ═══════════════════════════════════════════════════════════════════════════
// Subcommand handlers
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Handle the "عرض" (rank) subcommand.
 * Shows the rank card as an image attachment.
 * @async
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @returns {Promise<void>}
 */
async function handleRank(interaction) {
    try {
        await interaction.deferReply();

        const guildId = interaction.guild.id;
        const targetUser = interaction.options.getUser('العضو') || interaction.user;

        // Fetch guild config for rank card settings
        let guildConfig = null;
        try {
            guildConfig = await ServerConfig.get();
        } catch (e) {
            // Ignore
        }

        // Check if leveling is enabled for this guild
        if (guildConfig?.leveling?.enabled === false) {
            return interaction.editReply({
                embeds: [createErrorEmbed('❌ معطّل', 'نظام المستويات معطّل في هذا السيرفر.')],
            });
        }

        // Fetch or create user data
        let userData = await User.findOne({ userId: targetUser.id, guildId });
        if (!userData) {
            userData = await User.create({ userId: targetUser.id, guildId });
        }

        // Calculate rank position: count users with higher (level, xp) combination
        let rankPosition = 1;
        try {
            // Count users who have strictly higher level, or same level but higher XP
            rankPosition = await User.countDocuments({
                guildId,
                $or: [
                    { level: { $gt: userData.level } },
                    { level: userData.level, xp: { $gt: userData.xp } },
                ],
            });
            rankPosition += 1; // +1 because rank starts at 1
        } catch (e) {
            logger.warn(`[leveling] Failed to calculate rank position: ${e.message}`);
            rankPosition = '?';
        }

        // Try to generate rank card image
        const isCanvasOk = canvasAvailable();

        if (isCanvasOk) {
            // Fetch the target member for avatar and guild member count
            let targetMember = null;
            try {
                targetMember = await interaction.guild.members.fetch(targetUser.id);
            } catch (e) {
                // Member might not be in the guild anymore
                targetMember = null;
            }

            // Build rank card options
            const rankCardOptions = {
                background: guildConfig?.leveling?.rankCard?.background || 'default',
            };

            const imageBuffer = await drawRankCard(
                targetMember,
                interaction.guild,
                userData,
                typeof rankPosition === 'number' ? rankPosition : 1,
                rankCardOptions
            );

            if (imageBuffer) {
                const attachment = new AttachmentBuilder(imageBuffer, { name: 'rank-card.png' });

                const embed = new EmbedBuilder()
                    .setColor(getLevelColor(userData.level))
                    .setTitle(`📊 كرت رتبة ${targetUser.username}`)
                    .setDescription(
                        `> **الترتيب:** #${rankPosition} | **المستوى:** ${userData.level} | **الطبقة:** ${getTierName(userData.level)}`
                    )
                    .setImage('attachment://rank-card.png')
                    .setTimestamp();

                return interaction.editReply({ embeds: [embed], files: [attachment] });
            }
        }

        // Fallback: if canvas is not available, send a text-based rank card
        const xpNeeded = xpForLevel(userData.level);
        const progress = xpNeeded > 0 ? Math.min((userData.xp / xpNeeded) * 100, 100) : 0;
        const progressBar = buildTextProgressBar(progress, 20);
        const tierColor = getLevelColor(userData.level);
        const tierName = getTierName(userData.level);

        const embed = new EmbedBuilder()
            .setColor(tierColor)
            .setAuthor({
                name: targetUser.username,
                iconURL: targetUser.displayAvatarURL({ format: 'png', size: 128 }),
            })
            .setTitle(`📊 كرت الرتبة`)
            .addFields(
                { name: '🏅 الترتيب', value: `**#${rankPosition}**`, inline: true },
                { name: '⭐ المستوى', value: `**${userData.level}**`, inline: true },
                { name: '🏷️ الطبقة', value: `**${tierName}**`, inline: true },
                { name: '📊 الخبرة', value: `${progressBar} **${userData.xp.toLocaleString()}** / **${xpNeeded.toLocaleString()}** XP`, inline: false },
                { name: '💬 الرسائل', value: `${userData.totalMessages.toLocaleString()} رسالة`, inline: true },
                { name: '👥 الأعضاء', value: `${interaction.guild.memberCount.toLocaleString()} عضو`, inline: true },
            )
            .setThumbnail(targetUser.displayAvatarURL({ format: 'png', size: 128 }))
            .setFooter({ text: `${interaction.guild.name} | Family Legends Bot` })
            .setTimestamp();

        return interaction.editReply({ embeds: [embed] });
    } catch (error) {
        logger.error('[leveling] Error in rank subcommand:', error);
        try {
            await interaction.editReply({
                embeds: [createErrorEmbed('❌ خطأ', 'حدث خطأ أثناء عرض كرت الرتبة.')],
            });
        } catch (e) {
            // Fallback if reply was not deferred
        }
    }
}

/**
 * Handle the "المتصدرون" (leaderboard) subcommand.
 * Shows top 25 users per page as an embed.
 * @async
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @returns {Promise<void>}
 */
async function handleLeaderboard(interaction) {
    try {
        await interaction.deferReply();

        const guildId = interaction.guild.id;
        const page = interaction.options.getInteger('صفحة') || 1;
        const perPage = 25;
        const skip = (page - 1) * perPage;

        // Fetch guild config
        let guildConfig = null;
        try {
            guildConfig = await ServerConfig.get();
        } catch (e) {
            // Ignore
        }

        // Check if leveling is enabled for this guild
        if (guildConfig?.leveling?.enabled === false) {
            return interaction.editReply({
                embeds: [createErrorEmbed('❌ معطّل', 'نظام المستويات معطّل في هذا السيرفر.')],
            });
        }

        // Get total count for pagination info
        const totalUsers = await User.countDocuments({ guildId });
        const totalPages = Math.ceil(totalUsers / perPage);

        if (totalUsers === 0) {
            return interaction.editReply({
                embeds: [createInfoEmbed('📊 لوحة المتصدرين', 'لا توجد بيانات مستويات لهذا السيرفر بعد. ابدأ بالتحدث لكسب الخبرة!')],
            });
        }

        // Fetch users sorted by level DESC, xp DESC
        const topUsers = await User.find({ guildId })
            .sort({ level: -1, xp: -1 })
            .skip(skip)
            .limit(perPage);

        if (topUsers.length === 0) {
            return interaction.editReply({
                embeds: [createInfoEmbed('📊 لوحة المتصدرين', `لا توجد بيانات في هذه الصفحة. الصفحة ${page} فارغة.`)],
            });
        }

        // Fetch user objects for display names and avatars
        const medals = ['🥇', '🥈', '🥉'];
        const memberCache = interaction.guild.members.cache;

        // Pre-fetch all users to avoid N+1 problem
        const discordUsers = await Promise.all(
            topUsers.map(async (u) => {
                const cached = memberCache.get(u.userId);
                if (cached) return cached.user;
                try {
                    return await interaction.client.users.fetch(u.userId);
                } catch {
                    return null;
                }
            })
        );

        let leaderboardText = '';
        for (let i = 0; i < topUsers.length; i++) {
            const user = topUsers[i];
            const userObj = discordUsers[i];
            const globalRank = skip + i + 1;

            const displayName = userObj ? userObj.username : `عضو_${user.userId.slice(0, 6)}`;
            const avatarUrl = userObj
                ? userObj.displayAvatarURL({ format: 'png', size: 32 })
                : null;
            const xpNeeded = xpForLevel(user.level);

            const medal = globalRank <= 3 ? medals[globalRank - 1] : `\`${globalRank}.\``;
            const avatarDisplay = avatarUrl ? `[${displayName}](${avatarUrl})` : displayName;

            leaderboardText += `${medal} ${avatarDisplay} — **المستوى ${user.level}** | \`${user.xp.toLocaleString()}/${xpNeeded.toLocaleString()} XP\` | 💬 ${user.totalMessages}\n`;
        }

        const embed = new EmbedBuilder()
            .setColor('#FFD700')
            .setTitle(`🏆 لوحة المتصدرين — ${interaction.guild.name}`)
            .setDescription(leaderboardText)
            .setFooter({
                text: `الصفحة ${page} من ${totalPages} | إجمالي ${totalUsers} عضو | Family Legends Bot`,
            })
            .setTimestamp();

        return interaction.editReply({ embeds: [embed] });
    } catch (error) {
        logger.error('[leveling] Error in leaderboard subcommand:', error);
        try {
            await interaction.editReply({
                embeds: [createErrorEmbed('❌ خطأ', 'حدث خطأ أثناء تحميل لوحة المتصدرين.')],
            });
        } catch (e) {
            // Fallback
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// Utility functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Build a text-based progress bar.
 * @param {number} percentage - Progress percentage (0-100)
 * @param {number} length - Total bar length in characters
 * @returns {string} Progress bar string
 */
function buildTextProgressBar(percentage, length) {
    const filled = Math.round((percentage / 100) * length);
    const empty = length - filled;
    return `${'█'.repeat(filled)}${'░'.repeat(empty)}`;
}
