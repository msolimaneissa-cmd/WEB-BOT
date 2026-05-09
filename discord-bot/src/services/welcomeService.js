/**
 * @file src/services/welcomeService.js
 * @description خدمة الترحيب المتقدمة - أفضل من ProBot و Carl-bot
 * تدعم رسائل ترحيب مخصصة، صور ديناميكية، ودور تلقائي
 */

const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const ServerConfig = require('../database/schemas/serverConfigSchema');
const User = require('../database/schemas/userSchema');
const { createWelcomeImage } = require('../utils/welcomeImage');
const logger = require('../utils/logger');

/**
 * إرسال رسالة ترحيب مخصصة
 * @param {Object} options
 * @param {import('discord.js').GuildMember} member - العضو الجديد
 * @returns {Promise<Object>}
 */
async function sendWelcomeMessage({ member }) {
    try {
        const guildId = member.guild.id;
        const config = await ServerConfig.findOne({ guildId });
        const welcomeConfig = config?.welcome || {};

        if (!welcomeConfig.enabled) {
            return { success: false, error: 'الترحيب معطل' };
        }

        const channel = member.guild.channels.cache.get(welcomeConfig.channelId);
        if (!channel || !channel.isTextBased()) {
            return { success: false, error: 'قناة الترحيب غير موجودة' };
        }

        // معالجة المتغيرات في الرسالة
        const message = processWelcomeVariables(welcomeConfig.message || '', member);
        
        let sendMessageOptions = {};

        // إذا كان هناك صورة مخصصة
        if (welcomeConfig.useCustomImage) {
            const imageBuffer = await createWelcomeImage(member);
            const attachment = new AttachmentBuilder(imageBuffer, { name: 'welcome.png' });
            sendMessageOptions.files = [attachment];
        }

        // إذا كان هناك Embed
        if (welcomeConfig.useEmbed) {
            const embed = createWelcomeEmbed(welcomeConfig.embedData || {}, member);
            sendMessageOptions.embeds = [embed];
        }

        // إضافة النص
        if (message) {
            sendMessageOptions.content = message;
        }

        await channel.send(sendMessageOptions);

        // منح الدور التلقائي
        if (welcomeConfig.autoRole) {
            await giveAutoRole(member, welcomeConfig.autoRole);
        }

        logger.info(`👋 تم ترحيب بـ ${member.user.tag} في ${member.guild.name}`);

        return { success: true };

    } catch (error) {
        logger.error('خطأ في إرسال الترحيب:', error);
        return { success: false, error: error.message };
    }
}

/**
 * معالجة متغيرات رسالة الترحيب
 * @param {string} template
 * @param {import('discord.js').GuildMember} member
 * @returns {string}
 */
function processWelcomeVariables(template, member) {
    const variables = {
        '{user}': member.user.username,
        '{mention}': `<@${member.user.id}>`,
        '{tag}': member.user.tag,
        '{server}': member.guild.name,
        '{members}': member.guild.memberCount.toString(),
        '{id}': member.user.id,
        '{created_at}': member.user.createdAt.toLocaleDateString('ar-SA'),
        '{joined_at}': member.joinedAt.toLocaleDateString('ar-SA')
    };

    let result = template;
    for (const [placeholder, value] of Object.entries(variables)) {
        result = result.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value);
    }

    return result;
}

/**
 * إنشاء Embed ترحيبي
 * @param {Object} embedData
 * @param {import('discord.js').GuildMember} member
 * @returns {EmbedBuilder}
 */
function createWelcomeEmbed(embedData, member) {
    const embed = new EmbedBuilder();

    if (embedData.title) {
        embed.setTitle(processWelcomeVariables(embedData.title, member));
    }

    if (embedData.description) {
        embed.setDescription(processWelcomeVariables(embedData.description, member));
    }

    if (embedData.color) {
        embed.setColor(embedData.color);
    } else {
        embed.setColor('#5865F2');
    }

    if (embedData.thumbnail && member.user.displayAvatarURL()) {
        embed.setThumbnail(member.user.displayAvatarURL({ size: 256 }));
    }

    if (embedData.image) {
        embed.setImage(embedData.image);
    }

    if (embedData.footer) {
        embed.setFooter({
            text: processWelcomeVariables(embedData.footer.text, member),
            iconURL: embedData.footer.icon_url || member.user.displayAvatarURL()
        });
    }

    if (embedData.author) {
        embed.setAuthor({
            name: processWelcomeVariables(embedData.author.name, member),
            iconURL: embedData.author.icon_url
        });
    }

    if (embedData.timestamp !== false) {
        embed.setTimestamp();
    }

    if (embedData.fields && Array.isArray(embedData.fields)) {
        for (const field of embedData.fields) {
            embed.addFields({
                name: processWelcomeVariables(field.name, member),
                value: processWelcomeVariables(field.value, member),
                inline: field.inline || false
            });
        }
    }

    return embed;
}

/**
 * منح دور تلقائي للعضو
 * @param {import('discord.js').GuildMember} member
 * @param {string|string[]} roleIds
 * @returns {Promise<boolean>}
 */
async function giveAutoRole(member, roleIds) {
    try {
        const roles = Array.isArray(roleIds) ? roleIds : [roleIds];
        const validRoles = [];

        for (const roleId of roles) {
            const role = member.guild.roles.cache.get(roleId);
            if (role && !member.roles.cache.has(roleId)) {
                if (member.guild.roles.everyone.position > role.position) {
                    validRoles.push(roleId);
                }
            }
        }

        if (validRoles.length > 0) {
            await member.roles.add(validRoles);
            return true;
        }

        return false;

    } catch (error) {
        logger.error('خطأ في منح الدور التلقائي:', error);
        return false;
    }
}

/**
 * تحديث إعدادات الترحيب
 * @param {string} guildId
 * @param {Object} updates
 * @returns {Promise<Object>}
 */
async function updateWelcomeConfig(guildId, updates) {
    try {
        let config = await ServerConfig.findOne({ guildId });

        if (!config) {
            config = await ServerConfig.create({ guildId });
        }

        if (!config.welcome) {
            config.welcome = {};
        }

        Object.assign(config.welcome, updates);
        await config.save();

        return { success: true, config: config.welcome };

    } catch (error) {
        logger.error('خطأ في تحديث إعدادات الترحيب:', error);
        return { success: false, error: error.message };
    }
}

/**
 * الحصول على إعدادات الترحيب
 * @param {string} guildId
 * @returns {Promise<Object>}
 */
async function getWelcomeConfig(guildId) {
    try {
        const config = await ServerConfig.findOne({ guildId });
        return config?.welcome || {
            enabled: false,
            channelId: null,
            message: '',
            useCustomImage: false,
            useEmbed: false,
            autoRole: null
        };

    } catch (error) {
        logger.error('خطأ في الحصول على إعدادات الترحيب:', error);
        return null;
    }
}

module.exports = {
    sendWelcomeMessage,
    processWelcomeVariables,
    createWelcomeEmbed,
    giveAutoRole,
    updateWelcomeConfig,
    getWelcomeConfig
};
