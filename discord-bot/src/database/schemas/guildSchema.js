/**
 * @file src/database/schemas/guildSchema.js
 * @description Mongoose schema for guild-specific configuration.
 * Stores moderation, welcome, protection (individual toggles), economy, music,
 * leveling, tickets, notifications, logging, giveaways, reaction roles, and
 * general appearance / permission settings.
 */

const mongoose = require('mongoose');

/** @type {import('mongoose').Schema} Guild configuration schema */
const guildSchema = new mongoose.Schema({
    guildId: { type: String, required: true, unique: true },

    // ── Moderation ────────────────────────────────────────────────────────
    mod: {
        modRoleId: { type: String, default: null },
        adminRoleId: { type: String, default: null },
        mutedRoleId: { type: String, default: null },
        logChannelId: { type: String, default: null },
        maxWarnings: { type: Number, default: 3, min: 1 },
        autoBan: { type: Boolean, default: false },
        staffRoles: [{ type: String }],
    },

    // ── Welcome ───────────────────────────────────────────────────────────
    welcome: {
        enabled: { type: Boolean, default: false },
        channelId: { type: String, default: null },
        message: { type: String, default: 'مرحباً بك في السيرفر، {user}!' },
        autoRoleId: { type: String, default: null },
        backgroundImage: { type: String, default: null },
        font: { type: String, default: 'Arial' },
        color: { type: String, default: '#ffffff' },
        dmEnabled: { type: Boolean, default: false },
        dmMessage: { type: String, default: null },
    },

    // ── Booster ───────────────────────────────────────────────────────────
    booster: {
        enabled: { type: Boolean, default: false },
        channelId: { type: String, default: null },
        message: { type: String, default: 'شكراً {user} على دعم السيرفر! 🚀' },
    },

    // ── Goodbye ───────────────────────────────────────────────────────────
    goodbye: {
        enabled: { type: Boolean, default: false },
        channelId: { type: String, default: null },
        message: { type: String, default: 'وداعاً {user}!' },
    },

    // ── Welcome Image ────────────────────────────────────────────────────
    welcomeImage: {
        enabled: { type: Boolean, default: false },
        background: { type: String, default: 'default' },
        font: { type: String, default: 'Cairo' },
        color: { type: String, default: '#FFFFFF' },
        showAvatar: { type: Boolean, default: true },
        showUsername: { type: Boolean, default: true },
        showMemberCount: { type: Boolean, default: true },
        showServerIcon: { type: Boolean, default: false },
    },

    // ── Join DM ───────────────────────────────────────────────────────────
    joinDm: {
        enabled: { type: Boolean, default: false },
        message: { type: String, default: null },
    },

    // ── Protection (individual toggles) ───────────────────────────────────
    protection: {
        antiSpam: {
            enabled: { type: Boolean, default: false },
            maxMessages: { type: Number, default: 5, min: 1 },
            interval: { type: Number, default: 5000, min: 1000 },
            punishment: { type: String, default: 'timeout', enum: ['timeout', 'kick', 'ban'] },
        },
        antiLink: {
            enabled: { type: Boolean, default: false },
            allowedChannels: [{ type: String }],
            allowedRoles: [{ type: String }],
        },
        antiInvite: {
            enabled: { type: Boolean, default: false },
        },
        antiCaps: {
            enabled: { type: Boolean, default: false },
            minCapsPercentage: { type: Number, default: 70, min: 10, max: 100 },
            minCapsLength: { type: Number, default: 5, min: 1 },
        },
        antiSwear: {
            enabled: { type: Boolean, default: false },
            customWords: [{ type: String }],
        },
        antiNewAccount: {
            enabled: { type: Boolean, default: false },
            minAge: { type: Number, default: 1, min: 1 }, // بالأيام
            action: { type: String, default: 'kick', enum: ['kick', 'ban'] },
        },
        antiMention: {
            enabled: { type: Boolean, default: false },
            maxMentions: { type: Number, default: 5, min: 1 },
            action: { type: String, default: 'timeout', enum: ['timeout', 'kick', 'ban'] },
        },
        verification: {
            enabled: { type: Boolean, default: false },
            roleId: { type: String, default: null },
            channelId: { type: String, default: null },
            message: { type: String, default: 'اضغط على الزر بالأسفل للتحقق والدخول للسيرفر.' },
        },
        antiNuke: {
            enabled: { type: Boolean, default: false },
            maxChannelDelete: { type: Number, default: 3 },
            maxRoleDelete: { type: Number, default: 3 },
            maxKick: { type: Number, default: 5 },
            maxBan: { type: Number, default: 5 },
            cooldown: { type: Number, default: 60000 }, // 1 minute
            action: { type: String, default: 'quarantine', enum: ['quarantine', 'notify'] }, // quarantine = remove all roles from the mod
        },
    },

    // Backward-compatibility aliases (top-level toggles)
    antiSpam: {
        enabled: { type: Boolean, default: false },
        maxMessages: { type: Number, default: 5, min: 1 },
        interval: { type: Number, default: 5000, min: 1000 },
        punishment: { type: String, default: 'timeout', enum: ['timeout', 'kick', 'ban'] },
    },
    antiLink: {
        enabled: { type: Boolean, default: false },
        allowedChannels: [{ type: String }],
        allowedRoles: [{ type: String }],
    },

    // ── Economy ───────────────────────────────────────────────────────────
    economy: {
        enabled: { type: Boolean, default: true },
        currencyName: { type: String, default: 'عملات' },
        currencyEmoji: { type: String, default: '💰' },
        dailyMin: { type: Number, default: 500 },
        dailyMax: { type: Number, default: 1500 },
        workMin: { type: Number, default: 100 },
        workMax: { type: Number, default: 800 },
    },

    // ── Music ─────────────────────────────────────────────────────────────
    music: {
        defaultVolume: { type: Number, default: 80, min: 1, max: 150 },
        maxQueueSize: { type: Number, default: 100, min: 1 },
        leaveOnEmpty: { type: Boolean, default: true },
        emptyCooldown: { type: Number, default: 60, min: 10 },
        // New music fields
        djRoleId: { type: String, default: null },
        stayInChannel: { type: Boolean, default: false },          // 24/7 mode
        autoplay: { type: Boolean, default: false },
        maxSongDuration: { type: Number, default: 3600000 },       // 1 hour in ms
        maxPlaylistSize: { type: Number, default: 50 },
        quality: { type: String, enum: ['low', 'high'], default: 'high' },
        filterPresets: [{
            name: { type: String, required: true },
            filters: [{ type: String, required: true }],
        }],
    },

    // ── Leveling / XP ─────────────────────────────────────────────────────
    leveling: {
        enabled: { type: Boolean, default: true },
        xpMin: { type: Number, default: 5 },
        xpMax: { type: Number, default: 15 },
        cooldown: { type: Number, default: 5 },                    // seconds
        xpPerMinuteCap: { type: Number, default: 100 },
        ignoreChannels: [{ type: String }],
        ignoreRoles: [{ type: String }],
        rewards: [{
            level: { type: Number, required: true },
            roleIds: [{ type: String }],
            auto: { type: Boolean, default: true },
        }],
        rankCard: {
            background: { type: String, default: 'default' },
        },
    },

    // ── Tickets ───────────────────────────────────────────────────────────
    tickets: {
        enabled: { type: Boolean, default: false },
        categories: [{
            name: { type: String, required: true },
            emoji: { type: String, default: '🎫' },
            categoryId: { type: String, required: true },
            supportRoleId: { type: String, required: true },
            maxOpenPerUser: { type: Number, default: 3 },
            transcriptEnabled: { type: Boolean, default: true },
            description: { type: String, default: null },
        }],
        panelChannelId: { type: String, default: null },
        panelMessageId: { type: String, default: null },
        logChannelId: { type: String, default: null },
    },

    // ── Notifications ─────────────────────────────────────────────────────
    notifications: {
        enabled: { type: Boolean, default: false },
        logChannelId: { type: String, default: null },
    },

    // ── Logging (moderation & server events) ─────────────────────────────
    logging: {
        enabled: { type: Boolean, default: false },
        channelId: { type: String, default: null },
        events: {
            messageDelete: { type: Boolean, default: true },
            messageUpdate: { type: Boolean, default: true },
            memberJoin: { type: Boolean, default: true },
            memberLeave: { type: Boolean, default: true },
            channelCreate: { type: Boolean, default: false },
            channelDelete: { type: Boolean, default: false },
            channelUpdate: { type: Boolean, default: false },
            roleCreate: { type: Boolean, default: false },
            roleDelete: { type: Boolean, default: false },
            roleUpdate: { type: Boolean, default: false },
            banAdd: { type: Boolean, default: true },
            banRemove: { type: Boolean, default: true },
            memberUpdate: { type: Boolean, default: false },
        },
    },

    // ── Giveaways ─────────────────────────────────────────────────────────
    giveaways: {
        enabled: { type: Boolean, default: false },
        logChannelId: { type: String, default: null },
    },

    // ── Reaction Roles ───────────────────────────────────────────────────
    reactionRoles: {
        enabled: { type: Boolean, default: false },
    },

    // ── General / Appearance / Permissions ────────────────────────────────
    general: {
        embedColor: { type: String, default: '#5865F2' },
        language: { type: String, enum: ['ar', 'en'], default: 'ar' },
        botStatus: { type: String, default: 'إدارة السيرفر' },
        botActivityType: {
            type: String,
            enum: ['PLAYING', 'WATCHING', 'LISTENING', 'COMPETING'],
            default: 'PLAYING',
        },
        adminRoleIds: [{ type: String }],
        modRoleIds: [{ type: String }],
        bypassRoleIds: [{ type: String }],
        ignoredChannels: [{ type: String }],
    },

    // ── Activity Log (legacy) ────────────────────────────────────────────
    activityLog: {
        enabled: { type: Boolean, default: true },
    },

    // ── Website / Streamers (legacy) ─────────────────────────────────────
    website: {
        webhookUrl: { type: String, default: null },
        webhookSecret: { type: String, default: null },
        streamers: [{
            name: { type: String, required: true },
            platform: { type: String, enum: ['twitch', 'youtube', 'tiktok', 'kick'], required: true },
            username: { type: String, required: true },
            channelLink: { type: String, default: '' },
            isLive: { type: Boolean, default: false },
            lastChecked: { type: Date, default: null },
        }],
        streamDetection: {
            enabled: { type: Boolean, default: false },
            channelId: { type: String, default: null },
            checkInterval: { type: Number, default: 60 },
        },
        streaming: {
            enabled: { type: Boolean, default: false },
            channelId: { type: String, default: null },
            messageTemplate: { type: String, default: '🔴 {user} بدأ بثاً مباشراً على {platform}!\n{url}' },
        },
    },
    modules: {
        moderation: { type: Boolean, default: true },
        economy: { type: Boolean, default: true },
        music: { type: Boolean, default: true },
        tickets: { type: Boolean, default: true },
        ai: { type: Boolean, default: true },
        giveaway: { type: Boolean, default: true },
        leveling: { type: Boolean, default: true },
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

// ── Virtuals ─────────────────────────────────────────────────────────────

/**
 * Effective protection settings – supports both the nested `protection`
 * object and the legacy top-level toggles.
 */
guildSchema.virtual('effectiveProtection').get(function () {
    return {
        antiSpam: this.protection?.antiSpam?.enabled ?? this.antiSpam?.enabled ?? false,
        antiLink: this.protection?.antiLink?.enabled ?? this.antiLink?.enabled ?? false,
        antiInvite: this.protection?.antiInvite?.enabled ?? false,
        antiCaps: this.protection?.antiCaps?.enabled ?? false,
        antiSwear: this.protection?.antiSwear?.enabled ?? false,
    };
});

// ── Static Helpers ───────────────────────────────────────────────────────

/**
 * Find a guild config or create one with defaults.
 * @param {string} guildId
 * @returns {Promise<Guild>}
 */
guildSchema.statics.findOrCreate = async function (guildId) {
    let guild = await this.findOne({ guildId });
    if (!guild) {
        guild = await this.create({ guildId });
    }
    return guild;
};

/**
 * Get the effective embed color for a guild.
 * Falls back to the default (#5865F2) if not set.
 * @param {string} guildId
 * @returns {Promise<string>}
 */
guildSchema.statics.getEmbedColor = async function (guildId) {
    const guild = await this.findOne({ guildId });
    return guild?.general?.embedColor ?? '#5865F2';
};

module.exports = mongoose.model('Guild', guildSchema);
