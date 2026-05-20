/**
 * @file src/events/presenceUpdate.js
 * @description كشف بدء/إيقاف البث المباشر عبر تحديثات الحضور على ديسكورد.
 * يرسل أحداث stream_start و stream_end إلى webhook الموقع.
 */

const ServerConfig = require('../database/schemas/serverConfigSchema');
const { isDatabaseConnected } = require('../database/connect');
const { sendStreamStart, sendStreamEnd } = require('../utils/webhook');
const { EmbedBuilder } = require('discord.js');
const { config } = require('../config');

/**
 * تخزين حالة البث الحالية لكل عضو
 * لتجنب الإرسال المتكرر لنفس الحدث
 * @type {Map<string, {url: string, startedAt: string}>}
 */
const activeStreams = new Map();

// 🧹 تنظيف دوري للإدخالات القديمة لمنع تسرب الذاكرة (كل 24 ساعة)
setInterval(() => {
    const now = Date.now();
    for (const [key, data] of activeStreams.entries()) {
        const startedAt = new Date(data.startedAt).getTime();
        if (now - startedAt > 86400000) { // 24 hours TTL
            activeStreams.delete(key);
        }
    }
}, 86400000);

/**
 * تحديد المنصة من رابط البث
 * @param {string} url - رابط البث
 * @returns {string} اسم المنصة
 */
function detectPlatform(url) {
    if (!url) return 'unknown';
    const lower = url.toLowerCase();
    if (lower.includes('twitch.tv')) return 'twitch';
    if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'youtube';
    if (lower.includes('kick.com')) return 'kick';
    if (lower.includes('tiktok.com')) return 'tiktok';
    if (lower.includes('facebook.com') || lower.includes('fb.watch')) return 'facebook';
    return 'unknown';
}

/**
 * @module events/presenceUpdate
 * @description Event handler for Discord presence updates (stream detection).
 */
module.exports = {
    /** @type {string} Event name */
    name: 'presenceUpdate',
    /** @type {boolean} Fire on every occurrence */
    once: false,

    /**
     * Executes when a member's presence is updated.
     * Detects stream start/stop events and forwards them to the website webhook.
     * @async
     * @param {import('discord.js').Presence} oldPresence - Previous presence
     * @param {import('discord.js').Presence} newPresence - Updated presence
     * @param {import('discord.js').Client} client - The Discord client
     * @returns {Promise<void>}
     */
    async execute(oldPresence, newPresence, client) {
        // ─── بوابة الأمان (Security Gate) ───
        if (!newPresence.guild || newPresence.guild.id !== config.mainGuildId) return;

        // تجاهل الأعضاء بدون سيرفر أو البوتات
        if (!newPresence.member || newPresence.member.user.bot) return;

        const member = newPresence.member;
        const userId = member.id;
        // Use username instead of tag for consistent lookup in Firestore
        const username = member.user.username;
        const userTag = member.user.tag;

        // البحث عن نشاط بث في الحضور الجديد
        const newStreaming = newPresence.activities?.find(
            a => a.type === ActivityType.Streaming
        );

        // البحث عن نشاط بث في الحضور القديم
        const oldStreaming = oldPresence?.activities?.find(
            a => a.type === ActivityType.Streaming
        );

        const newStreamUrl = newStreaming?.url || null;
        const oldStreamUrl = oldStreaming?.url || null;
        const streamKey = `${userId}`;

        // ─── بدء بث جديد ───
        if (newStreamUrl && newStreamUrl !== oldStreamUrl) {
            // تحقق إذا لم يكن هذا البث مسجلاً مسبقاً
            const existing = activeStreams.get(streamKey);
            if (!existing || existing.url !== newStreamUrl) {
                const platform = detectPlatform(newStreamUrl);
                const startedAt = new Date().toISOString();

                activeStreams.set(streamKey, { url: newStreamUrl, startedAt });

                logger.info(`🔴 بدء بث مباشر: ${userTag} على ${platform} - ${newStreamUrl}`);

                try {
                    // 1. إرسال إلى Webhook الموقع
                    await sendStreamStart({
                        userId,
                        username,
                        streamUrl: newStreamUrl,
                        platform,
                        guildId: member.guild?.id,
                        startedAt,
                    });

                    // 2. إرسال تنبيه إلى قناة الديسكورد (إذا كان مفعلاً)
                    if (isDatabaseConnected() && member.guild) {
                        const guildConfig = await ServerConfig.get();
                        const streamConfig = guildConfig?.streaming;

                        if (streamConfig?.enabled && streamConfig?.channelId) {
                            // التحقق من توافق المنصة
                            if (streamConfig.platform === 'all' || streamConfig.platform === platform) {
                                const channel = member.guild.channels.cache.get(streamConfig.channelId);
                                if (channel) {
                                    const embed = new EmbedBuilder()
                                        .setColor(platform === 'twitch' ? '#6441a5' : '#ff0000')
                                        .setTitle(`🔴 ${userTag} بدأ بثاً مباشراً!`)
                                        .setURL(newStreamUrl)
                                        .setDescription(`جاري البث الآن على **${platform.toUpperCase()}**\nانضموا الآن عبر الرابط!`)
                                        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
                                        .addFields(
                                            { name: 'المنصة', value: platform.toUpperCase(), inline: true },
                                            { name: 'الرابط', value: `[اضغط هنا](${newStreamUrl})`, inline: true }
                                        )
                                        .setImage(newStreaming.assets?.largeImageURL() || member.user.displayAvatarURL({ size: 1024 }))
                                        .setFooter({ text: 'تنبيهات البث المباشر - Family Legends' })
                                        .setTimestamp();

                                    await channel.send({ content: `📢 انتباه! صانع المحتوى <@${userId}> في بث مباشر الآن!`, embeds: [embed] });
                                }
                            }
                        }
                    }
                } catch (error) {
                    logger.error('❌ فشل إرسال حدث بدء البث:', error.message);
                }
            }
            return;
        }

        // ─── توقف البث ───
        if (!newStreaming && oldStreaming) {
            const existing = activeStreams.get(streamKey);
            if (existing) {
                activeStreams.delete(streamKey);
                logger.info(`⚪ توقف البث المباشر: ${userTag}`);

                try {
                    await sendStreamEnd({
                        userId,
                        username,
                        guildId: member.guild?.id,
                        endedAt: new Date().toISOString(),
                    });
                } catch (error) {
                    logger.error('❌ فشل إرسال حدث انتهاء البث:', error.message);
                }
            }
        }
    },
};
