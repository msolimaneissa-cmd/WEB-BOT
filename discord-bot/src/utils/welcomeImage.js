/**
 * @file utils/welcomeImage.js
 * @description Canvas-based welcome/goodbye card image generator.
 * Generates beautiful 1200x500 welcome cards with support for Arabic text,
 * user avatars, server icons, member counts, and customizable backgrounds.
 */

const { createCanvas, registerFont, Image, isCanvasAvailable } = require('./canvasHelper');
const fs = require('fs');
const path = require('path');
const logger = require('./logger');

// ── Module-level state ────────────────────────────────────────────────────

/** @type {boolean} Whether the canvas module loaded successfully */
let canvasAvailable = false;
/** @type {boolean} Whether a font supporting Arabic has been registered */
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
    path.join(__dirname, '..', '..', 'assets', 'fonts', 'Cairo-Regular.ttf'),
    // Common Linux font directories
    '/usr/share/fonts/truetype/noto/NotoSansArabic-Bold.ttf',
    '/usr/share/fonts/truetype/noto/NotoSansArabic-Regular.ttf',
    '/usr/share/fonts/opentype/noto/NotoSansArabic-Bold.otf',
    '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
    '/usr/share/fonts/truetype/freefont/FreeSans.ttf',
    '/usr/share/fonts/truetype/freefont/FreeSerif.ttf',
    // macOS
    '/System/Library/Fonts/Supplemental/Arial Bold.ttf',
    '/System/Library/Fonts/Supplemental/Georgia Bold.ttf',
    // Windows (WSL paths)
    '/mnt/c/Windows/Fonts/arialbd.ttf',
    '/mnt/c/Windows/Fonts/tahoma.ttf',
    '/mnt/c/Windows/Fonts/arial.ttf',
];

// Regular-weight font search paths (for body text)
const FONT_REGULAR_PATHS = [
    path.join(__dirname, '..', '..', 'fonts', 'Cairo-Regular.ttf'),
    path.join(__dirname, '..', '..', 'assets', 'fonts', 'Cairo-Regular.ttf'),
    '/usr/share/fonts/truetype/noto/NotoSansArabic-Regular.ttf',
    '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
    '/usr/share/fonts/truetype/freefont/FreeSans.ttf',
    '/usr/share/fonts/truetype/freefont/FreeSerif.ttf',
    '/System/Library/Fonts/Supplemental/Arial.ttf',
    '/mnt/c/Windows/Fonts/arial.ttf',
    '/mnt/c/Windows/Fonts/tahoma.ttf',
];

// ── Initialization ─────────────────────────────────────────────────────────

(function initCanvas() {
    canvasAvailable = isCanvasAvailable();
    if (!canvasAvailable) {
        logger.warn('[welcomeImage] Canvas module is NOT available. Welcome images will be disabled.');
        return;
    }

    // Attempt to register an Arabic-capable font
    let boldFontRegistered = false;
    for (const fontPath of FONT_SEARCH_PATHS) {
        if (fs.existsSync(fontPath)) {
            try {
                registerFont(fontPath, { family: 'WelcomeFont' });
                registeredFontFamily = 'WelcomeFont';
                boldFontRegistered = true;
                logger.info(`[welcomeImage] Registered bold font: ${fontPath}`);
                break;
            } catch (e) {
                // Try next font
            }
        }
    }

    // Register a regular-weight font for body text
    for (const fontPath of FONT_REGULAR_PATHS) {
        if (fs.existsSync(fontPath)) {
            try {
                registerFont(fontPath, { family: 'WelcomeFontRegular' });
                if (!boldFontRegistered) {
                    registeredFontFamily = 'WelcomeFontRegular';
                }
                arabicFontRegistered = true;
                logger.info(`[welcomeImage] Registered regular font: ${fontPath}`);
                break;
            } catch (e) {
                // Try next font
            }
        }
    }

    if (!arabicFontRegistered && !boldFontRegistered) {
        logger.warn('[welcomeImage] No Arabic-capable font found. Text may not render correctly.');
        logger.warn('[welcomeImage] Place a Cairo or NotoSansArabic font in /fonts/ directory.');
    } else {
        arabicFontRegistered = true;
    }
})();

// ── Default gradient backgrounds ──────────────────────────────────────────

const DEFAULT_GRADIENTS = {
    welcome: [
        { stop: 0, color: '#1a1a2e' },
        { stop: 0.5, color: '#16213e' },
        { stop: 1, color: '#0f3460' },
    ],
    goodbye: [
        { stop: 0, color: '#2d132c' },
        { stop: 0.5, color: '#1a0a1e' },
        { stop: 1, color: '#120a1e' },
    ],
};

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
        logger.debug(`[welcomeImage] Failed to load image from URL: ${url} — ${err.message}`);
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
function truncateText(name, maxLen = 22) {
    if (!name) return 'Unknown';
    if (name.length <= maxLen) return name;
    return name.slice(0, maxLen - 1) + '…';
}

/**
 * Wrap text into multiple lines that fit within maxWidth.
 * Handles Arabic text by measuring each character.
 * @param {import('canvas').CanvasRenderingContext2D} ctx
 * @param {string} text
 * @param {number} maxWidth
 * @returns {string[]}
 */
function wrapText(ctx, text, maxWidth) {
    const lines = [];
    let currentLine = '';

    for (let i = 0; i < text.length; i++) {
        const testLine = currentLine + text[i];
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && currentLine.length > 0) {
            lines.push(currentLine);
            currentLine = text[i];
        } else {
            currentLine = testLine;
        }
    }
    if (currentLine) lines.push(currentLine);
    return lines.length > 0 ? lines : [text];
}

// ── Main drawing function ─────────────────────────────────────────────────

/**
 * Draw a welcome/goodbye card image.
 *
 * @param {import('discord.js').GuildMember} member - The guild member (or partial member).
 * @param {import('discord.js').Guild} guild - The guild.
 * @param {object} [options={}] - Customization options.
 * @param {string}  [options.background='default'] - Background color or 'default'.
 * @param {string}  [options.font='Cairo']         - Font family name (reserved for future per-guild fonts).
 * @param {string}  [options.color='#FFFFFF']       - Primary text color.
 * @param {boolean} [options.showAvatar=true]       - Show user's circular avatar.
 * @param {boolean} [options.showUsername=true]     - Show username text.
 * @param {boolean} [options.showMemberCount=true]  - Show server member count.
 * @param {boolean} [options.showServerIcon=false]  - Show server icon.
 * @param {'welcome'|'goodbye'} [options.type='welcome'] - Card type.
 * @returns {Promise<Buffer|null>} PNG image buffer, or null on failure.
 */
async function drawWelcomeCard(member, guild, options = {}) {
    // Guard: canvas must be available
    if (!canvasAvailable) return null;

    // Merge options with defaults
    const opts = {
        background: 'default',
        font: 'Cairo',
        color: '#FFFFFF',
        showAvatar: true,
        showUsername: true,
        showMemberCount: true,
        showServerIcon: false,
        type: 'welcome',
        ...options,
    };

    // ── Canvas setup ───────────────────────────────────────────────────
    const WIDTH = 1200;
    const HEIGHT = 500;
    const canvas = createCanvas(WIDTH, HEIGHT);
    const ctx = canvas.getContext('2d');

    // ── Background ─────────────────────────────────────────────────────
    const gradientStops = DEFAULT_GRADIENTS[opts.type] || DEFAULT_GRADIENTS.welcome;

    if (opts.background && opts.background !== 'default') {
        // Solid color fallback
        ctx.fillStyle = opts.background;
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
        // Overlay gradient for depth
        const overlay = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
        overlay.addColorStop(0, 'rgba(0,0,0,0.3)');
        overlay.addColorStop(1, 'rgba(0,0,0,0.1)');
        ctx.fillStyle = overlay;
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
    } else {
        // Default gradient background
        const grad = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
        for (const stop of gradientStops) {
            grad.addColorStop(stop.stop, stop.color);
        }
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
    }

    // ── Decorative elements ────────────────────────────────────────────
    // Subtle circle decorations
    ctx.globalAlpha = 0.06;
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(WIDTH - 100, 80, 180, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(WIDTH - 200, 420, 120, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(100, 450, 80, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Bottom decorative bar
    ctx.globalAlpha = 0.1;
    const barGrad = ctx.createLinearGradient(0, HEIGHT - 4, WIDTH, HEIGHT - 4);
    barGrad.addColorStop(0, '#e94560');
    barGrad.addColorStop(0.5, '#0f3460');
    barGrad.addColorStop(1, '#533483');
    ctx.fillStyle = barGrad;
    ctx.fillRect(0, HEIGHT - 4, WIDTH, 4);
    ctx.globalAlpha = 1;

    // ── Load images (avatar + server icon) in parallel ─────────────────
    const avatarUrl = member?.user?.displayAvatarURL
        ? member.user.displayAvatarURL({ format: 'png', size: 256 })
        : null;
    const serverIconUrl = (opts.showServerIcon && guild?.iconURL())
        ? guild.iconURL({ format: 'png', size: 128 })
        : null;

    const [avatarImg, serverIconImg] = await Promise.all([
        opts.showAvatar ? loadImageFromURL(avatarUrl) : null,
        opts.showServerIcon ? loadImageFromURL(serverIconUrl) : null,
    ]);

    // ── Avatar ─────────────────────────────────────────────────────────
    const AVATAR_SIZE = 100;
    const AVATAR_X = 70;
    const AVATAR_Y = (HEIGHT - AVATAR_SIZE) / 2;

    if (avatarImg) {
        // Avatar border ring
        ctx.beginPath();
        ctx.arc(AVATAR_X + AVATAR_SIZE / 2, AVATAR_Y + AVATAR_SIZE / 2, AVATAR_SIZE / 2 + 6, 0, Math.PI * 2);
        ctx.strokeStyle = opts.color;
        ctx.lineWidth = 4;
        ctx.globalAlpha = 0.6;
        ctx.stroke();
        ctx.globalAlpha = 1;

        // Clip to circle
        ctx.save();
        ctx.beginPath();
        ctx.arc(AVATAR_X + AVATAR_SIZE / 2, AVATAR_Y + AVATAR_SIZE / 2, AVATAR_SIZE / 2, 0, Math.PI * 2);
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
        ctx.arc(AVATAR_X + AVATAR_SIZE / 2, AVATAR_Y + AVATAR_SIZE / 2, AVATAR_SIZE / 2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Question mark
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = `bold 36px ${registeredFontFamily}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('?', AVATAR_X + AVATAR_SIZE / 2, AVATAR_Y + AVATAR_SIZE / 2);
    }

    // ── Text area (right of avatar) ────────────────────────────────────
    const TEXT_START_X = AVATAR_X + AVATAR_SIZE + 40;
    const TEXT_MAX_WIDTH = opts.showServerIcon ? WIDTH - TEXT_START_X - 140 : WIDTH - TEXT_START_X - 40;
    const TEXT_COLOR = opts.color || '#FFFFFF';
    const ACCENT_COLOR = '#e94560';

    // ── Title line ("Welcome" / "Goodbye") ────────────────────────────
    const titleText = opts.type === 'goodbye' ? 'وداعاً' : 'مرحباً بك في';
    const titleEmoji = opts.type === 'goodbye' ? '👋' : '✨';

    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = ACCENT_COLOR;
    ctx.font = `bold 20px ${registeredFontFamily}`;
    ctx.fillText(titleEmoji + '  ' + titleText, TEXT_START_X, 100);

    // ── Server name ────────────────────────────────────────────────────
    const serverName = guild?.name || 'السيرفر';
    const serverLines = wrapText(ctx, serverName, TEXT_MAX_WIDTH);

    ctx.fillStyle = TEXT_COLOR;
    ctx.font = `bold 32px ${registeredFontFamily}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    let yPos = 145;
    for (let i = 0; i < Math.min(serverLines.length, 2); i++) {
        ctx.fillText(truncateText(serverLines[i], 30), TEXT_START_X, yPos);
        yPos += 42;
    }

    // ── Divider line ──────────────────────────────────────────────────
    const dividerY = yPos + 10;
    const dividerGrad = ctx.createLinearGradient(TEXT_START_X, dividerY, TEXT_START_X + 250, dividerY);
    dividerGrad.addColorStop(0, ACCENT_COLOR);
    dividerGrad.addColorStop(1, 'rgba(233,69,96,0)');
    ctx.fillStyle = dividerGrad;
    ctx.fillRect(TEXT_START_X, dividerY, 250, 2);

    // ── Username ───────────────────────────────────────────────────────
    yPos = dividerY + 20;
    if (opts.showUsername) {
        const displayName = member?.user?.username || member?.displayName || 'عضو جديد';
        const usernameLines = wrapText(ctx, displayName, TEXT_MAX_WIDTH);

        ctx.fillStyle = TEXT_COLOR;
        ctx.font = `bold 28px ${registeredFontFamily}`;
        ctx.globalAlpha = 0.9;

        for (let i = 0; i < Math.min(usernameLines.length, 2); i++) {
            ctx.fillText(truncateText(usernameLines[i], 30), TEXT_START_X, yPos);
            yPos += 38;
        }
        ctx.globalAlpha = 1;
    }

    // ── Member count ──────────────────────────────────────────────────
    if (opts.showMemberCount && guild?.memberCount) {
        const memberCount = guild.memberCount;
        const countText = `Member #${memberCount}`;
        const countAr = `العضو رقم ${memberCount}`;

        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.font = `18px ${registeredFontFamily}`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        // Display both Arabic and English
        const countCombined = countAr + '  •  ' + countText;
        ctx.fillText(countCombined, TEXT_START_X, yPos + 10);
    }

    // ── Server icon (bottom-right corner) ──────────────────────────────
    if (serverIconImg) {
        const ICON_SIZE = 64;
        const ICON_X = WIDTH - ICON_SIZE - 40;
        const ICON_Y = HEIGHT - ICON_SIZE - 40;

        // Background circle
        ctx.beginPath();
        ctx.arc(ICON_X + ICON_SIZE / 2, ICON_Y + ICON_SIZE / 2, ICON_SIZE / 2 + 4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.fill();

        // Clip and draw
        ctx.save();
        ctx.beginPath();
        ctx.arc(ICON_X + ICON_SIZE / 2, ICON_Y + ICON_SIZE / 2, ICON_SIZE / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();

        const siAspect = serverIconImg.width / serverIconImg.height;
        let six = 0, siy = 0, siw = serverIconImg.width, sih = serverIconImg.height;
        if (siAspect > 1) { six = (serverIconImg.width - serverIconImg.height) / 2; siw = serverIconImg.height; }
        else { siy = (serverIconImg.height - serverIconImg.width) / 2; sih = serverIconImg.width; }
        ctx.drawImage(serverIconImg, six, siy, siw, sih, ICON_X, ICON_Y, ICON_SIZE, ICON_SIZE);
        ctx.restore();

        // Server name label under icon
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = `12px ${registeredFontFamily}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(truncateText(guild?.name || 'Server', 12), ICON_X + ICON_SIZE / 2, ICON_Y + ICON_SIZE + 8);
    }

    // ── "Family Legends Bot" watermark ─────────────────────────────────
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.font = `bold 14px ${registeredFontFamily}`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText('Family Legends Bot', WIDTH - 20, HEIGHT - 16);

    // ── Export to PNG buffer ───────────────────────────────────────────
    try {
        const buffer = canvas.toBuffer('image/png');
        return buffer;
    } catch (err) {
        logger.error(`[welcomeImage] Failed to export canvas to buffer: ${err.message}`);
        return null;
    }
}

// ── Exports ───────────────────────────────────────────────────────────────

module.exports = {
    drawWelcomeCard,
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
