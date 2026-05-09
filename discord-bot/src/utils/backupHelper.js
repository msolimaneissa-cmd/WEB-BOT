/**
 * @file src/utils/backupHelper.js
 * @description Helper for creating and restoring server backups.
 */

const { ChannelType } = require('discord.js');
const crypto = require('crypto');
const Backup = require('../database/schemas/backupSchema');
const logger = require('./logger');

/**
 * سحب لقطة (Snapshot) من حالة السيرفر الحالية
 * @param {import('discord.js').Guild} guild 
 * @param {string} creatorId 
 */
async function createBackup(guild, creatorId) {
    const backupId = crypto.randomUUID().replace(/-/g, '').substring(0, 10).toUpperCase();
    
    // 1. معالجة الرتب (Roles)
    const roles = guild.roles.cache
        .filter(r => !r.managed && r.name !== '@everyone')
        .sort((a, b) => b.position - a.position)
        .map(r => ({
            name: r.name,
            color: r.color,
            hoist: r.hoist,
            permissions: r.permissions.bitfield.toString(),
            mentionable: r.mentionable,
            position: r.position
        }));

    // 2. معالجة القنوات (Channels)
    const categories = [];
    const others = [];

    const guildChannels = await guild.channels.fetch();
    
    // القنوات داخل أقسام
    const categoriesList = guildChannels.filter(c => c.type === ChannelType.GuildCategory).sort((a, b) => a.position - b.position);
    
    for (const [_, cat] of categoriesList) {
        const children = guildChannels
            .filter(c => c.parentId === cat.id)
            .sort((a, b) => a.position - b.position)
            .map(c => ({
                name: c.name,
                type: c.type,
                topic: c.topic,
                nsfw: c.nsfw,
                rateLimitPerUser: c.rateLimitPerUser,
                permissions: c.permissionOverwrites.cache.map(p => ({ id: p.id, allow: p.allow.bitfield.toString(), deny: p.deny.bitfield.toString() }))
            }));

        categories.push({
            name: cat.name,
            permissions: cat.permissionOverwrites.cache.map(p => ({ id: p.id, allow: p.allow.bitfield.toString(), deny: p.deny.bitfield.toString() })),
            children
        });
    }

    // القنوات بدون أقسام
    const standaloneChannels = guildChannels.filter(c => !c.parentId && c.type !== ChannelType.GuildCategory);
    for (const [_, c] of standaloneChannels) {
        others.push({
            name: c.name,
            type: c.type,
            topic: c.topic,
            nsfw: c.nsfw,
            rateLimitPerUser: c.rateLimitPerUser,
            permissions: c.permissionOverwrites.cache.map(p => ({ id: p.id, allow: p.allow.bitfield.toString(), deny: p.deny.bitfield.toString() }))
        });
    }

    const backupData = {
        backupId,
        guildId: guild.id,
        creatorId,
        guildName: guild.name,
        guildIcon: guild.iconURL(),
        data: {
            name: guild.name,
            iconURL: guild.iconURL(),
            verificationLevel: guild.verificationLevel,
            explicitContentFilter: guild.explicitContentFilter,
            defaultMessageNotifications: guild.defaultMessageNotifications,
            roles,
            channels: { categories, others }
        }
    };

    return await Backup.create(backupData);
}

/**
 * استعادة حالة السيرفر من نسخة احتياطية
 * تنبيه: هذه العملية ستحذف كافة القنوات والرتب الحالية!
 * @param {import('discord.js').Guild} guild 
 * @param {string} backupId 
 */
async function loadBackup(guild, backupId) {
    const backup = await Backup.findOne({ backupId });
    if (!backup) throw new Error('النسخة الاحتياطية غير موجودة');

    // 1. مسح القنوات الحالية (باستثناء قنوات البوت التقنية إذا وجدت)
    const channels = await guild.channels.fetch();
    const channelDeletePromises = [];
    for (const [_, channel] of channels) {
        channelDeletePromises.push(channel.delete().catch(() => {}));
    }
    await Promise.all(channelDeletePromises);

    // 2. مسح الرتب الحالية (التي يمكن حذفها)
    const roles = await guild.roles.fetch();
    const roleDeletePromises = [];
    for (const [_, role] of roles) {
        if (!role.managed && role.name !== '@everyone' && role.editable) {
            roleDeletePromises.push(role.delete().catch(() => {}));
        }
    }
    await Promise.all(roleDeletePromises);

    // 3. إنشاء الرتب الجديدة
    const roleCreatePromises = backup.data.roles.map(r => {
        return guild.roles.create({
            name: r.name,
            color: r.color,
            hoist: r.hoist,
            permissions: BigInt(r.permissions),
            mentionable: r.mentionable
        }).catch(err => logger.error(`فشل إنشاء رتبة ${r.name}:`, err));
    });
    await Promise.all(roleCreatePromises);

    // 4. إنشاء الأقسام والقنوات (مع تطبيق الصلاحيات)
    for (const cat of backup.data.channels.categories) {
        const category = await guild.channels.create({
            name: cat.name,
            type: ChannelType.GuildCategory,
            permissionOverwrites: cat.permissions?.map(p => ({
                id: p.id,
                allow: BigInt(p.allow),
                deny: BigInt(p.deny)
            })) || []
        });

        for (const child of cat.children) {
            await guild.channels.create({
                name: child.name,
                type: child.type,
                topic: child.topic,
                nsfw: child.nsfw,
                rateLimitPerUser: child.rateLimitPerUser,
                parent: category.id,
                permissionOverwrites: child.permissions?.map(p => ({
                    id: p.id,
                    allow: BigInt(p.allow),
                    deny: BigInt(p.deny)
                })) || []
            });
        }
    }

    // 5. إنشاء القنوات المستقلة (مع تطبيق الصلاحيات)
    for (const c of backup.data.channels.others) {
        await guild.channels.create({
            name: c.name,
            type: c.type,
            topic: c.topic,
            nsfw: c.nsfw,
            rateLimitPerUser: c.rateLimitPerUser,
            permissionOverwrites: c.permissions?.map(p => ({
                id: p.id,
                allow: BigInt(p.allow),
                deny: BigInt(p.deny)
            })) || []
        });
    }

    return true;
}

module.exports = { createBackup, loadBackup };
