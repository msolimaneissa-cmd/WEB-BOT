/**
 * @file src/utils/permissions.js
 * @description Provides permission and role hierarchy checking utilities
 * for moderation actions.
 */

/**
 * Check if a member has a specific permission
 * @param {import('discord.js').GuildMember} member
 * @param {bigint} permission
 * @returns {boolean}
 */
function hasPermission(member, permission) {
    if (!member) return false;
    return member.permissions.has(permission) || member.permissions.has('Administrator');
}

/**
 * Check if the bot can moderate a target member (hierarchy check)
 * @param {import('discord.js').GuildMember} botMember
 * @param {import('discord.js').GuildMember} targetMember
 * @returns {boolean}
 */
function canModerate(botMember, targetMember) {
    if (!botMember || !targetMember) return false;
    if (botMember.id === targetMember.id) return false;
    return botMember.roles.highest.position > targetMember.roles.highest.position;
}

/**
 * Check if a user can moderate a target member
 * @param {import('discord.js').GuildMember} userMember
 * @param {import('discord.js').GuildMember} targetMember
 * @returns {boolean}
 */
function userCanModerate(userMember, targetMember) {
    if (!userMember || !targetMember) return false;
    if (userMember.id === userMember.guild.ownerId) return true;
    if (userMember.id === targetMember.id) return false;
    return userMember.roles.highest.position > targetMember.roles.highest.position;
}

/**
 * Check if both the user and the bot can moderate the target
 * @param {import('discord.js').GuildMember} userMember
 * @param {import('discord.js').GuildMember} botMember
 * @param {import('discord.js').GuildMember} targetMember
 * @returns {{ userCan: boolean, botCan: boolean }}
 */
function checkModerationChain(userMember, botMember, targetMember) {
    return {
        userCan: userCanModerate(userMember, targetMember),
        botCan: canModerate(botMember, targetMember),
    };
}

/**
 * Check if a member is considered staff based on guild configuration
 * @param {import('discord.js').GuildMember} member
 * @param {Object} guildConfig
 * @returns {boolean}
 */
function isStaff(member, guildConfig) {
    if (!member) return false;
    if (member.permissions.has('Administrator')) return true;
    if (!guildConfig) return false;

    // Check staffRoles array from mod settings
    const staffRoles = guildConfig.mod?.staffRoles || [];
    if (staffRoles.length > 0 && member.roles.cache.some(role => staffRoles.includes(role.id))) {
        return true;
    }

    // Check legacy mod/admin roles
    const modRoleId = guildConfig.mod?.modRoleId;
    const adminRoleId = guildConfig.mod?.adminRoleId;
    if (modRoleId && member.roles.cache.has(modRoleId)) return true;
    if (adminRoleId && member.roles.cache.has(adminRoleId)) return true;

    return false;
}

module.exports = {
    hasPermission,
    canModerate,
    userCanModerate,
    checkModerationChain,
    isStaff,
};
