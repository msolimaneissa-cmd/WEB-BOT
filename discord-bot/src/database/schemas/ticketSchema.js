/**
 * @file src/database/schemas/ticketSchema.js
 * @description Mongoose schema for support tickets.
 * Tracks ticket channels, creators, status, and transcript links.
 */

const mongoose = require('mongoose');

/** @type {import('mongoose').Schema} Ticket schema */
const ticketSchema = new mongoose.Schema({
    guildId: { type: String, required: true, index: true },
    channelId: { type: String, required: true, unique: true },
    userId: { type: String, required: true },
    userTag: { type: String, default: null },
    category: { type: String, default: null },           // category name
    subject: { type: String, default: null },
    supportRoleIds: [{ type: String }],
    status: {
        type: String,
        enum: ['open', 'closed', 'transcript'],
        default: 'open',
        index: true,
    },
    closedBy: { type: String, default: null },
    closedAt: { type: Date, default: null },
    transcriptUrl: { type: String, default: null },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

// ── Indexes ──────────────────────────────────────────────────────────────
// guildId indexed via schema option.
// channelId has a unique index via schema option.

// ── Static Helpers ───────────────────────────────────────────────────────

/**
 * Get tickets for a guild, optionally filtered by status.
 * @param {string} guildId
 * @param {'open'|'closed'|'transcript'} [status]
 * @returns {Promise<Ticket[]>}
 */
ticketSchema.statics.getGuildTickets = async function (guildId, status) {
    const query = { guildId };
    if (status) query.status = status;
    return this.find(query).sort({ createdAt: -1 });
};

/**
 * Count how many open tickets a user currently has in a guild.
 * @param {string} guildId
 * @param {string} userId
 * @returns {Promise<number>}
 */
ticketSchema.statics.getUserOpenTickets = async function (guildId, userId) {
    return this.countDocuments({ guildId, userId, status: 'open' });
};

/**
 * Return aggregated ticket statistics for a guild.
 * @param {string} guildId
 * @returns {Promise<{ open: number, closed: number, total: number }>}
 */
ticketSchema.statics.getTicketStats = async function (guildId) {
    const [open, closed, total] = await Promise.all([
        this.countDocuments({ guildId, status: 'open' }),
        this.countDocuments({ guildId, status: 'closed' }),
        this.countDocuments({ guildId }),
    ]);
    return { open, closed, total };
};

module.exports = mongoose.model('Ticket', ticketSchema);
