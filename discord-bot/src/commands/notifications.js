/**
 * @file commands/notifications.js
 * @description نظام إدارة الإشعارات الخارجية - يشمل: إضافة، حذف، عرض، واختبار الإشعارات
 * لمنصات: Twitch, YouTube, Twitter/X, Reddit
 *
 * @module commands/notifications
 */

const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const Notification = require('../database/schemas/notificationSchema');
const {
    createSuccessEmbed,
    createErrorEmbed,
    createInfoEmbed,
} = require('../utils/embeds');
const logger = require('../utils/logger');
const { PLATFORM_COLORS, PLATFORM_EMOJIS, PLATFORM_NAMES } = require('../utils/notificationChecker');

// ─── ثوantu ──────────────────────────────────────────────────────────────────

/** رموز حالات التفعيل */
const STATUS_EMOJI = {
    true:  '✅',
    false: '❌',
};

/** أسماء أنواع المنشورات بالعربية */
const POST_TYPE_NAMES = {
    hot: 'رائج',
    new: 'جديد',
    top: 'الأفضل',
};

// ─── بناء الأمر ─────────────────────────────────────────────────────────────

/**
 * @type {SlashCommandBuilder}
 */
const data = new SlashCommandBuilder()
    .setName('اشعارات')
    .setDescription('نظام إدارة الإشعارات الخارجية')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)

    // ─── إضافة إشعار ───
    .addSubcommand(sub =>
        sub
            .setName('اضافة')
            .setDescription('إضافة إشعار جديد لمنصة خارجية')
            .addStringOption(opt =>
                opt
                    .setName('platform')
                    .setDescription('المنصة المطلوبة')
                    .setRequired(true)
                    .addChoices(
                        { name: '🟣 Twitch (تويتش)', value: 'twitch' },
                        { name: '🔴 YouTube (يوتيوب)', value: 'youtube' },
                        { name: '🐦 Twitter/X (تويتر)', value: 'twitter' },
                        { name: '🟠 Reddit (ريديت)', value: 'reddit' },
                    )
            )
            .addStringOption(opt =>
                opt
                    .setName('username')
                    .setDescription('اسم المستخدم أو معرف الحساب')
                    .setRequired(true)
            )
            .addChannelOption(opt =>
                opt
                    .setName('channel')
                    .setDescription('قناة الإشعارات')
                    .setRequired(true)
                    .addChannelTypes(ChannelType.GuildText)
            )
            .addRoleOption(opt =>
                opt
                    .setName('mention_role')
                    .setDescription('دور الإشعار (اختياري)')
                    .setRequired(false)
            )
    )

    // ─── حذف إشعار ───
    .addSubcommand(sub =>
        sub
            .setName('حذف')
            .setDescription('حذف إشعار موجود')
            .addStringOption(opt =>
                opt
                    .setName('id')
                    .setDescription('معرف الإشعار (من قائمة الإشعارات)')
                    .setRequired(true)
            )
    )

    // ─── قائمة الإشعارات ───
    .addSubcommand(sub =>
        sub
            .setName('قائمة')
            .setDescription('عرض جميع الإشعارات في السيرفر')
    )

    // ─── اختبار إشعار ───
    .addSubcommand(sub =>
        sub
            .setName('اختبار')
            .setDescription('إرسال إشعار تجريبي')
            .addStringOption(opt =>
                opt
                    .setName('id')
                    .setDescription('معرف الإشعار (من قائمة الإشعارات)')
                    .setRequired(true)
            )
    );

// ─── التنفيذ ────────────────────────────────────────────────────────────────

/**
 * تنفيذ أمر الإشعارات
 * @async
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @returns {Promise<void>}
 */
async function execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    try {
        switch (subcommand) {
            case 'اضافة':
                await handleAdd(interaction);
                break;
            case 'حذف':
                await handleRemove(interaction);
                break;
            case 'قائمة':
                await handleList(interaction);
                break;
            case 'اختبار':
                await handleTest(interaction);
                break;
        }
    } catch (error) {
        logger.error(`❌ خطأ في أمر الإشعارات (${subcommand}):`, error);

        const errorMsg = error.message || 'حدث خطأ غير متوقع';
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
                embeds: [createErrorEmbed('❌ خطأ', errorMsg)],
                ephemeral: true,
            }).catch(() => {});
        } else {
            await interaction.editReply({
                embeds: [createErrorEmbed('❌ خطأ', errorMsg)],
            }).catch(() => {});
        }
    }
}

// ─── معالجات الأوامر الفرعية ───────────────────────────────────────────────

/**
 * إضافة إشعار جديد
 * @async
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 */
async function handleAdd(interaction) {
    const platform = interaction.options.getString('platform');
    const username = interaction.options.getString('username');
    const channel = interaction.options.getChannel('channel');
    const mentionRole = interaction.options.getRole('mention_role');

    // التحقق من حد الإشعارات (50 إشعار كحد أقصى لكل سيرفر)
    const existingCount = await Notification.countDocuments({ guildId: interaction.guildId });
    if (existingCount >= 50) {
        return interaction.reply({
            embeds: [createErrorEmbed(
                '❌ الحد الأقصى',
                'وصلت إلى الحد الأقصى للإشعارات (50). احذف بعض الإشعارات أولاً.'
            )],
            ephemeral: true,
        });
    }

    // التحقق من عدم وجود إشعار مكرر
    const duplicate = await Notification.findOne({
        guildId: interaction.guildId,
        platform,
        username,
        channelId: channel.id,
    });

    if (duplicate) {
        return interaction.reply({
            embeds: [createErrorEmbed(
                '❌ إشعار موجود',
                `يوجد إشعار مكرر لنفس الحساب في نفس القناة (المعرف: \`${duplicate._id}\`)`
            )],
            ephemeral: true,
        });
    }

    // بناء وثيقة الإشعار
    const notificationData = {
        guildId: interaction.guildId,
        platform,
        username,
        channelId: channel.id,
        mentionRoleId: mentionRole ? mentionRole.id : null,
        enabled: true,
        checkInterval: platform === 'twitch' ? 60 : 120,
    };

    // إعدادات خاصة بكل منصة
    if (platform === 'youtube') {
        // إذا كان المُدخل يبدأ بـ UC → معرف قناة، وإلا اسم مستخدم
        if (/^UC[\w-]{22}$/.test(username)) {
            notificationData.extra = { ...notificationData.extra, ytChannelId: username };
        }
    }

    if (platform === 'reddit') {
        notificationData.extra = {
            ...notificationData.extra,
            subreddit: username,
            postType: 'hot',
            minUpvotes: 0,
        };
    }

    // إنشاء الإشعار
    const notification = await Notification.create(notificationData);

    logger.command(interaction.user.id, interaction.guildId, `اشعارات اضافة (${platform})`);

    const embed = createSuccessEmbed(
        '✅ تم إضافة الإشعار!',
        null,
        {
            fields: [
                { name: '📰 المنصة', value: `${PLATFORM_EMOJIS[platform]} ${PLATFORM_NAMES[platform]}`, inline: true },
                { name: '👤 الحساب', value: username, inline: true },
                { name: '📢 القناة', value: `<#${channel.id}>`, inline: true },
                { name: '🔔 الإشارة', value: mentionRole ? `<@&${mentionRole.id}>` : 'بدون', inline: true },
                { name: '⏱️ فترة الفحص', value: `${notificationData.checkInterval} ثانية`, inline: true },
                { name: '🆔 المعرف', value: `\`${notification._id}\``, inline: false },
            ],
            footer: { text: 'استخدم /اشعارات اختبار لإرسال إشعار تجريبي' },
        }
    );

    return interaction.reply({ embeds: [embed], ephemeral: true });
}

/**
 * حذف إشعار
 * @async
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 */
async function handleRemove(interaction) {
    const id = interaction.options.getString('id');

    const notification = await Notification.findById(id);

    if (!notification) {
        return interaction.reply({
            embeds: [createErrorEmbed(
                '❌ غير موجود',
                'لم يتم العثور على إشعار بهذا المعرف. تأكد من استخدام المعرف الصحيح من قائمة الإشعارات.'
            )],
            ephemeral: true,
        });
    }

    // التحقق من أن الإشعار يخص هذا السيرفر
    if (notification.guildId !== interaction.guildId) {
        return interaction.reply({
            embeds: [createErrorEmbed(
                '❌ صلاحية مرفوضة',
                'هذا الإشعار لا يخص هذا السيرفر.'
            )],
            ephemeral: true,
        });
    }

    await Notification.findByIdAndDelete(id);

    logger.command(interaction.user.id, interaction.guildId, `اشعارات حذف (${id})`);

    return interaction.reply({
        embeds: [createSuccessEmbed(
            '✅ تم حذف الإشعار',
            `تم حذف إشعار **${PLATFORM_NAMES[notification.platform]}** للحساب \`${notification.username}\``
        )],
        ephemeral: true,
    });
}

/**
 * عرض قائمة الإشعارات
 * @async
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 */
async function handleList(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const notifications = await Notification.getGuildNotifications(interaction.guildId);

    if (notifications.length === 0) {
        return interaction.editReply({
            embeds: [createInfoEmbed(
                '📋 لا توجد إشعارات',
                'لم يتم إضافة أي إشعار بعد. استخدم `/اشعارات اضافة` لإضافة إشعار جديد.'
            )],
        });
    }

    // تجميع الإشعارات حسب المنصة
    const grouped = { twitch: [], youtube: [], twitter: [], reddit: [] };
    for (const notif of notifications) {
        if (grouped[notif.platform]) {
            grouped[notif.platform].push(notif);
        }
    }

    // بناء التضمينات
    const embeds = [];

    // تضمين الملخص
    const summaryEmbed = createInfoEmbed(
        '📋 قائمة الإشعارات',
        `إجمالي الإشعارات: **${notifications.length}** | ` +
        `المفعّلة: **${notifications.filter(n => n.enabled).length}**`
    );

    embeds.push(summaryEmbed);

    // تضمين لكل منصة
    for (const [platform, notifs] of Object.entries(grouped)) {
        if (notifs.length === 0) continue;

        const fields = notifs.map((notif, i) => ({
            name: `${i + 1}. ${notif.username}`,
            value: [
                `🆔 \`${notif._id}\``,
                `📢 <#${notif.channelId}>`,
                `🔔 ${notif.mentionRoleId ? `<@&${notif.mentionRoleId}>` : 'بدون'}`,
                `⏱️ ${notif.checkInterval}ث`,
                `📊 ${STATUS_EMOJI[String(notif.enabled)]} ${notif.enabled ? 'مفعّل' : 'معطّل'}`,
            ].join(' | '),
            inline: false,
        }));

        const platformEmbed = new EmbedBuilder()
            .setColor(PLATFORM_COLORS[platform])
            .setTitle(`${PLATFORM_EMOJIS[platform]} ${PLATFORM_NAMES[platform]} (${notifs.length})`)
            .addFields(fields)
            .setFooter({ text: 'Family Legends Bot ✨' })
            .setTimestamp();

        embeds.push(platformEmbed);
    }

    // Discord limits embeds to 10 per message
    if (embeds.length > 10) {
        embeds.length = 10;
    }

    logger.command(interaction.user.id, interaction.guildId, 'اشعارات قائمة');

    return interaction.editReply({ embeds });
}

/**
 * إرسال إشعار تجريبي
 * @async
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 */
async function handleTest(interaction) {
    const id = interaction.options.getString('id');

    const notification = await Notification.findById(id);

    if (!notification) {
        return interaction.reply({
            embeds: [createErrorEmbed(
                '❌ غير موجود',
                'لم يتم العثور على إشعار بهذا المعرف.'
            )],
            ephemeral: true,
        });
    }

    // التحقق من أن الإشعار يخص هذا السيرفر
    if (notification.guildId !== interaction.guildId) {
        return interaction.reply({
            embeds: [createErrorEmbed(
                '❌ صلاحية مرفوضة',
                'هذا الإشعار لا يخص هذا السيرفر.'
            )],
            ephemeral: true,
        });
    }

    await interaction.deferReply({ ephemeral: true });

    // التحقق من القناة
    let channel;
    try {
        channel = await interaction.guild.channels.fetch(notification.channelId);
    } catch {
        return interaction.editReply({
            embeds: [createErrorEmbed(
                '❌ قناة غير موجودة',
                'القناة المحددة للإشعار غير موجودة أو يتعذر الوصول إليها.'
            )],
        });
    }

    if (!channel || !channel.isTextBased()) {
        return interaction.editReply({
            embeds: [createErrorEmbed(
                '❌ قناة غير صالحة',
                'القناة المحددة ليست قناة نصية.'
            )],
        });
    }

    // بناء إشعار تجريبي
    const { platform, username } = notification;
    const testEmbeds = buildTestEmbeds(platform, username);
    const testRows = buildTestRows(platform, username);

    // إرسال الإشعار التجريبي
    let content = '';
    const allowedMentions = { roles: [], everyone: false };

    if (notification.mentionRoleId) {
        content += `<@&${notification.mentionRoleId}> `;
        allowedMentions.roles.push(notification.mentionRoleId);
    }

    try {
        const payload = {
            embeds: testEmbeds,
            components: testRows,
        };
        if (content.trim()) {
            payload.content = content.trim();
            payload.allowedMentions = allowedMentions;
        }

        await channel.send(payload);

        logger.command(interaction.user.id, interaction.guildId, `اشعارات اختبار (${platform})`);

        return interaction.editReply({
            embeds: [createSuccessEmbed(
                '✅ تم إرسال الإشعار التجريبي!',
                `تم إرسال إشعار تجريبي لـ ${PLATFORM_EMOJIS[platform]} **${PLATFORM_NAMES[platform]}** إلى <#${channel.id}>`
            )],
        });
    } catch (error) {
        return interaction.editReply({
            embeds: [createErrorEmbed(
                '❌ فشل الإرسال',
                `لم يتم إرسال الإشعار: ${error.message}`
            )],
        });
    }
}

// ─── بناء إشعارات تجريبية ──────────────────────────────────────────────────

/**
 * بناء تضمينات تجريبية حسب المنصة
 * @param {string} platform
 * @param {string} username
 * @returns {EmbedBuilder[]}
 */
function buildTestEmbeds(platform, username) {
    const footer = { text: '🔔 إشعار تجريبي | Family Legends Bot ✨' };

    switch (platform) {
        case 'twitch':
            return [
                new EmbedBuilder()
                    .setColor(PLATFORM_COLORS.twitch)
                    .setTitle(`${PLATFORM_EMOJIS.twitch} بث مباشر جديد!`)
                    .setURL(`https://twitch.tv/${username}`)
                    .setDescription(`**${username}** يبث الآن!`)
                    .addFields(
                        { name: '🎮 اللعبة', value: '(تجريبي)', inline: true },
                        { name: '📺 العنوان', value: '(بث تجريبي)', inline: true },
                        { name: '👀 المشاهدين', value: '0', inline: true },
                    )
                    .setFooter(footer)
                    .setTimestamp(),
            ];

        case 'youtube':
            return [
                new EmbedBuilder()
                    .setColor(PLATFORM_COLORS.youtube)
                    .setTitle(`${PLATFORM_EMOJIS.youtube} فيديو جديد!`)
                    .setURL(`https://youtube.com/@${username}`)
                    .setDescription(`**(فيديو تجريبي)**`)
                    .addFields(
                        { name: '📺 القناة', value: username, inline: true },
                        { name: '⏱️ المدة', value: '0:00', inline: true },
                        { name: '👁️ المشاهدات', value: '0', inline: true },
                    )
                    .setFooter(footer)
                    .setTimestamp(),
            ];

        case 'twitter':
            return [
                new EmbedBuilder()
                    .setColor(PLATFORM_COLORS.twitter)
                    .setTitle(`${PLATFORM_EMOJIS.twitter} تغريدة جديدة!`)
                    .setURL(`https://twitter.com/${username}`)
                    .setDescription('(نص تغريدة تجريبية)')
                    .addFields(
                        { name: '👤 الحساب', value: `@${username}`, inline: true },
                        { name: '📅 التاريخ', value: new Date().toLocaleDateString('ar-SA'), inline: true },
                    )
                    .setFooter(footer)
                    .setTimestamp(),
            ];

        case 'reddit':
            return [
                new EmbedBuilder()
                    .setColor(PLATFORM_COLORS.reddit)
                    .setTitle(`${PLATFORM_EMOJIS.reddit} منشور جديد!`)
                    .setURL(`https://reddit.com/r/${username}`)
                    .setDescription('**(عنوان تجريبي)**')
                    .addFields(
                        { name: '📝 المؤلف', value: 'u/test', inline: true },
                        { name: '⬆️ التصويتات', value: '0', inline: true },
                        { name: '💬 التعليقات', value: '0', inline: true },
                        { name: '📰 المجتمع', value: `r/${username}`, inline: true },
                    )
                    .setFooter(footer)
                    .setTimestamp(),
            ];

        default:
            return [
                new EmbedBuilder()
                    .setColor(0x5865F2)
                    .setTitle('🔔 إشعار تجريبي')
                    .setDescription('إشعار تجريبي')
                    .setFooter(footer)
                    .setTimestamp(),
            ];
    }
}

/**
 * بناء أزرار تجريبية حسب المنصة
 * @param {string} platform
 * @param {string} username
 * @returns {ActionRowBuilder[]}
 */
function buildTestRows(platform, username) {
    const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

    let label, url;
    switch (platform) {
        case 'twitch':
            label = 'مشاهدة على تويتش';
            url = `https://twitch.tv/${username}`;
            break;
        case 'youtube':
            label = 'مشاهدة الفيديو';
            url = `https://youtube.com/@${username}`;
            break;
        case 'twitter':
            label = 'عرض التغريدة';
            url = `https://twitter.com/${username}`;
            break;
        case 'reddit':
            label = 'قراءة المنشور';
            url = `https://reddit.com/r/${username}`;
            break;
        default:
            return [];
    }

    return [
        new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel(label)
                .setURL(url)
                .setStyle(ButtonStyle.Link)
        ),
    ];
}

// ─── الصادرات ───────────────────────────────────────────────────────────────

module.exports = {
    data,
    execute,
};
