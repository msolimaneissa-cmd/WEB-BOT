/**
 * @file src/utils/canvasHelper.js
 * @description Helper for generating welcome images and rank cards using canvas.
 * Includes graceful fallback when canvas native module is unavailable.
 */

const path = require('path');
const logger = require('./logger');

// Track canvas availability
let canvasAvailable = false;
let createCanvas, loadImage, registerFont, Image;

// Try to load canvas module with graceful fallback
try {
    const canvas = require('canvas');
    createCanvas = canvas.createCanvas;
    loadImage = canvas.loadImage;
    registerFont = canvas.registerFont;
    Image = canvas.Image;
    canvasAvailable = true;
    logger.success('✅ Canvas module loaded successfully');
} catch (error) {
    logger.warn('⚠️ Canvas module not available - Image generation features disabled');
    logger.debug('Canvas error:', error.message);
    
    // Provide no-op fallbacks
    createCanvas = () => ({ getContext: () => ({ fillStyle: '', fillRect: () => {}, drawImage: () => {}, fillText: () => {}, measureText: () => ({ width: 0 }), beginPath: () => {}, arc: () => {}, closePath: () => {}, clip: () => {}, save: () => {}, restore: () => {} }), toBuffer: () => null });
    loadImage = () => Promise.resolve(null);
    registerFont = () => {};
    Image = class { constructor() { this.src = ''; } };
}

/**
 * Check if canvas functionality is available
 * @returns {boolean}
 */
function isCanvasAvailable() {
    return canvasAvailable;
}

/**
 * توليد صورة ترحيب احترافية
 * @param {import('discord.js').GuildMember} member - العضو الجديد
 * @param {Object} config - إعدادات الترحيب
 * @returns {Promise<Buffer|null>}
 */
async function generateWelcomeImage(member, config = {}) {
    if (!canvasAvailable) {
        logger.debug('Canvas not available, skipping welcome image generation');
        return null;
    }

    const {
        background = 'https://i.imgur.com/8P9u6u6.png', // خلفية افتراضية
        font = 'Arial',
        color = '#ffffff',
    } = config;

    try {
        const avatar = await loadImage(member.user.displayAvatarURL({ extension: 'png', size: 256 }));
        const bg = await loadImage(background);

        const canvas = createCanvas(1200, 500);
        const ctx = canvas.getContext('2d');

        // رسم الخلفية
        ctx.drawImage(bg, 0, 0, 1200, 500);

        // إضافة طبقة شفافة خفيفة
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(0, 0, 1200, 500);

        // رسم الأفاتار دائرية
        ctx.save();
        ctx.beginPath();
        ctx.arc(600, 150, 100, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatar, 500, 50, 200, 200);
        ctx.restore();

        // إضافة نص الترحيب مع ظل
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 5;
        ctx.shadowOffsetY = 5;

        // تدرج لوني للنص الرئيسي
        const gradient = ctx.createLinearGradient(0, 280, 0, 350);
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(1, color || '#3498db');

        ctx.fillStyle = gradient;
        ctx.textAlign = 'center';
        ctx.font = `bold 80px ${font}`;
        ctx.fillText('WELCOME', 600, 330);

        ctx.shadowBlur = 5;
        ctx.fillStyle = '#ffffff';
        ctx.font = `45px ${font}`;
        ctx.fillText(member.user.tag.toUpperCase(), 600, 390);

        ctx.font = `bold 35px ${font}`;
        ctx.fillStyle = color || '#3498db';
        ctx.fillText(`MEMBER #${member.guild.memberCount}`, 600, 450);

        return canvas.toBuffer();
    } catch (error) {
        logger.error('Error generating welcome image:', error);
        return null;
    }
}

/**
 * توليد بطاقة الرتبة (Rank Card)
 * @param {import('discord.js').User} user - المستخدم
 * @param {Object} stats - إحصائيات المستخدم (level, xp, xpNeeded, rank)
 * @param {Object} config - إعدادات البطاقة
 * @returns {Promise<Buffer|null>}
 */
async function generateRankCard(user, stats, config = {}) {
    if (!canvasAvailable) {
        logger.debug('Canvas not available, skipping rank card generation');
        return null;
    }

    const {
        background = 'https://i.imgur.com/8P9u6u6.png',
        color = '#3498db',
    } = config;

    const { level, xp, xpNeeded, rank } = stats;
    const progress = Math.min((xp / xpNeeded) * 100, 100);

    try {
        const avatar = await loadImage(user.displayAvatarURL({ extension: 'png', size: 256 }));
        const bg = await loadImage(background);

        const canvas = createCanvas(900, 300);
        const ctx = canvas.getContext('2d');

        // رسم الخلفية
        ctx.drawImage(bg, 0, 0, 900, 300);

        // طبقة شفافة
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        roundRect(ctx, 20, 20, 860, 260, 15, true, false);

        // الأفاتار
        ctx.save();
        ctx.beginPath();
        ctx.arc(120, 150, 80, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatar, 40, 70, 160, 160);
        ctx.restore();

        // النصوص
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'left';
        ctx.font = 'bold 40px Arial';
        ctx.fillText(user.username, 240, 100);
        ctx.font = '30px Arial';
        ctx.fillText(`LEVEL ${level}`, 240, 160);
        ctx.textAlign = 'right';
        ctx.fillText(`#${rank}`, 840, 100);

        // شريط التقدم (خلفية)
        ctx.fillStyle = '#444444';
        roundRect(ctx, 240, 200, 600, 30, 15, true, false);

        // شريط التقدم (تقدم)
        ctx.fillStyle = color;
        roundRect(ctx, 240, 200, (600 * progress) / 100, 30, 15, true, false);

        // نص XP
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.font = '20px Arial';
        ctx.fillText(`${xp} / ${xpNeeded} XP`, 540, 222);

        return canvas.toBuffer();
    } catch (error) {
        logger.error('Error generating rank card:', error);
        return null;
    }
}

/**
 * توليد بطاقة الملف الشخصي (Profile Card)
 * @param {import('discord.js').User} user - المستخدم
 * @param {Object} stats - إحصائيات المستخدم (level, xp, balance, bank, rank, badges)
 * @returns {Promise<Buffer|null>}
 */
async function generateProfileCard(user, stats) {
    if (!canvasAvailable) {
        logger.debug('Canvas not available, skipping profile card generation');
        return null;
    }

    const { level, xp, balance, bank, rank, badges = [] } = stats;
    const xpNeeded = Math.floor(100 * Math.pow(level, 1.5));
    const progress = Math.min((xp / xpNeeded) * 100, 100);

    try {
        const avatar = await loadImage(user.displayAvatarURL({ extension: 'png', size: 256 }));
        const bg = await loadImage('https://i.imgur.com/8P9u6u6.png');

        const canvas = createCanvas(1000, 600);
        const ctx = canvas.getContext('2d');

        // رسم الخلفية
        ctx.drawImage(bg, 0, 0, 1000, 600);

        // طبقة شفافة
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        roundRect(ctx, 30, 30, 940, 540, 30, true, false);

        // الأفاتار
        ctx.save();
        ctx.beginPath();
        ctx.arc(180, 180, 120, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatar, 60, 60, 240, 240);
        ctx.restore();

        // معلومات المستخدم
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'left';
        ctx.font = 'bold 50px Arial';
        ctx.fillText(user.username.toUpperCase(), 340, 120);
        ctx.font = '30px Arial';
        ctx.fillText(`LEVEL ${level}`, 340, 180);
        ctx.fillText(`RANK #${rank}`, 340, 230);

        // العملات
        roundRect(ctx, 340, 270, 600, 100, 15, true, false);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 25px Arial';
        ctx.fillText('BALANCE', 360, 310);
        ctx.fillText('BANK', 660, 310);
        ctx.font = '35px Arial';
        ctx.fillStyle = '#f1c40f';
        ctx.fillText(`${balance.toLocaleString()} 💰`, 360, 355);
        ctx.fillText(`${bank.toLocaleString()} 🏦`, 660, 355);

        // شريط الخبرة
        ctx.fillStyle = '#444444';
        roundRect(ctx, 60, 400, 880, 40, 20, true, false);
        ctx.fillStyle = '#3498db';
        roundRect(ctx, 60, 400, (880 * progress) / 100, 40, 20, true, false);
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.font = '20px Arial';
        ctx.fillText(`${xp} / ${xpNeeded} XP`, 500, 428);

        // الأوسمة (Badges)
        ctx.textAlign = 'left';
        ctx.font = 'bold 25px Arial';
        ctx.fillText('BADGES', 60, 480);

        // رسم الأوسمة
        let badgeX = 60;
        badges.slice(0, 8).forEach(badge => {
            ctx.fillText(badge.emoji || '⭐', badgeX, 530);
            badgeX += 50;
        });

        return canvas.toBuffer();
    } catch (error) {
        logger.error('Error generating profile card:', error);
        return null;
    }
}

/**
 * Helper function to draw rounded rectangles
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {number} width - Width
 * @param {number} height - Height
 * @param {number} radius - Corner radius
 * @param {boolean} fill - Whether to fill
 * @param {boolean} stroke - Whether to stroke
 */
function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
    if (typeof radius === 'undefined') {
        radius = 5;
    }
    if (typeof radius === 'number') {
        radius = { tl: radius, tr: radius, br: radius, bl: radius };
    }
    
    ctx.beginPath();
    ctx.moveTo(x + radius.tl, y);
    ctx.lineTo(x + width - radius.tr, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
    ctx.lineTo(x + width, y + height - radius.br);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
    ctx.lineTo(x + radius.bl, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
    ctx.lineTo(x, y + radius.tl);
    ctx.quadraticCurveTo(x, y, x + radius.tl, y);
    ctx.closePath();
    
    if (fill) {
        ctx.fill();
    }
    if (stroke) {
        ctx.stroke();
    }
}

module.exports = {
    generateWelcomeImage,
    generateRankCard,
    generateProfileCard,
    isCanvasAvailable,
    createCanvas,
    loadImage,
    registerFont,
    Image
};
