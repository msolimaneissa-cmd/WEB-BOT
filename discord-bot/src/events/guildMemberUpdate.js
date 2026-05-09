/**
 * @file events/guildMemberUpdate.js
 * @description نظام رصد تعزيز السيرفر (Server Boost) وإرسال رسائل شكر مخصصة.
 */

const { EmbedBuilder } = require('discord.js');
const ServerConfig = require('../database/schemas/serverConfigSchema');
const { isDatabaseConnected } = require('../database/connect');
const logger = require('../utils/logger');
const { config } = require('../config');

/**
 * @module events/guildMemberUpdate
 */
module.exports = {
    name: 'guildMemberUpdate',

    /**
     * Executes when a member's data is updated.
     * Detects server boost events.
     * @async
     * @param {import('discord.js').GuildMember} oldMember - Previous state
     * @param {import('discord.js').GuildMember} newMember - Current state
     * @returns {Promise<void>}
     */
    async execute(oldMember, newMember) {
        // ─── بوابة الأمان (Security Gate) ───
        if (!newMember.guild || newMember.guild.id !== config.mainGuildId) return;
        
        // التحقق من بدء التعزيز (Boost)
        const oldBoost = oldMember.premiumSince;
        const newBoost = newMember.premiumSince;

        if (!oldBoost && newBoost) {
            logger.info(`✨ سيرفر ${newMember.guild.name} حصل على دعم جديد من: ${newMember.user.tag}`);
            
            if (!isDatabaseConnected()) return;

            try {
                const guildConfig = await ServerConfig.get();
                const config = guildConfig?.booster;

                if (config?.enabled && config?.channelId) {
                    const channel = newMember.guild.channels.cache.get(config.channelId);
                    if (channel) {
                        const messageTemplate = config.message || 'شكراً {user} على دعمك للسيرفر! ✨';
                        const content = messageTemplate
                            .replace('{user}', `<@${newMember.id}>`)
                            .replace('{guild}', newMember.guild.name)
                            .replace('{boost_count}', newMember.guild.premiumSubscriptionCount);

                        const embed = new EmbedBuilder()
                            .setColor('#FF73FA') // لون الدعم التقليدي (نيون بينك)
                            .setTitle('✨ دعم جديد للسيرفر! ✨')
                            .setAuthor({
                                name: newMember.user.username,
                                iconURL: newMember.user.displayAvatarURL({ dynamic: true })
                            })
                            .setDescription(content)
                            .setThumbnail('https://i.imgur.com/vHqY7bE.png') // أيقونة الدعم
                            .setFooter({ text: 'شكراً لمساهمتك في تطوير السيرفر 😍' })
                            .setTimestamp();

                        await channel.send({ content: `<@${newMember.id}>`, embeds: [embed] });
                    }
                }
            } catch (error) {
                logger.error('Error handling booster message:', error);
            }
        }

        // ─── مزامنة الرتب (Role Sync) ───
        const oldRoles = oldMember.roles.cache.map(r => r.id).sort();
        const newRoles = newMember.roles.cache.map(r => r.id).sort();

        if (JSON.stringify(oldRoles) !== JSON.stringify(newRoles)) {
            if (!isDatabaseConnected()) return;
            try {
                const User = require('../database/schemas/userSchema');
                await User.findOneAndUpdate(
                    { userId: newMember.id, guildId: newMember.guild.id },
                    { $set: { roles: newRoles } },
                    { upsert: true }
                );
                logger.debug(`Synced roles for ${newMember.user.tag}`);
            } catch (error) {
                logger.error('Error syncing roles:', error);
            }
        }
    },
};
