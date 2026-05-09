/**
 * @file src/database/schemas/aiConfigSchema.js
 * @description Mongoose schema for per-guild AI chatbot configuration.
 * Controls model selection, prompts, rate-limits, and channel targeting.
 */

const mongoose = require('mongoose');
const crypto = require('crypto');

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default_secret_key_32_bytes_long_here_if_empty';
const IV_LENGTH = 16;

function encrypt(text) {
    if (!text) return text;
    try {
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32)), iv);
        let encrypted = cipher.update(text);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        return iv.toString('hex') + ':' + encrypted.toString('hex');
    } catch { return text; }
}

function decrypt(text) {
    if (!text) return text;
    if (!text.includes(':')) return text;
    try {
        const textParts = text.split(':');
        const iv = Buffer.from(textParts.shift(), 'hex');
        const encryptedText = Buffer.from(textParts.join(':'), 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32)), iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    } catch { return text; }
}

/** @type {import('mongoose').Schema} AIConfig schema */
const aiConfigSchema = new mongoose.Schema({
    guildId: { type: String, required: true, unique: true },
    enabled: { type: Boolean, default: false },
    triggerMode: {
        type: String,
        enum: ['mention', 'channel', 'hybrid'],
        default: 'mention',
    },
    allowedChannels: [{ type: String }],
    apiKey: { type: String, default: null, get: decrypt, set: encrypt },
    model: { type: String, default: 'gemini-1.5-flash' },
    systemPrompt: {
        type: String,
        default: 'You are a helpful assistant for the Family Legends Discord server. '
            + 'You are friendly, witty, and speak Arabic and English fluently. '
            + 'Keep responses concise but informative.',
    },
    temperature: { type: Number, default: 0.7, min: 0, max: 2 },
    maxTokens: { type: Number, default: 150, min: 10, max: 2000 },
    contextLength: { type: Number, default: 10, min: 1, max: 50 },
    userCooldown: { type: Number, default: 30 },          // seconds
    dailyLimit: { type: Number, default: 100 },
}, {
    timestamps: true,
    toJSON: { virtuals: true, getters: true },
    toObject: { virtuals: true, getters: true },
});

// ── Static Helpers ───────────────────────────────────────────────────────

/**
 * Find or create AI config for a guild.
 * @param {string} guildId
 * @returns {Promise<AIConfig>}
 */
aiConfigSchema.statics.findOrCreate = async function (guildId) {
    let config = await this.findOne({ guildId });
    if (!config) {
        config = await this.create({ guildId });
    }
    return config;
};

/**
 * Check whether AI chat is enabled and the given channel is allowed.
 * @param {string} guildId
 * @param {string} channelId
 * @returns {Promise<boolean>}
 */
aiConfigSchema.statics.isChannelAllowed = async function (guildId, channelId) {
    const config = await this.findOne({ guildId, enabled: true });
    if (!config) return false;
    if (config.allowedChannels.length === 0) return true;
    return config.allowedChannels.includes(channelId);
};

module.exports = mongoose.model('AIConfig', aiConfigSchema);
