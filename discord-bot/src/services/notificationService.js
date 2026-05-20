/**
 * @file src/services/notificationService.js
 * @description نظام الإشعارات للبث المباشر (Twitch, YouTube).
 */

const { EmbedBuilder } = require('discord.js');
const ServerConfig = require('../database/schemas/serverConfigSchema');
const logger = require('../utils/logger');
const { checkAllStreamers } = require('../utils/streamDetector');
const { sendStreamStart, sendStreamEnd } = require('../utils/webhook');

// تخزين قائمة الستريمرز المباشرين حالياً عالمياً
let liveStreamers = [];
const previousLiveStatus = new Map();

function buildStreamUrl({ platform, username, channelLink }) {
    if (typeof channelLink === 'string' && channelLink.trim().startsWith('http')) {
        return channelLink.trim();
    }
    if (platform === 'youtube') return `https://www.youtube.com/${username}/live`;
    if (platform === 'kick') return `https://kick.com/${username}`;
    if (platform === 'tiktok') return `https://www.tiktok.com/@${username}/live`;
    return `https://twitch.tv/${username}`;
}

function getMaxLastChecked(streamers) {
    let max = null;
    for (const s of streamers) {
        if (!s?.lastChecked) continue;
        const d = new Date(s.lastChecked);
        if (!Number.isFinite(d.getTime())) continue;
        if (!max || d > max) max = d;
    }
    return max;
}

function shouldCheckNow(detection, streamers) {
    const intervalMinutes = Number.isFinite(detection?.checkInterval) ? detection.checkInterval : 60;
    const intervalMs = Math.max(60_000, intervalMinutes * 60_000);
    const lastChecked = getMaxLastChecked(streamers);
    if (!lastChecked) return true;
    return (Date.now() - lastChecked.getTime()) >= intervalMs;
}

/**
 * فحص حالة البث المباشر لجميع السيرفرات
 * @param {import('discord.js').Client} client 
 */
async function checkStreamStatus(client) {
    try {
        const guilds = await Guild.find({ 'website.streamDetection.enabled': true });
        const currentLive = [];

        for (const guildConfig of guilds) {
            const discordGuild = client.guilds.cache.get(guildConfig.guildId);
            if (!discordGuild) continue;

            const detection = guildConfig.website.streamDetection;
            if (!detection.enabled) continue;

            const streamers = guildConfig.website?.streamers || [];
            if (streamers.length === 0) continue;
            if (!shouldCheckNow(detection, streamers)) continue;

            const notifyChannel = detection.channelId
                ? discordGuild.channels.cache.get(detection.channelId)
                : null;

            const input = streamers
                .filter(s => s?.platform && s?.username)
                .map(s => ({ name: s.name, platform: s.platform, username: s.username }));

            const statuses = await checkAllStreamers(input);

            for (let i = 0; i < statuses.length; i++) {
                const status = statuses[i];
                const streamer = streamers.find(s => s.platform === status.platform && s.username === status.username);
                if (!streamer) continue;

                const key = `${guildConfig.guildId}-${status.platform}-${status.username}`;
                const wasLive = previousLiveStatus.has(key) ? previousLiveStatus.get(key) : (streamer.isLive || false);

                streamer.isLive = status.isLive;
                streamer.lastChecked = new Date();

                if (status.isLive) {
                    const streamUrl = buildStreamUrl({
                        platform: status.platform,
                        username: status.username,
                        channelLink: streamer.channelLink,
                    });

                    currentLive.push({
                        guildId: guildConfig.guildId,
                        guildName: discordGuild.name || 'Unknown',
                        name: streamer.name,
                        platform: status.platform,
                        username: status.username,
                        channelLink: streamUrl,
                    });

                    if (!wasLive) {
                        try {
                            await sendStreamStart({
                                userId: null,
                                username: streamer.name,
                                streamUrl,
                                platform: status.platform,
                                guildId: guildConfig.guildId,
                            });
                        } catch (e) {
                            logger.debug(`⚠️ فشل إرسال webhook لبداية البث: ${e?.message || e}`);
                        }

                        if (notifyChannel && notifyChannel.isTextBased()) {
                            try {
                                const embed = new EmbedBuilder()
                                    .setColor(status.platform === 'youtube' ? '#FF0000' : status.platform === 'kick' ? '#53FC18' : status.platform === 'tiktok' ? '#000000' : '#9146FF')
                                    .setTitle(`🔴 بث مباشر جديد: ${streamer.name}`)
                                    .setURL(streamUrl)
                                    .setDescription(`بدأ **${streamer.name}** بثاً مباشراً الآن على **${status.platform}**.`)
                                    .setTimestamp();

                                await notifyChannel.send({ embeds: [embed] });
                            } catch (e) {
                                logger.debug(`⚠️ فشل إرسال إشعار البث داخل ديسكورد: ${e?.message || e}`);
                            }
                        }
                    }
                } else if (wasLive) {
                    const streamUrl = buildStreamUrl({
                        platform: status.platform,
                        username: status.username,
                        channelLink: streamer.channelLink,
                    });
                    try {
                        await sendStreamEnd({
                            userId: null,
                            username: streamer.name,
                            streamUrl,
                            platform: status.platform,
                            guildId: guildConfig.guildId,
                        });
                    } catch (e) {
                        logger.debug(`⚠️ فشل إرسال webhook لنهاية البث: ${e?.message || e}`);
                    }
                }

                previousLiveStatus.set(key, status.isLive);
            }

            await guildConfig.save();
        }
        liveStreamers = currentLive;
    } catch (error) {
        logger.error('Error in stream status check:', error);
    }
}

/**
 * بدء نظام فحص البث
 * @param {import('discord.js').Client} client 
 */
function startStreamNotifications(client) {
    checkStreamStatus(client).catch(() => null);
    setInterval(() => checkStreamStatus(client), 60_000);
    logger.info('📡 نظام إشعارات البث المباشر يعمل');
}

/**
 * جلب قائمة الستريمرز المباشرين
 */
function getLiveStreamers() {
    return liveStreamers;
}

module.exports = { startStreamNotifications, getLiveStreamers, buildStreamUrl, shouldCheckNow };
