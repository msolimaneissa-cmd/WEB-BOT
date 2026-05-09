/**
 * @file events/guildMemberRemove.js
 * @description Handles the guildMemberRemove event. Logs when a member
 * leaves, is kicked, or is banned from the server. Includes optional
 * goodbye card image generation.
 */

const { EmbedBuilder, AttachmentBuilder, AuditLogEvent } = require('discord.js');
const ServerConfig = require('../database/schemas/serverConfigSchema');
const { isDatabaseConnected } = require('../database/connect');
const logger = require('../utils/logger');
const { drawWelcomeCard } = require('../utils/welcomeImage');
const { config } = require('../config');

/**
 * @module events/guildMemberRemove
 * @description Event handler for when a member leaves or is removed from a guild.
 */
module.exports = {
    /** @type {string} Event name */
    name: 'guildMemberRemove',

    /**
     * Executes when a member is removed from the guild.
     * @async
     * @param {import('discord.js').GuildMember} member - The member who left/was removed.
     * @returns {Promise<void>}
     */
    async execute(member) {
        // ─── بوابة الأمان (Security Gate) ───
        if (!member.guild || member.guild.id !== config.mainGuildId) return;
        
        let guildConfig = null;
        let logChannelId = null;

        if (isDatabaseConnected()) {
            try {
                guildConfig = await ServerConfig.get();
                if (guildConfig && guildConfig.mod && guildConfig.mod.logChannelId) {
                    logChannelId = guildConfig.mod.logChannelId;
                }
            } catch (error) {
                logger.error('Database error in guildMemberRemove:', error);
            }
        }

        // ═══════════════════════════════════════════════════════════════
        // 📋 Log to mod-log channel (existing behavior)
        // ═══════════════════════════════════════════════════════════════
        let logChannel = null;
        if (logChannelId) {
            logChannel = member.guild.channels.cache.get(logChannelId);
        } else {
            // Fallback: find a channel containing 'سجل'
            logChannel = member.guild.channels.cache.find(c => c.name.includes('سجل') && c.isTextBased());
        }

        if (logChannel &&
            logChannel.permissionsFor(member.guild.members.me).has(['SendMessages', 'EmbedLinks'])) {
            // Calculate days in server
            const joinedAt = member.joinedTimestamp;
            const leftAt = Date.now();
            const durationMs = leftAt - joinedAt;
            const daysInServer = Math.floor(durationMs / (1000 * 60 * 60 * 24));

            // Determine if kicked/banned or left voluntarily
            let reason = 'مغادرة';
            let actionExecutor = null;

            if (member.guild.members.me.permissions.has('ViewAuditLog')) {
                try {
                    // Check kicks
                    const kickLogs = await member.guild.fetchAuditLogs({
                        limit: 1,
                        type: AuditLogEvent.MemberKick,
                    });
                    const kickLog = kickLogs.entries.first();

                    // Check bans
                    const banLogs = await member.guild.fetchAuditLogs({
                        limit: 1,
                        type: AuditLogEvent.MemberBanAdd,
                    });
                    const banLog = banLogs.entries.first();

                    if (kickLog && kickLog.target.id === member.id && kickLog.createdTimestamp > (Date.now() - 5000)) {
                        reason = 'مطرود';
                        actionExecutor = kickLog.executor;
                    } else if (banLog && banLog.target.id === member.id && banLog.createdTimestamp > (Date.now() - 5000)) {
                        reason = 'محظور';
                        actionExecutor = banLog.executor;
                    }
                } catch (error) {
                    logger.error('Error fetching audit logs:', error);
                }
            }

            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setAuthor({ name: `لقد غادر ${member.user.tag}`, iconURL: member.user.displayAvatarURL({ dynamic: true }) })
                .addFields(
                    { name: '⏱️ المدة في السيرفر', value: `${daysInServer} يوم`, inline: true },
                    { name: '🎭 عدد الأدوار', value: `${member.roles.cache.size - 1}`, inline: true },
                    { name: 'السبب', value: reason, inline: false },
                )
                .setFooter({ text: `المعرف: ${member.id}` })
                .setTimestamp();

            if (actionExecutor) {
                embed.addFields({ name: 'بواسطة', value: `${actionExecutor.tag}`, inline: true });
            }

            await logChannel.send({ embeds: [embed] }).catch(err => logger.error(err));
        }

        // ═══════════════════════════════════════════════════════════════
        // 👋 Goodbye message (with optional image)
        // ═══════════════════════════════════════════════════════════════
        const goodbyeEnabled = guildConfig?.goodbye?.enabled ?? false;
        if (!goodbyeEnabled) return;

        // Determine goodbye channel
        let goodbyeChannel = null;
        const goodbyeChannelId = guildConfig?.goodbye?.channelId;

        if (goodbyeChannelId) {
            goodbyeChannel = member.guild.channels.cache.get(goodbyeChannelId);
        } else {
            // Fallback: use same channel as welcome or find a goodbye/welcome channel
            const welcomeChannelId = guildConfig?.welcome?.channelId;
            if (welcomeChannelId) {
                goodbyeChannel = member.guild.channels.cache.get(welcomeChannelId);
            }
            if (!goodbyeChannel) {
                goodbyeChannel = member.guild.channels.cache.find(c =>
                    (c.name.includes('وداع') || c.name.includes('goodbye') ||
                     c.name.includes('ترحيب') || c.name.includes('welcome') ||
                     c.name.includes('general')) &&
                    c.isTextBased()
                );
            }
        }

        if (!goodbyeChannel) return;

        if (!goodbyeChannel.permissionsFor(member.guild.members.me).has(['SendMessages', 'EmbedLinks'])) {
            return;
        }

        const guildName = member.guild.name;
        const memberCount = member.guild.memberCount;
        const userTag = member.user.tag;

        // Custom goodbye message
        let goodbyeMessage = guildConfig?.goodbye?.message || 'وداعاً {user}!';
        goodbyeMessage = goodbyeMessage
            .replace('{user}', userTag)
            .replace('{guild}', guildName)
            .replace('{memberCount}', String(memberCount));

        // Generate goodbye image if enabled
        const welcomeImageConfig = guildConfig?.welcomeImage || {};
        const goodbyeImageEnabled = welcomeImageConfig.enabled ?? false;
        let goodbyeAttachment = null;

        if (goodbyeImageEnabled) {
            try {
                const imageBuffer = await drawWelcomeCard(member, member.guild, {
                    background: welcomeImageConfig.background || 'default',
                    font: welcomeImageConfig.font || 'Cairo',
                    color: welcomeImageConfig.color || '#FFFFFF',
                    showAvatar: welcomeImageConfig.showAvatar ?? true,
                    showUsername: welcomeImageConfig.showUsername ?? true,
                    showMemberCount: welcomeImageConfig.showMemberCount ?? true,
                    showServerIcon: welcomeImageConfig.showServerIcon ?? false,
                    type: 'goodbye',
                });

                if (imageBuffer) {
                    goodbyeAttachment = new AttachmentBuilder(imageBuffer, {
                        name: 'goodbye.png',
                    });
                }
            } catch (error) {
                logger.error(`[guildMemberRemove] Failed to generate goodbye image: ${error.message}`);
            }
        }

        // Build goodbye embed
        const goodbyeEmbed = new EmbedBuilder()
            .setColor('#ED4245')
            .setAuthor({
                name: `👋 لقد غادر ${userTag}`,
                iconURL: member.user.displayAvatarURL({ dynamic: true }),
            })
            .setDescription(goodbyeMessage)
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
            .addFields(
                { name: '👥 أعضاء السيرفر', value: `**${memberCount}**`, inline: true },
                { name: '📅 تاريخ الانضمام', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`, inline: true },
            )
            .setFooter({
                text: `${userTag} | ${member.id}`,
                iconURL: member.user.displayAvatarURL({ dynamic: true }),
            })
            .setTimestamp();

        // Send with or without image
        if (goodbyeAttachment) {
            goodbyeEmbed.setImage('attachment://goodbye.png');
            await goodbyeChannel.send({
                embeds: [goodbyeEmbed],
                files: [goodbyeAttachment],
            }).catch(err => logger.error(err));
        } else {
            await goodbyeChannel.send({ embeds: [goodbyeEmbed] }).catch(err => logger.error(err));
        }
    },
};
