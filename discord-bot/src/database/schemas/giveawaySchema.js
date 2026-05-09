/**
 * @file src/database/schemas/giveawaySchema.js
 * @description Mongoose schema for giveaway events.
 * Stores giveaway configuration, entries, winners, and requirements.
 */

const mongoose = require('mongoose');

/** @type {import('mongoose').Schema} Giveaway schema */
const giveawaySchema = new mongoose.Schema({
    guildId: { type: String, required: true, index: true },
    channelId: { type: String, required: true },
    messageId: { type: String, required: true, unique: true },
    hostId: { type: String, required: true },
    hostTag: { type: String, default: null },
    prize: { type: String, required: true },
    winners: { type: Number, default: 1, min: 1 },
    endAt: { type: Date, required: true, index: true },
    entries: [{ type: String }],            // user IDs who entered
    winnerIds: [{ type: String }],          // actual winners
    ended: { type: Boolean, default: false },
    requirements: {
        requiredRole: { type: String, default: null },
        minAccountAge: { type: Number, default: 0 },    // in days
        minServerJoin: { type: Number, default: 0 },    // in days
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

// ── Indexes ──────────────────────────────────────────────────────────────
// guildId and endAt already indexed via schema options above.
// messageId has a unique index via schema option.

// ── Static Helpers ───────────────────────────────────────────────────────

/**
 * Get all active (non-ended) giveaways for a guild.
 * @param {string} guildId
 * @returns {Promise<Giveaway[]>}
 */
giveawaySchema.statics.getActiveGuildGiveaways = async function (guildId) {
    return this.find({ guildId, ended: false }).sort({ endAt: 1 });
};

/**
 * Mark a giveaway as ended and return the document.
 * @param {string} messageId
 * @returns {Promise<Giveaway|null>}
 */
giveawaySchema.statics.endGiveaway = async function (messageId) {
    return this.findOneAndUpdate(
        { messageId, ended: false },
        { ended: true },
        { new: true },
    );
};

/**
 * Re-roll winners for a giveaway, excluding previous winners.
 * Picks `winners` count from entries minus previous winner IDs.
 * @param {string} messageId
 * @returns {Promise<{ giveaway: Giveaway, newWinners: string[] } | null>}
 */
giveawaySchema.statics.rerollGiveaway = async function (messageId) {
    const giveaway = await this.findOne({ messageId });
    if (!giveaway) return null;

    // Filter out previous winners from the pool
    const eligible = giveaway.entries.filter(
        (id) => !giveaway.winnerIds.includes(id),
    );

    if (eligible.length === 0) {
        return { giveaway, newWinners: [] };
    }

    // Fisher-Yates partial shuffle to pick N unique winners
    const count = Math.min(giveaway.winners, eligible.length);
    const pool = [...eligible];
    const picked = [];

    for (let i = 0; i < count; i++) {
        const idx = Math.floor(Math.random() * pool.length);
        picked.push(pool.splice(idx, 1)[0]);
    }

    // Persist new winners
    giveaway.winnerIds = picked;
    await giveaway.save();

    return { giveaway, newWinners: picked };
};

module.exports = mongoose.model('Giveaway', giveawaySchema);
