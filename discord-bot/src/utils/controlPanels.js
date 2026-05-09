/**
 * @file src/utils/controlPanels.js
 * @description نظام لوحات التحكم التفاعلية الاحترافية
 * يتضمن أزرار، قوائم، ونوافذ تفاعلية خاصة بكل مستخدم
 */

const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
    EmbedBuilder,
    ComponentType
} = require('discord.js');
const { createSuccessEmbed, createErrorEmbed, createInfoEmbed, createMusicEmbed, COLORS } = require('./embeds');
const logger = require('./logger');

// ═══════════════════════════════════════════════════════════════
// 🎨 ثوابت التصميم
// ═══════════════════════════════════════════════════════════════

const EMOJIS = {
    // تحكم الموسيقى
    PLAY: '▶️',
    PAUSE: '⏸️',
    RESUME: '▶️',
    SKIP: '⏭️',
    STOP: '⏹️',
    SHUFFLE: '🔀',
    REPEAT: '🔁',
    REPEAT_ONE: '🔂',
    VOLUME_UP: '🔊',
    VOLUME_DOWN: '🔉',
    MUTE: '🔇',
    LEAVE: '🔌',
    QUEUE: '📋',
    NOW_PLAYING: '🎵',
    FILTER: '🎛️',
    AUTOPLAY: '🔄',

    // حالات
    SUCCESS: '✅',
    ERROR: '❌',
    LOADING: '⏳',
    WARNING: '⚠️',
    INFO: 'ℹ️',

    // ألعاب
    ROCK: '🪨',
    PAPER: '📄',
    SCISSORS: '✂️',
    DICE: '🎲',
    COIN: '🪙',

    // أخرى
    SETTINGS: '⚙️',
    BACK: '⬅️',
    NEXT: '➡️',
    REFRESH: '🔄',
    DELETE: '🗑️',
    LOCK: '🔒',
};

// ═══════════════════════════════════════════════════════════════
// 🎵 لوحة تحكم الموسيقى
// ═══════════════════════════════════════════════════════════════

/**
 * إنشاء لوحة تحكم الموسيقى الرئيسية
 * @param {Object} queue - قائمة التشغيل
 * @param {Object} song - الأغنية الحالية
 * @param {string} userId - معرف المستخدم (لإظهار اللوحة له فقط)
 * @returns {Object} - اللوحة مع المكونات
 */
function createMusicControlPanel(queue, song, userId) {
    const isPaused = queue?.paused || false;
    const repeatMode = queue?.repeatMode || 0;
    const autoplay = queue?.autoplay || false;
    const volume = queue?.volume || 80;

    // إنشاء Embed احترافي
    const embed = new EmbedBuilder()
        .setColor(COLORS.MUSIC)
        .setTitle('🎵 لوحة تحكم الموسيقى')
        .setDescription(song
            ? `**يعمل الآن:**\n[${song.name.slice(0, 50)}${song.name.length > 50 ? '...' : ''}](${song.url})`
            : '**لا توجد أغنية تعمل حالياً**'
        )
        .addFields(
            { name: '🔊 الصوت', value: `${volume}%`, inline: true },
            { name: '🔁 التكرار', value: repeatMode === 0 ? 'معطل' : repeatMode === 1 ? 'أغنية' : 'قائمة', inline: true },
            { name: '🔄 تلقائي', value: autoplay ? 'مفعل' : 'معطل', inline: true },
            { name: '📋 في القائمة', value: `${queue?.songs?.length || 0} أغنية`, inline: true },
            { name: '👤 التحكم', value: `<@${userId}>`, inline: true },
        )
        .setThumbnail(song?.thumbnail || null)
        .setFooter({ text: '💡 اللوحة خاصة بك فقط - لا يراها أحد آخر' });

    // صف الأزرار الأول - التحكم الأساسي
    const row1 = new ActionRowBuilder()
        .addComponents(
            // إيقاف/استئناف
            new ButtonBuilder()
                .setCustomId(`music_${userId}_pause`)
                .setLabel(isPaused ? 'استئناف' : 'إيقاف')
                .setEmoji(isPaused ? EMOJIS.RESUME : EMOJIS.PAUSE)
                .setStyle(isPaused ? ButtonStyle.Success : ButtonStyle.Secondary),
            // تخطي
            new ButtonBuilder()
                .setCustomId(`music_${userId}_skip`)
                .setLabel('تخطي')
                .setEmoji(EMOJIS.SKIP)
                .setStyle(ButtonStyle.Primary),
            // إيقاف كامل
            new ButtonBuilder()
                .setCustomId(`music_${userId}_stop`)
                .setLabel('إنهاء')
                .setEmoji(EMOJIS.STOP)
                .setStyle(ButtonStyle.Danger),
            // خلط
            new ButtonBuilder()
                .setCustomId(`music_${userId}_shuffle`)
                .setLabel('خلط')
                .setEmoji(EMOJIS.SHUFFLE)
                .setStyle(ButtonStyle.Secondary),
        );

    // صف الأزرار الثاني - التحكم المتقدم
    const row2 = new ActionRowBuilder()
        .addComponents(
            // تكرار
            new ButtonBuilder()
                .setCustomId(`music_${userId}_repeat`)
                .setLabel('تكرار')
                .setEmoji(repeatMode === 0 ? EMOJIS.REPEAT : EMOJIS.REPEAT_ONE)
                .setStyle(repeatMode > 0 ? ButtonStyle.Success : ButtonStyle.Secondary),
            // تشغيل تلقائي
            new ButtonBuilder()
                .setCustomId(`music_${userId}_autoplay`)
                .setLabel('تلقائي')
                .setEmoji(EMOJIS.AUTOPLAY)
                .setStyle(autoplay ? ButtonStyle.Success : ButtonStyle.Secondary),
            // قائمة الانتظار
            new ButtonBuilder()
                .setCustomId(`music_${userId}_queue`)
                .setLabel('القائمة')
                .setEmoji(EMOJIS.QUEUE)
                .setStyle(ButtonStyle.Primary),
            // مغادرة
            new ButtonBuilder()
                .setCustomId(`music_${userId}_leave`)
                .setLabel('مغادرة')
                .setEmoji(EMOJIS.LEAVE)
                .setStyle(ButtonStyle.Danger),
        );

    // قائمة الصوت
    const row3 = new ActionRowBuilder()
        .addComponents(
            new StringSelectMenuBuilder()
                .setCustomId(`music_${userId}_volume`)
                .setPlaceholder('🔊 ضبط الصوت')
                .addOptions([
                    { label: 'صامت', value: '0', emoji: '🔇' },
                    { label: 'هادئ (25%)', value: '25', emoji: '🔉' },
                    { label: 'متوسط (50%)', value: '50', emoji: '🔊' },
                    { label: 'عالي (75%)', value: '75', emoji: '🔊' },
                    { label: 'كامل (100%)', value: '100', emoji: '📢' },
                    { label: 'أقصى (150%)', value: '150', emoji: '📢' },
                ])
        );

    // قائمة الفلاتر
    const row4 = new ActionRowBuilder()
        .addComponents(
            new StringSelectMenuBuilder()
                .setCustomId(`music_${userId}_filter`)
                .setPlaceholder('🎛️ اختر فلتر صوتي')
                .addOptions([
                    { label: 'بدون فلتر', value: 'off', emoji: '❌' },
                    { label: 'باس قوي', value: 'bass', emoji: '🎶' },
                    { label: 'نايتكور', value: 'nightcore', emoji: '⚡' },
                    { label: 'فابورويف', value: 'vaporwave', emoji: '🌊' },
                    { label: '3D', value: '3d', emoji: '🎧' },
                    { label: 'محاط', value: 'surround', emoji: '🔊' },
                    { label: 'عكس', value: 'reverse', emoji: '⏪' },
                    { label: 'كاريوكي', value: 'karaoke', emoji: '🎤' },
                ])
        );

    return {
        embeds: [embed],
        components: [row1, row2, row3, row4]
    };
}

/**
 * إنشاء لوحة البحث عن أغنية
 * @param {Array} results - نتائج البحث
 * @param {string} userId - معرف المستخدم
 * @returns {Object}
 */
function createSearchPanel(results, userId) {
    const embed = new EmbedBuilder()
        .setColor(COLORS.INFO)
        .setTitle('🔍 نتائج البحث')
        .setDescription('اختر الأغنية من القائمة أدناه:')
        .setFooter({ text: '💡 يمكنك الضغط على اسم الأغنية لتشغيلها' });

    const options = results.slice(0, 10).map((song, i) => ({
        label: song.title.slice(0, 100),
        description: `${song.duration} | ${song.author?.slice(0, 30) || 'غير معروف'}`,
        value: `${i}`,
        emoji: i === 0 ? '1️⃣' : i === 1 ? '2️⃣' : i === 2 ? '3️⃣' : i === 3 ? '4️⃣' : i === 4 ? '5️⃣' :
               i === 5 ? '6️⃣' : i === 6 ? '7️⃣' : i === 7 ? '8️⃣' : i === 8 ? '9️⃣' : '🔟',
    }));

    const row = new ActionRowBuilder()
        .addComponents(
            new StringSelectMenuBuilder()
                .setCustomId(`search_${userId}_select`)
                .setPlaceholder('🎵 اختر أغنية للتشغيل')
                .addOptions(options)
        );

    const cancelButton = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`search_${userId}_cancel`)
                .setLabel('إلغاء')
                .setEmoji('❌')
                .setStyle(ButtonStyle.Danger)
        );

    return {
        embeds: [embed],
        components: [row, cancelButton]
    };
}

// ═══════════════════════════════════════════════════════════════
// 🎮 لوحة تحكم الألعاب
// ═══════════════════════════════════════════════════════════════

/**
 * إنشاء لوحة لعبة حجر ورقة مقص
 * @param {string} userId - معرف المستخدم
 * @returns {Object}
 */
function createRockPaperScissorsPanel(userId) {
    const embed = new EmbedBuilder()
        .setColor(COLORS.INFO)
        .setTitle('✊✋✌️ حجر ورقة مقص')
        .setDescription(`اختر حركتك يا <@${userId}>!`)
        .addFields(
            { name: '🪨 حجر', value: 'يغلب المقص', inline: true },
            { name: '📄 ورقة', value: 'تغلب الحجر', inline: true },
            { name: '✂️ مقص', value: 'يغلب الورقة', inline: true },
        )
        .setFooter({ text: '💡 اللعبة خاصة بك فقط' });

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`game_${userId}_rock`)
                .setLabel('حجر')
                .setEmoji(EMOJIS.ROCK)
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId(`game_${userId}_paper`)
                .setLabel('ورقة')
                .setEmoji(EMOJIS.PAPER)
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId(`game_${userId}_scissors`)
                .setLabel('مقص')
                .setEmoji(EMOJIS.SCISSORS)
                .setStyle(ButtonStyle.Primary),
        );

    return {
        embeds: [embed],
        components: [row]
    };
}

/**
 * إنشاء لوحة لعبة النرد
 * @param {string} userId - معرف المستخدم
 * @returns {Object}
 */
function createDicePanel(userId) {
    const embed = new EmbedBuilder()
        .setColor(COLORS.INFO)
        .setTitle('🎲 رمي النرد')
        .setDescription(`اختر نوع النرد يا <@${userId}>!`)
        .setFooter({ text: '💡 يمكنك اختيار نوع النرد من القائمة' });

    const row = new ActionRowBuilder()
        .addComponents(
            new StringSelectMenuBuilder()
                .setCustomId(`game_${userId}_dice`)
                .setPlaceholder('🎲 اختر نوع النرد')
                .addOptions([
                    { label: 'نرد 4 وجوه (D4)', value: '4', emoji: '🎲' },
                    { label: 'نرد 6 وجوه (D6)', value: '6', emoji: '🎲' },
                    { label: 'نرد 8 وجوه (D8)', value: '8', emoji: '🎲' },
                    { label: 'نرد 10 وجوه (D10)', value: '10', emoji: '🎲' },
                    { label: 'نرد 12 وجوه (D12)', value: '12', emoji: '🎲' },
                    { label: 'نرد 20 وجوه (D20)', value: '20', emoji: '🎲' },
                    { label: 'نرد 100 وجه (D100)', value: '100', emoji: '🎲' },
                ])
        );

    return {
        embeds: [embed],
        components: [row]
    };
}

/**
 * إنشاء لوحة القائمة الرئيسية للألعاب
 * @param {string} userId - معرف المستخدم
 * @returns {Object}
 */
function createGamesMenuPanel(userId) {
    const embed = new EmbedBuilder()
        .setColor(COLORS.INFO)
        .setTitle('🎮 قائمة الألعاب')
        .setDescription(`اختر لعبة للعب يا <@${userId}>!`)
        .addFields(
            { name: '✊✋✌️ حجر ورقة مقص', value: 'العب ضد البوت', inline: true },
            { name: '🎲 نرد', value: 'ارمي النرد', inline: true },
            { name: '🪙 عملة', value: 'ارمي العملة', inline: true },
        )
        .setFooter({ text: '💡 اللوحة خاصة بك فقط' });

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`game_${userId}_rps`)
                .setLabel('حجر ورقة مقص')
                .setEmoji('✊')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId(`game_${userId}_dice_menu`)
                .setLabel('نرد')
                .setEmoji('🎲')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId(`game_${userId}_coin`)
                .setLabel('عملة')
                .setEmoji('🪙')
                .setStyle(ButtonStyle.Primary),
        );

    return {
        embeds: [embed],
        components: [row]
    };
}

// ═══════════════════════════════════════════════════════════════
// 📋 لوحة القائمة الرئيسية
// ═══════════════════════════════════════════════════════════════

/**
 * إنشاء القائمة الرئيسية للبوت
 * @param {string} userId - معرف المستخدم
 * @param {Object} client - عميل البوت
 * @returns {Object}
 */
function createMainMenuPanel(userId, client) {
    const embed = new EmbedBuilder()
        .setColor(COLORS.INFO)
        .setTitle('🤖 القائمة الرئيسية')
        .setDescription(`أهلاً بك <@${userId}>!\nاختر ما تريد من القائمة أدناه`)
        .addFields(
            { name: '🎵 الموسيقى', value: 'تحكم كامل بالموسيقى', inline: true },
            { name: '🎮 الألعاب', value: 'ألعاب مسلية', inline: true },
            { name: '⚙️ الإعدادات', value: 'إعدادات البوت', inline: true },
        )
        .setFooter({ text: `💡 البوت يخدم ${client.guilds.cache.size} سيرفر` })
        .setThumbnail(client.user.displayAvatarURL());

    const row1 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`menu_${userId}_music`)
                .setLabel('الموسيقى')
                .setEmoji('🎵')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId(`menu_${userId}_games`)
                .setLabel('الألعاب')
                .setEmoji('🎮')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId(`menu_${userId}_settings`)
                .setLabel('الإعدادات')
                .setEmoji('⚙️')
                .setStyle(ButtonStyle.Secondary),
        );

    return {
        embeds: [embed],
        components: [row1]
    };
}

// ═══════════════════════════════════════════════════════════════
// 🔧 معالجة التفاعلات
// ═══════════════════════════════════════════════════════════════

/**
 * معالج تفاعلات الموسيقى
 * @param {Object} interaction - التفاعل
 * @param {Object} client - عميل البوت
 */
async function handleMusicInteraction(interaction, client) {
    const customId = interaction.customId;
    const parts = customId.split('_');
    const actionUserId = parts[1];
    const action = parts[2];

    // التحقق من صاحب اللوحة
    if (interaction.user.id !== actionUserId) {
        return interaction.reply({
            content: '⚠️ هذه اللوحة خاصة بشخص آخر!',
            ephemeral: true
        });
    }

    const queue = client.distube.getQueue(interaction.guild);

    try {
        switch (action) {
            case 'pause': {
                if (!queue) return interaction.reply({ content: '❌ لا توجد موسيقى!', ephemeral: true });
                if (queue.paused) {
                    queue.resume();
                    await interaction.reply({ content: '▶️ تم استئناف الأغنية!', ephemeral: true });
                } else {
                    queue.pause();
                    await interaction.reply({ content: '⏸️ تم إيقاف الأغنية مؤقتاً!', ephemeral: true });
                }
                break;
            }
            case 'skip': {
                if (!queue) return interaction.reply({ content: '❌ لا توجد موسيقى!', ephemeral: true });
                await queue.skip();
                await interaction.reply({ content: '⏭️ تم التخطي!', ephemeral: true });
                break;
            }
            case 'stop': {
                if (!queue) return interaction.reply({ content: '❌ لا توجد موسيقى!', ephemeral: true });
                queue.stop();
                await interaction.reply({ content: '⏹️ تم إيقاف كل شيء!', ephemeral: true });
                break;
            }
            case 'shuffle': {
                if (!queue || queue.songs.length < 3) {
                    return interaction.reply({ content: '❌ تحتاج 3 أغاني على الأقل!', ephemeral: true });
                }
                const current = queue.songs.shift();
                for (let i = queue.songs.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [queue.songs[i], queue.songs[j]] = [queue.songs[j], queue.songs[i]];
                }
                queue.songs.unshift(current);
                await interaction.reply({ content: '🔀 تم خلط القائمة!', ephemeral: true });
                break;
            }
            case 'repeat': {
                if (!queue) return interaction.reply({ content: '❌ لا توجد موسيقى!', ephemeral: true });
                const mode = (queue.repeatMode + 1) % 3;
                queue.setRepeatMode(mode);
                const modes = ['⏹️ إيقاف التكرار', '🔁 تكرار الأغنية', '🔂 تكرار القائمة'];
                await interaction.reply({ content: modes[mode], ephemeral: true });
                break;
            }
            case 'autoplay': {
                if (!queue) return interaction.reply({ content: '❌ لا توجد قائمة!', ephemeral: true });
                const autoplay = queue.toggleAutoplay();
                await interaction.reply({
                    content: autoplay ? '🔄 تم تفعيل التشغيل التلقائي!' : '⏹️ تم إيقاف التشغيل التلقائي!',
                    ephemeral: true
                });
                break;
            }
            case 'queue': {
                if (!queue || !queue.songs.length) {
                    return interaction.reply({ content: '❌ القائمة فارغة!', ephemeral: true });
                }
                const songs = queue.songs.slice(0, 10);
                const desc = songs.map((s, i) => {
                    const prefix = i === 0 ? '▶️' : '`' + i + '.`';
                    return `${prefix} ${s.name.slice(0, 40)} [\`${s.formattedDuration}\`]`;
                }).join('\n');
                await interaction.reply({
                    embeds: [new EmbedBuilder()
                        .setColor(COLORS.MUSIC)
                        .setTitle('📋 قائمة الانتظار')
                        .setDescription(desc)
                        .addFields(
                            { name: '📊 الإجمالي', value: `${queue.songs.length} أغنية`, inline: true },
                            { name: '⏱️ المدة', value: queue.formattedDuration, inline: true }
                        )
                    ],
                    ephemeral: true
                });
                break;
            }
            case 'leave': {
                if (queue) queue.stop();
                client.distube.voices.leave(interaction.guild);
                await interaction.reply({ content: '🔌 تم مغادرة القناة!', ephemeral: true });
                break;
            }
            default:
                await interaction.reply({ content: '❌ إجراء غير معروف!', ephemeral: true });
        }

        // تحديث اللوحة
        if (queue && ['pause', 'skip', 'shuffle', 'repeat', 'autoplay'].includes(action)) {
            const newPanel = createMusicControlPanel(queue, queue.songs[0], actionUserId);
            await interaction.message.edit(newPanel);
        }
    } catch (error) {
        logger.error('خطأ في معالجة تفاعل الموسيقى:', error);
        await interaction.reply({ content: '❌ حدث خطأ!', ephemeral: true });
    }
}

/**
 * معالج قائمة الصوت
 */
async function handleVolumeSelect(interaction, client) {
    const customId = interaction.customId;
    const parts = customId.split('_');
    const actionUserId = parts[1];

    if (interaction.user.id !== actionUserId) {
        return interaction.reply({ content: '⚠️ هذه اللوحة خاصة بشخص آخر!', ephemeral: true });
    }

    const volume = parseInt(interaction.values[0]);
    const queue = client.distube.getQueue(interaction.guild);

    if (!queue) {
        return interaction.reply({ content: '❌ لا توجد موسيقى!', ephemeral: true });
    }

    queue.setVolume(volume);
    await interaction.reply({ content: `🔊 تم ضبط الصوت إلى **${volume}%**`, ephemeral: true });

    // تحديث اللوحة
    const newPanel = createMusicControlPanel(queue, queue.songs[0], actionUserId);
    await interaction.message.edit(newPanel);
}

/**
 * معالج قائمة الفلاتر
 */
async function handleFilterSelect(interaction, client) {
    const customId = interaction.customId;
    const parts = customId.split('_');
    const actionUserId = parts[1];

    if (interaction.user.id !== actionUserId) {
        return interaction.reply({ content: '⚠️ هذه اللوحة خاصة بشخص آخر!', ephemeral: true });
    }

    const filter = interaction.values[0];
    const queue = client.distube.getQueue(interaction.guild);

    if (!queue) {
        return interaction.reply({ content: '❌ لا توجد موسيقى!', ephemeral: true });
    }

    if (filter === 'off') {
        queue.filters.clear();
        await interaction.reply({ content: '❌ تم إيقاف الفلاتر!', ephemeral: true });
    } else {
        queue.filters.add(filter);
        await interaction.reply({ content: `🎛️ تم تفعيل فلتر **${filter}**!`, ephemeral: true });
    }
}

/**
 * معالج تفاعلات الألعاب
 */
async function handleGameInteraction(interaction, client) {
    const customId = interaction.customId;
    const parts = customId.split('_');
    const actionUserId = parts[1];
    const action = parts[2];

    if (interaction.user.id !== actionUserId) {
        return interaction.reply({ content: '⚠️ هذه اللوحة خاصة بشخص آخر!', ephemeral: true });
    }

    const choices = ['rock', 'paper', 'scissors'];
    const emojis = { rock: '🪨', paper: '📄', scissors: '✂️' };
    const names = { rock: 'حجر', paper: 'ورقة', scissors: 'مقص' };

    if (['rock', 'paper', 'scissors'].includes(action)) {
        const botChoice = choices[Math.floor(Math.random() * 3)];
        let result;

        if (action === botChoice) {
            result = '🤝 تعادل!';
        } else if (
            (action === 'rock' && botChoice === 'scissors') ||
            (action === 'paper' && botChoice === 'rock') ||
            (action === 'scissors' && botChoice === 'paper')
        ) {
            result = '🎉 فزت!';
        } else {
            result = '🤖 فزت أنا!';
        }

        const embed = new EmbedBuilder()
            .setColor(result.includes('فزت!') ? COLORS.SUCCESS : result.includes('تعادل') ? COLORS.WARN : COLORS.ERROR)
            .setTitle('✊✋✌️ حجر ورقة مقص')
            .addFields(
                { name: 'اختيارك', value: `${emojis[action]} ${names[action]}`, inline: true },
                { name: 'اختياري', value: `${emojis[botChoice]} ${names[botChoice]}`, inline: true },
                { name: 'النتيجة', value: result, inline: false }
            );

        await interaction.update({ embeds: [embed], components: [] });
    } else if (action === 'coin') {
        const result = Math.random() < 0.5 ? 'رأس' : 'كتابة';
        const embed = new EmbedBuilder()
            .setColor(COLORS.SUCCESS)
            .setTitle('🪙 رمي العملة')
            .setDescription(`سقطت العملة على **${result}**!`);

        await interaction.reply({ embeds: [embed], ephemeral: true });
    } else if (action === 'dice' || action === 'dice_menu') {
        if (action === 'dice_menu') {
            const panel = createDicePanel(actionUserId);
            await interaction.update(panel);
        }
    } else if (action === 'rps') {
        const panel = createRockPaperScissorsPanel(actionUserId);
        await interaction.update(panel);
    }
}

/**
 * معالج قائمة النرد
 */
async function handleDiceSelect(interaction, client) {
    const customId = interaction.customId;
    const parts = customId.split('_');
    const actionUserId = parts[1];

    if (interaction.user.id !== actionUserId) {
        return interaction.reply({ content: '⚠️ هذه اللوحة خاصة بشخص آخر!', ephemeral: true });
    }

    const sides = parseInt(interaction.values[0]);
    const result = Math.floor(Math.random() * sides) + 1;

    const embed = new EmbedBuilder()
        .setColor(COLORS.SUCCESS)
        .setTitle('🎲 رمي النرد')
        .setDescription(`رميت نرد **D${sides}**\nالنتيجة: **${result}**`)
        .setFooter({ text: result === sides ? '🎉 الحظ الأقصى!' : result === 1 ? '💀 الحظ السيء!' : '' });

    await interaction.update({ embeds: [embed], components: [] });
}

/**
 * معالج القائمة الرئيسية
 */
async function handleMenuInteraction(interaction, client) {
    const customId = interaction.customId;
    const parts = customId.split('_');
    const actionUserId = parts[1];
    const action = parts[2];

    if (interaction.user.id !== actionUserId) {
        return interaction.reply({ content: '⚠️ هذه اللوحة خاصة بشخص آخر!', ephemeral: true });
    }

    switch (action) {
        case 'music': {
            const queue = client.distube.getQueue(interaction.guild);
            if (!queue) {
                return interaction.reply({ content: '❌ لا توجد موسيقى تعمل! استخدم `/موسيقى شغل` أولاً', ephemeral: true });
            }
            const panel = createMusicControlPanel(queue, queue.songs[0], actionUserId);
            await interaction.update(panel);
            break;
        }
        case 'games': {
            const panel = createGamesMenuPanel(actionUserId);
            await interaction.update(panel);
            break;
        }
        case 'settings': {
            await interaction.reply({ content: '⚙️ قريباً...', ephemeral: true });
            break;
        }
    }
}

// ═══════════════════════════════════════════════════════════════
// 📤 التصدير
// ═══════════════════════════════════════════════════════════════

module.exports = {
    EMOJIS,
    // لوحات الموسيقى
    createMusicControlPanel,
    createSearchPanel,
    // لوحات الألعاب
    createRockPaperScissorsPanel,
    createDicePanel,
    createGamesMenuPanel,
    // القائمة الرئيسية
    createMainMenuPanel,
    // معالجات التفاعل
    handleMusicInteraction,
    handleVolumeSelect,
    handleFilterSelect,
    handleGameInteraction,
    handleDiceSelect,
    handleMenuInteraction,
};
