/**
 * @file src/utils/music.js
 * @description نظام الموسيقى الاحترافي مع دعم يوتيوب، سبوتيفاي، ساوندكلاود.
 * يتضمن نظام fallback ذكي للبحث والتشغيل من أفضل مصدر متاح.
 */

const { DisTube } = require("distube");
const { YtDlpPlugin } = require("@distube/yt-dlp");
const { SpotifyPlugin } = require("@distube/spotify");
const { SoundCloudPlugin } = require("@distube/soundcloud");
const ytSearch = require("yt-search");
const { createSuccessEmbed, createErrorEmbed, createInfoEmbed } = require("./embeds");
const logger = require("./logger");

/**
 * قائمة الفلاتر الصوتية المتاحة
 * @type {Object<string, string>}
 */
const FILTERS_MAP = {
    "3d": "3d",
    "bass": "bass",
    "nightcore": "nightcore",
    "vaporwave": "vaporwave",
    "surround": "surround",
    "reverse": "reverse",
    "karaoke": "karaoke",
    "tremolo": "tremolo",
    "vibrato": "vibrato",
    "8d": "8d",
};

/**
 * البحث السريع عن فيديو يوتيوب
 * @param {string} query - اسم الأغنية أو البحث
 * @returns {Promise<{url: string, title: string, duration: string}|null>}
 */
async function quickYouTubeSearch(query) {
    try {
        const result = await ytSearch(query);
        const video = result.videos?.[0];

        if (video) {
            return {
                url: video.url,
                title: video.title,
                duration: video.duration.timestamp || `${video.duration.seconds}s`,
                thumbnail: video.thumbnail,
            };
        }
        return null;
    } catch (error) {
        logger.debug('فشل البحث في yt-search:', error.message);
        return null;
    }
}

/**
 * التحقق إذا كان النص رابط
 * @param {string} text - النص للتحقق
 * @returns {boolean}
 */
function isURL(text) {
    try {
        new URL(text);
        return true;
    } catch {
        return false;
    }
}

/**
 * تحديد نوع الرابط
 * @param {string} url - الرابط
 * @returns {'youtube'|'spotify'|'soundcloud'|'unknown'}
 */
function detectURLType(url) {
    const lower = url.toLowerCase();
    if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'youtube';
    if (lower.includes('spotify.com')) return 'spotify';
    if (lower.includes('soundcloud.com')) return 'soundcloud';
    return 'unknown';
}

/**
 * تهيئة نظام الموسيقى DisTube مع إعدادات محسنة
 * @param {import('discord.js').Client} client - عميل ديسكورد
 */
function setupDistube(client) {
    // Guard: prevent duplicate initialization and duplicate event listeners
    if (client.distube) {
        logger.info('DisTube already initialized, skipping setup.');
        return;
    }

    // إنشاء مثيل DisTube مع إعدادات محسنة
    client.distube = new DisTube(client, {
        plugins: [
            // YtDlpPlugin مع إعدادات متقدمة لتجنب الحظر
            new YtDlpPlugin({
                update: false,
                // إعدادات yt-dlp لتجنب الحظر
                requestOptions: {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    },
                },
            }),
            new SpotifyPlugin(),
            new SoundCloudPlugin(),
        ],
        emitNewSongOnly: true,
        leaveOnStop: true,
        savePreviousSongs: true,
        searchSongs: 0, // نستخدم yt-search بدلاً من البحث المدمج
        searchCooldown: 10,
        nsfw: false,
    });

    // ─── أحداث الموسيقى ───

    /** عند بدء تشغيل أغنية جديدة */
    client.distube.on("playSong", (queue, song) => {
        const embed = createSuccessEmbed('🎵 يعمل الآن', `[${song.name}](${song.url})`)
            .addFields(
                { name: '⏱️ المدة', value: song.formattedDuration, inline: true },
                { name: '👤 طلب بواسطة', value: `${song.user}`, inline: true },
                { name: '📊 المركز في القائمة', value: `${queue.songs.length - 1} أغنية متبقية`, inline: true }
            )
            .setThumbnail(song.thumbnail);
        queue.textChannel.send({ embeds: [embed] }).catch(() => { });
    });

    /** عند إضافة أغنية للقائمة */
    client.distube.on("addSong", (queue, song) => {
        const embed = createSuccessEmbed('✅ تمت الإضافة للقائمة', `[${song.name}](${song.url})`)
            .addFields(
                { name: '⏱️ المدة', value: song.formattedDuration, inline: true },
                { name: '📊 المركز', value: `#${queue.songs.length - 1}`, inline: true },
                { name: '👤 طلب بواسطة', value: `${song.user}`, inline: true }
            );
        queue.textChannel.send({ embeds: [embed] }).catch(() => { });
    });

    /** عند إضافة قائمة تشغيل */
    client.distube.on("addList", (queue, playlist) => {
        const embed = createSuccessEmbed('✅ تمت إضافة قائمة التشغيل', `[${playlist.name}](${playlist.url})`)
            .addFields(
                { name: '🎵 عدد الأغاني', value: `${playlist.songs.length}`, inline: true },
                { name: '⏱️ المدة الإجمالية', value: playlist.formattedDuration || 'غير متاح', inline: true },
                { name: '👤 طلب بواسطة', value: `${playlist.user}`, inline: true }
            );
        queue.textChannel.send({ embeds: [embed] }).catch(() => { });
    });

    /** عند تهيئة قائمة الانتظار */
    client.distube.on("initQueue", async (queue) => {
        let defaultVolume = 80;
        let stay247 = false;

        try {
            const ServerConfig = require('../database/schemas/serverConfigSchema');
            const { isDatabaseConnected } = require('../database/connect');

            if (isDatabaseConnected() && queue.guild) {
                const guildConfig = await ServerConfig.get();
                if (guildConfig?.music?.defaultVolume) {
                    defaultVolume = guildConfig.music.defaultVolume;
                }
                if (guildConfig?.music?.stay247) {
                    stay247 = true;
                }
            }
        } catch (error) {
            // تجاهل أخطاء قاعدة البيانات
        }

        queue.volume = defaultVolume;
        // If 24/7 is enabled, we set some Distube properties
        if (stay247) {
            // DisTube doesn't have a direct 24/7 property, but we can set leaveOnEmpty/Stop to false for this queue
            queue.distube.options.leaveOnEmpty = false;
            queue.distube.options.leaveOnStop = false;
            queue.distube.options.leaveOnFinish = false;
        }
    });

    /** عند انتهاء قائمة الانتظار */
    client.distube.on("finish", (queue) => {
        if (queue.autoplay) {
            const embed = createInfoEmbed('🔄 التشغيل التلقائي', 'جاري البحث عن أغاني مشابهة...');
            queue.textChannel.send({ embeds: [embed] }).catch(() => { });
        } else {
            const embed = createInfoEmbed('📋 انتهت القائمة', 'لا توجد أغاني أخرى في القائمة.\nاستخدم `/موسيقى مغادرة` لطلب المغادرة.');
            queue.textChannel.send({ embeds: [embed] }).catch(() => { });
        }
    });

    /** عند عدم وجود نتائج مشابهة */
    client.distube.on("noRelated", (queue) => {
        const embed = createInfoEmbed('⚠️ التشغيل التلقائي', 'لم يتم العثور على أغاني مشابهة.');
        queue.textChannel.send({ embeds: [embed] }).catch(() => { });
        queue.stop();
    });

    /** عند انضمام البوت لقناة الصوت */
    client.distube.on("connect", (queue) => {
        const embed = createInfoEmbed('🔗 تم الاتصال', `تم الاتصال بقناة الصوت **${queue.voiceChannel.name}**.`);
        queue.textChannel.send({ embeds: [embed] }).catch(() => { });
    });

    /** عند فتح قناة الصوت بدون أعضاء */
    client.distube.on("empty", (queue) => {
        const embed = createInfoEmbed('🗣️ قناة الصوت فاضية', 'قناة الصوت فارغة. جاري المغادرة خلال 60 ثانية...');
        queue.textChannel.send({ embeds: [embed] }).catch(() => { });
    });

    /** عند قطع الاتصال */
    client.distube.on("disconnect", (queue) => {
        const embed = createInfoEmbed('🔌 تم الانفصال', 'تم الانفصال من قناة الصوت.');
        queue.textChannel.send({ embeds: [embed] }).catch(() => { });
        logger.info('تم قطع الاتصال من القناة الصوتية');
    });

    /** معالجة الأخطاء */
    client.distube.on("error", (channel, error) => {
        logger.error('خطأ في DisTube:', error.message);

        let errorMessage = getErrorMessage(error);

        if (channel && channel.send) {
            const embed = createErrorEmbed('❌ خطأ في الموسيقى', errorMessage);
            channel.send({ embeds: [embed] }).catch(() => { });
        }
    });

    // معالجة خطأ الاتصال بالقناة الصوتية (Voice Connection Timeout)
    // Guard: only register once to prevent duplicate listeners on re-initialization
    if (!client._musicVoiceStateListener) {
        client._musicVoiceStateListener = true;
        client.on('voiceStateUpdate', (oldState, newState) => {
            // إذا البوت انقطع عن القناة الصوتية
            if (oldState.member?.id === client.user?.id && oldState.channelId && !newState.channelId) {
                logger.warn('تم قطع الاتصال الصوتي unexpectedly');
            }
        });
    }

    logger.success('✅ تم تهيئة نظام الموسيقى الاحترافي (يوتيوب + سبوتيفاي + ساوندكلاود).');
}

/**
 * الحصول على رسالة خطأ واضحة
 * @param {Error} error - الخطأ
 * @returns {string}
 */
function getErrorMessage(error) {
    const msg = error.message?.toLowerCase() || '';

    if (msg.includes('429') || msg.includes('too many requests') || msg.includes('rate')) {
        return '⚠️ **يوتيوب مشغول حالياً**\n💡 **جرب:** استخدم رابط سبوتيفاي أو ساوندكلاود بدلاً من يوتيوب.\n⏳ انتظر دقيقة ثم حاول مرة أخرى.';
    }
    if (msg.includes('sign in to confirm')) {
        return '⚠️ هذا الفيديو يتطلب تسجيل الدخول (قد يكون مقيّد بالعمر).';
    }
    if (msg.includes('video unavailable') || msg.includes('not available')) {
        return '⚠️ هذا الفيديو غير متاح أو تم حذفه.';
    }
    if (msg.includes('private video')) {
        return '⚠️ هذا الفيديو خاص ولا يمكن تشغيله.';
    }
    if (msg.includes('no results') || msg.includes('not found')) {
        return '⚠️ لم يتم العثور على نتائج للبحث.';
    }
    if (msg.includes('unsupported url') || msg.includes('unsupported')) {
        return '⚠️ هذا الرابط غير مدعوم.\n✅ **الروابط المدعومة:** يوتيوب، سبوتيفاي، ساوندكلاود';
    }
    if (msg.includes('not in voice')) {
        return '⚠️ البوت ليس في قناة صوتية.';
    }
    if (msg.includes('live')) {
        return '⚠️ لا يمكن تشغيل البث المباشر.';
    }
    if (msg.includes('premium')) {
        return '⚠️ هذا المحتوى يتطلب اشتراك سبوتيفاي بريميوم.';
    }
    if (msg.includes('ffmpeg') || msg.includes('stream')) {
        return '⚠️ خطأ في معالجة الصوت. جرب أغنية أخرى.';
    }
    if (msg.includes('http') || msg.includes('status code')) {
        return '⚠️ حدث خطأ في الاتصال. حاول مرة أخرى.';
    }
    if (msg.includes('copyright') || msg.includes('blocked')) {
        return '⚠️ هذا المحتوى محمي بحقوق النشر ولا يمكن تشغيله.';
    }
    if (msg.includes('age')) {
        return '⚠️ هذا الفيديو مقيد بالعمر ولا يمكن تشغيله.';
    }

    return `حدث خطأ غير متوقع. حاول مرة أخرى.\n🔍 **التفاصيل:** \`${error.message?.slice(0, 100) || 'غير معروف'}\``;
}

/**
 * تشغيل أغنية مع نظام fallback ذكي
 * @param {import('discord.js').Client} client 
 * @param {import('discord.js').VoiceChannel} voiceChannel 
 * @param {import('discord.js').TextChannel} textChannel 
 * @param {import('discord.js').GuildMember} member 
 * @param {string} query 
 * @returns {Promise<{success: boolean, message: string, song?: object}>}
 */
async function smartPlay(client, voiceChannel, textChannel, member, query) {
    try {
        // إذا كان رابط، حاول تشغيله مباشرة
        if (isURL(query)) {
            const urlType = detectURLType(query);

            // روابط سبوتيفاي وساوندكلاود تعمل بشكل أفضل
            if (urlType === 'spotify' || urlType === 'soundcloud') {
                await client.distube.play(voiceChannel, query, {
                    textChannel,
                    member,
                });
                return { success: true, message: 'جاري التشغيل...' };
            }

            // روابط يوتيوب - حاول مباشرة
            try {
                await client.distube.play(voiceChannel, query, {
                    textChannel,
                    member,
                });
                return { success: true, message: 'جاري التشغيل من يوتيوب...' };
            } catch (ytError) {
                // إذا فشل يوتيوب، حاول البحث عن الأغنية
                logger.warn('فشل يوتيوب، جاري البحث البديل:', ytError.message);

                const searchResult = await quickYouTubeSearch(query);
                if (searchResult) {
                    // استخرج اسم الأغنية من الرابط وابحث عنه
                    return {
                        success: false,
                        message: '⚠️ يوتيوب محجوب حالياً. جرب استخدام سبوتيفاي أو ساوندكلاود.',
                        needsSearch: true
                    };
                }
            }
        }

        // إذا لم يكن رابط، ابحث عنه
        const searchResult = await quickYouTubeSearch(query);

        if (searchResult) {
            try {
                await client.distube.play(voiceChannel, searchResult.url, {
                    textChannel,
                    member,
                });
                return {
                    success: true,
                    message: `🎵 تم العثور على: **${searchResult.title}**`,
                    song: searchResult
                };
            } catch (playError) {
                // إذا فشل التشغيل، أرجع معلومات للبحث
                logger.warn('فشل تشغيل نتيجة البحث:', playError.message);
                return {
                    success: false,
                    message: '⚠️ يوتيوب محجوب حالياً.\n💡 **جرب:** اكتب اسم الأغنية مع "spotify" أو "soundcloud"',
                    needsSearch: true
                };
            }
        }

        // محاولة أخيرة مع DisTube search
        try {
            await client.distube.play(voiceChannel, query, {
                textChannel,
                member,
            });
            return { success: true, message: 'جاري البحث والتشغيل...' };
        } catch (finalError) {
            return {
                success: false,
                message: `❌ لم أتمكن من العثور على الأغنية.\n💡 **نصائح:**\n• تأكد من كتابة اسم الأغنية بشكل صحيح\n• جرب إضافة اسم الفنان\n• استخدم رابط من سبوتيفاي أو ساوندكلاود`
            };
        }
    } catch (error) {
        logger.error('خطأ في smartPlay:', error.message);
        return {
            success: false,
            message: getErrorMessage(error)
        };
    }
}

module.exports = {
    setupDistube,
    FILTERS_MAP,
    quickYouTubeSearch,
    isURL,
    detectURLType,
    getErrorMessage,
    smartPlay
};
