/**
 * @file src/database/schemas/reactionRoleSchema.js
 * @description Mongoose schema for reaction-role setups.
 * Supports three types: reaction (emoji), button, and select menu.
 * Each setup links to a target message and stores a list of role mappings.
 *
 * @module database/schemas/reactionRoleSchema
 */

const mongoose = require('mongoose');

/** @type {import('mongoose').Schema} Reaction-role configuration schema */
const reactionRoleSchema = new mongoose.Schema({
    guildId: { type: String, required: true, index: true },
    messageId: { type: String, required: true },
    channelId: { type: String, required: true },
    type: { type: String, required: true, enum: ['reaction', 'button', 'select'] },
    exclusive: { type: Boolean, default: false },
    roles: [{
        roleId: { type: String, required: true },
        emoji: { type: String, default: '' },
        label: { type: String, default: '' },
        description: { type: String, default: '' },
        style: { type: String, default: 'PRIMARY', enum: ['PRIMARY', 'SECONDARY', 'SUCCESS', 'DANGER'] },
    }],
    /** ID of the bot's message (for button/select types). Null for reaction type. */
    botMessageId: { type: String, default: null },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

// Compound unique index — one setup per message per guild
reactionRoleSchema.index({ messageId: 1, guildId: 1 }, { unique: true });

// ─── Static helpers ────────────────────────────────────────────

/**
 * Find a reaction-role setup by target message ID and guild ID.
 * @param {string} messageId
 * @param {string} guildId
 * @returns {Promise<import('mongoose').Document|null>}
 */
reactionRoleSchema.statics.findByMessage = async function (messageId, guildId) {
    return await this.findOne({ messageId, guildId });
};

/**
 * Find all reaction-role setups for a given guild.
 * @param {string} guildId
 * @returns {Promise<import('mongoose').Document[]>}
 */
reactionRoleSchema.statics.findAllByGuild = async function (guildId) {
    return await this.find({ guildId });
};

/**
 * Delete all reaction-role setups for a given guild (cleanup).
 * @param {string} guildId
 * @returns {Promise<number>} Number of deleted documents.
 */
reactionRoleSchema.statics.deleteAllByGuild = async function (guildId) {
    const result = await this.deleteMany({ guildId });
    return result.deletedCount;
};
module.exports = mongoose.model('ReactionRole', reactionRoleSchema);
