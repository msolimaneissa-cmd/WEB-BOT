/**
 * @file src/database/schemas/notificationSchema.js
 * @description Mongoose schema for external-platform notifications.
 * Supports Twitch, YouTube, Twitter, and Reddit stream/post alerts.
 */

const mongoose = require('mongoose');

/** @type {import('mongoose').Schema} Notification schema */
const notificationSchema = new mongoose.Schema({
    guildId: { type: String, required: true, index: true },
    platform: {
        type: String,
        enum: ['twitch', 'youtube', 'twitter', 'reddit'],
        required: true,
    },
    username: { type: String, required: true },       // account to monitor
    channelId: { type: String, required: true },       // target Discord channel
    mentionRoleId: { type: String, default: null },
    mentionEveryone: { type: Boolean, default: false },
    enabled: { type: Boolean, default: true },
    lastNotified: { type: Date, default: null },
    customMessage: { type: String, default: null },
    extra: {
        // Twitch-specific
        streamTitle: { type: String, default: null },
        gameName: { type: String, default: null },
        // YouTube-specific
        ytChannelId: { type: String, default: null },
        // Twitter-specific
        keywords: [{ type: String }],
        minLikes: { type: Number, default: 0 },
        minRetweets: { type: Number, default: 0 },
        // Reddit-specific
        subreddit: { type: String, default: null },
        minUpvotes: { type: Number, default: 0 },
        postType: {
            type: String,
            enum: ['hot', 'new', 'top'],
            default: 'hot',
        },
    },
    checkInterval: { type: Number, default: 60 },     // seconds
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

// ── Indexes ──────────────────────────────────────────────────────────────
// guildId already indexed via schema option.

// Compound index: guildId + platform for efficient filtering
notificationSchema.index({ guildId: 1, platform: 1 });

// ── Static Helpers ───────────────────────────────────────────────────────

/**
 * Get all notifications for a guild.
 * @param {string} guildId
 * @returns {Promise<Notification[]>}
 */
notificationSchema.statics.getGuildNotifications = async function (guildId) {
    return this.find({ guildId }).sort({ createdAt: 1 });
};

/**
 * Get enabled notifications, optionally filtered by platform.
 * @param {string} guildId
 * @param {string} [platform]
 * @returns {Promise<Notification[]>}
 */
notificationSchema.statics.getEnabledNotifications = async function (guildId, platform) {
    const query = { guildId, enabled: true };
    if (platform) query.platform = platform;
    return this.find(query).sort({ createdAt: 1 });
};

module.exports = mongoose.model('Notification', notificationSchema);
