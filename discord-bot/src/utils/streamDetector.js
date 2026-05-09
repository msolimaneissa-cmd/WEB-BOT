/**
 * @file src/utils/streamDetector.js
 * @description نظام كشف حالة البث المباشر على المنصات الخارجية.
 * يدعم فحص: Twitch, YouTube, TikTok, Kick
 */

const logger = require('./logger');

/** مهلة الطلب بالمللي ثانية */
const FETCH_TIMEOUT = 5000;

/**
 * فحص حالة البث المباشر على Twitch
 * يتحقق من وجود حالات البث عبر صفحة القناة
 * @async
 * @param {string} username - اسم المستخدم على Twitch
 * @returns {Promise<boolean>}
 */
async function checkTwitchLive(username) {
    try {
        const response = await fetch(`https://www.twitch.tv/${username}`, {
            signal: AbortSignal.timeout(FETCH_TIMEOUT),
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; DiscordBot/1.0)',
            },
        });

        const html = await response.text();
        // التحقق من وجود مؤشرات البث المباشر في صفحة Twitch
        return html.includes('"isLive":true') ||
               html.includes('"is_live":true') ||
               html.includes('data-a-target="live-channel-stream-card"');
    } catch (error) {
        logger.debug(`⚠️ فشل فحص Twitch للمستخدم ${username}: ${error.message}`);
        return false;
    }
}

/**
 * فحص حالة البث المباشر على Kick
 * @async
 * @param {string} username - اسم المستخدم على Kick
 * @returns {Promise<boolean>}
 */
async function checkKickLive(username) {
    try {
        const response = await fetch(`https://api.kick.com/public/v1/channels/${username}`, {
            signal: AbortSignal.timeout(FETCH_TIMEOUT),
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; DiscordBot/1.0)',
            },
        });

        const data = await response.json();
        return data?.data?.is_live === true;
    } catch (error) {
        logger.debug(`⚠️ فشل فحص Kick للمستخدم ${username}: ${error.message}`);
        return false;
    }
}

/**
 * فحص حالة البث المباشر على TikTok
 * @async
 * @param {string} username - اسم المستخدم على TikTok
 * @returns {Promise<boolean>}
 */
async function checkTikTokLive(username) {
    try {
        const response = await fetch(`https://www.tiktok.com/@${username}/live`, {
            signal: AbortSignal.timeout(FETCH_TIMEOUT),
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; DiscordBot/1.0)',
            },
        });

        const html = await response.text();
        return html.includes('"isLive":true') ||
               html.includes('"is_live":true') ||
               html.includes('LiveEventRoom');
    } catch (error) {
        logger.debug(`⚠️ فشل فحص TikTok للمستخدم ${username}: ${error.message}`);
        return false;
    }
}

/**
 * فحص حالة البث المباشر على YouTube
 * يتحقق من إعادة التوجيه من صفحة /live إلى /watch?v=
 * @async
 * @param {string} handle - معرف أو اسم القناة على YouTube
 * @returns {Promise<boolean>}
 */
async function checkYouTubeLive(handle) {
    try {
        const response = await fetch(`https://www.youtube.com/${handle}/live`, {
            signal: AbortSignal.timeout(FETCH_TIMEOUT),
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; DiscordBot/1.0)',
            },
            redirect: 'manual',
        });

        // إذا كان هناك إعادة توجيه إلى /watch?v= فهو بث مباشر
        const location = response.headers.get('location') || '';
        if (location.includes('/watch?v=')) {
            return true;
        }

        // إذا لم يكن هناك إعادة توجيه، تحقق من المحتوى
        if (response.status === 200) {
            const html = await response.text();
            return html.includes('"isLive":true') ||
                   html.includes('badge-style-live') ||
                   html.includes('ytp-live');
        }

        return false;
    } catch (error) {
        logger.debug(`⚠️ فشل فحص YouTube للمستخدم ${handle}: ${error.message}`);
        return false;
    }
}

/**
 * دوال الفحص حسب المنصة
 * @type {Object<string, Function>}
 */
const platformCheckers = {
    twitch: checkTwitchLive,
    kick: checkKickLive,
    tiktok: checkTikTokLive,
    youtube: checkYouTubeLive,
};

/**
 * فحص حالة بث مستخدم واحد
 * @async
 * @param {Object} streamer - بيانات المستخدم
 * @param {string} streamer.name - اسم المستخدم المعروض
 * @param {string} streamer.platform - المنصة
 * @param {string} streamer.username - اسم المستخدم على المنصة
 * @returns {Promise<{name: string, platform: string, username: string, isLive: boolean, checkedAt: string}>}
 */
async function checkStreamer(streamer) {
    const checker = platformCheckers[streamer.platform];
    if (!checker) {
        logger.warn(`⚠️ منصة غير معروفة: ${streamer.platform}`);
        return {
            name: streamer.name,
            platform: streamer.platform,
            username: streamer.username,
            isLive: false,
            checkedAt: new Date().toISOString(),
        };
    }

    try {
        const isLive = await checker(streamer.username);
        return {
            name: streamer.name,
            platform: streamer.platform,
            username: streamer.username,
            isLive,
            checkedAt: new Date().toISOString(),
        };
    } catch (error) {
        logger.debug(`⚠️ خطأ في فحص ${streamer.name} على ${streamer.platform}: ${error.message}`);
        return {
            name: streamer.name,
            platform: streamer.platform,
            username: streamer.username,
            isLive: false,
            checkedAt: new Date().toISOString(),
        };
    }
}

/**
 * فحص حالة البث لجميع المستخدمين المحددين
 * @async
 * @param {Array<{name: string, platform: string, username: string}>} streamersList - قائمة المستخدمين
 * @returns {Promise<Array<{name: string, platform: string, username: string, isLive: boolean, checkedAt: string}>>}
 */
async function checkAllStreamers(streamersList) {
    if (!streamersList || streamersList.length === 0) {
        return [];
    }

    logger.debug(`🔄 جاري فحص حالة البث لـ ${streamersList.length} مستخدم...`);

    const results = await Promise.allSettled(
        streamersList.map(streamer => checkStreamer(streamer))
    );

    const statuses = results.map((result, index) => {
        if (result.status === 'fulfilled') {
            return result.value;
        }
        const streamer = streamersList[index];
        return {
            name: streamer.name,
            platform: streamer.platform,
            username: streamer.username,
            isLive: false,
            checkedAt: new Date().toISOString(),
        };
    });

    const liveCount = statuses.filter(s => s.isLive).length;
    if (liveCount > 0) {
        logger.info(`🔴 تم اكتشاف ${liveCount} بث مباشر من أصل ${statuses.length}`);
    } else {
        logger.debug(`⚪ لا توجد بثوص مباشرة حالياً من أصل ${statuses.length} مستخدم`);
    }

    return statuses;
}

module.exports = {
    checkTwitchLive,
    checkKickLive,
    checkTikTokLive,
    checkYouTubeLive,
    checkAllStreamers,
    checkStreamer,
    platformCheckers,
};
