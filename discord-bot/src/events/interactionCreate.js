/**
 * @file events/interactionCreate.js
 * @description معالج التفاعلات الرئيسي - يدعم أوامر Slash، الأزرار، والقوائم
 */

const { Events, EmbedBuilder, ComponentType } = require('discord.js');
const ServerConfig = require('../database/schemas/serverConfigSchema');
const {
    handleMusicInteraction,
    handleVolumeSelect,
    handleFilterSelect,
    handleGameInteraction,
    handleDiceSelect,
    handleMenuInteraction,
    createMusicControlPanel,
} = require('../utils/controlPanels');
const { handleTicketOpen, handleTicketClose } = require('../utils/ticketHelper');
const { config } = require('../config');
const { getGuildSettings } = require('../utils/cache');
const logger = require('../utils/logger');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {
        // ─── بوابة الأمان (Security Gate) ───
        if (!interaction.guild || interaction.guild.id !== config.mainGuildId) {
            if (interaction.isChatInputCommand() || interaction.isButton() || interaction.isStringSelectMenu()) {
                await interaction.reply({ content: 'This bot is restricted to a specific server.', ephemeral: true });
            }
            return;
        }
        // ─── حارس الـ DM: لا نعالج التفاعلات خارج السيرفرات ───
        if (!interaction.guild) return;

        // ═══════════════════════════════════════════════════════════════
        // 🎯 معالجة أوامر Slash
        // ═══════════════════════════════════════════════════════════════
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);

            if (!command) {
                logger.error(`لم يتم العثور على الأمر المطابق لـ ${interaction.commandName}.`);
                return;
            }

            try {
                await command.execute(interaction, client);
            } catch (error) {
                logger.error(`خطأ أثناء تنفيذ الأمر ${interaction.commandName}:`, error);

                const errorEmbed = new EmbedBuilder()
                    .setColor('Red')
                    .setTitle('❌ حدث خطأ!')
                    .setDescription('حدث خطأ غير متوقع أثناء تنفيذ هذا الأمر. تم إبلاغ المطورين.');

                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
                } else {
                    await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                }
            }
            return;
        }

        // ═══════════════════════════════════════════════════════════════
        // 🔍 معالجة الاكمال التلقائي (Autocomplete)
        // ═══════════════════════════════════════════════════════════════
        if (interaction.isAutocomplete()) {
            const command = client.commands.get(interaction.commandName);

            if (!command) return;

            try {
                await command.autocomplete(interaction);
            } catch (error) {
                logger.error(`خطأ أثناء تنفيذ الاكمال التلقائي للأمر ${interaction.commandName}:`, error);
            }
            return;
        }

        // ═══════════════════════════════════════════════════════════════
        // 🎫 معالجة أزرار التذاكر
        // ═══════════════════════════════════════════════════════════════
        if (interaction.isButton() && interaction.customId === 'ticket_open') {
            await handleTicketOpen(interaction);
            return;
        }

        if (interaction.isButton() && interaction.customId === 'ticket_close') {
            await handleTicketClose(interaction);
            return;
        }

        // ─── معالجة زر التحقق (Verification) ───
        if (interaction.isButton() && interaction.customId === 'verify_member') {
            if (!interaction.guild) return interaction.reply({ content: '❌ هذا الإجراء لا يمكن تنفيذه في الرسائل الخاصة.', ephemeral: true });
            const guildConfig = await ServerConfig.get();
            const verifyData = guildConfig?.protection?.verification;

            if (!verifyData?.enabled || !verifyData.roleId) {
                return interaction.reply({ content: '❌ نظام التحقق غير مفعّل أو غير مضبوط بشكل صحيح.', ephemeral: true });
            }

            const role = interaction.guild.roles.cache.get(verifyData.roleId);
            if (!role) return interaction.reply({ content: '❌ لم يتم العثور على رتبة التحقق. يرجى التواصل مع الإدارة.', ephemeral: true });

            try {
                if (interaction.member.roles.cache.has(verifyData.roleId)) {
                    return interaction.reply({ content: '✅ أنت مفعّل بالفعل في السيرفر.', ephemeral: true });
                }

                await interaction.member.roles.add(role);
                return interaction.reply({ content: `✅ تم التحقق بنجاح! لقد حصلت على رتبة **${role.name}**. مرحباً بك!`, ephemeral: true });
            } catch (err) {
                logger.error('Error in verification:', err);
                return interaction.reply({ content: '❌ فشل في إضافة الرتبة. تأكد من صلاحيات البوت.', ephemeral: true });
            }
        }

        // ─── معالجة أزرار الرتب بالتفاعل (Reaction Roles) ───
        if (interaction.isButton() && interaction.customId.startsWith('rr_')) {
            const roleId = interaction.customId.split('_')[1];
            const role = interaction.guild.roles.cache.get(roleId);
            if (!role) return interaction.reply({ content: '❌ لم يتم العثور على الرتبة.', ephemeral: true });

            try {
                if (interaction.member.roles.cache.has(roleId)) {
                    await interaction.member.roles.remove(roleId);
                    return interaction.reply({ content: `✅ تم إزالة رتبة **${role.name}** منك.`, ephemeral: true });
                } else {
                    await interaction.member.roles.add(roleId);
                    return interaction.reply({ content: `✅ تم منحك رتبة **${role.name}**.`, ephemeral: true });
                }
            } catch (err) {
                logger.error('Error in interaction reaction role:', err);
                return interaction.reply({ content: '❌ فشل في تعديل الرتبة. تأكد من صلاحيات البوت وموقع الرتبة.', ephemeral: true });
            }
        }

        // ═══════════════════════════════════════════════════════════════
        // 🛠️ معالجة أزرار مركز الخدمات (Services Center)
        // ═══════════════════════════════════════════════════════════════
        if (interaction.isButton() && interaction.customId.startsWith('svc_')) {
            const serviceId = interaction.customId.replace('svc_', '');
            let embed = new EmbedBuilder().setColor('#5865F2');

            switch (serviceId) {
                case 'tickets':
                    embed.setTitle('🎟️ نظام التذاكر المتطور')
                        .setDescription('نظام تذاكر احترافي يسمح للأعضاء بفتح تذاكر دعم فني.\n\n**الميزات:**\n- لوحة تحكم إدارية كاملة.\n- سجلات محادثات (Transcripts).\n- إغلاق التذاكر بضغطة زر.\n- تخصيص كامل للرسائل والأقسام.');
                    break;
                case 'security':
                    embed.setTitle('🛡️ نظام الحماية (Anti-Nuke)')
                        .setDescription('نظام حماية شامل لسيرفرك من أي عمليات تخريب متعمدة.\n\n**الميزات:**\n- منع حذف الرتب أو القنوات الجماعي.\n- حظر أو تقييد المشرفين المخربين تلقائياً.\n- حماية من الـ Spam والـ Mention.\n- مراقبة سجلات الـ Audit Logs بشكل فوري.');
                    break;
                case 'ai':
                    embed.setTitle('🤖 نظام الذكاء الاصطناعي')
                        .setDescription('بوت ذكي مدعوم بتقنيات Google Gemini للدردشة والمساعدة.\n\n**الميزات:**\n- محادثات طبيعية وذكية.\n- فهم السياق واللغة العربية بطلاقة.\n- مساعدة في حل المشاكل التقنية أو البرمجية.\n- تحديثات مستمرة لزيادة الذكاء.');
                    break;
                default:
                    return interaction.reply({ content: '❌ خدمة غير معروفة.', ephemeral: true });
            }

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // ═══════════════════════════════════════════════════════════════
        // ⚡ زر لوحة التحكم السريع (بعد التشغيل)
        // ═══════════════════════════════════════════════════════════════
        if (interaction.isButton() && interaction.customId.startsWith('quickpanel_')) {
            const actionUserId = interaction.customId.split('_')[1];

            if (interaction.user.id !== actionUserId) {
                return interaction.reply({ content: '⚠️ هذه اللوحة خاصة بشخص آخر!', ephemeral: true });
            }

            const queue = client.distube.getQueue(interaction.guild);
            if (!queue || !queue.songs.length) {
                return interaction.reply({ content: '❌ لا توجد موسيقى تعمل حالياً!', ephemeral: true });
            }

            const panel = createMusicControlPanel(queue, queue.songs[0], actionUserId);
            await interaction.reply({ ...panel, ephemeral: true });
            return;
        }

        // ═══════════════════════════════════════════════════════════════
        // 📚 تفاعلات المساعدة
        // ═══════════════════════════════════════════════════════════════
        if (interaction.isButton() && interaction.customId.startsWith('help_')) {
            const helpCommand = require('../commands/help');
            if (helpCommand.handleHelpInteraction) {
                await helpCommand.handleHelpInteraction(interaction, client);
            }
            return;
        }

        // ═══════════════════════════════════════════════════════════════
        // 🎵 معالجة أزرار الموسيقى
        // ═══════════════════════════════════════════════════════════════
        if (interaction.isButton() && interaction.customId.startsWith('music_')) {
            await handleMusicInteraction(interaction, client);
            return;
        }

        // ═══════════════════════════════════════════════════════════════
        // 🎮 معالجة أزرار الألعاب
        // ═══════════════════════════════════════════════════════════════
        if (interaction.isButton() && interaction.customId.startsWith('game_')) {
            await handleGameInteraction(interaction, client);
            return;
        }

        // ═══════════════════════════════════════════════════════════════
        // 📋 معالجة أزرار القائمة الرئيسية
        // ═══════════════════════════════════════════════════════════════
        if (interaction.isButton() && interaction.customId.startsWith('menu_')) {
            await handleMenuInteraction(interaction, client);
            return;
        }

        // ═══════════════════════════════════════════════════════════════
        // 🔊 معالجة قائمة الصوت
        // ═══════════════════════════════════════════════════════════════
        if (interaction.isStringSelectMenu() && interaction.customId.includes('_volume')) {
            await handleVolumeSelect(interaction, client);
            return;
        }

        // ═══════════════════════════════════════════════════════════════
        // 🎛️ معالجة قائمة الفلاتر
        // ═══════════════════════════════════════════════════════════════
        if (interaction.isStringSelectMenu() && interaction.customId.includes('_filter')) {
            await handleFilterSelect(interaction, client);
            return;
        }

        // ═══════════════════════════════════════════════════════════════
        // 🎲 معالجة قائمة النرد
        // ═══════════════════════════════════════════════════════════════
        if (interaction.isStringSelectMenu() && interaction.customId.includes('_dice')) {
            await handleDiceSelect(interaction, client);
            return;
        }

        // ═══════════════════════════════════════════════════════════════
        // 🔍 معالجة قائمة البحث (اختيار أغنية)
        // ═══════════════════════════════════════════════════════════════
        if (interaction.isStringSelectMenu() && interaction.customId.startsWith('search_') && interaction.customId.endsWith('_select')) {
            const parts = interaction.customId.split('_');
            const actionUserId = parts[1];

            if (interaction.user.id !== actionUserId) {
                return interaction.reply({ content: '⚠️ هذه اللوحة خاصة بشخص آخر!', ephemeral: true });
            }

            const selectedIndex = parseInt(interaction.values[0], 10);
            const results = client.searchResults?.get(actionUserId);

            if (!results || !results[selectedIndex]) {
                return interaction.update({
                    content: '❌ انتهت صلاحية نتائج البحث. حاول البحث مرة أخرى.',
                    embeds: [],
                    components: [],
                });
            }

            const song = results[selectedIndex];
            const voiceChannel = interaction.member.voice.channel;

            if (!voiceChannel) {
                return interaction.reply({ content: '❌ يجب أن تكون في قناة صوتية!', ephemeral: true });
            }

            try {
                await interaction.update({
                    embeds: [new EmbedBuilder()
                        .setColor('Green')
                        .setTitle('🎵 جاري التشغيل')
                        .setDescription(`**${song.title}**`)],
                    components: [],
                });

                await client.distube.play(voiceChannel, song.url, {
                    textChannel: interaction.channel,
                    member: interaction.member,
                });

                client.searchResults?.delete(actionUserId);
            } catch (error) {
                logger.error('خطأ في تشغيل الأغنية المختارة:', error);
                await interaction.reply({ content: '❌ حدث خطأ أثناء تشغيل الأغنية!', ephemeral: true });
            }
            return;
        }

        // ═══════════════════════════════════════════════════════════════
        // 🎁 معالجة زر المشاركة في السحب
        // ═══════════════════════════════════════════════════════════════
        if (interaction.isButton() && interaction.customId.startsWith('giveaway_join_')) {
            const messageId = interaction.customId.replace('giveaway_join_', '');
            const giveawayCommand = require('../commands/giveaway');
            if (giveawayCommand.handleJoinButton) {
                await giveawayCommand.handleJoinButton(interaction, messageId, client);
            }
            return;
        }

        // ═══════════════════════════════════════════════════════════════
        // 🔍 معالجة زر إلغاء البحث
        // ═══════════════════════════════════════════════════════════════
        if (interaction.isButton() && interaction.customId.startsWith('search_') && interaction.customId.endsWith('_cancel')) {
            const parts = interaction.customId.split('_');
            const actionUserId = parts[1];

            if (interaction.user.id !== actionUserId) {
                return interaction.reply({ content: '⚠️ هذه اللوحة خاصة بشخص آخر!', ephemeral: true });
            }

            client.searchResults?.delete(actionUserId);
            await interaction.update({ content: '❌ تم إلغاء البحث.', embeds: [], components: [] });
            return;
        }
    },
};
