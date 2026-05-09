/**
 * @file commands/backup.js
 * @description نظام النسخ الاحتياطي (Server Backup) - إنشاء واستعادة نسخ السيرفر.
 */

const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const { createSuccessEmbed, createErrorEmbed, createInfoEmbed } = require('../utils/embeds');
const { createBackup, loadBackup } = require('../utils/backupHelper');
const Backup = require('../database/schemas/backupSchema');
const logger = require('../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('نسخ_احتياطي')
        .setDescription('نظام حماية ونسخ السيرفر')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(sub =>
            sub.setName('انشاء')
                .setDescription('إنشاء نسخة احتياطية جديدة للسيرفر')
        )
        .addSubcommand(sub =>
            sub.setName('استعادة')
                .setDescription('استعادة السيرفر من نسخة سابقة (تحذير: سيتم مسح القنوات الحالية!)')
                .addStringOption(opt => opt.setName('المعرف').setDescription('معرف النسخة الاحتياطية').setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName('قائمة')
                .setDescription('عرض قائمة النسخ الاحتياطية الخاصة بك')
        ),

    async execute(interaction) {
        // التحقق من أن المستخدم هو صاحب السيرفر (لأمان أعلى)
        if (interaction.user.id !== interaction.guild.ownerId) {
            return interaction.reply({ embeds: [createErrorEmbed('❌ صلاحية مرفوضة', 'هذا الأمر متاح فقط لصاحب السيرفر (Owner).')], ephemeral: true });
        }

        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'انشاء') {
            await interaction.deferReply({ ephemeral: true });
            try {
                const backup = await createBackup(interaction.guild, interaction.user.id);
                const embed = createSuccessEmbed('📦 تم إنشاء النسخة الاحتياطية', `تم حفظ حالة السيرفر بنجاح!\n**المعرف:** \`${backup.backupId}\`\nيرجى الاحتفاظ بهذا المعرف لاستخدامه عند الاستعادة.`);
                return interaction.editReply({ embeds: [embed] });
            } catch (error) {
                logger.error('Error creating backup:', error);
                return interaction.editReply({ embeds: [createErrorEmbed('❌ خطأ', 'حدث خطأ أثناء إنشاء النسخة الاحتياطية.')] });
            }
        }

        if (subcommand === 'استعادة') {
            const backupId = interaction.options.getString('المعرف');
            const backup = await Backup.findOne({ backupId });

            if (!backup) {
                return interaction.reply({ embeds: [createErrorEmbed('❌ خطأ', 'المعرف غير صحيح أو النسخة غير موجودة.')], ephemeral: true });
            }

            const confirmEmbed = createInfoEmbed('⚠️ تأكيد الاستعادة', `هل أنت متأكد من استعادة النسخة الاحتياطية \`${backupId}\`؟\n\n**تحذير:** سيتم حذف كافة القنوات والرتب الحالية واستبدالها بالنسخة الاحتياطية. لا يمكن التراجع عن هذه العملية.`);
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('confirm_restore')
                        .setLabel('تأكيد الاستعادة')
                        .setStyle(ButtonStyle.Danger),
                    new ButtonBuilder()
                        .setCustomId('cancel_restore')
                        .setLabel('إلغاء')
                        .setStyle(ButtonStyle.Secondary)
                );

            const response = await interaction.reply({ 
                embeds: [confirmEmbed], 
                components: [row],
                ephemeral: true 
            });

            const collector = response.createMessageComponentCollector({ 
                componentType: ComponentType.Button, 
                time: 30000 
            });

            collector.on('collect', async (i) => {
                if (i.customId === 'cancel_restore') {
                    await i.update({ content: '❌ تم إلغاء عملية الاستعادة.', embeds: [], components: [] });
                    return collector.stop();
                }

                if (i.customId === 'confirm_restore') {
                    await i.update({ 
                        content: '⏳ جاري البدء في استعادة النسخة الاحتياطية... يرجى الانتظار.', 
                        embeds: [], 
                        components: [] 
                    });

                    try {
                        await loadBackup(interaction.guild, backupId);
                        logger.info(`✅ Backup restored successfully for guild: ${interaction.guild.name} (${interaction.guild.id})`);
                    } catch (error) {
                        logger.error('Error loading backup:', error);
                        await i.followUp({ embeds: [createErrorEmbed('❌ خطأ', 'حدث خطأ أثناء عملية الاستعادة.')], ephemeral: true }).catch(() => {});
                    }
                    return collector.stop();
                }
            });

            collector.on('end', async (collected, reason) => {
                if (reason === 'time') {
                    await interaction.editReply({ content: '⏰ انتهى وقت التأكيد. تم إلغاء العملية.', embeds: [], components: [] }).catch(() => {});
                }
            });
        }

        if (subcommand === 'قائمة') {
            const backups = await Backup.find({ guildId: interaction.guild.id }).sort({ createdAt: -1 }).limit(10);
            
            if (backups.length === 0) {
                return interaction.reply({ embeds: [createInfoEmbed('📦 النسخ الاحتياطية', 'لا توجد نسخ احتياطية مسجلة لهذا السيرفر.')], ephemeral: true });
            }

            const embed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle('📋 قائمة النسخ الاحتياطية')
                .setDescription('إليك آخر 10 نسخ تم إنشاؤها لهذا السيرفر:')
                .setTimestamp();

            backups.forEach(b => {
                embed.addFields({
                    name: `🆔 ${b.backupId}`,
                    value: `📅 **التاريخ:** <t:${Math.floor(b.createdAt.getTime() / 1000)}:R>\n👤 **المنشئ:** <@${b.creatorId}>`,
                    inline: true
                });
            });

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
    },
};
