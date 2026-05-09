/**
 * @file src/utils/giveawayHelper.js
 * @description Giveaway management system with persistence and auto-ending.
 */

const { EmbedBuilder } = require('discord.js');
const Giveaway = require('../database/schemas/giveawaySchema');
const logger = require('./logger');

/**
 * Ends a giveaway and picks winners.
 * @param {import('discord.js').Client} client 
 * @param {string} messageId 
 */
async function endGiveaway(client, messageId) {
    try {
        const giveaway = await Giveaway.findOne({ messageId, ended: false });
        if (!giveaway) return;

        const guild = client.guilds.cache.get(giveaway.guildId);
        if (!guild) return;

        const channel = guild.channels.cache.get(giveaway.channelId);
        if (!channel) return;

        const message = await channel.messages.fetch(messageId).catch(() => null);
        if (!message) {
            giveaway.ended = true;
            await giveaway.save();
            return;
        }

        const reaction = message.reactions.cache.get('🎉');
        if (!reaction) {
            giveaway.ended = true;
            await giveaway.save();
            return;
        }

        // Fetch all users who reacted
        const users = await reaction.users.fetch();
        const participantIds = users.filter(u => !u.bot).map(u => u.id);

        if (participantIds.length === 0) {
            giveaway.ended = true;
            await giveaway.save();
            
            const noWinnersEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle(`🎉 انتهت الهبة: ${giveaway.prize}`)
                .setDescription('❌ لم يشارك أحد في الهبة، لا يوجد فائزين.')
                .setTimestamp();
            
            await message.edit({ embeds: [noWinnersEmbed] });
            return channel.send(`❌ لم يشارك أحد في الهبة على **${giveaway.prize}**.`);
        }

        // Filter participants based on requirements
        const eligibleParticipants = [];
        const { requirements } = giveaway;

        for (const userId of participantIds) {
            try {
                const member = await guild.members.fetch(userId).catch(() => null);
                if (!member) continue;

                // 1. Check required role
                if (requirements.requiredRole && !member.roles.cache.has(requirements.requiredRole)) {
                    continue;
                }

                // 2. Check account age (in days)
                if (requirements.minAccountAge > 0) {
                    const accountAge = (Date.now() - member.user.createdTimestamp) / (1000 * 60 * 60 * 24);
                    if (accountAge < requirements.minAccountAge) continue;
                }

                // 3. Check server join age (in days)
                if (requirements.minServerJoin > 0) {
                    const joinAge = (Date.now() - member.joinedTimestamp) / (1000 * 60 * 60 * 24);
                    if (joinAge < requirements.minServerJoin) continue;
                }

                eligibleParticipants.push(userId);
            } catch (err) {
                logger.error(`Error checking requirements for user ${userId}:`, err);
            }
        }

        if (eligibleParticipants.length === 0) {
            giveaway.ended = true;
            await giveaway.save();
            
            const noWinnersEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle(`🎉 انتهت الهبة: ${giveaway.prize}`)
                .setDescription('❌ لم يستوف أحد شروط المشاركة في الهبة.')
                .setTimestamp();
            
            await message.edit({ embeds: [noWinnersEmbed] });
            return channel.send(`❌ لم يستوف أحد شروط المشاركة في الهبة على **${giveaway.prize}**.`);
        }

        // Save all participants for future re-rolls
        giveaway.entries = eligibleParticipants;

        const winners = [];
        const pool = [...eligibleParticipants];
        for (let i = 0; i < Math.min(giveaway.winners, pool.length); i++) {
            const winnerIndex = Math.floor(Math.random() * pool.length);
            winners.push(pool.splice(winnerIndex, 1)[0]);
        }

        giveaway.winnerIds = winners;
        giveaway.ended = true;
        await giveaway.save();

        const winnerMentions = winners.map(id => `<@${id}>`).join(', ');
        const endEmbed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle(`🎉 انتهت الهبة: ${giveaway.prize}`)
            .setDescription(`**الفائزين:** ${winnerMentions}\n**بواسطة:** <@${giveaway.hostId}>`)
            .setTimestamp();

        await message.edit({ embeds: [endEmbed] });
        await channel.send(`مبروك ${winnerMentions}! لقد فزتم بـ **${giveaway.prize}**! 🎉`);
        
        logger.info(`🎉 Giveaway ended: ${giveaway.prize} in ${guild.name}`);
    } catch (error) {
        logger.error(`Error ending giveaway ${messageId}:`, error);
    }
}

/**
 * Starts the giveaway scheduler to check for ending giveaways.
 * @param {import('discord.js').Client} client 
 */
function startGiveawayScheduler(client) {
    setInterval(async () => {
        try {
            const now = new Date();
            const endingSoon = await Giveaway.find({
                endAt: { $lte: now },
                ended: false
            });

            for (const giveaway of endingSoon) {
                await endGiveaway(client, giveaway.messageId);
            }
        } catch (error) {
            logger.error('Error in giveaway scheduler:', error);
        }
    }, 15000); // Check every 15 seconds
    
    logger.info('⏲️ Giveaway scheduler started');
}

module.exports = {
    endGiveaway,
    startGiveawayScheduler
};