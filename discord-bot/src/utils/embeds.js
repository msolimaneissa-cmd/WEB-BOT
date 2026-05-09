/**
 * @file src/utils/embeds.js
 * @description Professional embed factory system for Family Legends Bot.
 * Provides standardized, consistently branded Discord embeds with a modern
 * color palette, default branding, and flexible options support.
 *
 * @module utils/embeds
 */

const { EmbedBuilder } = require('discord.js');

// ---------------------------------------------------------------------------
// Color palette — softer, modern values aligned with Discord's design language
// ---------------------------------------------------------------------------

/** @type {Record<string, number>} */
const COLORS = Object.freeze({
    SUCCESS:      0x57F287,   // Discord green
    ERROR:        0xED4245,   // Discord red
    WARN:         0xFEE75C,   // Discord yellow
    INFO:         0x5865F2,   // Discord blurple
    MUSIC:        0x1DB954,   // Spotify green
    ECONOMY:      0xFFD700,   // Gold
    ANNOUNCEMENT: 0xFF6B35,   // Orange
    TICKET:       0x5865F2,   // Blurple
    DEFAULT:      0x2F3136,   // Dark gray
});

// ---------------------------------------------------------------------------
// Branding constants
// ---------------------------------------------------------------------------

const DEFAULT_FOOTER_TEXT = 'Family Legends Bot ✨';
const DEFAULT_FOOTER_ICON = null; // Set to a URL string to show a footer icon

/** @type {string|null} Global bot avatar URL. Set once via setBotAvatar(). */
let globalBotAvatar = null;

/**
 * Set the global bot avatar URL used as a default thumbnail on every embed.
 * Call this once at startup with the bot's avatar URL for consistent branding.
 *
 * @param {string} avatarUrl - The full URL to the bot's avatar image.
 */
function setBotAvatar(avatarUrl) {
    if (typeof avatarUrl !== 'string' || avatarUrl.trim().length === 0) {
        throw new TypeError('setBotAvatar() expects a non-empty URL string.');
    }
    globalBotAvatar = avatarUrl.trim();
}

/**
 * Retrieve the current global bot avatar URL.
 *
 * @returns {string|null}
 */
function getBotAvatar() {
    return globalBotAvatar;
}

// ---------------------------------------------------------------------------
// Embed factories
// ---------------------------------------------------------------------------

/**
 * Create a base branded embed with professional styling.
 *
 * Every embed ships with:
 * - A color from the {@link COLORS} palette (or any custom value).
 * - A default footer (`Family Legends Bot ✨`) — overridable via `options.footer`.
 * - An ISO 8601 timestamp.
 * - An optional global bot avatar thumbnail.
 *
 * @param {number}  color       - Embed sidebar color (integer, e.g. `COLORS.INFO`).
 * @param {string}  title       - Embed title.
 * @param {string}  [description] - Embed body text.
 * @param {Object}  [options={}] - Additional styling options.
 * @param {string}  [options.thumbnail]  - Thumbnail image URL (overrides bot avatar).
 * @param {string}  [options.image]      - Large image URL.
 * @param {string}  [options.url]        - Hyperlink applied to the title.
 * @param {Object}  [options.footer]     - `{ text, iconURL }` — overrides default footer.
 * @param {Object}  [options.author]     - `{ name, url, iconURL }` — author bar.
 * @param {Array}   [options.fields]     - Array of `{ name, value, inline }` field objects.
 * @param {boolean} [options.showAvatar] - If `false`, suppress the default bot avatar thumbnail.
 * @returns {EmbedBuilder}
 */
function createEmbed(color, title, description, options = {}) {
    const {
        thumbnail,
        image,
        url,
        footer,
        author,
        fields,
        showAvatar = true,
    } = options;

    const embed = new EmbedBuilder()
        .setColor(color)
        .setTitle(title)
        .setTimestamp();

    // Description
    if (description) {
        embed.setDescription(description);
    }

    // Thumbnail — caller-provided takes precedence over global bot avatar
    if (typeof thumbnail === 'string' && thumbnail.length > 0) {
        embed.setThumbnail(thumbnail);
    } else if (showAvatar && globalBotAvatar) {
        embed.setThumbnail(globalBotAvatar);
    }

    // Large image
    if (typeof image === 'string' && image.length > 0) {
        embed.setImage(image);
    }

    // Title URL
    if (typeof url === 'string' && url.length > 0) {
        embed.setURL(url);
    }

    // Footer — caller-provided overrides default
    if (footer && typeof footer === 'object') {
        embed.setFooter(footer);
    } else {
        embed.setFooter({ text: DEFAULT_FOOTER_TEXT, iconURL: DEFAULT_FOOTER_ICON });
    }

    // Author bar
    if (author && typeof author === 'object') {
        embed.setAuthor(author);
    }

    // Fields
    if (Array.isArray(fields) && fields.length > 0) {
        embed.addFields(fields);
    }

    return embed;
}

/**
 * Create a success embed (Discord green).
 * @param {string} title
 * @param {string} [description]
 * @param {Object} [options] — See {@link createEmbed} for all supported keys.
 * @returns {EmbedBuilder}
 */
function createSuccessEmbed(title, description, options = {}) {
    return createEmbed(COLORS.SUCCESS, title, description, options);
}

/**
 * Create an error embed (Discord red).
 * @param {string} title
 * @param {string} [description]
 * @param {Object} [options]
 * @returns {EmbedBuilder}
 */
function createErrorEmbed(title, description, options = {}) {
    return createEmbed(COLORS.ERROR, title, description, options);
}

/**
 * Create an info embed (Discord blurple).
 * @param {string} title
 * @param {string} [description]
 * @param {Object} [options]
 * @returns {EmbedBuilder}
 */
function createInfoEmbed(title, description, options = {}) {
    return createEmbed(COLORS.INFO, title, description, options);
}

/**
 * Create a warning embed (Discord yellow).
 * @param {string} title
 * @param {string} [description]
 * @param {Object} [options]
 * @returns {EmbedBuilder}
 */
function createWarnEmbed(title, description, options = {}) {
    return createEmbed(COLORS.WARN, title, description, options);
}

/**
 * Create a music embed (Spotify green).
 * @param {string} title
 * @param {string} [description]
 * @param {Object} [options]
 * @returns {EmbedBuilder}
 */
function createMusicEmbed(title, description, options = {}) {
    return createEmbed(COLORS.MUSIC, title, description, options);
}

/**
 * Create an economy embed (gold).
 * @param {string} title
 * @param {string} [description]
 * @param {Object} [options]
 * @returns {EmbedBuilder}
 */
function createEconomyEmbed(title, description, options = {}) {
    return createEmbed(COLORS.ECONOMY, title, description, options);
}

/**
 * Create a ticket embed (blurple).
 * @param {string} title
 * @param {string} [description]
 * @param {Object} [options]
 * @returns {EmbedBuilder}
 */
function createTicketEmbed(title, description, options = {}) {
    return createEmbed(COLORS.TICKET, title, description, options);
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
    // Factory functions
    createEmbed,
    createSuccessEmbed,
    createErrorEmbed,
    createInfoEmbed,
    createWarnEmbed,
    createMusicEmbed,
    createEconomyEmbed,
    createTicketEmbed,

    // Branding helpers
    setBotAvatar,
    getBotAvatar,

    // Constants
    COLORS,
};
