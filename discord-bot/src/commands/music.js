/**
 * @file commands/music.js
 * @description نظام الموسيقى الاحترافي - أوامر Slash كاملة مع 16 subcommand.
 * اسم الأمر: /موسيقى
 */

const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const { createErrorEmbed, createSuccessEmbed, createInfoEmbed, createMusicEmbed } = require('../utils/embeds');
const { FILTERS_MAP, quickYouTubeSearch, smartPlay } = require('../utils/music');
const { createMusicControlPanel } = require('../utils/controlPanels');
const logger = require('../utils/logger');

// ═══════════════════════════════════════════════════════════════
//  Slash Command Builder
// ═══════════════════════════════════════════════════════════════

const data = new SlashCommandBuilder()
    .setName('موسيقى')
    .setDescription('🎵 نظام الموسيقى الاحترافي')

    // ─── 1. شغل ───
    .addSubcommand(sub =>
        sub.setName('شغل')
            .setDescription('🎵 تشغيل أغنية بالاسم أو الرابط')
            .addStringOption(opt =>
                opt.setName('الاسم')
                    .setDescription('اسم الأغنية أو رابط YouTube / Spotify / SoundCloud')
                    .setRequired(true)
            )
    )

    // ─── 2. وقف ───
    .addSubcommand(sub =>
        sub.setName('وقف')
            .setDescription('⏸️ إيقاف مؤقت للموسيقى')
    )

    // ─── 3. كمل ───
    .addSubcommand(sub =>
        sub.setName('كمل')
            .setDescription('▶️ استئناف الموسيقى')
    )

    // ─── 4. تخطي ───
    .addSubcommand(sub =>
        sub.setName('تخطي')
            .setDescription('⏭️ تخطي الأغنية الحالية')
    )

    // ─── 5. انهاء ───
    .addSubcommand(sub =>
        sub.setName('انهاء')
            .setDescription('⏹️ إيقاف الموسيقى ومسح القائمة')
    )

    // ─── 6. قائمة ───
    .addSubcommand(sub =>
        sub.setName('قائمة')
            .setDescription('📋 عرض قائمة الانتظار')
    )

    // ─── 7. صوت ───
    .addSubcommand(sub =>
        sub.setName('صوت')
            .setDescription('🔊 ضبط مستوى الصوت')
            .addIntegerOption(opt =>
                opt.setName('المستوى')
                    .setDescription('مستوى الصوت (1 - 150)')
                    .setMinValue(1)
                    .setMaxValue(150)
                    .setRequired(true)
            )
    )

    // ─── 8. كرر ───
    .addSubcommand(sub =>
        sub.setName('كرر')
            .setDescription('🔁 وضع التكرار')
            .addStringOption(opt =>
                opt.setName('الوضع')
                    .setDescription('نوع التكرار')
                    .setRequired(true)
                    .addChoices(
                        { name: 'إيقاف', value: '0' },
                        { name: 'أغنية', value: '1' },
                        { name: 'قائمة', value: '2' }
                    )
            )
    )

    // ─── 9. حالي ───
    .addSubcommand(sub =>
        sub.setName('حالي')
            .setDescription('🎵 الأغنية الحالية + لوحة التحكم')
    )

    // ─── 10. طلع ───
    .addSubcommand(sub =>
        sub.setName('طلع')
            .setDescription('🔌 مغادرة القناة الصوتية')
    )

    // ─── 11. وضع_المستمر ───
    .addSubcommand(sub =>
        sub.setName('وضع_المستمر')
            .setDescription('♾️ تفعيل/تعطيل وضع 24/7')
    )

    // ─── 12. خلط ───
    .addSubcommand(sub =>
        sub.setName('خلط')
            .setDescription('🔀 خلط قائمة الانتظار')
    )

    // ─── 13. تلقائي ───
    .addSubcommand(sub =>
        sub.setName('تلقائي')
            .setDescription('🔄 تشغيل / إيقاف التشغيل التلقائي')
    )

    // ─── 14. فلتر ───
    .addSubcommand(sub =>
        sub.setName('فلتر')
            .setDescription('🎛️ تطبيق فلتر صوتي')
            .addStringOption(opt =>
                opt.setName('النوع')
                    .setDescription('نوع الفلتر')
                    .setRequired(true)
                    .addChoices(
                        { name: 'إيقاف', value: 'off' },
                        { name: 'باس', value: 'bass' },
                        { name: 'نايتكور', value: 'nightcore' },
                        { name: 'فابورويف', value: 'vaporwave' },
                        { name: '3D', value: '3d' },
                        { name: 'محاط', value: 'surround' },
                        { name: 'عكس', value: 'reverse' },
                        { name: 'كاريوكي', value: 'karaoke' },
                        { name: 'تريمولو', value: 'tremolo' },
                        { name: 'فيبراتو', value: 'vibrato' },
                        { name: '8D', value: '8d' }
                    )
            )
    )

    // ─── 15. بحث ───
    .addSubcommand(sub =>
        sub.setName('بحث')
            .setDescription('🔍 البحث في يوتيوب')
            .addStringOption(opt =>
                opt.setName('الاستعلام')
                    .setDescription('اسم الأغنية أو كلمة البحث')
                    .setRequired(true)
            )
    )

    // ─── 16. ازالة ───
    .addSubcommand(sub =>
        sub.setName('ازالة')
            .setDescription('🗑️ إزالة أغنية من القائمة')
            .addIntegerOption(opt =>
                opt.setName('الرقم')
                    .setDescription('رقم الأغنية في القائمة')
                    .setRequired(true)
            )
    )

    // ─── 17. لوحة ───
    .addSubcommand(sub =>
        sub.setName('لوحة')
            .setDescription('🎮 فتح لوحة التحكم التفاعلية')
    )

    // ─── 18. كلمات ───
    .addSubcommand(sub =>
        sub.setName('كلمات')
            .setDescription('📜 عرض كلمات الأغنية الحالية')
            .addStringOption(opt =>
                opt.setName('الاغنية')
                    .setDescription('اسم الأغنية (اتركه فارغاً للأغنية الحالية)')
                    .setRequired(false)
            )
    )

    // ─── 19. قفز ───
    .addSubcommand(sub =>
        sub.setName('قفز')
            .setDescription('⏩ القفز إلى أغنية معينة في القائمة')
            .addIntegerOption(opt =>
                opt.setName('الرقم')
                    .setDescription('رقم الأغنية في القائمة')
                    .setRequired(true)
            )
    )

    // ─── 20. تقديم ───
    .addSubcommand(sub =>
        sub.setName('تقديم')
            .setDescription('⏩ التقديم إلى وقت معين في الأغنية')
            .addStringOption(opt =>
                opt.setName('الوقت')
                    .setDescription('الوقت بالثواني أو بتنسيق (mm:ss)')
                    .setRequired(true)
            )
    );

// ═══════════════════════════════════════════════════════════════
//  Execute
// ═══════════════════════════════════════════════════════════════

async function execute(interaction, client) {
    const subcommand = interaction.options.getSubcommand();
    const { guild, member } = interaction;

    // Check for DJ role if configured
    try {
        const ServerConfig = require('../database/schemas/serverConfigSchema');
        const guildConfig = await ServerConfig.get();
        const djRoleId = guildConfig?.music?.djRoleId;

        const managementCommands = ['وقف', 'كمل', 'تخطي', 'انهاء', 'صوت', 'كرر', 'طلع', 'وضع_المستمر', 'خلط', 'تلقائي', 'فلتر', 'ازالة', 'قفز', 'تقديم'];
        
        if (djRoleId && managementCommands.includes(subcommand)) {
            const hasDjRole = member.roles.cache.has(djRoleId);
            const isAdmin = member.permissions.has(PermissionFlagsBits.Administrator) || member.permissions.has(PermissionFlagsBits.ManageGuild);
            
            if (!hasDjRole && !isAdmin) {
                return interaction.reply({
                    embeds: [createErrorEmbed('❌ صلاحية مرفوضة', 'هذا الأمر متاح فقط لأصحاب رتبة الـ DJ أو الإدارة.')],
                    ephemeral: true
                });
            }
        }
    } catch (err) {
        logger.error('Error checking DJ role:', err);
    }

    try {
        switch (subcommand) {

            // ─── شغل ───
            case 'شغل': {
                const voiceChannel = member.voice.channel;
                if (!voiceChannel) {
                    return interaction.reply({
                        embeds: [createErrorEmbed('🎤 خطأ', 'يجب أن تكون في قناة صوتية!')],
                        ephemeral: true
                    });
                }

                if (!voiceChannel.permissionsFor(client.user).has(['Connect', 'Speak'])) {
                    return interaction.reply({
                        embeds: [createErrorEmbed('❌ خطأ', 'ليس لدي صلاحية الاتصال أو التحدث في هذه القناة.')],
                        ephemeral: true
                    });
                }

                const query = interaction.options.getString('الاسم');

                await interaction.deferReply();

                const result = await smartPlay(client, voiceChannel, interaction.channel, member, query);

                if (result.success) {
                    const row = new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId(`quickpanel_${interaction.user.id}`)
                            .setLabel('🎮 لوحة التحكم')
                            .setStyle(ButtonStyle.Primary)
                    );

                    await interaction.editReply({
                        embeds: [createSuccessEmbed('✅ تم التشغيل', `${result.message}\n\n💡 اضغط على الزر لفتح لوحة التحكم!`)],
                        components: [row]
                    });
                } else {
                    await interaction.editReply({
                        embeds: [createErrorEmbed('❌ خطأ', result.message)]
                    });
                }
                break;
            }

            // ─── وقف ───
            case 'وقف': {
                const queue = client.distube.getQueue(guild);
                if (!queue) {
                    return interaction.reply({
                        embeds: [createErrorEmbed('❌ خطأ', 'لا توجد موسيقى قيد التشغيل.')],
                        ephemeral: true
                    });
                }
                if (queue.paused) {
                    return interaction.reply({
                        embeds: [createInfoEmbed('ℹ️ معلومة', 'الموسيقى موقوفة بالفعل.')],
                        ephemeral: true
                    });
                }

                queue.pause();
                await interaction.reply({
                    embeds: [createSuccessEmbed('⏸️ إيقاف مؤقت', 'تم إيقاف الأغنية. استخدم `/موسيقى كمل` للاستئناف.')]
                });
                break;
            }

            // ─── كمل ───
            case 'كمل': {
                const queue = client.distube.getQueue(guild);
                if (!queue) {
                    return interaction.reply({
                        embeds: [createErrorEmbed('❌ خطأ', 'لا توجد موسيقى.')],
                        ephemeral: true
                    });
                }
                if (!queue.paused) {
                    return interaction.reply({
                        embeds: [createInfoEmbed('ℹ️ معلومة', 'الموسيقى تعمل بالفعل.')],
                        ephemeral: true
                    });
                }

                queue.resume();
                await interaction.reply({
                    embeds: [createSuccessEmbed('▶️ استئناف', 'تم استئناف الأغنية.')]
                });
                break;
            }

            // ─── تخطي ───
            case 'تخطي': {
                const queue = client.distube.getQueue(guild);
                if (!queue) {
                    return interaction.reply({
                        embeds: [createErrorEmbed('❌ خطأ', 'لا توجد موسيقى.')],
                        ephemeral: true
                    });
                }
                if (queue.songs.length <= 1 && !queue.autoplay) {
                    return interaction.reply({
                        embeds: [createErrorEmbed('❌ خطأ', 'لا توجد أغاني أخرى في القائمة.')],
                        ephemeral: true
                    });
                }

                try {
                    await queue.skip();
                    await interaction.reply({
                        embeds: [createSuccessEmbed('⏭️ تخطي', 'تم تخطي الأغنية.')]
                    });
                } catch (e) {
                    logger.error('خطأ في التخطي:', e);
                    await interaction.reply({
                        embeds: [createErrorEmbed('❌ خطأ', e.message)]
                    });
                }
                break;
            }

            // ─── انهاء ───
            case 'انهاء': {
                const queue = client.distube.getQueue(guild);
                if (!queue) {
                    return interaction.reply({
                        embeds: [createErrorEmbed('❌ خطأ', 'لا توجد موسيقى.')],
                        ephemeral: true
                    });
                }

                queue.stop();
                await interaction.reply({
                    embeds: [createSuccessEmbed('⏹️ إنهاء', 'تم إيقاف الموسيقى ومسح القائمة.')]
                });
                break;
            }

            // ─── قائمة ───
            case 'قائمة': {
                const queue = client.distube.getQueue(guild);
                if (!queue || !queue.songs.length) {
                    return interaction.reply({
                        embeds: [createErrorEmbed('❌ خطأ', 'القائمة فارغة.')],
                        ephemeral: true
                    });
                }

                const songs = queue.songs.slice(0, 10);
                const description = songs.map((song, i) => {
                    const prefix = i === 0 ? '▶️' : `\`${i}.\``;
                    return `${prefix} [${song.name.slice(0, 45)}](${song.url}) \`${song.formattedDuration}\``;
                }).join('\n');

                const embed = new EmbedBuilder()
                    .setColor('#0099ff')
                    .setTitle('📋 قائمة الانتظار')
                    .setDescription(description)
                    .addFields(
                        { name: '📊 الأغاني', value: `${queue.songs.length}`, inline: true },
                        { name: '⏱️ المدة الإجمالية', value: queue.formattedDuration, inline: true },
                        { name: '🔊 الصوت', value: `${queue.volume}%`, inline: true }
                    );

                if (queue.songs.length > 10) {
                    embed.setFooter({ text: `... و ${queue.songs.length - 10} أغنية أخرى` });
                }

                await interaction.reply({ embeds: [embed] });
                break;
            }

            // ─── صوت ───
            case 'صوت': {
                const queue = client.distube.getQueue(guild);
                if (!queue) {
                    return interaction.reply({
                        embeds: [createErrorEmbed('❌ خطأ', 'لا توجد موسيقى.')],
                        ephemeral: true
                    });
                }

                const vol = interaction.options.getInteger('المستوى');

                queue.setVolume(vol);
                await interaction.reply({
                    embeds: [createSuccessEmbed('🔊 صوت', `تم ضبط مستوى الصوت إلى **${vol}%**`)]
                });
                break;
            }

            // ─── كرر ───
            case 'كرر': {
                const queue = client.distube.getQueue(guild);
                if (!queue) {
                    return interaction.reply({
                        embeds: [createErrorEmbed('❌ خطأ', 'لا توجد موسيقى.')],
                        ephemeral: true
                    });
                }

                const mode = parseInt(interaction.options.getString('الوضع'), 10);
                const modeNames = ['⏹️ إيقاف التكرار', '🔁 تكرار الأغنية', '🔂 تكرار القائمة'];

                queue.setRepeatMode(mode);
                await interaction.reply({
                    embeds: [createSuccessEmbed('🔁 تكرار', modeNames[mode])]
                });
                break;
            }

            // ─── حالي ───
            case 'حالي': {
                const queue = client.distube.getQueue(guild);
                if (!queue || !queue.songs.length) {
                    return interaction.reply({
                        embeds: [createErrorEmbed('❌ خطأ', 'لا توجد موسيقى قيد التشغيل.')],
                        ephemeral: true
                    });
                }

                const song = queue.songs[0];
                const panel = createMusicControlPanel(queue, song, interaction.user.id);
                await interaction.reply(panel);
                break;
            }

            // ─── طلع ───
            case 'طلع': {
                if (!guild.members.me.voice.channelId) {
                    return interaction.reply({
                        embeds: [createErrorEmbed('❌ خطأ', 'لست في قناة صوتية حالياً.')],
                        ephemeral: true
                    });
                }

                const queue = client.distube.getQueue(guild);
                if (queue) queue.stop();
                client.distube.voices.leave(guild);
                await interaction.reply({
                    embeds: [createSuccessEmbed('🔌 مغادرة', 'تم مغادرة القناة الصوتية.')]
                });
                break;
            }

            // ─── وضع_المستمر ───
            case 'وضع_المستمر': {
                const ServerConfig = require('../database/schemas/serverConfigSchema');
                const guildConfig = await ServerConfig.get() ;
                
                const currentStatus = guildConfig.music?.stay247 || false;
                const newStatus = !currentStatus;

                if (!guildConfig.music) guildConfig.music = {};
                guildConfig.music.stay247 = newStatus;
                await guildConfig.save();

                const queue = client.distube.getQueue(guild);
                if (queue) {
                    queue.distube.options.leaveOnEmpty = !newStatus;
                    queue.distube.options.leaveOnStop = !newStatus;
                    queue.distube.options.leaveOnFinish = !newStatus;
                }

                await interaction.reply({
                    embeds: [createSuccessEmbed('♾️ وضع 24/7', newStatus ? 'تم تفعيل وضع 24/7 بنجاح!' : 'تم تعطيل وضع 24/7.')]
                });
                break;
            }

            // ─── خلط ───
            case 'خلط': {
                const queue = client.distube.getQueue(guild);
                if (!queue || queue.songs.length <= 2) {
                    return interaction.reply({
                        embeds: [createErrorEmbed('❌ خطأ', 'تحتاج 3 أغاني على الأقل للخلط.')],
                        ephemeral: true
                    });
                }

                // Fisher-Yates shuffle (حافظ على الأغنية الحالية)
                const current = queue.songs.shift();
                for (let i = queue.songs.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [queue.songs[i], queue.songs[j]] = [queue.songs[j], queue.songs[i]];
                }
                queue.songs.unshift(current);

                await interaction.reply({
                    embeds: [createSuccessEmbed('🔀 خلط', 'تم خلط قائمة الانتظار!')]
                });
                break;
            }

            // ─── تلقائي ───
            case 'تلقائي': {
                const queue = client.distube.getQueue(guild);
                if (!queue) {
                    return interaction.reply({
                        embeds: [createErrorEmbed('❌ خطأ', 'لا توجد قائمة تشغيل.')],
                        ephemeral: true
                    });
                }

                const autoplay = queue.toggleAutoplay();
                await interaction.reply({
                    embeds: [autoplay
                        ? createSuccessEmbed('🔄 تشغيل تلقائي', 'تم التفعيل! سيتم تشغيل أغاني مشابهة تلقائياً.')
                        : createInfoEmbed('⏹️ تشغيل تلقائي', 'تم الإيقاف.')
                    ]
                });
                break;
            }

            // ─── فلتر ───
            case 'فلتر': {
                const queue = client.distube.getQueue(guild);
                if (!queue) {
                    return interaction.reply({
                        embeds: [createErrorEmbed('❌ خطأ', 'لا توجد موسيقى.')],
                        ephemeral: true
                    });
                }

                const filterType = interaction.options.getString('النوع');

                if (filterType === 'off') {
                    queue.filters.clear();
                    await interaction.reply({
                        embeds: [createSuccessEmbed('❌ فلاتر', 'تم إيقاف جميع الفلاتر.')]
                    });
                } else {
                    const filterName = FILTERS_MAP[filterType];
                    if (!filterName) {
                        return interaction.reply({
                            embeds: [createErrorEmbed('❌ خطأ', 'فلتر غير معروف.')],
                            ephemeral: true
                        });
                    }

                    queue.filters.add(filterName);
                    await interaction.reply({
                        embeds: [createSuccessEmbed('🎛️ فلتر', `تم تفعيل فلتر **${filterName}**`)]
                    });
                }
                break;
            }

            // ─── بحث ───
            case 'بحث': {
                const query = interaction.options.getString('الاستعلام');

                await interaction.deferReply();

                try {
                    const result = await quickYouTubeSearch(query);

                    if (!result) {
                        return interaction.editReply({
                            embeds: [createErrorEmbed('❌ خطأ', `لم أجد نتائج لـ: \`${query}\``)]
                        });
                    }

                    const embed = new EmbedBuilder()
                        .setColor('#0099ff')
                        .setTitle('🔍 نتيجة البحث')
                        .setDescription(`[${result.title}](${result.url})`)
                        .addFields(
                            { name: '⏱️ المدة', value: result.duration, inline: true },
                            { name: '📋 للتشغيل', value: `اضغط على الزر بالأسفل ⬇️`, inline: false }
                        )
                        .setThumbnail(result.thumbnail)
                        .setTimestamp();

                    const row = new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setLabel('🎵 شغّل الآن')
                            .setStyle(ButtonStyle.Success)
                            .setCustomId(`play_${interaction.user.id}_${encodeURIComponent(result.url)}`)
                    );

                    await interaction.editReply({ embeds: [embed], components: [row] });
                } catch (e) {
                    logger.error('خطأ في البحث:', e);
                    await interaction.editReply({
                        embeds: [createErrorEmbed('❌ خطأ', 'حدث خطأ أثناء البحث.')]
                    });
                }
                break;
            }

            // ─── ازالة ───
            case 'ازالة': {
                const queue = client.distube.getQueue(guild);
                if (!queue || queue.songs.length <= 1) {
                    return interaction.reply({
                        embeds: [createErrorEmbed('❌ خطأ', 'لا توجد أغاني للإزالة.')],
                        ephemeral: true
                    });
                }

                const num = interaction.options.getInteger('الرقم');
                if (num < 1 || num >= queue.songs.length) {
                    return interaction.reply({
                        embeds: [createErrorEmbed('❌ خطأ', `الرقم يجب أن يكون بين 1 و ${queue.songs.length - 1}`)],
                        ephemeral: true
                    });
                }

                const removed = queue.songs.splice(num, 1)[0];
                await interaction.reply({
                    embeds: [createSuccessEmbed('🗑️ إزالة', `تمت إزالة **${removed.name.slice(0, 50)}** من القائمة.`)]
                });
                break;
            }

            // ─── لوحة ───
            case 'لوحة': {
                const queue = client.distube.getQueue(guild);
                if (!queue || !queue.songs.length) {
                    return interaction.reply({
                        embeds: [createErrorEmbed('❌ خطأ', 'لا توجد موسيقى قيد التشغيل.')],
                        ephemeral: true
                    });
                }

                const song = queue.songs[0];
                const panel = createMusicControlPanel(queue, song, interaction.user.id);
                await interaction.reply(panel);
                break;
            }

            // ─── كلمات ───
            case 'كلمات': {
                await interaction.deferReply();
                const queue = client.distube.getQueue(guild);
                let songName = interaction.options.getString('الاغنية');

                if (!songName) {
                    if (!queue || !queue.songs.length) {
                        return interaction.editReply({
                            embeds: [createErrorEmbed('❌ خطأ', 'لا توجد موسيقى قيد التشغيل حالياً. يرجى كتابة اسم الأغنية.')]
                        });
                    }
                    songName = queue.songs[0].name;
                }

                try {
                    const axios = require('axios');
                    const response = await axios.get(`https://some-random-api.com/lyrics?title=${encodeURIComponent(songName)}`);
                    const data = response.data;

                    if (!data || !data.lyrics) {
                        return interaction.editReply({
                            embeds: [createErrorEmbed('❌ لا توجد نتائج', `لم أجد كلمات لأغنية: **${songName}**`)]
                        });
                    }

                    const lyrics = data.lyrics.length > 4000 ? data.lyrics.slice(0, 4000) + '...' : data.lyrics;
                    const embed = new EmbedBuilder()
                        .setColor('#0099ff')
                        .setTitle(`📜 كلمات: ${data.title}`)
                        .setAuthor({ name: data.author })
                        .setDescription(lyrics)
                        .setThumbnail(data.thumbnail?.genius || null)
                        .setFooter({ text: 'Family Legends Bot' })
                        .setTimestamp();

                    await interaction.editReply({ embeds: [embed] });
                } catch (e) {
                    logger.error('خطأ في جلب الكلمات:', e);
                    await interaction.editReply({
                        embeds: [createErrorEmbed('❌ خطأ', 'حدث خطأ أثناء جلب الكلمات.')]
                    });
                }
                break;
            }

            // ─── قفز ───
            case 'قفز': {
                const queue = client.distube.getQueue(guild);
                if (!queue) {
                    return interaction.reply({
                        embeds: [createErrorEmbed('❌ خطأ', 'لا توجد موسيقى.')],
                        ephemeral: true
                    });
                }

                const num = interaction.options.getInteger('الرقم');
                if (num < 1 || num >= queue.songs.length) {
                    return interaction.reply({
                        embeds: [createErrorEmbed('❌ خطأ', `الرقم يجب أن يكون بين 1 و ${queue.songs.length - 1}`)],
                        ephemeral: true
                    });
                }

                try {
                    await queue.jump(num);
                    await interaction.reply({
                        embeds: [createSuccessEmbed('⏩ قفز', `تم القفز إلى الأغنية رقم **${num}**.`)]
                    });
                } catch (e) {
                    await interaction.reply({
                        embeds: [createErrorEmbed('❌ خطأ', 'فشل القفز إلى الأغنية المحددة.')],
                        ephemeral: true
                    });
                }
                break;
            }

            // ─── تقديم ───
            case 'تقديم': {
                const queue = client.distube.getQueue(guild);
                if (!queue) {
                    return interaction.reply({
                        embeds: [createErrorEmbed('❌ خطأ', 'لا توجد موسيقى.')],
                        ephemeral: true
                    });
                }

                const timeStr = interaction.options.getString('الوقت');
                let timeInSeconds = 0;

                if (timeStr.includes(':')) {
                    const parts = timeStr.split(':').reverse();
                    timeInSeconds = parseInt(parts[0], 10) + (parseInt(parts[1], 10) * 60) + (parts[2] ? parseInt(parts[2], 10) * 3600 : 0);
                } else {
                    timeInSeconds = parseInt(timeStr, 10);
                }

                if (isNaN(timeInSeconds) || timeInSeconds < 0) {
                    return interaction.reply({
                        embeds: [createErrorEmbed('❌ خطأ', 'يرجى تقديم وقت صالح (مثال: 90 أو 1:30)')],
                        ephemeral: true
                    });
                }

                try {
                    queue.seek(timeInSeconds);
                    await interaction.reply({
                        embeds: [createSuccessEmbed('⏩ تقديم', `تم التقديم إلى **${timeStr}**.`)]
                    });
                } catch (e) {
                    await interaction.reply({
                        embeds: [createErrorEmbed('❌ خطأ', 'فشل التقديم للوقت المحدد.')],
                        ephemeral: true
                    });
                }
                break;
            }

            default:
                await interaction.reply({
                    embeds: [createErrorEmbed('❌ خطأ', 'أمر فرعي غير معروف.')],
                    ephemeral: true
                });
        }
    } catch (error) {
        logger.error(`خطأ في أمر /موسيقى ${subcommand}:`, error);

        const errorMsg = 'حدث خطأ غير متوقع. حاول مرة أخرى.';
        if (interaction.deferred || interaction.replied) {
            await interaction.editReply({
                embeds: [createErrorEmbed('❌ خطأ داخلي', errorMsg)]
            });
        } else {
            await interaction.reply({
                embeds: [createErrorEmbed('❌ خطأ داخلي', errorMsg)],
                ephemeral: true
            });
        }
    }
}

// ═══════════════════════════════════════════════════════════════
//  Export
// ═══════════════════════════════════════════════════════════════

module.exports = { data, execute };
