/**
 * @file src/events/antiNuke.js
 * @description نظام الحماية المتقدم (Anti-Nuke) لمراقبة ومنع التخريب الجماعي.
 */

const { Events, AuditLogEvent, EmbedBuilder } = require('discord.js');
const ServerConfig = require('../database/schemas/serverConfigSchema');
const { isDatabaseConnected } = require('../database/connect');
const logger = require('../utils/logger');
const { trackAction } = require('../services/protectionService');

// تخزين مؤقت للعمليات (In-memory tracking)
// (Now handled by protectionService)

/**
 * معالجة التنبيه أو العقوبة للمشرف المخرب
 */
async function handleNukeAction(guild, executor, actionType, config) {
    const logChannelId = config.mod?.logChannelId;
    const logChannel = logChannelId ? guild.channels.cache.get(logChannelId) : null;

    if (config.protection.antiNuke.action === 'quarantine') {
        try {
            // سحب جميع الرتب من المشرف (عزل)
            const member = await guild.members.fetch(executor.id);
            const rolesToRemove = member.roles.cache.filter(r => r.id !== guild.id && r.managed === false);
            await member.roles.remove(rolesToRemove, 'نظام Anti-Nuke: اشتباه في عملية تخريب');

            if (logChannel) {
                const embed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('🚨 تم تفعيل نظام Anti-Nuke')
                    .setDescription(`تم رصد محاولة تخريب (**${actionType}**) بواسطة ${executor}.`)
                    .addFields({ name: 'الإجراء المتخذ', value: 'تم سحب جميع الصلاحيات (Quarantine) فوراً.' })
                    .setTimestamp();
                logChannel.send({ content: '@everyone', embeds: [embed] });
            }
            logger.warn(`🚨 Anti-Nuke triggered for ${executor.tag} in ${guild.name} (Action: ${actionType})`);
        } catch (err) {
            logger.error('Failed to quarantine user in Anti-Nuke:', err);
        }
    }
}

module.exports = [
    // ─── 1. مراقبة حذف القنوات ───
    {
        name: Events.ChannelDelete,
        async execute(channel) {
            if (!channel.guild || !isDatabaseConnected()) return;
            const config = await ServerConfig.get();
            if (!config?.protection?.antiNuke?.enabled) return;

            const auditLogs = await channel.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.ChannelDelete });
            const logEntry = auditLogs.entries.first();
            if (!logEntry) return;

            const { executor } = logEntry;
            if (executor.id === channel.client.user.id || executor.id === channel.guild.ownerId) return;

            if (trackAction(executor.id, 'channel_delete', channel.guild.id, config)) {
                await handleNukeAction(channel.guild, executor, 'حذف قنوات جماعي', config);
            }
        }
    },

    // ─── 2. مراقبة حذف الرتب ───
    {
        name: Events.GuildRoleDelete,
        async execute(role) {
            if (!isDatabaseConnected()) return;
            const config = await ServerConfig.get();
            if (!config?.protection?.antiNuke?.enabled) return;

            const auditLogs = await role.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.RoleDelete });
            const logEntry = auditLogs.entries.first();
            if (!logEntry) return;

            const { executor } = logEntry;
            if (executor.id === role.client.user.id || executor.id === role.guild.ownerId) return;

            if (trackAction(executor.id, 'role_delete', role.guild.id, config)) {
                await handleNukeAction(role.guild, executor, 'حذف رتب جماعي', config);
            }
        }
    },

    // ─── 3. مراقبة الطرد الجماعي ───
    {
        name: Events.GuildMemberRemove,
        async execute(member) {
            if (!isDatabaseConnected()) return;
            const config = await ServerConfig.get();
            if (!config?.protection?.antiNuke?.enabled) return;

            const auditLogs = await member.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberKick });
            const logEntry = auditLogs.entries.first();
            if (!logEntry || logEntry.target.id !== member.id) return;

            const { executor } = logEntry;
            if (executor.id === member.client.user.id || executor.id === member.guild.ownerId) return;

            if (trackAction(executor.id, 'member_kick', member.guild.id, config)) {
                await handleNukeAction(member.guild, executor, 'طرد أعضاء جماعي', config);
            }
        }
    }
];
