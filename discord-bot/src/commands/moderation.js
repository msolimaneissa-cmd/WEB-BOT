/**
 * @file commands/moderation.js
 * @description أوامر الإدارة الشاملة تشمل: حظر، طرد، إسكات، تحذير، مسح، وإلغاء الحظر.
 * نظام التحذيرات متكامل مع قاعدة البيانات ودعم الحظر التلقائي عند بلوغ الحد الأقصى.
 */

const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { createSuccessEmbed, createErrorEmbed } = require('../utils/embeds');
const { canModerate, userCanModerate, isStaff } = require('../utils/permissions');
const ServerConfig = require('../database/schemas/serverConfigSchema');
const Warning = require('../database/schemas/warningSchema');
const ModAction = require('../database/schemas/modActionSchema');
const { isDatabaseConnected } = require('../database/connect');

const ms = require('ms');
const logger = require('../utils/logger');

async function sendModLog(interaction, title, targetUser, reason) {
    if (!isDatabaseConnected()) return;
    try {
        const guildConfig = await ServerConfig.get();
        const logChannelId = guildConfig?.mod?.logChannelId;
        if (logChannelId) {
            const logChannel = interaction.guild.channels.cache.get(logChannelId);
            if (logChannel) {
                const logEmbed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle(title)
                    .addFields(
                        { name: 'العضو', value: `${targetUser.tag} (${targetUser.id})` },
                        { name: 'المشرف', value: `${interaction.user.tag}` },
                        { name: 'السبب', value: reason || 'لم يتم التحديد' }
                    )
                    .setTimestamp();
                logChannel.send({ embeds: [logEmbed] }).catch(() => {});
            }
        }
    } catch (e) {
        logger.error('Error logging mod action', e);
    }
}

/**
 * @module commands/moderation
 * @description أوامر الإدارة لإدارة السيرفر.
 */
module.exports = {
    /** @type {SlashCommandBuilder} تعريف الأمر */
    data: new SlashCommandBuilder()
        .setName('ادارة')
        .setDescription('أوامر الإدارة')
        .addSubcommand(subcommand =>
            subcommand
                .setName('حظر')
                .setDescription('حظر عضو من السيرفر')
                .addUserOption(option => option.setName('العضو').setDescription('العضو المراد حظره').setRequired(true))
                .addStringOption(option => option.setName('السبب').setDescription('سبب الحظر').setRequired(false))
                .addIntegerOption(option => option.setName('عدد_الايام').setDescription('عدد أيام الرسائل للحذف (0-7)').setRequired(false).setMinValue(0).setMaxValue(7))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('طرد')
                .setDescription('طرد عضو من السيرفر')
                .addUserOption(option => option.setName('العضو').setDescription('العضو المراد طرده').setRequired(true))
                .addStringOption(option => option.setName('السبب').setDescription('سبب الطرد').setRequired(false))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('اسكات')
                .setDescription('إسكات عضو')
                .addUserOption(option => option.setName('العضو').setDescription('العضو المراد إسكاته').setRequired(true))
                .addStringOption(option => option.setName('المدة').setDescription('المدة (مثال: 10m, 1h, 1d)').setRequired(true))
                .addStringOption(option => option.setName('السبب').setDescription('سبب الإسكات').setRequired(false))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('تحذير')
                .setDescription('تحذير عضو (يُحفظ في قاعدة البيانات)')
                .addUserOption(option => option.setName('العضو').setDescription('العضو المراد تحذيره').setRequired(true))
                .addStringOption(option => option.setName('السبب').setDescription('سبب التحذير').setRequired(false))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('التحذيرات')
                .setDescription('عرض تحذيرات عضو')
                .addUserOption(option => option.setName('العضو').setDescription('العضو لعرض تحذيراته').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('مسح_التحذيرات')
                .setDescription('مسح جميع تحذيرات عضو')
                .addUserOption(option => option.setName('العضو').setDescription('العضو المراد مسح تحذيراته').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('مسح')
                .setDescription('مسح عدة رسائل')
                .addIntegerOption(option => option.setName('العدد').setDescription('عدد الرسائل للحذف (1-100)').setRequired(true).setMinValue(1).setMaxValue(100))
                .addUserOption(option => option.setName('العضو').setDescription('حذف رسائل هذا العضو فقط').setRequired(false))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('الغاء_الحظر')
                .setDescription('إلغاء حظر عضو')
                .addStringOption(option => option.setName('المعرف').setDescription('معرف العضو المراد إلغاء حظره').setRequired(true))
                .addStringOption(option => option.setName('السبب').setDescription('سبب إلغاء الحظر').setRequired(false))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('حظر_مؤقت')
                .setDescription('حظر عضو مؤقتًا')
                .addUserOption(option => option.setName('العضو').setDescription('العضو المراد حظره').setRequired(true))
                .addStringOption(option => option.setName('المدة').setDescription('مدة الحظر (مثال: 1h, 1d, 1w)').setRequired(true))
                .addStringOption(option => option.setName('السبب').setDescription('سبب الحظر').setRequired(false))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('حظر_ناعم')
                .setDescription('حظر عضو وحذفه فوراً (لمسح رسائله)')
                .addUserOption(option => option.setName('العضو').setDescription('العضو المراد حظره').setRequired(true))
                .addStringOption(option => option.setName('السبب').setDescription('سبب الحظر').setRequired(false))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('حظر_المعرف')
                .setDescription('حظر عضو بواسطة المعرف (حتى لو لم يكن في السيرفر)')
                .addStringOption(option => option.setName('المعرف').setDescription('معرف العضو المراد حظره').setRequired(true))
                .addStringOption(option => option.setName('السبب').setDescription('سبب الحظر').setRequired(false))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('بطيء')
                .setDescription('تعيين وضع السلو_مود في القناة')
                .addIntegerOption(option => option.setName('الثواني').setDescription('عدد الثواني (0 لتعطيله)').setRequired(true).setMinValue(0).setMaxValue(21600))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('قفل')
                .setDescription('قفل القناة الحالية')
                .addStringOption(option => option.setName('السبب').setDescription('سبب القفل').setRequired(false))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('فتح')
                .setDescription('فتح القناة الحالية')
                .addStringOption(option => option.setName('السبب').setDescription('سبب الفتح').setRequired(false))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('لقب')
                .setDescription('تغيير لقب عضو')
                .addUserOption(option => option.setName('العضو').setDescription('العضو المراد تغيير لقبه').setRequired(true))
                .addStringOption(option => option.setName('اللقب').setDescription('اللقب الجديد (اتركه فارغاً للمسح)').setRequired(false))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('الغاء_اسكات')
                .setDescription('إلغاء إسكات عضو')
                .addUserOption(option => option.setName('العضو').setDescription('العضو المراد إلغاء إسكاته').setRequired(true))
                .addStringOption(option => option.setName('السبب').setDescription('سبب إلغاء الإسكات').setRequired(false))
        ),

    /**
     * تنفيذ أمر الإدارة بناءً على الأمر الفرعي المختار.
     * @async
     * @param {import('discord.js').ChatInputCommandInteraction} interaction - تفاعل الأمر.
     * @returns {Promise<void>}
     */
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'حظر') {
            const guildConfig = await ServerConfig.get();
            const isMemberStaff = isStaff(interaction.member, guildConfig);

            if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers) && !isMemberStaff) {
                return interaction.reply({ embeds: [createErrorEmbed('❌ صلاحية مرفوضة', 'ليس لديك صلاحية لحظر الأعضاء')], ephemeral: true });
            }
            if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.BanMembers)) {
                return interaction.reply({ embeds: [createErrorEmbed('البوت يفتقر للصلاحيات', 'ليس لدي صلاحية لحظر الأعضاء')], ephemeral: true });
            }

            const targetUser = interaction.options.getUser('العضو');
            const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
            const reason = interaction.options.getString('السبب') || 'لم يتم تحديد سبب';
            const days = interaction.options.getInteger('عدد_الايام') || 0;

            if (targetMember) {
                if (!canModerate(interaction.guild.members.me, targetMember)) {
                    return interaction.reply({ embeds: [createErrorEmbed('❌ خطأ في التسلسل الهرمي', 'لا يمكنني حظر عضو لديه رول مساوٍ أو أعلى مني')], ephemeral: true });
                }
                if (!userCanModerate(interaction.member, targetMember)) {
                    return interaction.reply({ embeds: [createErrorEmbed('❌ خطأ في التسلسل الهرمي', 'لا يمكنك حظر عضو لديه رول مساوٍ أو أعلى منك')], ephemeral: true });
                }
            }

            try {
                const dmEmbed = createErrorEmbed(`تم حظرك من ${interaction.guild.name}`, `**السبب:** ${reason}`);
                await targetUser.send({ embeds: [dmEmbed] }).catch(() => { logger.debug('Could not send DM to user (DMs closed or bot blocked)'); });
            } catch (e) {
                logger.info('Could not DM user');
            }

            await interaction.guild.members.ban(targetUser, { reason: reason, deleteMessageSeconds: days * 24 * 60 * 60 });

            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('🚫 عضو محظور')
                .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
                .addFields(
                    { name: 'العضو', value: `${targetUser.tag} (${targetUser.id})` },
                    { name: 'المشرف', value: `${interaction.user.tag}` },
                    { name: 'السبب', value: reason }
                )
                .setTimestamp();

            await sendModLog(interaction, '🚫 حظر', targetUser, reason);
            return interaction.reply({ embeds: [embed] });
        }

        if (subcommand === 'طرد') {
            const guildConfig = await ServerConfig.get();
            const isMemberStaff = isStaff(interaction.member, guildConfig);

            if (!interaction.member.permissions.has(PermissionFlagsBits.KickMembers) && !isMemberStaff) {
                return interaction.reply({ embeds: [createErrorEmbed('❌ صلاحية مرفوضة', 'ليس لديك صلاحية لطر الأعضاء')], ephemeral: true });
            }
            if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.KickMembers)) {
                return interaction.reply({ embeds: [createErrorEmbed('البوت يفتقر للصلاحيات', 'ليس لدي صلاحية لطر الأعضاء')], ephemeral: true });
            }

            const targetUser = interaction.options.getUser('العضو');
            const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
            const reason = interaction.options.getString('السبب') || 'لم يتم تحديد سبب';

            if (!targetMember) return interaction.reply({ embeds: [createErrorEmbed('❌ غير موجود', 'العضو غير موجود في السيرفر')], ephemeral: true });

            if (!canModerate(interaction.guild.members.me, targetMember)) {
                return interaction.reply({ embeds: [createErrorEmbed('❌ خطأ في التسلسل الهرمي', 'لا يمكنني طرد عضو لديه رول مساوٍ أو أعلى مني')], ephemeral: true });
            }
            if (!userCanModerate(interaction.member, targetMember)) {
                return interaction.reply({ embeds: [createErrorEmbed('❌ خطأ في التسلسل الهرمي', 'لا يمكنك طرد عضو لديه رول مساوٍ أو أعلى منك')], ephemeral: true });
            }

            try {
                const dmEmbed = createErrorEmbed(`تم طردك من ${interaction.guild.name}`, `**السبب:** ${reason}`);
                await targetUser.send({ embeds: [dmEmbed] }).catch(() => { logger.debug('Could not send DM to user (DMs closed or bot blocked)'); });
            } catch (e) {}

            await targetMember.kick(reason);

            const embed = createSuccessEmbed('👢 عضو مطرود', `**${targetUser.tag}** تم طرده.\n**السبب:** ${reason}`);
            await sendModLog(interaction, '👢 طرد', targetUser, reason);
            return interaction.reply({ embeds: [embed] });
        }

        if (subcommand === 'اسكات') {
            const guildConfig = await ServerConfig.get();
            const isMemberStaff = isStaff(interaction.member, guildConfig);

            if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers) && !isMemberStaff) {
                return interaction.reply({ embeds: [createErrorEmbed('❌ صلاحية مرفوضة', 'ليس لديك صلاحية لإسكات الأعضاء')], ephemeral: true });
            }
            if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ModerateMembers)) {
                return interaction.reply({ embeds: [createErrorEmbed('البوت يفتقر للصلاحيات', 'ليس لدي صلاحية لإسكات الأعضاء')], ephemeral: true });
            }

            const targetUser = interaction.options.getUser('العضو');
            const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
            const durationStr = interaction.options.getString('المدة');
            const reason = interaction.options.getString('السبب') || 'لم يتم تحديد سبب';

            if (!targetMember) return interaction.reply({ embeds: [createErrorEmbed('❌ غير موجود', 'العضو غير موجود في السيرفر')], ephemeral: true });

            if (!canModerate(interaction.guild.members.me, targetMember)) {
                return interaction.reply({ embeds: [createErrorEmbed('❌ خطأ في التسلسل الهرمي', 'لا يمكنني إسكات عضو لديه رول مساوٍ أو أعلى مني')], ephemeral: true });
            }
            if (!userCanModerate(interaction.member, targetMember)) {
                return interaction.reply({ embeds: [createErrorEmbed('❌ خطأ في التسلسل الهرمي', 'لا يمكنك إسكات عضو لديه رول مساوٍ أو أعلى منك')], ephemeral: true });
            }

            const durationMs = ms(durationStr);
            if (!durationMs) return interaction.reply({ embeds: [createErrorEmbed('❌ تنسيق غير صالح', 'يرجى تقديم مدة صالحة (مثال: 10m, 1h, 1d)')], ephemeral: true });
            if (durationMs > ms('28d')) return interaction.reply({ embeds: [createErrorEmbed('❌ مدة طويلة جداً', 'لا يمكن أن تتجاوز الإسكاتات 28 يوماً')], ephemeral: true });

            await targetMember.timeout(durationMs, reason);

            const embed = createSuccessEmbed('🔇 عضو مُسكَت', `**${targetUser.tag}** تم إسكاته لمدة ${ms(durationMs, { long: true })}.\n**السبب:** ${reason}`);
            await sendModLog(interaction, `🔇 إسكات (${ms(durationMs, { long: true })})`, targetUser, reason);
            return interaction.reply({ embeds: [embed] });
        }

        if (subcommand === 'تحذير') {
            const guildConfig = await ServerConfig.get();
            const isMemberStaff = isStaff(interaction.member, guildConfig);

            if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages) && !isMemberStaff) {
                return interaction.reply({ embeds: [createErrorEmbed('❌ صلاحية مرفوضة', 'ليس لديك صلاحية لتحذير الأعضاء')], ephemeral: true });
            }

            const targetUser = interaction.options.getUser('العضو');
            const reason = interaction.options.getString('السبب') || 'لم يتم تحديد سبب';

            // حفظ التحذير في قاعدة البيانات
            let warningCount = 0;
            if (isDatabaseConnected()) {
                try {
                    await Warning.addWarning(targetUser.id, interaction.guild.id, interaction.user.id, interaction.user.tag, reason);
                    warningCount = await Warning.getWarningCount(targetUser.id, interaction.guild.id);
                } catch (error) {
                    logger.error('خطأ في حفظ التحذير:', error);
                }
            }

            // إرسال رسالة خاصة للمستخدم
            try {
                const dmEmbed = createErrorEmbed(`لقد تلقيت تحذيراً في ${interaction.guild.name}`, `**السبب:** ${reason}\n**عدد تحذيراتك:** ${warningCount}`);
                await targetUser.send({ embeds: [dmEmbed] }).catch(() => { logger.debug('Could not send DM to user (DMs closed or bot blocked)'); });
            } catch (e) {}

            const embed = createSuccessEmbed('⚠️ عضو محذّر', `**${targetUser.tag}** تم تحذيره.\n**السبب:** ${reason}\n**إجمالي التحذيرات:** ${warningCount}`);

            // التحقق من الحد الأقصى للتحذيرات + الحظر التلقائي
            if (isDatabaseConnected()) {
                try {
                    const guildConfig = await ServerConfig.get();
                    const maxWarnings = guildConfig?.mod?.maxWarnings || 3;
                    const autoBan = guildConfig?.mod?.autoBan || false;

                    if (warningCount >= maxWarnings) {
                        if (autoBan && interaction.guild.members.me.permissions.has(PermissionFlagsBits.BanMembers)) {
                            try {
                                await interaction.guild.members.ban(targetUser, { reason: `بلغ الحد الأقصى للتحذيرات (${maxWarnings})` });
                                const banEmbed = createErrorEmbed('🚫 حظر تلقائي', `**${targetUser.tag}** تم حظره تلقائياً بعد بلوغ الحد الأقصى للتحذيرات (${maxWarnings}).`);
                                return interaction.reply({ embeds: [embed, banEmbed] });
                            } catch (err) {
                                logger.error('فشل في الحظر التلقائي:', err);
                            }
                        }

                        // تسجيل في قناة السجلات
                        const logChannelId = guildConfig?.mod?.logChannelId;
                        if (logChannelId) {
                            const logChannel = interaction.guild.channels.cache.get(logChannelId);
                            if (logChannel) {
                                const logEmbed = new EmbedBuilder()
                                    .setColor('#FF0000')
                                    .setTitle('⚠️ بلوغ الحد الأقصى للتحذيرات')
                                    .setDescription(`**العضو:** ${targetUser.tag} (${targetUser.id})\n**التحذيرات:** ${warningCount}/${maxWarnings}\n**الحظر التلقائي:** ${autoBan ? 'مفعّل' : 'معطّل'}`)
                                    .setTimestamp();
                                logChannel.send({ embeds: [logEmbed] }).catch(() => {});
                            }
                        }
                    }
                } catch (error) {
                    logger.error('خطأ في التحقق من الحد الأقصى للتحذيرات:', error);
                }
            }

            return interaction.reply({ embeds: [embed] });
        }

        if (subcommand === 'التحذيرات') {
            const guildConfig = await ServerConfig.get();
            const isMemberStaff = isStaff(interaction.member, guildConfig);

            if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages) && !isMemberStaff) {
                return interaction.reply({ embeds: [createErrorEmbed('❌ صلاحية مرفوضة', 'ليس لديك صلاحية لعرض التحذيرات')], ephemeral: true });
            }

            const targetUser = interaction.options.getUser('العضو');

            if (!isDatabaseConnected()) {
                return interaction.reply({ embeds: [createErrorEmbed('❌ قاعدة البيانات غير متصلة', 'لا يمكن جلب التحذيرات حالياً')], ephemeral: true });
            }

            await interaction.deferReply();

            try {
                const warnings = await Warning.getUserWarnings(targetUser.id, interaction.guild.id);
                const warningCount = warnings.length;

                if (warningCount === 0) {
                    return interaction.editReply({ embeds: [createSuccessEmbed('✅ لا توجد تحذيرات', `**${targetUser.tag}** ليس لديه أي تحذيرات.`)] });
                }

                // عرض آخر 10 تحذيرات
                const recentWarnings = warnings.slice(0, 10);
                const warningsList = recentWarnings.map((w, i) => {
                    const date = new Date(w.timestamp || w.createdAt).toLocaleDateString('ar-EG');
                    return `**#${i + 1}** — ${date} | بواسطة: ${w.moderatorTag} | السبب: ${w.reason}`;
                }).join('\n');

                const guildConfig = await ServerConfig.get();
                const maxWarnings = guildConfig?.mod?.maxWarnings || 3;

                const embed = new EmbedBuilder()
                    .setColor('#FFA500')
                    .setTitle(`⚠️ تحذيرات ${targetUser.tag}`)
                    .setDescription(`**إجمالي التحذيرات:** ${warningCount}/${maxWarnings}`)
                    .addFields({ name: 'آخر التحذيرات', value: warningsList })
                    .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
                    .setFooter({ text: warningCount > 10 ? `عرض آخر 10 من ${warningCount} تحذير` : null })
                    .setTimestamp();

                return interaction.editReply({ embeds: [embed] });
            } catch (error) {
                logger.error('خطأ في جلب التحذيرات:', error);
                return interaction.editReply({ embeds: [createErrorEmbed('❌ خطأ', 'حدث خطأ أثناء جلب التحذيرات.')], ephemeral: true });
            }
        }

        if (subcommand === 'مسح_التحذيرات') {
            if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
                return interaction.reply({ embeds: [createErrorEmbed('❌ صلاحية مرفوضة', 'ليس لديك صلاحية لمسح التحذيرات')], ephemeral: true });
            }

            const targetUser = interaction.options.getUser('العضو');

            if (!isDatabaseConnected()) {
                return interaction.reply({ embeds: [createErrorEmbed('❌ قاعدة البيانات غير متصلة', 'لا يمكن مسح التحذيرات حالياً')], ephemeral: true });
            }

            await interaction.deferReply();

            try {
                const deletedCount = await Warning.clearWarnings(targetUser.id, interaction.guild.id);
                const embed = createSuccessEmbed('🗑️ تم مسح التحذيرات', `تم مسح **${deletedCount}** تحذير من **${targetUser.tag}**.`);
                return interaction.editReply({ embeds: [embed] });
            } catch (error) {
                logger.error('خطأ في مسح التحذيرات:', error);
                return interaction.editReply({ embeds: [createErrorEmbed('❌ خطأ', 'حدث خطأ أثناء مسح التحذيرات.')], ephemeral: true });
            }
        }

        if (subcommand === 'مسح') {
            const guildConfig = await ServerConfig.get();
            const isMemberStaff = isStaff(interaction.member, guildConfig);

            if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages) && !isMemberStaff) {
                return interaction.reply({ embeds: [createErrorEmbed('❌ صلاحية مرفوضة', 'ليس لديك صلاحية لمسح الرسائل')], ephemeral: true });
            }
            if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageMessages)) {
                return interaction.reply({ embeds: [createErrorEmbed('البوت يفتقر للصلاحيات', 'ليس لدي صلاحية لإدارة الرسائل')], ephemeral: true });
            }

            const amount = interaction.options.getInteger('العدد');
            const user = interaction.options.getUser('العضو');

            await interaction.deferReply({ ephemeral: true });

            const messages = await interaction.channel.messages.fetch({ limit: amount });

            let filteredMessages = messages;
            if (user) {
                filteredMessages = messages.filter(m => m.author.id === user.id);
            }

            const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
            const validMessages = filteredMessages.filter(m => m.createdTimestamp > twoWeeksAgo);

            if (validMessages.size === 0) {
                return interaction.editReply({ embeds: [createErrorEmbed('❌ لا توجد رسائل', 'لم يتم العثور على رسائل للحذف (قد تكون أقدم من 14 يوماً)')] });
            }

            await interaction.channel.bulkDelete(validMessages, true);

            const embed = createSuccessEmbed('🧹 تم مسح الرسائل', `تم حذف ${validMessages.size} رسائل${user ? ` من ${user.tag}` : ''}.`);
            const reply = await interaction.channel.send({ embeds: [embed] });

            setTimeout(() => {
                reply.delete().catch(() => {});
            }, 5000);
                return interaction.editReply({ content: 'تم!' });
        }

        if (subcommand === 'الغاء_الحظر') {
            const guildConfig = await ServerConfig.get();
            const isMemberStaff = isStaff(interaction.member, guildConfig);

            if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers) && !isMemberStaff) {
                return interaction.reply({ embeds: [createErrorEmbed('❌ صلاحية مرفوضة', 'ليس لديك صلاحية لإلغاء الحظر')], ephemeral: true });
            }
            if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.BanMembers)) {
                return interaction.reply({ embeds: [createErrorEmbed('البوت يفتقر للصلاحيات', 'ليس لدي صلاحية لإلغاء حظر الأعضاء')], ephemeral: true });
            }

            const userId = interaction.options.getString('المعرف');
            const reason = interaction.options.getString('السبب') || 'لم يتم تحديد سبب';

            try {
                const bans = await interaction.guild.bans.fetch();
                const isBanned = bans.has(userId);

                if (!isBanned) {
                    return interaction.reply({ embeds: [createErrorEmbed('❌ غير محظور', 'هذا المعرف غير محظور')], ephemeral: true });
                }

                await interaction.guild.bans.remove(userId, reason);
                const embed = createSuccessEmbed('✅ تم إلغاء حظر العضو', `تم إلغاء حظر المعرف \`${userId}\`.\n**السبب:** ${reason}`);
                const dummyUser = { tag: userId, id: userId };
                await sendModLog(interaction, '✅ إلغاء حظر', dummyUser, reason);
                return interaction.reply({ embeds: [embed] });
            } catch (error) {
                return interaction.reply({ embeds: [createErrorEmbed('❌ خطأ', 'لا يمكن إلغاء حظر هذا العضو. تأكد أن المعرف صحيح')], ephemeral: true });
            }
        }

        if (subcommand === 'حظر_مؤقت') {
            if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
                return interaction.reply({ embeds: [createErrorEmbed('❌ صلاحية مرفوضة', 'ليس لديك صلاحية لحظر الأعضاء')], ephemeral: true });
            }
            if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.BanMembers)) {
                return interaction.reply({ embeds: [createErrorEmbed('البوت يفتقر للصلاحيات', 'ليس لدي صلاحية لحظر الأعضاء')], ephemeral: true });
            }

            const targetUser = interaction.options.getUser('العضو');
            const durationStr = interaction.options.getString('المدة');
            const reason = interaction.options.getString('السبب') || 'لم يتم تحديد سبب';
            const durationMs = ms(durationStr);

            if (!durationMs) return interaction.reply({ embeds: [createErrorEmbed('❌ تنسيق غير صالح', 'يرجى تقديم مدة صالحة (مثال: 1h, 1d, 1w)')], ephemeral: true });

            const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
            if (targetMember) {
                if (!canModerate(interaction.guild.members.me, targetMember)) {
                    return interaction.reply({ embeds: [createErrorEmbed('❌ خطأ في التسلسل الهرمي', 'لا يمكنني حظر عضو لديه رول مساوٍ أو أعلى مني')], ephemeral: true });
                }
                if (!userCanModerate(interaction.member, targetMember)) {
                    return interaction.reply({ embeds: [createErrorEmbed('❌ خطأ في التسلسل الهرمي', 'لا يمكنك حظر عضو لديه رول مساوٍ أو أعلى منك')], ephemeral: true });
                }
            }

            try {
                await interaction.guild.members.ban(targetUser, { reason: `حظر مؤقت: ${reason} (المدة: ${durationStr})` });

                if (isDatabaseConnected()) {
                    await ModAction.addTempban(targetUser.id, interaction.guild.id, interaction.user.id, reason, durationMs);
                }

                const embed = createSuccessEmbed('⏱️ حظر مؤقت', `تم حظر **${targetUser.tag}** لمدة ${ms(durationMs, { long: true })}.\n**السبب:** ${reason}`);
                await sendModLog(interaction, `⏱️ حظر مؤقت (${ms(durationMs, { long: true })})`, targetUser, reason);
                return interaction.reply({ embeds: [embed] });
            } catch (error) {
                logger.error('خطأ في الحظر المؤقت:', error);
                return interaction.reply({ embeds: [createErrorEmbed('❌ خطأ', 'حدث خطأ أثناء تنفيذ الحظر المؤقت.')], ephemeral: true });
            }
        }

        if (subcommand === 'حظر_ناعم') {
            if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
                return interaction.reply({ embeds: [createErrorEmbed('❌ صلاحية مرفوضة', 'ليس لديك صلاحية لحظر الأعضاء')], ephemeral: true });
            }

            const targetUser = interaction.options.getUser('العضو');
            const reason = interaction.options.getString('السبب') || 'لم يتم تحديد سبب';

            try {
                await interaction.guild.members.ban(targetUser, { reason: `حظر ناعم: ${reason}`, deleteMessageSeconds: 7 * 24 * 60 * 60 });
                await interaction.guild.members.unban(targetUser, 'إكمال الحظر الناعم');

                const embed = createSuccessEmbed('🧼 حظر ناعم', `تم تنفيذ حظر ناعم لـ **${targetUser.tag}**.\n(تم حظره لمسح رسائله ثم إلغاء الحظر فوراً)`);
                await sendModLog(interaction, '🧼 حظر ناعم', targetUser, reason);
                return interaction.reply({ embeds: [embed] });
            } catch (error) {
                return interaction.reply({ embeds: [createErrorEmbed('❌ خطأ', 'حدث خطأ أثناء تنفيذ الحظر الناعم.')], ephemeral: true });
            }
        }

        if (subcommand === 'حظر_المعرف') {
            if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
                return interaction.reply({ embeds: [createErrorEmbed('❌ صلاحية مرفوضة', 'ليس لديك صلاحية لحظر الأعضاء')], ephemeral: true });
            }

            const userId = interaction.options.getString('المعرف');
            const reason = interaction.options.getString('السبب') || 'لم يتم تحديد سبب';

            try {
                await interaction.guild.members.ban(userId, { reason: `حظر معرف: ${reason}` });
                const embed = createSuccessEmbed('🆔 حظر معرف', `تم حظر المعرف \`${userId}\` بنجاح.\n**السبب:** ${reason}`);
                return interaction.reply({ embeds: [embed] });
            } catch (error) {
                return interaction.reply({ embeds: [createErrorEmbed('❌ خطأ', 'تأكد من أن المعرف صحيح وأن البوت لديه الصلاحيات.')], ephemeral: true });
            }
        }

        if (subcommand === 'بطيء') {
            if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
                return interaction.reply({ embeds: [createErrorEmbed('❌ صلاحية مرفوضة', 'ليس لديك صلاحية لإدارة القنوات')], ephemeral: true });
            }

            const seconds = interaction.options.getInteger('الثواني');
            await interaction.channel.setRateLimitPerUser(seconds);

            const embed = createSuccessEmbed('⏳ وضع بطيء', seconds === 0 ? 'تم تعطيل الوضع البطيء.' : `تم تعيين الوضع البطيء إلى ${seconds} ثانية.`);
            return interaction.reply({ embeds: [embed] });
        }

        if (subcommand === 'قفل') {
            if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
                return interaction.reply({ embeds: [createErrorEmbed('❌ صلاحية مرفوضة', 'ليس لديك صلاحية لإدارة القنوات')], ephemeral: true });
            }

            const reason = interaction.options.getString('السبب') || 'لم يتم تحديد سبب';

            try {
                await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: false });
                const embed = createSuccessEmbed('🔒 قفل القناة', `تم قفل القناة بنجاح.\n**السبب:** ${reason}`);
                return interaction.reply({ embeds: [embed] });
            } catch (error) {
                return interaction.reply({ embeds: [createErrorEmbed('❌ خطأ', 'حدث خطأ أثناء قفل القناة.')], ephemeral: true });
            }
        }

        if (subcommand === 'فتح') {
            if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
                return interaction.reply({ embeds: [createErrorEmbed('❌ صلاحية مرفوضة', 'ليس لديك صلاحية لإدارة القنوات')], ephemeral: true });
            }

            const reason = interaction.options.getString('السبب') || 'لم يتم تحديد سبب';

            try {
                await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: null });
                const embed = createSuccessEmbed('🔓 فتح القناة', `تم فتح القناة بنجاح.\n**السبب:** ${reason}`);
                return interaction.reply({ embeds: [embed] });
            } catch (error) {
                return interaction.reply({ embeds: [createErrorEmbed('❌ خطأ', 'حدث خطأ أثناء فتح القناة.')], ephemeral: true });
            }
        }

        if (subcommand === 'لقب') {
            if (!interaction.member.permissions.has(PermissionFlagsBits.ManageNicknames)) {
                return interaction.reply({ embeds: [createErrorEmbed('❌ صلاحية مرفوضة', 'ليس لديك صلاحية لتغيير ألقاب الأعضاء')], ephemeral: true });
            }

            const targetUser = interaction.options.getUser('العضو');
            const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
            const nickname = interaction.options.getString('اللقب');

            if (!targetMember) return interaction.reply({ embeds: [createErrorEmbed('❌ غير موجود', 'العضو غير موجود في السيرفر')], ephemeral: true });

            if (!canModerate(interaction.guild.members.me, targetMember)) {
                return interaction.reply({ embeds: [createErrorEmbed('❌ خطأ في التسلسل الهرمي', 'لا يمكنني تغيير لقب عضو لديه رول مساوٍ أو أعلى مني')], ephemeral: true });
            }

            await targetMember.setNickname(nickname, `بواسطة ${interaction.user.tag}`);

            const embed = createSuccessEmbed('📝 تم تغيير اللقب', `تم تغيير لقب **${targetUser.tag}** إلى **${nickname || 'الافتراضي'}**.`);
            return interaction.reply({ embeds: [embed] });
        }

        if (subcommand === 'الغاء_اسكات') {
            if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
                return interaction.reply({ embeds: [createErrorEmbed('❌ صلاحية مرفوضة', 'ليس لديك صلاحية لإلغاء إسكات الأعضاء')], ephemeral: true });
            }
            if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ModerateMembers)) {
                return interaction.reply({ embeds: [createErrorEmbed('البوت يفتقر للصلاحيات', 'ليس لدي صلاحية لإلغاء إسكات الأعضاء')], ephemeral: true });
            }

            const targetUser = interaction.options.getUser('العضو');
            const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
            const reason = interaction.options.getString('السبب') || 'لم يتم تحديد سبب';

            if (!targetMember) return interaction.reply({ embeds: [createErrorEmbed('❌ غير موجود', 'العضو غير موجود في السيرفر')], ephemeral: true });

            if (!targetMember.communicationDisabledUntilTimestamp) {
                return interaction.reply({ embeds: [createErrorEmbed('❌ غير مُسكَت', 'هذا العضو ليس لديه إسكات حالي')], ephemeral: true });
            }

            if (!canModerate(interaction.guild.members.me, targetMember)) {
                return interaction.reply({ embeds: [createErrorEmbed('❌ خطأ في التسلسل الهرمي', 'لا يمكنني إلغاء إسكات عضو لديه رول مساوٍ أو أعلى مني')], ephemeral: true });
            }

            await targetMember.timeout(null, reason);

            const embed = createSuccessEmbed('🔊 تم إلغاء الإسكات', `**${targetUser.tag}** تم إلغاء إسكاته.\n**السبب:** ${reason}`);
            return interaction.reply({ embeds: [embed] });
        }
    },
};
