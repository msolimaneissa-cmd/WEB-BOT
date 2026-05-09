const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { createSuccessEmbed, createErrorEmbed } = require('../utils/embeds');
const logger = require('../utils/logger');

/**
 * @module commands/utility
 * @description أوامر الأدوات تشمل: مساعدة، بنق، معلومات السيرفر،
 * معلومات العضو، صورة، وإعلان.
 */
module.exports = {
    /** @type {SlashCommandBuilder} Slash command definition */
    data: new SlashCommandBuilder()
        .setName('أدوات')
        .setDescription('أوامر الأدوات')
        .addSubcommand(subcommand => subcommand.setName('مساعدة').setDescription('عرض كل الأوامر المتاحة'))
        .addSubcommand(subcommand => subcommand.setName('بنق').setDescription('عرض سرعة البوت ووقت التشغيل'))
        .addSubcommand(subcommand => subcommand.setName('معلومات_السيرفر').setDescription('عرض معلومات عن السيرفر'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('معلومات_العضو')
                .setDescription('عرض معلومات عن عضو')
                .addUserOption(option => option.setName('العضو').setDescription('العضو المراد فحصه').setRequired(false))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('صورة')
                .setDescription('عرض صورة بروفايل عضو')
                .addUserOption(option => option.setName('العضو').setDescription('العضو المراد فحصه').setRequired(false))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('اعلان')
                .setDescription('إرسال إعلان')
                .addStringOption(option => option.setName('الرسالة').setDescription('رسالة الإعلان').setRequired(true))
                .addChannelOption(option => option.setName('القناة').setDescription('القناة المراد الإرسال إليها').setRequired(false))
        ),

    /**
     * Executes the utility command based on the chosen subcommand.
     * @async
     * @param {import('discord.js').ChatInputCommandInteraction} interaction - The interaction instance.
     * @returns {Promise<void>}
     */
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'مساعدة') {
            const embed = new EmbedBuilder()
                .setColor('#3498DB')
                .setTitle('📚 أوامر البوت')
                .setDescription('كل الأوامر المتاحة مصنفة حسب النوع:')
                .addFields(
                    { name: '🛡️ الإدارة (`/ادارة`)', value: 'حظر، طرد، إسكات، تحذير، مسح، إلغاء الحظر' },
                    { name: '🎵 الموسيقى (`/موسيقى`)', value: 'تشغيل، إيقاف، استئناف، تخطي، إنهاء، قائمة، الصوت، تكرار، الآن، مغادرة' },
                    { name: '💰 الاقتصاد (`/اقتصاد`)', value: 'رصيد، يومي، عمل، تحويل، سرقة، المتصدرون' },
                    { name: '🎲 الترفيه (`/ترفيه`)', value: 'كرة الحظ، عملة، نرد، رمي النرد، ميم، حجر ورقة مقص' },
                    { name: '🛠️ الأدوات (`/أدوات`)', value: 'مساعدة، بنق، معلومات السيرفر، معلومات العضو، صورة، إعلان' }
                )
                .setFooter({ text: 'استخدم الأوامر الفرعية لرؤية الخيارات!' });

            return interaction.reply({ embeds: [embed] });
        }

        if (subcommand === 'بنق') {
            const sent = await interaction.reply({ content: 'جاري الفحص...', fetchReply: true });
            const roundtripLatency = sent.createdTimestamp - interaction.createdTimestamp;

            const days = Math.floor(interaction.client.uptime / 86400000);
            const hours = Math.floor(interaction.client.uptime / 3600000) % 24;
            const minutes = Math.floor(interaction.client.uptime / 60000) % 60;
            const seconds = Math.floor(interaction.client.uptime / 1000) % 60;

            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('🏓 بونق!')
                .addFields(
                    { name: 'سرعة البوت', value: `${roundtripLatency}ms`, inline: true },
                    { name: 'سرعة الـ API', value: `${Math.round(interaction.client.ws.ping)}ms`, inline: true },
                    { name: 'وقت التشغيل', value: `${days}ي ${hours}س ${minutes}د ${seconds}ث`, inline: false }
                );

            return interaction.editReply({ content: null, embeds: [embed] });
        }

        if (subcommand === 'معلومات_السيرفر') {
            const { guild } = interaction;
            const owner = await guild.fetchOwner();

            const humans = guild.members.cache.filter(m => !m.user.bot).size;
            const bots = guild.members.cache.size - humans;
            const textChannels = guild.channels.cache.filter(c => c.isTextBased()).size;
            const voiceChannels = guild.channels.cache.filter(c => c.isVoiceBased()).size;

            const embed = new EmbedBuilder()
                .setColor('#3498DB')
                .setTitle(`📊 معلومات السيرفر: ${guild.name}`)
                .setThumbnail(guild.iconURL({ dynamic: true }))
                .addFields(
                    { name: 'المالك', value: `${owner.user.tag}`, inline: true },
                    { name: 'معرف السيرفر', value: `${guild.id}`, inline: true },
                    { name: 'تاريخ الإنشاء', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:D>`, inline: true },
                    { name: 'الأعضاء', value: `الإجمالي: ${guild.memberCount}\nالبشر: ${humans}\nالبوتات: ${bots}`, inline: true },
                    { name: 'القنوات', value: `نصية: ${textChannels}\nصوتية: ${voiceChannels}`, inline: true },
                    { name: 'مستوى الدعم', value: `المستوى ${guild.premiumTier} (${guild.premiumSubscriptionCount} دعم)`, inline: true }
                );

            return interaction.reply({ embeds: [embed] });
        }

        if (subcommand === 'معلومات_العضو') {
            const targetUser = interaction.options.getUser('العضو') || interaction.user;
            const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

            const embed = new EmbedBuilder()
                .setColor('#3498DB')
                .setAuthor({ name: targetUser.tag, iconURL: targetUser.displayAvatarURL({ dynamic: true }) })
                .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 256 }))
                .addFields(
                    { name: 'معرف العضو', value: targetUser.id, inline: true },
                    { name: 'بوت', value: targetUser.bot ? 'نعم' : 'لا', inline: true },
                    { name: 'تاريخ إنشاء الحساب', value: `<t:${Math.floor(targetUser.createdTimestamp / 1000)}:R>`, inline: false }
                );

            if (targetMember) {
                // Presence info
                const presenceStatuses = {
                    online: '🟢 متصل',
                    idle: '🌙 غير نشط',
                    dnd: '⛔ لا تزعجني',
                    offline: '⚫ غير متصل/مخفي'
                };
                const presence = targetMember.presence ? targetMember.presence.status : 'offline';
                const statusStr = presenceStatuses[presence] || '⚫ غير متصل/مخفي';
                const customStatus = targetMember.presence?.activities?.find(a => a.type === 4)?.state || null;

                const roles = targetMember.roles.cache.filter(r => r.id !== interaction.guild.id).map(r => r.toString()).join(', ') || 'لا يوجد';
                embed.addFields(
                    { name: 'الحالة', value: statusStr + (customStatus ? `\n"${customStatus}"` : ''), inline: true },
                    { name: 'أعلى رول', value: targetMember.roles.highest.name, inline: true },
                    { name: 'تاريخ الانضمام', value: `<t:${Math.floor(targetMember.joinedTimestamp / 1000)}:R>`, inline: false },
                    { name: `الأدوار [${targetMember.roles.cache.size - 1}]`, value: roles, inline: false }
                );
            }

            return interaction.reply({ embeds: [embed] });
        }

        if (subcommand === 'صورة') {
            const targetUser = interaction.options.getUser('العضو') || interaction.user;

            const png = targetUser.displayAvatarURL({ extension: 'png', size: 1024 });
            const jpg = targetUser.displayAvatarURL({ extension: 'jpg', size: 1024 });
            const webp = targetUser.displayAvatarURL({ extension: 'webp', size: 1024 });

            const embed = new EmbedBuilder()
                .setColor('#3498DB')
                .setTitle(`صورة بروفايل ${targetUser.username}`)
                .setImage(targetUser.displayAvatarURL({ dynamic: true, size: 1024 }))
                .setDescription(`[PNG](${png}) | [JPG](${jpg}) | [WEBP](${webp})`);

            return interaction.reply({ embeds: [embed] });
        }

        if (subcommand === 'اعلان') {
            if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
                return interaction.reply({ embeds: [createErrorEmbed('❌ صلاحية مرفوضة', 'تحتاج صلاحية إدارة الرسائل لإرسال الإعلانات.')], ephemeral: true });
            }

            const message = interaction.options.getString('الرسالة');
            const targetChannel = interaction.options.getChannel('القناة') || interaction.channel;

            if (!targetChannel.isTextBased()) {
                return interaction.reply({ embeds: [createErrorEmbed('❌ قناة غير صالحة', 'يرجى اختيار قناة نصية.')], ephemeral: true });
            }

            if (!targetChannel.permissionsFor(interaction.guild.members.me).has(['SendMessages', 'EmbedLinks'])) {
                return interaction.reply({ embeds: [createErrorEmbed('❌ البوت يفتقر للصلاحيات', 'ليس لدي صلاحية إرسال رسائل أو روابط مضمنة في تلك القناة.')], ephemeral: true });
            }

            const embed = new EmbedBuilder()
                .setColor('#FF5733')
                .setTitle('📢 إعلان')
                .setDescription(message)
                .setFooter({ text: `أرسل بواسطة ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
                .setTimestamp();

            await targetChannel.send({ embeds: [embed] });

            return interaction.reply({ embeds: [createSuccessEmbed('✅ نجاح', `تم إرسال الإعلان إلى ${targetChannel}.`)], ephemeral: true });
        }
    },
};
