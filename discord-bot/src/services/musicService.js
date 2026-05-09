/**
 * @file src/services/musicService.js
 * @description خدمة موسيقى متقدمة - أفضل من أي بوت موسيقى
 * تدعم Spotify، SoundCloud، YouTube، وPremium Features
 */

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const logger = require('../utils/logger');

// تخزين مؤقت لقوائم التشغيل
const queueCache = new Map();
const historyCache = new Map();

// تنظيف دوري للكاش
setInterval(() => {
    const now = Date.now();
    for (const [key, data] of queueCache.entries()) {
        if (data.lastUpdate && now - data.lastUpdate > 1800000) { // 30 دقيقة
            queueCache.delete(key);
        }
    }
}, 600000);

/**
 * تشغيل أغنية
 * @param {import('discord.js').VoiceChannel} channel - القناة الصوتية
 * @param {string} query - البحث أو الرابط
 * @param {Object} distube - Instance من Distube
 * @param {string} userId - معرف المستخدم الذي طلب الأغنية
 * @returns {Promise<Object>}
 */
async function play(channel, query, distube, userId) {
    try {
        if (!distube) {
            return { success: false, error: 'نظام الموسيقى غير مهيأ' };
        }

        await distube.play(channel, query, {
            member: channel.guild.members.resolve(userId),
            textChannel: channel.guild.systemChannel || channel
        });

        return { success: true };

    } catch (error) {
        logger.error('خطأ في تشغيل الموسيقى:', error);
        return { success: false, error: error.message };
    }
}

/**
 * إيقاف التشغيل مؤقتاً
 * @param {string} guildId
 * @param {Object} distube
 * @returns {Promise<Object>}
 */
async function pause(guildId, distube) {
    try {
        const queue = distube.getQueue(guildId);
        if (!queue) {
            return { success: false, error: 'لا توجد أغنية قيد التشغيل' };
        }

        queue.pause();
        return { success: true };

    } catch (error) {
        logger.error('خطأ في الإيقاف المؤقت:', error);
        return { success: false, error: error.message };
    }
}

/**
 * استئناف التشغيل
 * @param {string} guildId
 * @param {Object} distube
 * @returns {Promise<Object>}
 */
async function resume(guildId, distube) {
    try {
        const queue = distube.getQueue(guildId);
        if (!queue) {
            return { success: false, error: 'لا توجد أغنية قيد التشغيل' };
        }

        queue.resume();
        return { success: true };

    } catch (error) {
        logger.error('خطأ في استئناف التشغيل:', error);
        return { success: false, error: error.message };
    }
}

/**
 * تخطي الأغنية
 * @param {string} guildId
 * @param {Object} distube
 * @returns {Promise<Object>}
 */
async function skip(guildId, distube) {
    try {
        const queue = distube.getQueue(guildId);
        if (!queue) {
            return { success: false, error: 'لا توجد أغنية قيد التشغيل' };
        }

        if (queue.songs.length <= 1) {
            return { success: false, error: 'لا توجد أغاني أخرى في القائمة' };
        }

        await queue.skip();
        return { success: true };

    } catch (error) {
        logger.error('خطأ في تخطي الأغنية:', error);
        return { success: false, error: error.message };
    }
}

/**
 * إيقاف التشغيل تماماً
 * @param {string} guildId
 * @param {Object} distube
 * @returns {Promise<Object>}
 */
async function stop(guildId, distube) {
    try {
        const queue = distube.getQueue(guildId);
        if (!queue) {
            return { success: false, error: 'لا توجد أغنية قيد التشغيل' };
        }

        await queue.stop();
        return { success: true };

    } catch (error) {
        logger.error('خطأ في إيقاف التشغيل:', error);
        return { success: false, error: error.message };
    }
}

/**
 * خلط قائمة التشغيل
 * @param {string} guildId
 * @param {Object} distube
 * @returns {Promise<Object>}
 */
async function shuffle(guildId, distube) {
    try {
        const queue = distube.getQueue(guildId);
        if (!queue) {
            return { success: false, error: 'لا توجد أغنية قيد التشغيل' };
        }

        queue.shuffle();
        return { success: true };

    } catch (error) {
        logger.error('خطأ في خلط القائمة:', error);
        return { success: false, error: error.message };
    }
}

/**
 * تكرار الأغنية/القائمة
 * @param {string} guildId
 * @param {Object} distube
 * @param {string} mode - 'song' أو 'queue' أو 'off'
 * @returns {Promise<Object>}
 */
async function setRepeatMode(guildId, distube, mode) {
    try {
        const queue = distube.getQueue(guildId);
        if (!queue) {
            return { success: false, error: 'لا توجد أغنية قيد التشغيل' };
        }

        switch (mode) {
            case 'song':
                queue.repeat = 1;
                break;
            case 'queue':
                queue.repeat = 2;
                break;
            default:
                queue.repeat = 0;
        }

        return { success: true, mode };

    } catch (error) {
        logger.error('خطأ في وضع التكرار:', error);
        return { success: false, error: error.message };
    }
}

/**
 * التقدم في الأغنية
 * @param {string} guildId
 * @param {Object} distube
 * @param {number} seconds - عدد الثواني
 * @returns {Promise<Object>}
 */
async function seek(guildId, distube, seconds) {
    try {
        const queue = distube.getQueue(guildId);
        if (!queue) {
            return { success: false, error: 'لا توجد أغنية قيد التشغيل' };
        }

        await queue.seek(seconds);
        return { success: true };

    } catch (error) {
        logger.error('خطأ في التقدم بالأغنية:', error);
        return { success: false, error: error.message };
    }
}

/**
 * الحصول على معلومات القائمة
 * @param {string} guildId
 * @param {Object} distube
 * @returns {Promise<Object>}
 */
async function getQueueInfo(guildId, distube) {
    try {
        const queue = distube.getQueue(guildId);
        if (!queue) {
            return null;
        }

        return {
            playing: queue.songs[0],
            songs: queue.songs.slice(1),
            volume: queue.volume,
            repeatMode: queue.repeat,
            isPaused: queue.paused,
            currentTime: queue.currentTime,
            duration: queue.songs[0]?.duration
        };

    } catch (error) {
        logger.error('خطأ في الحصول على معلومات القائمة:', error);
        return null;
    }
}

/**
 * تغيير مستوى الصوت
 * @param {string} guildId
 * @param {Object} distube
 * @param {number} volume - مستوى الصوت (0-200)
 * @returns {Promise<Object>}
 */
async function setVolume(guildId, distube, volume) {
    try {
        const queue = distube.getQueue(guildId);
        if (!queue) {
            return { success: false, error: 'لا توجد أغنية قيد التشغيل' };
        }

        if (volume < 0 || volume > 200) {
            return { success: false, error: 'مستوى الصوت يجب أن يكون بين 0 و 200' };
        }

        queue.setVolume(volume);
        return { success: true, volume };

    } catch (error) {
        logger.error('خطأ في تغيير مستوى الصوت:', error);
        return { success: false, error: error.message };
    }
}

/**
 * إضافة أغنية للقائمة
 * @param {string} guildId
 * @param {string} query
 * @param {Object} distube
 * @param {string} userId
 * @returns {Promise<Object>}
 */
async function addToQueue(guildId, query, distube, userId) {
    try {
        const queue = distube.getQueue(guildId);
        
        if (!queue) {
            return { success: false, error: 'لا توجد قائمة تشغيل حالية' };
        }

        const song = await distube.search(query, {
            limit: 1,
            member: queue.voiceChannel.guild.members.resolve(userId)
        });

        if (!song || song.length === 0) {
            return { success: false, error: 'لم يتم العثور على الأغنية' };
        }

        queue.add(song[0]);
        return { success: true, song: song[0] };

    } catch (error) {
        logger.error('خطأ في إضافة أغنية للقائمة:', error);
        return { success: false, error: error.message };
    }
}

/**
 * إزالة أغنية من القائمة
 * @param {string} guildId
 * @param {Object} distube
 * @param {number} index - موقع الأغنية
 * @returns {Promise<Object>}
 */
async function removeFromQueue(guildId, distube, index) {
    try {
        const queue = distube.getQueue(guildId);
        if (!queue) {
            return { success: false, error: 'لا توجد أغنية قيد التشغيل' };
        }

        if (index < 1 || index >= queue.songs.length) {
            return { success: false, error: 'رقم الأغنية غير صحيح' };
        }

        const removed = queue.songs[index];
        queue.remove(index);
        return { success: true, removed };

    } catch (error) {
        logger.error('خطأ في إزالة الأغنية:', error);
        return { success: false, error: error.message };
    }
}

/**
 * إنشاء Embed لحالة التشغيل
 * @param {Object} queueInfo
 * @returns {EmbedBuilder}
 */
function createNowPlayingEmbed(queueInfo) {
    const song = queueInfo.playing;
    
    const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('🎵 يعزف الآن')
        .setDescription(`**[${song.name}](${song.url})**`)
        .addFields(
            { name: 'المدة', value: formatDuration(song.duration), inline: true },
            { name: 'مطلوب بواسطة', value: `<@${song.user.id}>`, inline: true },
            { name: 'مستوى الصوت', value: `${queueInfo.volume}%`, inline: true }
        )
        .setFooter({ text: `الأغاني في القائمة: ${queueInfo.songs.length + 1}` })
        .setTimestamp();

    if (song.thumbnail) {
        embed.setThumbnail(song.thumbnail);
    }

    // شريط التقدم
    const progress = queueInfo.currentTime / queueInfo.duration;
    const progressBar = createProgressBar(progress);
    embed.addFields({
        name: '\u200b',
        value: `${formatDuration(queueInfo.currentTime)} ${progressBar} ${formatDuration(queueInfo.duration)}`
    });

    return embed;
}

/**
 * إنشاء أزرار التحكم
 * @returns {ActionRowBuilder[]}
 */
function createMusicControls() {
    const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('music_previous')
            .setLabel('السابق')
            .setEmoji('⏮️')
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId('music_pause_resume')
            .setLabel('إيقاف/استئناف')
            .setEmoji('⏯️')
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId('music_stop')
            .setLabel('إيقاف')
            .setEmoji('⏹️')
            .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
            .setCustomId('music_skip')
            .setLabel('تخطي')
            .setEmoji('⏭️')
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId('music_loop')
            .setLabel('تكرار')
            .setEmoji('🔁')
            .setStyle(ButtonStyle.Secondary)
    );

    const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('music_volume_down')
            .setLabel('-10')
            .setEmoji('🔉')
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId('music_volume_up')
            .setLabel('+10')
            .setEmoji('🔊')
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId('music_shuffle')
            .setLabel('خلط')
            .setEmoji('🔀')
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId('music_queue')
            .setLabel('القائمة')
            .setEmoji('📋')
            .setStyle(ButtonStyle.Secondary)
    );

    return [row1, row2];
}

/**
 * تنسيق المدة الزمنية
 * @param {number} seconds
 * @returns {string}
 */
function formatDuration(seconds) {
    if (!seconds || typeof seconds !== 'number') return '0:00';
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * إنشاء شريط التقدم
 * @param {number} progress - نسبة التقدم (0-1)
 * @returns {string}
 */
function createProgressBar(progress) {
    const length = 15;
    const filled = Math.round(length * progress);
    const empty = length - filled;
    return `[${'▓'.repeat(filled)}${'░'.repeat(empty)}]`;
}

module.exports = {
    play,
    pause,
    resume,
    skip,
    stop,
    shuffle,
    setRepeatMode,
    seek,
    getQueueInfo,
    setVolume,
    addToQueue,
    removeFromQueue,
    createNowPlayingEmbed,
    createMusicControls,
    formatDuration,
    createProgressBar
};
