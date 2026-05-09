/**
 * @file src/services/protectionService.js
 * @description Core logic for the protection system (Anti-Nuke, etc.).
 */

const actionTracker = new Map();

// Periodic cleanup to prevent memory leaks - every 10 minutes
setInterval(() => {
    const now = Date.now();
    for (const [key, data] of actionTracker.entries()) {
        // Remove entries older than 5 minutes since they're expired
        if (now - data.firstAction > 300000) {
            actionTracker.delete(key);
        }
    }
}, 600000);

/**
 * Tracks a potentially malicious action and checks if it exceeds the limit.
 * @param {string} executorId - The ID of the user performing the action.
 * @param {string} actionType - The type of action (e.g., 'channel_delete').
 * @param {string} guildId - The ID of the guild.
 * @param {Object} config - The guild's protection configuration.
 * @returns {boolean} - Returns true if the limit is exceeded.
 */
function trackAction(executorId, actionType, guildId, config) {
    if (!config?.protection?.antiNuke?.enabled) return false;

    const key = `${guildId}_${executorId}_${actionType}`;
    const now = Date.now();
    const cooldown = config.protection.antiNuke.cooldown || 60000;
    
    let data = actionTracker.get(key);

    // Reset if cooldown passed or doesn't exist
    if (!data || (now - data.firstAction > cooldown)) {
        data = { count: 1, firstAction: now };
    } else {
        data.count++;
    }

    actionTracker.set(key, data);

    // Get limit based on action type
    let limit = 3;
    switch (actionType) {
        case 'channel_delete':
            limit = config.protection.antiNuke.maxChannelDelete || 3;
            break;
        case 'role_delete':
            limit = config.protection.antiNuke.maxRoleDelete || 3;
            break;
        case 'member_kick':
            limit = config.protection.antiNuke.maxKick || 5;
            break;
        case 'member_ban':
            limit = config.protection.antiNuke.maxBan || 5;
            break;
    }

    return data.count > limit;
}

/**
 * Resets the tracker for a specific user and action.
 * @param {string} executorId 
 * @param {string} actionType 
 * @param {string} guildId 
 */
function resetActionTracker(executorId, actionType, guildId) {
    const key = `${guildId}_${executorId}_${actionType}`;
    actionTracker.delete(key);
}

module.exports = {
    trackAction,
    resetActionTracker,
};
