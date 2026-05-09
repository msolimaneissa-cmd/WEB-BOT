/**
 * @file src/utils/notificationChecker.js
 * @description نظام مراقبة الإشعارات - يفحص Twitch, YouTube, Twitter/X, Reddit
 * ويرسل تنبيهات إلى قنوات ديسكورد عند وجود محتوى جديد.
 *
 * @module utils/notificationChecker
 */

const axios = require('axios');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const Notification = require('../database/schemas/notificationSchema');
const logger = require('./logger');

// ─── ثوابت ──────────────────────────────────────────────────────────────────

/** فترة الفحص الافتراضية بالمللي ثانية (30 ثانية) */
const DEFAULT_CHECK_INTERVAL_MS = 30_000;

/** مهلة طلبات API بالمللي ثانية */
const API_TIMEOUT_MS = 10_000;

/** ألوان المنصات */
const PLATFORM_COLORS = {
    twitch:  0x9146FF, // #9146FF
    youtube: 0xFF0000, // #FF0000
    twitter: 0x1DA1F2, // #1DA1F2
    reddit:  0xFF4500, // #FF4500
};

/** رموز المنصات */
const PLATFORM_EMOJIS = {
    twitch:  '🟣',
    youtube: '🔴',
    twitter: '🐦',
    reddit:  '🟠',
};

/** أسماء المنصات بالعربية */
const PLATFORM_NAMES = {
    twitch:  'تويتش',
    youtube: 'يوتيوب',
    twitter: 'تويتر/X',
    reddit:  'ريديت',
};

// ─── حالة داخلية ────────────────────────────────────────────────────────────

/**
 * خريطة لتتبع حالة البث المباشر على Twitch.
 * المفتاح: username, القيمة: { isLive: boolean, streamId: string }
 * @type {Map<string, { isLive: boolean, streamId: string }>}
 */
const twitchLiveState = new Map();

/**
 * خريطة لتتبع آخر فيديو YouTube تم إشعار به.
 * المفتاح: ytChannelId, القيمة: videoId
 * @type {Map<string, string>}
 */
const youtubeLastVideo = new Map();

/**
 * خريطة لتتبع آخر تغريدة تم إشعار بها.
 * المفتاح: username, القيمة: tweetId
 * @type {Map<string, string>}
 */
const twitterLastTweet = new Map();

/**
 * خريطة لتتبع آخر منشور Reddit تم إشعار به.
 * المفتاح: subreddit, القيمة: postId
 * @type {Map<string, string>}
 */
const redditLastPost = new Map();

/**
 * رمز OAuth لتويتش (يُحدّث تلقائياً)
 * @type {{ token: string|null, expiresAt: number } | null}
 */
let twitchOAuth = null;

/** مرجع setInterval لإيقاف الفحص عند الحاجة */
let checkIntervalRef = null;

// ─── مساعدات عامة ──────────────────────────────────────────────────────────

/**
 * التحقق من انقضاء فترة الفحص (checkInterval)
 * @param {Date|null} lastNotified - تاريخ آخر إشعار
 * @param {number} checkInterval - الفترة بالثواني
 * @returns {boolean}
 */
function shouldNotify(lastNotified, checkInterval) {
    if (!lastNotified) return true;
    const elapsed = Date.now() - new Date(lastNotified).getTime();
    return elapsed >= checkInterval * 1000;
}

/**
 * التحقق من توافر بيانات اعتماد API
 * @param {...string} vars - متغيرات البيئة المطلوبة
 * @returns {boolean}
 */
function hasEnvVars(...vars) {
    return vars.every(v => typeof process.env[v] === 'string' && process.env[v].length > 0);
}

// ─── فحص Twitch ─────────────────────────────────────────────────────────────

/**
 * الحصول على رمز OAuth من Twitch
 * @async
 * @returns {Promise<string|null>}
 */
async function getTwitchToken() {
    // إعادة استخدام الرمز إذا كان صالحاً
    if (twitchOAuth && twitchOAuth.token && Date.now() < twitchOAuth.expiresAt) {
        return twitchOAuth.token;
    }

    if (!hasEnvVars('TWITCH_CLIENT_ID', 'TWITCH_CLIENT_SECRET')) {
        return null;
    }

    try {
        const response = await axios.post(
            'https://id.twitch.tv/oauth2/token',
            new URLSearchParams({
                client_id: process.env.TWITCH_CLIENT_ID,
                client_secret: process.env.TWITCH_CLIENT_SECRET,
                grant_type: 'client_credentials',
            }).toString(),
            {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                timeout: API_TIMEOUT_MS,
            }
        );

        twitchOAuth = {
            token: response.data.access_token,
            expiresAt: Date.now() + (response.data.expires_in * 1000) - 60_000, // تجديد قبل دقيقة
        };

        logger.success('✅ تم تحديث رمز OAuth لتويتش');
        return twitchOAuth.token;
    } catch (error) {
        logger.error('❌ فشل في الحصول على رمز OAuth لتويتش:', error.message);
        return null;
    }
}

/**
 * فحص حالة البث المباشر على Twitch
 * @async
 * @param {string} username - اسم المستخدم على Twitch
 * @returns {Promise<{ isLive: boolean, data: Object|null }>}
 */
async function checkTwitch(username) {
    const token = await getTwitchToken();
    if (!token) {
        return { isLive: false, data: null };
    }

    try {
        const response = await axios.get('https://api.twitch.tv/helix/streams', {
            params: { user_login: username },
            headers: {
                'Client-Id': process.env.TWITCH_CLIENT_ID,
                'Authorization': `Bearer ${token}`,
            },
            timeout: API_TIMEOUT_MS,
        });

        const streams = response.data?.data || [];
        if (streams.length === 0) {
            return { isLive: false, data: null };
        }

        const stream = streams[0];
        return {
            isLive: true,
            data: {
                streamId: stream.id,
                username: stream.user_name,
                title: stream.title,
                gameName: stream.game_name,
                viewerCount: stream.viewer_count,
                thumbnailUrl: stream.thumbnail_url
                    ? stream.thumbnail_url.replace('{width}', '1280').replace('{height}', '720')
                    : null,
                avatarUrl: null, // سيتم جلبه منفصلاً
                startedAt: stream.started_at,
                profileUrl: `https://twitch.tv/${stream.user_name}`,
            },
        };
    } catch (error) {
        logger.error(`❌ خطأ في فحص Twitch للمستخدم ${username}:`, error.message);
        return { isLive: false, data: null };
    }
}

/**
 * جلب صورة رمزية لمستخدم Twitch
 * @async
 * @param {string} username
 * @returns {Promise<string|null>}
 */
async function getTwitchAvatar(username) {
    const token = await getTwitchToken();
    if (!token) return null;

    try {
        const response = await axios.get('https://api.twitch.tv/helix/users', {
            params: { login: username },
            headers: {
                'Client-Id': process.env.TWITCH_CLIENT_ID,
                'Authorization': `Bearer ${token}`,
            },
            timeout: API_TIMEOUT_MS,
        });

        return response.data?.data?.[0]?.profile_image_url || null;
    } catch {
        return null;
    }
}

/**
 * معالجة إشعار Twitch - يرسل التضمين إذا كان البث جديداً
 * @async
 * @param {Object} notification - وثيقة الإشعار
 * @param {import('discord.js').Client} client
 * @returns {Promise<boolean>} هل تم إرسال إشعار
 */
async function processTwitchNotification(notification, client) {
    if (!hasEnvVars('TWITCH_CLIENT_ID', 'TWITCH_CLIENT_SECRET')) {
        logger.warn('⚠️ متغيرات بيئة Twitch غير مضبوطة - تخطي فحص Twitch');
        return false;
    }

    const { username } = notification;
    const result = await checkTwitch(username);

    // حالة البث السابقة
    const prevState = twitchLiveState.get(username) || { isLive: false, streamId: null };

    // إذا كان البث متوقف أو نفس البث → لا إشعار
    if (!result.isLive) {
        if (prevState.isLive) {
            logger.info(`⏹️ توقف البث المباشر: ${username} على تويتش`);
            twitchLiveState.set(username, { isLive: false, streamId: null });
        }
        return false;
    }

    // إذا كان نفس البث المسجل مسبقاً → لا إشعار
    if (prevState.streamId === result.data.streamId) {
        return false;
    }

    // بث جديد! تحديث الحالة وإرسال الإشعار
    twitchLiveState.set(username, { isLive: true, streamId: result.data.streamId });

    // جلب الصورة الرمزية
    const avatarUrl = await getTwitchAvatar(username);
    result.data.avatarUrl = avatarUrl;

    const { data } = result;

    // بناء التضمين
    const embed = new EmbedBuilder()
        .setColor(PLATFORM_COLORS.twitch)
        .setTitle(`${PLATFORM_EMOJIS.twitch} بث مباشر جديد!`)
        .setURL(data.profileUrl)
        .setDescription(`**${data.username}** يبث الآن!`)
        .addFields(
            { name: '🎮 اللعبة', value: data.gameName || 'غير محدد', inline: true },
            { name: '📺 العنوان', value: data.title || 'بدون عنوان', inline: true },
            { name: '👀 المشاهدين', value: `${data.viewerCount.toLocaleString('ar-SA')}`, inline: true },
        )
        .setThumbnail(data.avatarUrl)
        .setImage(data.thumbnailUrl)
        .setFooter({ text: 'Family Legends Bot ✨ | تويتش' })
        .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setLabel('مشاهدة على تويتش')
            .setURL(data.profileUrl)
            .setStyle(ButtonStyle.Link)
    );

    return { embed, row, platform: 'twitch' };
}

// ─── فحص YouTube ────────────────────────────────────────────────────────────

/**
 * فحص آخر فيديو على YouTube
 * @async
 * @param {string} channelId - معرف قناة YouTube
 * @returns {Promise<{ isNew: boolean, data: Object|null }>}
 */
async function checkYouTube(channelId) {
    if (!hasEnvVars('YOUTUBE_API_KEY')) {
        return { isNew: false, data: null };
    }

    try {
        const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
            params: {
                part: 'snippet',
                channelId,
                type: 'video',
                order: 'date',
                maxResults: 1,
                key: process.env.YOUTUBE_API_KEY,
            },
            timeout: API_TIMEOUT_MS,
        });

        const items = response.data?.items || [];
        if (items.length === 0) {
            return { isNew: false, data: null };
        }

        const video = items[0];
        const videoId = video.id.videoId;
        const lastVideoId = youtubeLastVideo.get(channelId);

        return {
            isNew: !lastVideoId || lastVideoId !== videoId,
            data: {
                videoId,
                title: video.snippet.title,
                description: video.snippet.description?.substring(0, 200) || '',
                channelTitle: video.snippet.channelTitle,
                publishedAt: video.snippet.publishedAt,
                thumbnail: video.snippet.thumbnails?.high?.url
                    || video.snippet.thumbnails?.medium?.url
                    || video.snippet.thumbnails?.default?.url
                    || null,
                videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
            },
        };
    } catch (error) {
        logger.error(`❌ خطأ في فحص YouTube للقناة ${channelId}:`, error.message);
        return { isNew: false, data: null };
    }
}

/**
 * جلب تفاصيل إضافية لفيديو YouTube (المدة، المشاهدات)
 * @async
 * @param {string} videoId
 * @returns {Promise<{ duration: string, viewCount: string|null } | null>}
 */
async function getYouTubeVideoDetails(videoId) {
    if (!hasEnvVars('YOUTUBE_API_KEY')) return null;

    try {
        const response = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
            params: {
                part: 'contentDetails,statistics',
                id: videoId,
                key: process.env.YOUTUBE_API_KEY,
            },
            timeout: API_TIMEOUT_MS,
        });

        const video = response.data?.items?.[0];
        if (!video) return null;

        // تحويل ISO 8601 مدة إلى نص مقروء
        const durationIso = video.contentDetails?.duration || 'PT0S';
        const durationStr = formatISODuration(durationIso);

        const viewCount = video.statistics?.viewCount;

        return { duration: durationStr, viewCount };
    } catch {
        return null;
    }
}

/**
 * تحويل صيغة ISO 8601 للمدة إلى نص مقروء
 * @param {string} iso - مثل PT1H30M45S
 * @returns {string}
 */
function formatISODuration(iso) {
    const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return '0:00';

    const hours = parseInt(match[1] || '0', 10);
    const minutes = parseInt(match[2] || '0', 10);
    const seconds = parseInt(match[3] || '0', 10);

    if (hours > 0) {
        return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

/**
 * معالجة إشعار YouTube
 * @async
 * @param {Object} notification
 * @param {import('discord.js').Client} client
 * @returns {Promise<boolean|Object>}
 */
async function processYouTubeNotification(notification, client) {
    if (!hasEnvVars('YOUTUBE_API_KEY')) {
        logger.warn('⚠️ متغير بيئة YOUTUBE_API_KEY غير مضبوط - تخطي فحص YouTube');
        return false;
    }

    const channelId = notification.extra?.ytChannelId || notification.username;
    const result = await checkYouTube(channelId);

    if (!result.isNew || !result.data) {
        return false;
    }

    // تحديث آخر فيديو
    youtubeLastVideo.set(channelId, result.data.videoId);

    // جلب تفاصيل إضافية
    const details = await getYouTubeVideoDetails(result.data.videoId);

    const { data } = result;

    const fields = [
        { name: '📺 القناة', value: data.channelTitle, inline: true },
    ];

    if (details) {
        fields.push(
            { name: '⏱️ المدة', value: details.duration, inline: true },
        );
        if (details.viewCount) {
            fields.push(
                { name: '👁️ المشاهدات', value: parseInt(details.viewCount, 10).toLocaleString('ar-SA'), inline: true },
            );
        }
    }

    const embed = new EmbedBuilder()
        .setColor(PLATFORM_COLORS.youtube)
        .setTitle(`${PLATFORM_EMOJIS.youtube} فيديو جديد!`)
        .setURL(data.videoUrl)
        .setDescription(`**${data.title}**`)
        .addFields(fields)
        .setThumbnail(data.thumbnail)
        .setImage(data.thumbnail)
        .setFooter({ text: 'Family Legends Bot ✨ | يوتيوب' })
        .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setLabel('مشاهدة الفيديو')
            .setURL(data.videoUrl)
            .setStyle(ButtonStyle.Link)
    );

    return { embed, row, platform: 'youtube' };
}

// ─── فحص Twitter/X ──────────────────────────────────────────────────────────

/**
 * فحص آخر تغريدة عبر RSS (nitter أو نقطة نهاية بديلة)
 * @async
 * @param {string} username - اسم المستخدم على Twitter/X
 * @returns {Promise<{ isNew: boolean, data: Object|null }>}
 */
async function checkTwitter(username) {
    try {
        // محاولة nitter RSS أولاً (أو نقاط نهاية بديلة)
        const endpoints = [
            `https://nitter.net/${username}/rss`,
            `https://nitter.privacydev.net/${username}/rss`,
            `https://rss.fregate.com/twitter/user/${username}`,
        ];

        let response = null;
        for (const url of endpoints) {
            try {
                response = await axios.get(url, {
                    timeout: API_TIMEOUT_MS,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (compatible; DiscordBot/1.0)',
                        'Accept': 'application/rss+xml, text/xml, application/xml',
                    },
                });
                if (response.status === 200) break;
                response = null;
            } catch {
                continue;
            }
        }

        if (!response || !response.data) {
            logger.debug(`⚠️ لم يتم العثور على RSS لتويتر للمستخدم ${username}`);
            return { isNew: false, data: null };
        }

        // تحليل RSS XML - استخراج أول عنصر
        const xml = response.data;
        const itemMatch = xml.match(/<item>([\s\S]*?)<\/item>/i);
        if (!itemMatch) {
            return { isNew: false, data: null };
        }

        const itemXml = itemMatch[1];

        // استخراج الحقول
        const titleMatch = itemXml.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i);
        const linkMatch = itemXml.match(/<link>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/i);
        const pubDateMatch = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/i);
        const descMatch = itemXml.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i);

        // استخراج tweetId من الرابط
        const tweetUrl = linkMatch?.[1]?.trim() || '';
        const tweetIdMatch = tweetUrl.match(/\/status\/(\d+)/);
        const tweetId = tweetIdMatch?.[1] || null;

        const title = titleMatch?.[1]?.trim() || '';
        const description = descMatch?.[1]?.trim() || title;
        // إزالة HTML tags من النص
        const cleanText = description.replace(/<[^>]*>/g, '').substring(0, 300);
        const pubDate = pubDateMatch?.[1]?.trim() || new Date().toISOString();

        if (!tweetId) {
            return { isNew: false, data: null };
        }

        const lastTweetId = twitterLastTweet.get(username);
        const isNew = !lastTweetId || lastTweetId !== tweetId;

        return {
            isNew,
            data: {
                tweetId,
                username,
                text: cleanText,
                url: tweetUrl || `https://twitter.com/${username}/status/${tweetId}`,
                publishedAt: pubDate,
            },
        };
    } catch (error) {
        logger.debug(`⚠️ فشل في فحص Twitter للمستخدم ${username}: ${error.message}`);
        return { isNew: false, data: null };
    }
}

/**
 * معالجة إشعار Twitter/X
 * @async
 * @param {Object} notification
 * @param {import('discord.js').Client} client
 * @returns {Promise<boolean|Object>}
 */
async function processTwitterNotification(notification, client) {
    const result = await checkTwitter(notification.username);

    if (!result.isNew || !result.data) {
        return false;
    }

    // تحديث آخر تغريدة
    twitterLastTweet.set(notification.username, result.data.tweetId);

    // التحقق من الكلمات المفتاحية إن وجدت
    const keywords = notification.extra?.keywords || [];
    if (keywords.length > 0) {
        const matchesKeyword = keywords.some(kw =>
            result.data.text.toLowerCase().includes(kw.toLowerCase())
        );
        if (!matchesKeyword) {
            logger.debug(`⏭️ تغريدة ${notification.username} لا تطابق الكلمات المفتاحية - تم تخطيها`);
            return false;
        }
    }

    const { data } = result;

    const embed = new EmbedBuilder()
        .setColor(PLATFORM_COLORS.twitter)
        .setTitle(`${PLATFORM_EMOJIS.twitter} تغريدة جديدة!`)
        .setURL(data.url)
        .setDescription(data.text.length > 400 ? data.text.substring(0, 397) + '...' : data.text)
        .addFields(
            { name: '👤 الحساب', value: `@${data.username}`, inline: true },
            { name: '📅 التاريخ', value: new Date(data.publishedAt).toLocaleDateString('ar-SA'), inline: true },
        )
        .setFooter({ text: 'Family Legends Bot ✨ | تويتر/X' })
        .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setLabel('عرض التغريدة')
            .setURL(data.url)
            .setStyle(ButtonStyle.Link)
    );

    return { embed, row, platform: 'twitter' };
}

// ─── فحص Reddit ─────────────────────────────────────────────────────────────

/**
 * فحص آخر المنشورات على Reddit
 * @async
 * @param {string} subreddit - اسم المجتمع الفرعي
 * @param {string} postType - نوع المنشورات (hot, new, top)
 * @param {number} minUpvotes - الحد الأدنى للتصويتات
 * @returns {Promise<{ isNew: boolean, data: Object|null }>}
 */
async function checkReddit(subreddit, postType = 'hot', minUpvotes = 0) {
    try {
        const response = await axios.get(
            `https://www.reddit.com/r/${subreddit}/${postType}.json`,
            {
                params: { limit: 5 },
                headers: {
                    'User-Agent': 'FamilyLegendsBot/1.0 (Notification Checker)',
                },
                timeout: API_TIMEOUT_MS,
            }
        );

        const posts = response.data?.data?.children || [];
        if (posts.length === 0) {
            return { isNew: false, data: null };
        }

        // البحث عن أول منشور يحقق شروط minUpvotes ولم يتم إشعاره
        for (const post of posts) {
            const postData = post.data;
            const postId = postData.id;

            // التحقق من الحد الأدنى للتصويتات
            if (postData.ups < minUpvotes) {
                continue;
            }

            const lastPostId = redditLastPost.get(subreddit);
            if (lastPostId === postId) {
                continue; // تم الإشعار عنه مسبقاً
            }

            // تحقق إضافي: إذا كان آخر معرف مسجل أقدم → منشور جديد
            //Reddit يستخدم ترتيب ID بحيث الأحدث أكبر
            const isNew = !lastPostId || postId > lastPostId;

            if (!isNew) continue;

            return {
                isNew: true,
                data: {
                    postId,
                    title: postData.title,
                    author: postData.author,
                    url: `https://reddit.com${postData.permalink}`,
                    score: postData.score,
                    numComments: postData.num_comments,
                    subreddit: postData.subreddit,
                    thumbnail: postData.thumbnail
                        && !postData.thumbnail.startsWith('self')
                        && !postData.thumbnail.startsWith('default')
                        ? postData.thumbnail
                        : null,
                    isSelf: postData.is_self,
                    selftext: postData.selftext?.substring(0, 200) || null,
                    createdAt: new Date(postData.created_utc * 1000),
                },
            };
        }

        return { isNew: false, data: null };
    } catch (error) {
        logger.error(`❌ خطأ في فحص Reddit للمجتمع r/${subreddit}:`, error.message);
        return { isNew: false, data: null };
    }
}

/**
 * معالجة إشعار Reddit
 * @async
 * @param {Object} notification
 * @param {import('discord.js').Client} client
 * @returns {Promise<boolean|Object>}
 */
async function processRedditNotification(notification, client) {
    const subreddit = notification.extra?.subreddit || notification.username;
    const postType = notification.extra?.postType || 'hot';
    const minUpvotes = notification.extra?.minUpvotes || 0;

    const result = await checkReddit(subreddit, postType, minUpvotes);

    if (!result.isNew || !result.data) {
        return false;
    }

    // تحديث آخر منشور
    redditLastPost.set(subreddit, result.data.postId);

    const { data } = result;

    const embed = new EmbedBuilder()
        .setColor(PLATFORM_COLORS.reddit)
        .setTitle(`${PLATFORM_EMOJIS.reddit} منشور جديد!`)
        .setURL(data.url)
        .setDescription(`**${data.title}**`)
        .addFields(
            { name: '📝 المؤلف', value: `u/${data.author}`, inline: true },
            { name: '⬆️ التصويتات', value: `${data.score.toLocaleString('ar-SA')}`, inline: true },
            { name: '💬 التعليقات', value: `${data.numComments.toLocaleString('ar-SA')}`, inline: true },
            { name: '📰 المجتمع', value: `r/${data.subreddit}`, inline: true },
        )
        .setThumbnail(data.thumbnail)
        .setFooter({ text: 'Family Legends Bot ✨ | ريديت' })
        .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setLabel('قراءة المنشور')
            .setURL(data.url)
            .setStyle(ButtonStyle.Link)
    );

    return { embed, row, platform: 'reddit' };
}

// ─── معالجات المنصات ────────────────────────────────────────────────────────

/** خريطة معالجات المنصات */
const platformHandlers = {
    twitch:  processTwitchNotification,
    youtube: processYouTubeNotification,
    twitter: processTwitterNotification,
    reddit:  processRedditNotification,
};

// ─── إرسال الإشعار إلى Discord ─────────────────────────────────────────────

/**
 * إرسال إشعار إلى قناة Discord
 * @async
 * @param {import('discord.js').Client} client
 * @param {string} channelId - معرف القناة
 * @param {EmbedBuilder} embed - التضمين
 * @param {ActionRowBuilder} [row] - أزرار الإجراء
 * @param {Object} notification - وثيقة الإشعار
 * @returns {Promise<boolean>}
 */
async function sendDiscordNotification(client, channelId, embed, row, notification) {
    try {
        const channel = await client.channels.fetch(channelId);
        if (!channel || !channel.isTextBased()) {
            logger.warn(`⚠️ القناة ${channelId} غير موجودة أو ليست قناة نصية`);
            return false;
        }

        // بناء المحتوى مع الإشارة
        let content = '';
        if (notification.mentionRoleId) {
            content = `<@&${notification.mentionRoleId}> `;
        }
        if (notification.mentionEveryone) {
            content += '@everyone ';
        }
        if (notification.customMessage) {
            content += notification.customMessage;
        }

        const messagePayload = { embeds: [embed] };
        if (row) {
            messagePayload.components = [row];
        }
        if (content.trim()) {
            messagePayload.content = content.trim();
            messagePayload.allowedMentions = {
                roles: notification.mentionRoleId ? [notification.mentionRoleId] : [],
                everyone: notification.mentionEveryone || false,
            };
        }

        await channel.send(messagePayload);
        return true;
    } catch (error) {
        logger.error(`❌ فشل في إرسال الإشعار إلى القناة ${channelId}:`, error.message);
        return false;
    }
}

// ─── الحلقة الرئيسية ───────────────────────────────────────────────────────

/**
 * تنفيذ دورة فحص واحدة لجميع الإشعارات المفعلة
 * @async
 * @param {import('discord.js').Client} client
 */
async function runCheckCycle(client) {
    try {
        // جلب جميع الإشعارات المفعلة
        const notifications = await Notification.find({ enabled: true }).lean();

        if (notifications.length === 0) {
            return;
        }

        logger.debug(`🔄 جاري فحص ${notifications.length} إشعار...`);

        for (const notification of notifications) {
            try {
                // التحقق من فترة الفحص
                if (!shouldNotify(notification.lastNotified, notification.checkInterval)) {
                    continue;
                }

                const handler = platformHandlers[notification.platform];
                if (!handler) {
                    logger.warn(`⚠️ منصة غير معروفة: ${notification.platform}`);
                    continue;
                }

                // معالجة الإشعار
                const result = await handler(notification, client);

                // إذا كانت النتيجة false → لا إشعار جديد
                if (!result) continue;

                // إذا كانت النتيجة تحتوي على embed → إرسالها
                if (result.embed) {
                    const sent = await sendDiscordNotification(
                        client,
                        notification.channelId,
                        result.embed,
                        result.row,
                        notification
                    );

                    if (sent) {
                        // تحديث آخر إشعار في قاعدة البيانات
                        await Notification.findByIdAndUpdate(notification._id, {
                            lastNotified: new Date(),
                        });

                        logger.info(
                            `📢 إشعار ${PLATFORM_NAMES[notification.platform]}: ` +
                            `${notification.username} → القناة ${notification.channelId}`
                        );
                    }
                }
            } catch (error) {
                logger.error(
                    `❌ خطأ في معالجة إشعار ${notification.platform}/${notification.username} ` +
                    `(ID: ${notification._id}):`,
                    error.message
                );
            }
        }
    } catch (error) {
        logger.error('❌ خطأ في دورة فحص الإشعارات:', error.message);
    }
}

// ─── نقطة الدخول الرئيسية ──────────────────────────────────────────────────

/**
 * بدء نظام مراقبة الإشعارات
 * @async
 * @param {import('discord.js').Client} client - عميل Discord
 * @param {number} [intervalMs=30000] - فترة الفحص بالمللي ثانية
 * @returns {{ stop: Function }}
 */
function startNotificationChecker(client, intervalMs = DEFAULT_CHECK_INTERVAL_MS) {
    logger.separator('📢 نظام الإشعارات');
    logger.info(`🔄 تم تفعيل نظام مراقبة الإشعارات (كل ${intervalMs / 1000} ثانية)`);

    // التحقق من بيانات الاعتماد
    if (hasEnvVars('TWITCH_CLIENT_ID', 'TWITCH_CLIENT_SECRET')) {
        logger.success('✅ بيانات اعتماد Twitch متوفرة');
    } else {
        logger.warn('⚠️ بيانات اعتماد Twitch غير متوفرة - فحص Twitch معطل');
    }

    if (hasEnvVars('YOUTUBE_API_KEY')) {
        logger.success('✅ مفتاح YouTube API متوفّر');
    } else {
        logger.warn('⚠️ مفتاح YOUTUBE_API_KEY غير متوفّر - فحص YouTube معطل');
    }

    logger.info('ℹ️ فحص Twitter/X و Reddit متاح بدون بيانات اعتماد خاصة');

    // فحص أولي بعد 5 ثوانٍ
    setTimeout(() => runCheckCycle(client), 5000);

    // بدء الفحص الدوري
    checkIntervalRef = setInterval(() => runCheckCycle(client), intervalMs);

    return {
        /**
         * إيقاف نظام مراقبة الإشعارات
         */
        stop() {
            if (checkIntervalRef) {
                clearInterval(checkIntervalRef);
                checkIntervalRef = null;
                logger.info('⏹️ تم إيقاف نظام مراقبة الإشعارات');
            }
        },
    };
}

// ─── الصادرات ───────────────────────────────────────────────────────────────

module.exports = {
    startNotificationChecker,
    // دوال منفصلة للتصدير (للاختبار أو الاستخدام الخارجي)
    checkTwitch,
    checkYouTube,
    checkTwitter,
    checkReddit,
    processTwitchNotification,
    processYouTubeNotification,
    processTwitterNotification,
    processRedditNotification,
    sendDiscordNotification,
    shouldNotify,
    // ثوابت
    PLATFORM_COLORS,
    PLATFORM_EMOJIS,
    PLATFORM_NAMES,
};
