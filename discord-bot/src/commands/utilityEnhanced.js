const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ChannelType } = require('discord.js');
const { createSuccessEmbed, createErrorEmbed, createInfoEmbed } = require('../utils/embeds');
const { isDatabaseConnected } = require('../database/connect');
const User = require('../database/schemas/userSchema');
const logger = require('../utils/logger');
const ms = require('ms');
const axios = require('axios');

// ─── Snipe cache references (populated by advancedLogging.js) ───
let getLastDeleted = () => null;
let getLastEdited = () => null;

try {
    const advLog = require('../events/advancedLogging');
    if (advLog.getLastDeleted) getLastDeleted = advLog.getLastDeleted;
    if (advLog.getLastEdited) getLastEdited = advLog.getLastEdited;
} catch (e) {
    // advancedLogging not available
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('أدوات_متقدمة')
        .setDescription('أدوات متقدمة ومميزات إضافية')

        // ─── snipe ───
        .addSubcommand(sub =>
            sub.setName('صيد').setDescription('عرض آخر رسالة محذوفة في هذه القناة')
        )

        // ─── editsnipe ───
        .addSubcommand(sub =>
            sub.setName('تعديل_مصيد').setDescription('عرض آخر رسالة معدلة في هذه القناة')
        )

        // ─── poll ───
        .addSubcommand(sub =>
            sub.setName('تصويت')
                .setDescription('إنشاء تصويت')
                .addStringOption(opt => opt.setName('السؤال').setDescription('سؤال التصويت').setRequired(true))
                .addStringOption(opt => opt.setName('الخيارات').setDescription('الخيارات مفصولة بفاصلة (2-10)').setRequired(true))
        )

        // ─── remind ───
        .addSubcommand(sub =>
            sub.setName('تذكير')
                .setDescription('تعيين تذكير لنفسك')
                .addStringOption(opt => opt.setName('الوقت').setDescription('المدة (مثال: 1h, 30m, 1d)').setRequired(true))
                .addStringOption(opt => opt.setName('الرسالة').setDescription('محتوى التذكير').setRequired(true))
        )

        // ─── say ───
        .addSubcommand(sub =>
            sub.setName('قول')
                .setDescription('يقلد البوت رسالتك')
                .addStringOption(opt => opt.setName('الرسالة').setDescription('الرسالة المراد إرسالها').setRequired(true))
                .addChannelOption(opt =>
                    opt.setName('القناة')
                        .setDescription('القناة المراد الإرسال إليها')
                        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
                        .setRequired(false)
                )
        )

        // ─── translate ───
        .addSubcommand(sub =>
            sub.setName('ترجمة')
                .setDescription('ترجمة نص')
                .addStringOption(opt => opt.setName('النص').setDescription('النص المراد ترجمته').setRequired(true))
                .addStringOption(opt =>
                    opt.setName('إلى')
                        .setDescription('لغة الترجمة')
                        .setRequired(true)
                        .addChoices(
                            { name: 'العربية', value: 'ar' },
                            { name: 'English', value: 'en' },
                            { name: 'Français', value: 'fr' },
                            { name: 'Español', value: 'es' },
                            { name: 'Deutsch', value: 'de' },
                            { name: '中文', value: 'zh' },
                            { name: '日本語', value: 'ja' },
                            { name: '한국어', value: 'ko' },
                            { name: 'Русский', value: 'ru' },
                            { name: 'Türkçe', value: 'tr' },
                            { name: 'Italiano', value: 'it' },
                            { name: 'Português', value: 'pt' }
                        )
                )
        )

        // ─── botinfo ───
        .addSubcommand(sub =>
            sub.setName('معلومات_البوت').setDescription('عرض معلومات وإحصائيات البوت')
        )

        // ─── banner ───
        .addSubcommand(sub =>
            sub.setName('بانر')
                .setDescription('عرض بانر عضو')
                .addUserOption(opt => opt.setName('العضو').setDescription('العضو المراد فحصه').setRequired(false))
        )

        // ─── embed builder ───
        .addSubcommand(sub =>
            sub.setName('تضمين')
                .setDescription('إنشاء رسالة مضمنة مخصصة')
                .addStringOption(opt => opt.setName('العنوان').setDescription('عنوان التضمين').setRequired(true))
                .addStringOption(opt => opt.setName('الوصف').setDescription('وصف التضمين').setRequired(true))
                .addStringOption(opt => opt.setName('اللون').setDescription('لون التضمين (كود HEX)').setRequired(false))
                .addStringOption(opt => opt.setName('الصورة').setDescription('رابط الصورة').setRequired(false))
                .addStringOption(opt => opt.setName('الصورة_المصغرة').setDescription('رابط الصورة المصغرة').setRequired(false))
        ),

    async execute(interaction) {
        const sub = interaction.options.getSubcommand();

        // ─── صيد (snipe) ───
        if (sub === 'صيد') {
            const deleted = getLastDeleted(interaction.channelId);
            if (!deleted) {
                return interaction.reply({
                    embeds: [createInfoEmbed('🔍 لا توجد رسائل محذوفة', 'لم يتم حذف أي رسائل مؤخراً في هذه القناة.')],
                    ephemeral: true,
                });
            }
            const embed = new EmbedBuilder()
                .setColor('#FF6B6B')
                .setAuthor({ name: deleted.authorTag, iconURL: deleted.authorAvatar })
                .setDescription(deleted.content || '*[رسالة فارغة أو مرفقات فقط]*')
                .setFooter({ text: `⏰ منذ ${Math.floor((Date.now() - deleted.timestamp) / 60000)} دقيقة` })
                .setTimestamp(deleted.timestamp);
            return interaction.reply({ embeds: [embed] });
        }

        // ─── تعديل_مصيد (editsnipe) ───
        if (sub === 'تعديل_مصيد') {
            const edited = getLastEdited(interaction.channelId);
            if (!edited) {
                return interaction.reply({
                    embeds: [createInfoEmbed('🔍 لا توجد رسائل معدلة', 'لم يتم تعديل أي رسائل مؤخراً في هذه القناة.')],
                    ephemeral: true,
                });
            }
            const embed = new EmbedBuilder()
                .setColor('#FFD93D')
                .setAuthor({ name: edited.authorTag, iconURL: edited.authorAvatar })
                .addFields(
                    { name: 'قبل التعديل', value: edited.oldContent ? (edited.oldContent.length > 1024 ? edited.oldContent.slice(0, 1021) + '...' : edited.oldContent) : '*[فارغ]*' },
                    { name: 'بعد التعديل', value: edited.newContent ? (edited.newContent.length > 1024 ? edited.newContent.slice(0, 1021) + '...' : edited.newContent) : '*[فارغ]*' },
                )
                .setFooter({ text: `⏰ منذ ${Math.floor((Date.now() - edited.timestamp) / 60000)} دقيقة` })
                .setTimestamp(edited.timestamp);
            return interaction.reply({ embeds: [embed] });
        }

        // ─── تصويت (poll) ───
        if (sub === 'تصويت') {
            if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
                return interaction.reply({ embeds: [createErrorEmbed('❌ صلاحية مرفوضة', 'تحتاج صلاحية إدارة الرسائل لإنشاء تصويت.')], ephemeral: true });
            }
            const question = interaction.options.getString('السؤال');
            const optionsStr = interaction.options.getString('الخيارات');
            const options = optionsStr.split(',').map(o => o.trim()).filter(o => o.length > 0);

            if (options.length < 2) return interaction.reply({ embeds: [createErrorEmbed('❌ خطأ', 'يجب أن يكون هناك خيارين على الأقل.')], ephemeral: true });
            if (options.length > 10) return interaction.reply({ embeds: [createErrorEmbed('❌ خطأ', 'الحد الأقصى 10 خيارات.')], ephemeral: true });

            const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

            const pollEmbed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle(`📊 ${question}`)
                .setDescription(options.map((o, i) => `${emojis[i]} ${o}`).join('\n'))
                .setFooter({ text: `أُنشئ بواسطة ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
                .setTimestamp();

            const msg = await interaction.reply({ embeds: [pollEmbed], fetchReply: true });
            for (let i = 0; i < options.length; i++) {
                await msg.react(emojis[i]);
            }
        }

        // ─── تذكير (remind) ───
        if (sub === 'تذكير') {
            const timeStr = interaction.options.getString('الوقت');
            const message = interaction.options.getString('الرسالة');
            const durationMs = ms(timeStr);

            if (!durationMs) return interaction.reply({ embeds: [createErrorEmbed('❌ تنسيق غير صالح', 'يرجى استخدام تنسيق مثل: 1h, 30m, 1d')], ephemeral: true });
            if (durationMs < ms('1m')) return interaction.reply({ embeds: [createErrorEmbed('❌ مدة قصيرة جداً', 'الحد الأدنى للتذكير هو دقيقة واحدة.')], ephemeral: true });
            if (durationMs > ms('30d')) return interaction.reply({ embeds: [createErrorEmbed('❌ مدة طويلة جداً', 'الحد الأقصى للتذكير هو 30 يوم.')], ephemeral: true });

            // Save reminder to database
            if (isDatabaseConnected()) {
                try {
                    await User.addReminder(interaction.user.id, interaction.guild.id, message, new Date(Date.now() + durationMs), interaction.channelId);
                } catch (err) {
                    logger.error('خطأ في حفظ التذكير:', err);
                }
            }

            // Set timeout
            setTimeout(async () => {
                try {
                    const remindEmbed = new EmbedBuilder()
                        .setColor('#F59E0B')
                        .setTitle('⏰ تذكير!')
                        .setDescription(message)
                        .setFooter({ text: `تم تعيينه قبل ${timeStr}` })
                        .setTimestamp();
                    await interaction.user.send({ embeds: [remindEmbed] }).catch(() => { logger.debug('Could not send DM to user (DMs closed or bot blocked)'); });
                } catch (err) {
                    try {
                        const channel = interaction.guild.channels.cache.get(interaction.channelId);
                        if (channel) {
                            await channel.send({ content: `${interaction.user} ⏰ تذكير: ${message}` });
                        }
                    } catch (e) { /* ignore */ }
                }
            }, durationMs);

            return interaction.reply({
                embeds: [createSuccessEmbed('⏰ تم تعيين التذكير', `سأذكرك بـ "${message.slice(0, 50)}${message.length > 50 ? '...' : ''}" بعد ${ms(durationMs, { long: true })}`)],
                ephemeral: true,
            });
        }

        // ─── قول (say) ───
        if (sub === 'قول') {
            if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
                return interaction.reply({ embeds: [createErrorEmbed('❌ صلاحية مرفوضة', 'تحتاج صلاحية إدارة الرسائل.')], ephemeral: true });
            }
            let messageContent = interaction.options.getString('الرسالة');
            const channel = interaction.options.getChannel('القناة') || interaction.channel;

            if (!channel.isTextBased()) return interaction.reply({ embeds: [createErrorEmbed('❌ قناة غير صالحة', 'يرجى اختيار قناة نصية.')], ephemeral: true });

            // 🛡️ تصفية المنشن (Prevent unauthorized mentions)
            if (!interaction.member.permissions.has(PermissionFlagsBits.MentionEveryone)) {
                messageContent = messageContent.replace(/@(everyone|here)/gi, '[@]$1');
            }

            try {
                await channel.send({ content: messageContent, allowedMentions: { parse: interaction.member.permissions.has(PermissionFlagsBits.MentionEveryone) ? ['users', 'roles', 'everyone'] : ['users', 'roles'] } });
                return interaction.reply({ embeds: [createSuccessEmbed('✅ تم الإرسال', `تم إرسال الرسالة إلى ${channel}.`)], ephemeral: true });
            } catch (err) {
                return interaction.reply({ embeds: [createErrorEmbed('❌ خطأ', 'فشل إرسال الرسالة.')], ephemeral: true });
            }
        }

        // ─── ترجمة (translate) ───
        if (sub === 'ترجمة') {
            const text = interaction.options.getString('النص');
            const targetLang = interaction.options.getString('إلى');

            await interaction.deferReply();

            try {
                const response = await axios.get('https://api.mymemory.translated.net/get', {
                    params: { q: text, langpair: `auto|${targetLang}` },
                    timeout: 10000,
                });
                const translated = response.data?.responseData?.translatedText;

                if (!translated) throw new Error('No translation');

                const langNames = { ar: 'العربية', en: 'English', fr: 'Français', es: 'Español', de: 'Deutsch', zh: '中文', ja: '日本語', ko: '한국어', ru: 'Русский', tr: 'Türkçe', it: 'Italiano', pt: 'Português' };

                const embed = new EmbedBuilder()
                    .setColor('#3498DB')
                    .setTitle('🌐 ترجمة')
                    .addFields(
                        { name: 'الأصلي', value: text.length > 1024 ? text.slice(0, 1021) + '...' : text },
                        { name: `إلى ${langNames[targetLang] || targetLang}`, value: translated.length > 1024 ? translated.slice(0, 1021) + '...' : translated },
                    )
                    .setFooter({ text: 'تم الترجمة بنجاح' });

                return interaction.editReply({ embeds: [embed] });
            } catch (err) {
                logger.error('خطأ في الترجمة:', err);
                return interaction.editReply({ embeds: [createErrorEmbed('❌ خطأ في الترجمة', 'تعذر ترجمة النص. حاول مرة أخرى.')], ephemeral: true });
            }
        }

        // ─── معلومات_البوت (botinfo) ───
        if (sub === 'معلومات_البوت') {
            const client = interaction.client;
            const days = Math.floor(client.uptime / 86400000);
            const hours = Math.floor(client.uptime / 3600000) % 24;
            const minutes = Math.floor(client.uptime / 60000) % 60;

            const memUsage = process.memoryUsage();
            const memMB = (memUsage.heapUsed / 1024 / 1024).toFixed(2);

            const servers = client.guilds.cache.size;
            const users = client.users.cache.size;
            const channels = client.channels.cache.size;

            const embed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle('🤖 معلومات البوت')
                .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
                .addFields(
                    { name: 'اسم البوت', value: client.user.tag, inline: true },
                    { name: 'المعرف', value: client.user.id, inline: true },
                    { name: 'وقت التشغيل', value: `${days}ي ${hours}س ${minutes}د`, inline: true },
                    { name: 'السيرفرات', value: `${servers}`, inline: true },
                    { name: 'المستخدمين', value: `${users}`, inline: true },
                    { name: 'القنوات', value: `${channels}`, inline: true },
                    { name: 'استخدام الذاكرة', value: `${memMB} MB`, inline: true },
                    { name: 'إصدار Node.js', value: process.version, inline: true },
                    { name: 'إصدار Discord.js', value: require('discord.js').version, inline: true },
                )
                .setFooter({ text: 'Family Legends Bot v2.0' })
                .setTimestamp();

            return interaction.reply({ embeds: [embed] });
        }

        // ─── بانر (banner) ───
        if (sub === 'بانر') {
            const targetUser = interaction.options.getUser('العضو') || interaction.user;
            await interaction.deferReply();

            try {
                const fetchedUser = await client.users.fetch(targetUser.id, { force: true });
                const bannerUrl = fetchedUser.bannerURL({ dynamic: true, size: 1024 });

                if (!bannerUrl) {
                    return interaction.editReply({ embeds: [createInfoEmbed('🖼️ لا يوجد بانر', `${targetUser.tag} ليس لديه بانر.`)], ephemeral: true });
                }

                const embed = new EmbedBuilder()
                    .setColor('#9B59B6')
                    .setTitle(`بانر ${fetchedUser.username}`)
                    .setImage(bannerUrl)
                    .setDescription(`[تحميل البانر](${bannerUrl})`);

                return interaction.editReply({ embeds: [embed] });
            } catch (err) {
                return interaction.editReply({ embeds: [createErrorEmbed('❌ خطأ', 'تعذر جلب البانر.')] });
            }
        }

        // ─── تضمين (embed builder) ───
        if (sub === 'تضمين') {
            if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
                return interaction.reply({ embeds: [createErrorEmbed('❌ صلاحية مرفوضة', 'تحتاج صلاحية إدارة الرسائل.')], ephemeral: true });
            }

            const title = interaction.options.getString('العنوان');
            const description = interaction.options.getString('الوصف');
            const colorStr = interaction.options.getString('اللون');
            const image = interaction.options.getString('الصورة');
            const thumbnail = interaction.options.getString('الصورة_المصغرة');

            const embed = new EmbedBuilder()
                .setTitle(title)
                .setDescription(description)
                .setFooter({ text: `أُنشئ بواسطة ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
                .setTimestamp();

            if (colorStr) {
                const color = colorStr.replace('#', '');
                if (/^[0-9A-Fa-f]{6}$/.test(color)) {
                    embed.setColor(parseInt(color, 16));
                }
            } else {
                embed.setColor('#5865F2');
            }

            if (image) embed.setImage(image);
            if (thumbnail) embed.setThumbnail(thumbnail);

            return interaction.reply({ embeds: [embed] });
        }
    },
};
