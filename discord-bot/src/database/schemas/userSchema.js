/**
 * @file src/database/schemas/userSchema.js
 * @description Mongoose schema for per-user per-guild data.
 * Stores economy balance, levels, XP, cooldowns, inventory,
 * personal todos, notes, and reminders.
 */

const mongoose = require('mongoose');

/** @type {import('mongoose').Schema} User data schema */
const userSchema = new mongoose.Schema({
    userId: { type: String, required: true, index: true },
    guildId: { type: String, required: true, index: true },
    roles: { type: [String], default: [] },

    // ── Economy ───────────────────────────────────────────────────────────
    balance: { type: Number, default: 0, min: 0 },
    bank: { type: Number, default: 0, min: 0 },

    // ── Leveling / XP ─────────────────────────────────────────────────────
    level: { type: Number, default: 1, min: 1 },
    xp: { type: Number, default: 0, min: 0 },
    totalMessages: { type: Number, default: 0, min: 0 },
    xpCooldown: { type: Date, default: null },          // for XP rate-limiting

    // ── Economy Cooldowns ─────────────────────────────────────────────────
    dailyCooldown: { type: Date, default: null },
    workCooldown: { type: Date, default: null },
    robCooldown: { type: Date, default: null },
    streak: { type: Number, default: 0, min: 0 },
    lastDaily: { type: Date, default: null },

    // ── Inventory ─────────────────────────────────────────────────────────
    inventory: [{
        itemId: { type: String },
        name: { type: String },
        quantity: { type: Number, min: 0 },
        price: { type: Number, min: 0 },
    }],
    badges: [{
        badgeId: String,
        name: String,
        emoji: String,
        awardedAt: { type: Date, default: Date.now }
    }],

    // ── Personal Todos ────────────────────────────────────────────────────
    todos: [{
        text: { type: String, required: true },
        completed: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now },
    }],

    // ── Personal Notes ────────────────────────────────────────────────────
    notes: [{
        title: { type: String, required: true },
        content: { type: String, default: '' },
        createdAt: { type: Date, default: Date.now },
    }],

    // ── Reminders ─────────────────────────────────────────────────────────
    reminders: [{
        text: { type: String, required: true },
        triggerAt: { type: Date, required: true },
        channelId: { type: String, required: true },
        active: { type: Boolean, default: true },
    }],
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

// ── Indexes ──────────────────────────────────────────────────────────────
// Compound unique index: one user record per guild
userSchema.index({ userId: 1, guildId: 1 }, { unique: true });

// Index for reminder lookups (find due reminders across all users)
userSchema.index({ 'reminders.triggerAt': 1 }, { sparse: true });

// ── Static Helpers ───────────────────────────────────────────────────────

/**
 * Find a user record or create one with defaults.
 * @param {string} userId
 * @param {string} guildId
 * @returns {Promise<User>}
 */
userSchema.statics.findOrCreate = async function (userId, guildId) {
    let user = await this.findOne({ userId, guildId });
    if (!user) {
        user = await this.create({ userId, guildId });
    }
    return user;
};

/**
 * Get all active (pending) reminders that are due.
 * @param {Date} now
 * @returns {Promise<User[]>}
 */
userSchema.statics.getDueReminders = async function (now) {
    return this.find({
        'reminders.active': true,
        'reminders.triggerAt': { $lte: now },
    });
};

/**
 * Add a todo item to a user's list.
 * @param {string} userId
 * @param {string} guildId
 * @param {string} text
 * @returns {Promise<User>}
 */
userSchema.statics.addTodo = async function (userId, guildId, text) {
    return this.findOneAndUpdate(
        { userId, guildId },
        { $push: { todos: { text, createdAt: new Date() } } },
        { new: true, upsert: true },
    );
};

/**
 * Add a personal note.
 * @param {string} userId
 * @param {string} guildId
 * @param {string} title
 * @param {string} [content='']
 * @returns {Promise<User>}
 */
userSchema.statics.addNote = async function (userId, guildId, title, content = '') {
    return this.findOneAndUpdate(
        { userId, guildId },
        { $push: { notes: { title, content, createdAt: new Date() } } },
        { new: true, upsert: true },
    );
};

/**
 * Add a reminder.
 * @param {string} userId
 * @param {string} guildId
 * @param {string} text
 * @param {Date} triggerAt
 * @param {string} channelId
 * @returns {Promise<User>}
 */
userSchema.statics.addReminder = async function (userId, guildId, text, triggerAt, channelId) {
    return this.findOneAndUpdate(
        { userId, guildId },
        { $push: { reminders: { text, triggerAt, channelId, active: true } } },
        { new: true, upsert: true },
    );
};

module.exports = mongoose.model('User', userSchema);
