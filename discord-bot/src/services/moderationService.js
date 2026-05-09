/**
 * @file src/services/moderationService.js
 * @description خدمة الإدارة المتقدمة - أفضل من Carl-bot و ProBot
 */

const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const Warning = require('../database/schemas/warningSchema');
const ModAction = require('../database/schemas/modActionSchema');
const ServerConfig = require('../database/schemas/serverConfigSchema');
const logger = require('../utils/logger');

async function warnUser({ guildId, userId, moderatorId, reason, duration }) {
    try {
        const warning = await Warning.create({
            guildId,
            userId,
            moderatorId,
            reason,
            expiresAt: duration ? new Date(Date.now() + duration) : null
        });

        await ModAction.create({
            guildId,
            type: 'warn',
            targetId: userId,
            moderatorId,
            reason
        });

        return { success: true, warning };
    } catch (error) {
        logger.error('خطأ في الإنذار:', error);
        return { success: false, error: error.message };
    }
}

async function kickMember(member, moderatorId, reason) {
    try {
        if (!member.kickable) {
            return { success: false, error: 'لا يمكن طرد هذا العضو' };
        }

        await member.kick(reason);
        
        await ModAction.create({
            guildId: member.guild.id,
            type: 'kick',
            targetId: member.id,
            moderatorId,
            reason
        });

        return { success: true };
    } catch (error) {
        logger.error('خطأ في الطرد:', error);
        return { success: false, error: error.message };
    }
}

async function banMember(member, moderatorId, reason, deleteMessages = 0) {
    try {
        if (!member.bannable) {
            return { success: false, error: 'لا يمكن حظر هذا العضو' };
        }

        await member.ban({ reason, deleteMessageSeconds: deleteMessages * 60 });
        
        await ModAction.create({
            guildId: member.guild.id,
            type: 'ban',
            targetId: member.id,
            moderatorId,
            reason
        });

        return { success: true };
    } catch (error) {
        logger.error('خطأ في الحظر:', error);
        return { success: false, error: error.message };
    }
}

async function getWarnings(userId, guildId) {
    try {
        return await Warning.find({ userId, guildId, expired: false }).sort({ createdAt: -1 });
    } catch (error) {
        logger.error('خطأ في جلب الإنذارات:', error);
        return [];
    }
}

module.exports = {
    warnUser,
    kickMember,
    banMember,
    getWarnings
};
