/**
 * @file utils/rankCard.js
 * @description Canvas-based rank card image generator for the leveling system.
 * Generates 900x300 rank cards with avatar, username, level, XP progress bar,
 * rank position, and member count. Supports level tier colors and Arabic fonts.
 */

const { createCanvas, registerFont, Image, isCanvasAvailable } = require('./canvasHelper');
const fs = require('fs');
const path = require('path');
const logger = require('./logger');

// ── Module-level state ────────────────────────────────────────────────────

/** @type {boolean} Whether the canvas module loaded successfully */
let canvasAvailable = false;
/** @type {boolean} Whether an Arabic-capable font has been registered */
let arabicFontRegistered = false;
/** @type {string} Name of the registered font family (for canvas fillStyle) */
let registeredFontFamily = 'sans-serif';

// Font search paths (in order of preference)
const FONT_SEARCH_PATHS = [
    // Project-local fonts (highest priority)
    path.join(__dirname, '..', '..', 'fonts', 'Cairo-Bold.ttf'),
    path.join(__dirname, '..', '..', 'fonts', 'Cairo-SemiBold.ttf'),
    path.join(__dirname, '..', '..', 'fonts', 'Cairo-Regular.ttf'),
    path.join(__dirname, '..', '..', 'assets', 'fonts', 'Cairo-Bold.ttf'),
    path.join(__dirname, '..', '..', 'assets', 'fonts', 'Cairo-SemiBold.ttf'),
    path.join(__dirname, '..', '..', 'assets', 'fonts', 'Cairo-Regular.ttf'),
    // Common Linux font directories
    '/usr/share/fonts/truetype/noto/NotoSansArabic-Bold.ttf',
    '/usr/share/fonts/truetype/noto/NotoSansArabic-Regular.ttf',
    '/usr/share/fonts/opentype/noto/NotoSansArabic-Bold.otf',
    '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
    '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
    '/usr/share/fonts/truetype/freefont/FreeSans.ttf',
    '/usr/share/fonts/truetype/freefont/FreeSansBold.ttf',
    '/usr/share/fonts/truetype/freefont/FreeSerif.ttf',
    // macOS
    '/System/Library/Fonts/Supplemental/Arial Bold.ttf',
    '/System/Library/Fonts/Supplemental/Georgia Bold.ttf',
    '/System/Library/Fonts/Supplemental/Arial.ttf',
    // Windows (WSL paths)
    '/mnt/c/Windows/Fonts/arialbd.ttf',
    '/mnt/c/Windows/Fonts/tahoma.ttf',
    '/mnt/c/Windows/Fonts/arial.ttf',
];

// ── Initialization ─────────────────────────────────────────────────────────

(function initCanvas() {
    canvasAvailable = isCanvasAvailable();
    if (!canvasAvailable) {
        logger.warn('[rankCard] Canvas module is NOT available. Rank cards will be disabled.');
        return;
    }

    // Attempt to register an Arabic-capable font
    for (const fontPath of FONT_SEARCH_PATHS) {
        if (fs.existsSync(fontPath)) {
            try {
                registerFont(fontPath, { family: 'RankFont' });
                registeredFontFamily = 'RankFont';
                arabicFontRegistered = true;
                logger.info(`[rankCard] Registered font: ${fontPath}`);
                break;
            } catch (e) {
                // Try next font
            }
        }
    }

    if (!arabicFontRegistered) {
        logger.warn('[rankCard] No Arabic-capable font found. Text may not render correctly.');
        logger.warn('[rankCard] Place a Cairo or NotoSansArabic font in /fonts/ directory.');
    }
})();

// ── Level tier colors ──────────────────────────────────────────────────────

/**
 * Get the accent color for a given level tier.
 * @param {number} level
 * @returns {string} Hex color string
 */
function getLevelColor(level) {
    if (level >= 100) return '#e74c3c';   // Red - legendary
    if (level >= 50) return '#f1c40f';    // Gold - elite
    if (level >= 30) return '#9b59b6';    // Purple - master
    if (level >= 20) return '#3498db';    // Blue - expert
    if (level >= 10) return '#27ae60';    // Green - skilled
    return '#95a5a6';                     // Gray - beginner
}

/**
 * Get the tier name for a given level.
 * @param {number} level
 * @returns {string} Arabic tier name
 */
function getTierName(level) {
    if (level >= 100) return 'أسطوري';
    if (level >= 50) return 'نخبة';
    if (level >= 30) return 'خبير';
    if (level >= 20) return 'محترف';
    if (level >= 10) return 'متمرس';
    return 'مبتدئ';
}

// ── XP calculation ─────────────────────────────────────────────────────────

/**
 * Calculate XP needed to reach the next level.
 * Formula: xpNeeded = 100 * Math.floor(level ^ 1.5)
 * @param {number} level
 * @returns {number}
 */
function xpForLevel(level) {
    return 100 * Math.floor(Math.pow(level, 1.5));
}

// ── Helper utilities ──────────────────────────────────────────────────────

/**
 * Load an image from a URL. Returns a canvas Image or null on failure.
 * @param {string} url
 * @returns {Promise<import('canvas').Image | null>}
 */
async function loadImageFromURL(url) {
    if (!url) return null;
    try {
        const axios = require('axios');
        const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 5000 });
        const img = new Image();
        img.src = Buffer.from(response.data, 'binary');
        return img;
    } catch (err) {
        logger.debug(`[rankCard] Failed to load image from URL: ${url} — ${err.message}`);
        return null;
    }
}

/**
 * Draw a rounded rectangle path.
 * @param {import('canvas').CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 * @param {number} w
 * @param {number} h
 * @param {number} r - corner radius
 */
function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

/**
 * Shorten a username if it exceeds a maximum length.
 * @param {string} name
 * @param {number} maxLen
 * @returns {string}
 */
function truncateText(name, maxLen = 20) {
    if (!name) return 'Unknown';
    if (name.length <= maxLen) return name;
    return name.slice(0, maxLen - 1) + '…';
}

// ── Main drawing function ─────────────────────────────────────────────────

/**
 * Draw a rank card image.
 *
 * @param {import('discord.js').GuildMember} member - The guild member.
 * @param {import('discord.js').Guild} guild - The guild.
 * @param {object} userData - User document from the database (level, xp, totalMessages).
 * @param {number} rankPosition - The user's rank position on the server leaderboard.
 * @param {object} [options={}] - Customization options.
 * @param {string}  [options.background='default'] - Background color or 'default'.
 * @returns {Promise<Buffer|null>} PNG image buffer, or null on failure.
 */
async function drawRankCard(member, guild, userData, rankPosition, options = {}) {
    // Guard: canvas must be available
    if (!canvasAvailable) return null;

    // Merge options with defaults
    const opts = {
        background: 'default',
        ...options,
    };

    // ── Canvas setup ───────────────────────────────────────────────────
    const WIDTH = 900;
    const HEIGHT = 300;
    const canvas = createCanvas(WIDTH, HEIGHT);
    const ctx = canvas.getContext('2d');

    // ── Level data ─────────────────────────────────────────────────────
    const level = userData?.level || 1;
    const currentXP = userData?.xp || 0;
    const xpNeeded = xpForLevel(level);
    const progress = xpNeeded > 0 ? Math.min((currentXP / xpNeeded) * 100, 100) : 0;
    const tierColor = getLevelColor(level);
    const tierName = getTierName(level);

    // ── Background ─────────────────────────────────────────────────────
    if (opts.background && opts.background !== 'default') {
        // Custom solid color
        ctx.fillStyle = opts.background;
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
        // Overlay gradient for depth
        const overlay = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
        overlay.addColorStop(0, 'rgba(0,0,0,0.3)');
        overlay.addColorStop(1, 'rgba(0,0,0,0.1)');
        ctx.fillStyle = overlay;
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
    } else {
        // Default dark gradient background
        const grad = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
        grad.addColorStop(0, '#1a1a2e');
        grad.addColorStop(0.5, '#16213e');
        grad.addColorStop(1, '#0f3460');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
    }

    // ── Subtle decorative elements ─────────────────────────────────────
    // Decorative circles
    ctx.globalAlpha = 0.04;
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(WIDTH - 60, 40, 120, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(WIDTH - 150, 260, 80, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(50, 260, 60, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // ── Outer card border (rounded rect) ───────────────────────────────
    const PADDING = 20;
    const CARD_RADIUS = 20;
    // Draw a subtle inner border
    ctx.save();
    roundRect(ctx, PADDING, PADDING, WIDTH - PADDING * 2, HEIGHT - PADDING * 2, CARD_RADIUS);
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    // ── Load avatar image ──────────────────────────────────────────────
    const avatarUrl = member?.user?.displayAvatarURL
        ? member.user.displayAvatarURL({ format: 'png', size: 256 })
        : null;
    const avatarImg = await loadImageFromURL(avatarUrl);

    // ── Avatar ─────────────────────────────────────────────────────────
    const AVATAR_SIZE = 120;
    const AVATAR_X = 50;
    const AVATAR_Y = (HEIGHT - AVATAR_SIZE) / 2;
    const AVATAR_CENTER_X = AVATAR_X + AVATAR_SIZE / 2;
    const AVATAR_CENTER_Y = AVATAR_Y + AVATAR_SIZE / 2;

    // Avatar glow effect
    ctx.save();
    ctx.shadowColor = tierColor;
    ctx.shadowBlur = 25;
    ctx.beginPath();
    ctx.arc(AVATAR_CENTER_X, AVATAR_CENTER_Y, AVATAR_SIZE / 2 + 6, 0, Math.PI * 2);
    ctx.fillStyle = tierColor;
    ctx.globalAlpha = 0.3;
    ctx.fill();
    ctx.restore();
    ctx.globalAlpha = 1;

    if (avatarImg) {
        // Avatar border ring
        ctx.beginPath();
        ctx.arc(AVATAR_CENTER_X, AVATAR_CENTER_Y, AVATAR_SIZE / 2 + 6, 0, Math.PI * 2);
        ctx.strokeStyle = tierColor;
        ctx.lineWidth = 5;
        ctx.stroke();

        // Clip to circle
        ctx.save();
        ctx.beginPath();
        ctx.arc(AVATAR_CENTER_X, AVATAR_CENTER_Y, AVATAR_SIZE / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();

        // Draw avatar image (cover-fit)
        const aspect = avatarImg.width / avatarImg.height;
        let sx = 0, sy = 0, sw = avatarImg.width, sh = avatarImg.height;
        if (aspect > 1) {
            sx = (avatarImg.width - avatarImg.height) / 2;
            sw = avatarImg.height;
        } else {
            sy = (avatarImg.height - avatarImg.width) / 2;
            sh = avatarImg.width;
        }
        ctx.drawImage(avatarImg, sx, sy, sw, sh, AVATAR_X, AVATAR_Y, AVATAR_SIZE, AVATAR_SIZE);

        ctx.restore();
    } else {
        // Placeholder avatar circle
        ctx.beginPath();
        ctx.arc(AVATAR_CENTER_X, AVATAR_CENTER_Y, AVATAR_SIZE / 2, 0, Math.PI * 2);
        ctx.strokeStyle = tierColor;
        ctx.lineWidth = 5;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(AVATAR_CENTER_X, AVATAR_CENTER_Y, AVATAR_SIZE / 2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.fill();

        // Question mark
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = `bold 40px ${registeredFontFamily}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('?', AVATAR_CENTER_X, AVATAR_CENTER_Y);
    }

    // ── Text area (right of avatar) ────────────────────────────────────
    const TEXT_START_X = AVATAR_X + AVATAR_SIZE + 30;
    const TEXT_MAX_WIDTH = WIDTH - TEXT_START_X - 40;

    // ── Username ───────────────────────────────────────────────────────
    const displayName = member?.user?.username || member?.displayName || 'عضو';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold 26px ${registeredFontFamily}`;
    ctx.fillText(truncateText(displayName, 22), TEXT_START_X, 55);

    // ── Discriminator / tag ────────────────────────────────────────────
    const tag = member?.user?.discriminator && member.user.discriminator !== '0'
        ? `#${member.user.discriminator}`
        : '';
    if (tag) {
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = `18px ${registeredFontFamily}`;
        ctx.fillText(tag, TEXT_START_X + ctx.measureText(truncateText(displayName, 22)).width + 8, 60);
    }

    // ── Level & Tier info ──────────────────────────────────────────────
    ctx.textBaseline = 'top';

    // Level text
    ctx.fillStyle = tierColor;
    ctx.font = `bold 20px ${registeredFontFamily}`;
    ctx.fillText(`المستوى ${level}`, TEXT_START_X, 92);

    // Tier name
    const tierTextWidth = ctx.measureText(`المستوى ${level}`).width;
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = `16px ${registeredFontFamily}`;
    ctx.fillText(tierName, TEXT_START_X + tierTextWidth + 12, 95);

    // ── XP Progress bar ────────────────────────────────────────────────
    const BAR_X = TEXT_START_X;
    const BAR_Y = 128;
    const BAR_WIDTH = Math.min(TEXT_MAX_WIDTH, 550);
    const BAR_HEIGHT = 24;
    const BAR_RADIUS = 12;

    // Progress bar background (empty portion)
    ctx.save();
    roundRect(ctx, BAR_X, BAR_Y, BAR_WIDTH, BAR_HEIGHT, BAR_RADIUS);
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fill();
    ctx.restore();

    // Progress bar filled portion
    const filledWidth = Math.max((progress / 100) * BAR_WIDTH, 0);
    if (filledWidth > 0) {
        ctx.save();
        // Clip to the rounded rect shape
        roundRect(ctx, BAR_X, BAR_Y, BAR_WIDTH, BAR_HEIGHT, BAR_RADIUS);
        ctx.clip();

        // Fill gradient for the progress
        const barGrad = ctx.createLinearGradient(BAR_X, BAR_Y, BAR_X + filledWidth, BAR_Y);
        barGrad.addColorStop(0, tierColor);
        barGrad.addColorStop(1, shiftColor(tierColor, 30));
        ctx.fillStyle = barGrad;
        ctx.fillRect(BAR_X, BAR_Y, filledWidth, BAR_HEIGHT);

        // Shine effect on progress bar
        const shineGrad = ctx.createLinearGradient(BAR_X, BAR_Y, BAR_X, BAR_Y + BAR_HEIGHT);
        shineGrad.addColorStop(0, 'rgba(255,255,255,0.25)');
        shineGrad.addColorStop(0.5, 'rgba(255,255,255,0)');
        shineGrad.addColorStop(1, 'rgba(0,0,0,0.1)');
        ctx.fillStyle = shineGrad;
        ctx.fillRect(BAR_X, BAR_Y, filledWidth, BAR_HEIGHT);

        ctx.restore();
    }

    // Progress bar border
    ctx.save();
    roundRect(ctx, BAR_X, BAR_Y, BAR_WIDTH, BAR_HEIGHT, BAR_RADIUS);
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    // XP text on the progress bar
    const xpText = `${currentXP.toLocaleString()} / ${xpNeeded.toLocaleString()} XP`;
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold 13px ${registeredFontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(xpText, BAR_X + BAR_WIDTH / 2, BAR_Y + BAR_HEIGHT / 2);

    // ── Stats row (rank, messages, member count) ───────────────────────
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    const STATS_Y = 172;
    const STATS_COLOR = 'rgba(255,255,255,0.7)';
    const STATS_LABEL_COLOR = 'rgba(255,255,255,0.4)';
    const STATS_FONT = `bold 16px ${registeredFontFamily}`;
    const LABEL_FONT = `13px ${registeredFontFamily}`;

    // Rank position
    ctx.fillStyle = STATS_LABEL_COLOR;
    ctx.font = LABEL_FONT;
    ctx.fillText('الترتيب', TEXT_START_X, STATS_Y);
    ctx.fillStyle = STATS_COLOR;
    ctx.font = STATS_FONT;
    ctx.fillText(`#${rankPosition}`, TEXT_START_X, STATS_Y + 18);

    // Total messages
    const MSG_X = TEXT_START_X + 130;
    ctx.fillStyle = STATS_LABEL_COLOR;
    ctx.font = LABEL_FONT;
    ctx.fillText('الرسائل', MSG_X, STATS_Y);
    ctx.fillStyle = STATS_COLOR;
    ctx.font = STATS_FONT;
    ctx.fillText(`${(userData?.totalMessages || 0).toLocaleString()}`, MSG_X, STATS_Y + 18);

    // Member count
    const MEMBER_X = MSG_X + 150;
    ctx.fillStyle = STATS_LABEL_COLOR;
    ctx.font = LABEL_FONT;
    ctx.fillText('الأعضاء', MEMBER_X, STATS_Y);
    ctx.fillStyle = STATS_COLOR;
    ctx.font = STATS_FONT;
    ctx.fillText(`${guild?.memberCount?.toLocaleString() || '?'}`, MEMBER_X, STATS_Y + 18);

    // ── Server name (bottom area) ──────────────────────────────────────
    const serverName = guild?.name || 'السيرفر';
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.font = `14px ${registeredFontFamily}`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText(truncateText(serverName, 35), WIDTH - 30, HEIGHT - 25);

    // ── Rank badge (top right) ─────────────────────────────────────────
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillStyle = tierColor;
    ctx.font = `bold 48px ${registeredFontFamily}`;
    ctx.fillText(`#${rankPosition}`, WIDTH - 30, 30);

    // Rank label
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.font = `14px ${registeredFontFamily}`;
    ctx.fillText('الترتيب', WIDTH - 30, 80);

    // ── "Family Legends Bot" watermark ─────────────────────────────────
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.font = `bold 12px ${registeredFontFamily}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillText('Family Legends Bot', 30, HEIGHT - 12);

    // ── Bottom decorative bar ──────────────────────────────────────────
    ctx.globalAlpha = 0.15;
    const barGrad = ctx.createLinearGradient(0, HEIGHT - 3, WIDTH, HEIGHT - 3);
    barGrad.addColorStop(0, tierColor);
    barGrad.addColorStop(0.5, '#0f3460');
    barGrad.addColorStop(1, '#533483');
    ctx.fillStyle = barGrad;
    ctx.fillRect(0, HEIGHT - 3, WIDTH, 3);
    ctx.globalAlpha = 1;

    // ── Export to PNG buffer ───────────────────────────────────────────
    try {
        const buffer = canvas.toBuffer('image/png');
        return buffer;
    } catch (err) {
        logger.error(`[rankCard] Failed to export canvas to buffer: ${err.message}`);
        return null;
    }
}

// ── Color utility ──────────────────────────────────────────────────────────

/**
 * Shift a hex color's brightness by a given amount.
 * @param {string} hex - Hex color string (e.g., '#3498db')
 * @param {number} amount - Amount to shift (positive = lighter, negative = darker)
 * @returns {string} Hex color string
 */
function shiftColor(hex, amount) {
    try {
        let r = parseInt(hex.slice(1, 3), 16);
        let g = parseInt(hex.slice(3, 5), 16);
        let b = parseInt(hex.slice(5, 7), 16);

        r = Math.min(255, Math.max(0, r + amount));
        g = Math.min(255, Math.max(0, g + amount));
        b = Math.min(255, Math.max(0, b + amount));

        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    } catch (e) {
        return hex;
    }
}

// ── Exports ───────────────────────────────────────────────────────────────

module.exports = {
    drawRankCard,
    xpForLevel,
    getLevelColor,
    getTierName,
    /**
     * Whether the canvas module is available and functional.
     * @type {boolean}
     */
    canvasAvailable: () => canvasAvailable,
    /**
     * Whether an Arabic-supporting font was found and registered.
     * @type {boolean}
     */
    arabicFontRegistered: () => arabicFontRegistered,
};
