/**
 * @file commands/economy.js
 * @description أوامر السلاش للاقتصاد المتقدم تشمل:
 * رصيد، مكافأة يومية، عمل، تحويل، سرقة، المتصدرون،
 * إيداع، سحب، متجر، شراء، ممتلكاتي.
 */

const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { randomInt } = require('node:crypto');
const User = require('../database/schemas/userSchema');
const ServerConfig = require('../database/schemas/serverConfigSchema');
const { isDatabaseConnected } = require('../database/connect');
const { createErrorEmbed, createSuccessEmbed, createInfoEmbed } = require('../utils/embeds');
const { generateRankCard, generateProfileCard } = require('../utils/canvasHelper');
const logger = require('../utils/logger');
const {
    checkDailyCooldown,
    calculateDailyReward,
    checkWorkCooldown,
    calculateWorkReward,
    validateTransfer,
    checkRobCooldown,
    processRob,
} = require('../services/economyService');

/**
 * عناصر المتجر المتاحة للشراء
 * @type {Array<{id: string, name: string, price: number, emoji: string, description: string, role?: boolean}>}
 */
const SHOP_ITEMS = [
    { id: 'vip', name: 'VIP', price: 5000, emoji: '👑', description: 'رتبة VIP مميزة' },
    { id: 'premium', name: 'بريميوم', price: 10000, emoji: '💎', description: 'رتبة بريميوم فاخرة' },
    { id: 'noble', name: 'نوبل', price: 20000, emoji: '🏆', description: 'رتبة نوبل راقية' },
    { id: 'legend', name: 'أسطوري', price: 50000, emoji: '🌟', description: 'رتبة أسطورية نادرة' },
    { id: 'fishing_rod', name: 'صيدلة', price: 500, emoji: '🎣', description: 'عصا صيد لصيد الأسماك' },
    { id: 'hunting_gun', name: 'بندقية صيد', price: 2000, emoji: '🔫', description: 'بندقية لصيد الحيوانات' },
    { id: 'laptop', name: 'حاسوب محمول', price: 3000, emoji: '💻', description: 'حاسوب للعمل من المنزل' },
    { id: 'phone', name: 'هاتف ذكي', price: 1500, emoji: '📱', description: 'هاتف ذكي جديد' },
    { id: 'car', name: 'سيارة', price: 15000, emoji: '🚗', description: 'سيارة فاخرة' },
    { id: 'house', name: 'منزل', price: 100000, emoji: '🏠', description: 'منزل أحلامك' },
    { id: 'sword', name: 'سيف', price: 3000, emoji: '⚔️', description: 'سيف قوي للمعارك' },
    { id: 'shield', name: 'درع', price: 2500, emoji: '🛡️', description: 'درع للحماية من السرقة' },
];

/**
 * جلب قائمة المتجر من قاعدة البيانات أو العودة للقيم الافتراضية
 * @param {string} guildId 
 * @returns {Promise<Array>}
 */
async function getShopItems(guildId) {
    if (!isDatabaseConnected()) return SHOP_ITEMS;
    try {
        const guild = await ServerConfig.get();
        if (guild?.economy?.shopItems?.length > 0) {
            return guild.economy.shopItems;
        }
    } catch (e) {
        logger.error('Error fetching shop items:', e);
    }
    return SHOP_ITEMS;
}

/**
 * @module commands/economy
 * @description أوامر الاقتصاد لإدارة العملات الافتراضية مع نظام بنك ومتجر ومخزون.
 */
module.exports = {
    /** @type {SlashCommandBuilder} تعريف أمر السلاش */
    data: new SlashCommandBuilder()
        .setName('اقتصاد')
        .setDescription('أوامر الاقتصاد المتقدمة')
        // ─── رصيد ───
        .addSubcommand(subcommand =>
            subcommand
                .setName('رصيد')
                .setDescription('عرض رصيدك أو رصيد عضو آخر')
                .addUserOption(option => option.setName('العضو').setDescription('العضو لعرض رصيده').setRequired(false))
        )
        // ─── مكافأة يومية ───
        .addSubcommand(subcommand => subcommand.setName('يومي').setDescription('ادعِ مكافأتك اليومية'))
        // ─── عمل ───
        .addSubcommand(subcommand => subcommand.setName('عمل').setDescription('اعمل لكسب العملات'))
        // ─── تحويل ───
        .addSubcommand(subcommand =>
            subcommand
                .setName('تحويل')
                .setDescription('حوّل عملات لعضو آخر')
                .addUserOption(option => option.setName('العضو').setDescription('العضو لتحويل الأموال إليه').setRequired(true))
                .addIntegerOption(option => option.setName('المبلغ').setDescription('المبلغ المراد تحويله').setRequired(true).setMinValue(1))
        )
        // ─── سرقة ───
        .addSubcommand(subcommand =>
            subcommand
                .setName('سرقة')
                .setDescription('حاول سرقة عضو آخر')
                .addUserOption(option => option.setName('العضو').setDescription('العضو المراد سرقته').setRequired(true))
        )
        // ─── المتصدرون ───
        .addSubcommand(subcommand => subcommand.setName('المتصدرون').setDescription('عرض لوحة المتصدرين'))
        // ─── إيداع ───
        .addSubcommand(subcommand =>
            subcommand
                .setName('ايداع')
                .setDescription('إيداع أموال من محفظتك إلى البنك')
                .addIntegerOption(option => option.setName('المبلغ').setDescription('المبلغ المراد إيداعه (اكتب "الكل" لإيداع كل شيء)').setRequired(true).setMinValue(1))
        )
        // ─── سحب ───
        .addSubcommand(subcommand =>
            subcommand
                .setName('سحب')
                .setDescription('سحب أموال من البنك إلى محفظتك')
                .addIntegerOption(option => option.setName('المبلغ').setDescription('المبلغ المراد سحبه').setRequired(true).setMinValue(1))
        )
        // ─── متجر ───
        .addSubcommand(subcommand => subcommand.setName('متجر').setDescription('عرض المتجر والعناصر المتاحة'))
        // ─── شراء ───
        .addSubcommand(subcommand =>
            subcommand
                .setName('شراء')
                .setDescription('شراء عنصر من المتجر')
                .addStringOption(option =>
                    option.setName('العنصر')
                        .setDescription('اسم العنصر المراد شراؤه')
                        .setRequired(true)
                        .setAutocomplete(true)
                )
        )
        // ─── ممتلكاتي ───
        .addSubcommand(subcommand => subcommand.setName('ممتلكاتي').setDescription('عرض مخزونك والعناصر المملوكة'))
        // ─── رتبة ───
        .addSubcommand(subcommand =>
            subcommand
                .setName('رتبة')
                .setDescription('عرض بطاقة الرتبة الخاصة بك أو لعضو آخر')
                .addUserOption(option => option.setName('العضو').setDescription('العضو لعرض رتبته').setRequired(false))
        )
        // ─── ملف ───
        .addSubcommand(subcommand =>
            subcommand
                .setName('ملف')
                .setDescription('عرض ملفك الشخصي المطور (البطاقة الذكية)')
                .addUserOption(option => option.setName('العضو').setDescription('العضو لعرض ملفه').setRequired(false))
        ),

    /**
     * معالج الاكمال التلقائي (Autocomplete)
     */
    async autocomplete(interaction) {
        const focusedValue = interaction.options.getFocused();
        const guildId = interaction.guild.id;
        const guildShopItems = await getShopItems(guildId);

        const filtered = guildShopItems.filter(item => 
            item.name.toLowerCase().includes(focusedValue.toLowerCase()) || 
            item.id.toLowerCase().includes(focusedValue.toLowerCase())
        );

        await interaction.respond(
            filtered.slice(0, 25).map(item => ({ 
                name: `${item.emoji || '📦'} ${item.name} - ${item.price.toLocaleString()} عملة`, 
                value: item.id 
            }))
        );
    },

    /**
     * ينفذ أمر الاقتصاد بناءً على الأمر الفرعي المختار.
     * @async
     * @param {import('discord.js').ChatInputCommandInteraction} interaction - نسخة التفاعل.
     * @param {import('discord.js').Client} client - نسخة العميل.
     * @returns {Promise<void>}
     */
    async execute(interaction, client) {
        if (!isDatabaseConnected()) {
            return interaction.reply({ embeds: [createErrorEmbed('❌ قاعدة البيانات غير متصلة', 'أوامر الاقتصاد معطلة حالياً لأن قاعدة البيانات غير متصلة.')], ephemeral: true });
        }

        const subcommand = interaction.options.getSubcommand();
        const guildId = interaction.guild.id;
        const userId = interaction.user.id;

        // التأكد من وجود المستخدم في قاعدة البيانات
        let userData = await User.findOne({ userId, guildId });
        if (!userData) {
            userData = await User.create({ userId, guildId });
        }

        // ─── رصيد ───
        if (subcommand === 'رصيد') {
            const targetUser = interaction.options.getUser('العضو') || interaction.user;
            let targetData = targetUser.id === userId ? userData : await User.findOne({ userId: targetUser.id, guildId });

            if (!targetData && targetUser.id !== userId) {
                targetData = await User.create({ userId: targetUser.id, guildId });
            }

            const totalWealth = targetData.balance + targetData.bank;
            const xpForNextLevel = targetData.level * 100;
            const xpProgress = Math.min((targetData.xp / xpForNextLevel) * 100, 100).toFixed(1);
            const xpBar = buildProgressBar(parseFloat(xpProgress), 20);

            const embed = new EmbedBuilder()
                .setColor('#FFD700')
                .setAuthor({ name: `💰 رصيد ${targetUser.username}`, iconURL: targetUser.displayAvatarURL() })
                .addFields(
                    { name: '💰 المحفظة', value: `🪙 ${targetData.balance.toLocaleString()} عملة`, inline: true },
                    { name: '🏦 البنك', value: `🏦 ${targetData.bank.toLocaleString()} عملة`, inline: true },
                    { name: '💎 إجمالي الثروة', value: `💎 ${totalWealth.toLocaleString()} عملة`, inline: true },
                    { name: '⭐ المستوى', value: `المستوى **${targetData.level}**`, inline: true },
                    { name: '📊 الخبرة', value: `${xpBar} ${targetData.xp}/${xpForNextLevel} XP`, inline: true },
                    { name: '💬 الرسائل', value: `${targetData.totalMessages} رسالة`, inline: true }
                )
                .setFooter({ text: `🔥 سلسلة المكافأة اليومية: ${targetData.streak} يوم` });

            return interaction.reply({ embeds: [embed] });
        }

        // ─── مكافأة يومية ───
        if (subcommand === 'يومي') {
            const { canClaim, remaining } = checkDailyCooldown(userData.dailyCooldown);

            if (!canClaim) {
                const hours = Math.floor(remaining / (1000 * 60 * 60));
                const mins = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
                return interaction.reply({ embeds: [createErrorEmbed('⏰ وقت الانتظار', `لقد حصلت بالفعل على مكافأتك اليومية. حاول مرة أخرى بعد ${hours}س ${mins}د.`)], ephemeral: true });
            }

            const { baseAmount, streakBonus, total, newStreak } = calculateDailyReward(userData.streak, userData.dailyCooldown);

            userData.balance += total;
            userData.streak = newStreak;
            userData.dailyCooldown = new Date();
            await userData.save();

            const embed = createSuccessEmbed('🎁 المكافأة اليومية', `حصلت على 🪙 **${baseAmount.toLocaleString()}** عملة!`)
                .addFields(
                    { name: '🔥 مكافأة السلسلة', value: `+ 🪙 **${streakBonus.toLocaleString()}** (${userData.streak} أيام متتالية)`, inline: true },
                    { name: '💰 الإجمالي', value: `🪙 **${total.toLocaleString()}** عملة`, inline: true }
                );

            return interaction.reply({ embeds: [embed] });
        }

        // ─── عمل ───
        if (subcommand === 'عمل') {
            const { canWork, remaining } = checkWorkCooldown(userData.workCooldown);

            if (!canWork) {
                const mins = Math.floor(remaining / (1000 * 60));
                const secs = Math.floor((remaining % (1000 * 60)) / 1000);
                return interaction.reply({ embeds: [createErrorEmbed('⏰ وقت الانتظار', `تحتاج للراحة. حاول العمل مرة أخرى بعد ${mins}د ${secs}ث.`)], ephemeral: true });
            }

            const { job, earned } = calculateWorkReward();

            userData.balance += earned;
            userData.workCooldown = new Date();
            await userData.save();

            return interaction.reply({ embeds: [createSuccessEmbed('💼 تم إنجاز العمل', `عملت كـ ${job.emoji} **${job.name}** وكسبت 🪙 **${earned.toLocaleString()}** عملة.`)] });
        }

        // ─── تحويل ───
        if (subcommand === 'تحويل') {
            const targetUser = interaction.options.getUser('العضو');
            const amount = interaction.options.getInteger('المبلغ');

            if (targetUser.id === userId) {
                return interaction.reply({ embeds: [createErrorEmbed('❌ غير صالح', 'لا يمكنك تحويل أموال لنفسك!')], ephemeral: true });
            }

            const { success, error } = validateTransfer(userData.balance, amount);
            if (!success) {
                if (error === 'INSUFFICIENT_FUNDS') {
                    return interaction.reply({ embeds: [createErrorEmbed('❌ رصيد غير كافٍ', `ليس لديك عملات كافية في محفظتك. رصيدك: 🪙 ${userData.balance.toLocaleString()}`)], ephemeral: true });
                }
                return interaction.reply({ embeds: [createErrorEmbed('❌ غير صالح', 'المبلغ غير صحيح.')], ephemeral: true });
            }

            let targetData = await User.findOne({ userId: targetUser.id, guildId });
            if (!targetData) targetData = await User.create({ userId: targetUser.id, guildId });

            // Use atomic operations to prevent race conditions
            const senderResult = await User.findOneAndUpdate(
                { userId, guildId, balance: { $gte: amount } },
                { $inc: { balance: -amount } },
                { new: true }
            );

            if (!senderResult) {
                return interaction.reply({ embeds: [createErrorEmbed('❌ رصيد غير كافٍ', 'ليس لديك عملات كافية في محفظتك.')], ephemeral: true });
            }

            await User.findOneAndUpdate(
                { userId: targetUser.id, guildId },
                { $inc: { balance: amount } },
                { new: true, upsert: true }
            );

            const newBalance = senderResult.balance;

            // إرسال رسالة خاصة للمستلم
            try {
                const dmEmbed = createSuccessEmbed('💰 تم استلام تحويل', `استلمت 🪙 **${amount.toLocaleString()}** عملة من ${interaction.user.tag} في ${interaction.guild.name}.`);
                await targetUser.send({ embeds: [dmEmbed] });
            } catch (e) {
                // المستلم قد يكون قد أغلق الرسائل الخاصة
            }

            return interaction.reply({ embeds: [createSuccessEmbed('✅ تم إرسال التحويل', `تم إرسال 🪙 **${amount.toLocaleString()}** عملة إلى ${targetUser.tag}.\nرصيدك الحالي: 🪙 ${newBalance.toLocaleString()}`)] });
        }

        // ─── سرقة ───
        if (subcommand === 'سرقة') {
            const targetUser = interaction.options.getUser('العضو');

            if (targetUser.id === userId) return interaction.reply({ embeds: [createErrorEmbed('❌ غير صالح', 'لا يمكنك سرقة نفسك!')], ephemeral: true });
            if (targetUser.bot) return interaction.reply({ embeds: [createErrorEmbed('❌ غير صالح', 'لا يمكنك سرقة البوتات!')], ephemeral: true });

            const { canRob, remaining } = checkRobCooldown(userData.robCooldown);

            if (!canRob) {
                const mins = Math.floor(remaining / (1000 * 60));
                return interaction.reply({ embeds: [createErrorEmbed('⏰ وقت الانتظار', `الشرطة لا تزال تبحث عنك. حاول مرة أخرى بعد ${mins}د.`)], ephemeral: true });
            }

            let targetData = await User.findOne({ userId: targetUser.id, guildId });
            if (!targetData) targetData = await User.create({ userId: targetUser.id, guildId });

            const hasShield = targetData.inventory.some(item => item.itemId === 'shield');
            const result = processRob(targetData.balance, hasShield);

            userData.robCooldown = new Date();

            if (!result.success) {
                if (result.error === 'TARGET_TOO_POOR') {
                    return interaction.reply({ embeds: [createErrorEmbed('❌ هدف فقير', 'هذا العضو ليس لديه عملات كافية لسرقته.')], ephemeral: true });
                }
                if (result.error === 'TARGET_HAS_SHIELD') {
                    await userData.save();
                    return interaction.reply({ embeds: [createErrorEmbed('🛡️ درع الحماية', `${targetUser.tag} يمتلك درع حماية! فشلت محاولة السرقة.`)] });
                }
                if (result.caught) {
                    userData.balance = Math.max(0, userData.balance - result.fine);
                    await userData.save();
                    return interaction.reply({ embeds: [createErrorEmbed('🚔 فشلت السرقة', `تم القبض عليك! دفعت غرامة بقيمة 🪙 **${result.fine.toLocaleString()}** عملة.`)] });
                }
            }

            // Use atomic operations to prevent race conditions
            const robSenderResult = await User.findOneAndUpdate(
                { userId, guildId },
                { $inc: { balance: result.amount }, $set: { robCooldown: new Date() } },
                { new: true }
            );
            const robTargetResult = await User.findOneAndUpdate(
                { userId: targetUser.id, guildId, balance: { $gte: result.amount } },
                { $inc: { balance: -result.amount } },
                { new: true }
            );

            if (!robTargetResult) {
                // Target didn't have enough, reverse the sender's gain
                await User.findOneAndUpdate(
                    { userId, guildId },
                    { $inc: { balance: -result.amount } }
                );
                return interaction.reply({ embeds: [createErrorEmbed('❌ فشلت السرقة', 'العضو لم يعد لديه عملات كافية.')] });
            }

            return interaction.reply({ embeds: [createSuccessEmbed('🔪 نجاح السرقة', `لقد سرقت بنجاح 🪙 **${result.amount.toLocaleString()}** عملة من ${targetUser.tag}!`)] });
        }

        // ─── المتصدرون ───
        if (subcommand === 'المتصدرون') {
            await interaction.deferReply();
            const topUsers = await User.find({ guildId }).sort({ balance: -1, bank: -1 }).limit(10);

            if (!topUsers.length) {
                return interaction.editReply({ embeds: [createInfoEmbed('المتصدرون', 'لا توجد بيانات اقتصاد لهذا السيرفر.')] });
            }

            const medals = ['🥇', '🥈', '🥉'];
            const guildMembers = interaction.guild.members.cache;

            const embed = new EmbedBuilder()
                .setColor('#FFD700')
                .setTitle(`🏆 أغنى الأعضاء في ${interaction.guild.name}`)
                .setDescription('يتم ترتيبهم حسب إجمالي الثروة (محفظة + بنك)');

            // Pre-fetch users efficiently
            const discordUsers = await Promise.allSettled(
                topUsers.map(async (u) => {
                    const cached = guildMembers.get(u.userId);
                    if (cached) return cached.user;
                    return await interaction.client.users.fetch(u.userId);
                })
            );

            let desc = '';
            for (let i = 0; i < topUsers.length; i++) {
                const u = topUsers[i];
                const res = discordUsers[i];
                const userObj = res.status === 'fulfilled' ? res.value : { tag: 'عضو غير معروف' };
                const total = u.balance + u.bank;
                const medal = i < 3 ? medals[i] : `**${i + 1}.**`;
                desc += `${medal} ${userObj.tag} - 🪙 ${total.toLocaleString()} (مستوى ${u.level})\n`;
            }

            embed.setDescription(desc);
            return interaction.editReply({ embeds: [embed] });
        }

        // ─── رتبة ───
        if (subcommand === 'رتبة') {
            await interaction.deferReply();
            const targetUser = interaction.options.getUser('العضو') || interaction.user;
            let targetData = targetUser.id === userId ? userData : await User.findOne({ userId: targetUser.id, guildId });

            if (!targetData && targetUser.id !== userId) {
                targetData = await User.create({ userId: targetUser.id, guildId });
            }

            // حساب الترتيب العالمي في السيرفر
            const allUsers = await User.find({ guildId }).sort({ level: -1, xp: -1 });
            const rank = allUsers.findIndex(u => u.userId === targetUser.id) + 1;

            const xpNeeded = Math.floor(100 * Math.pow(targetData.level, 1.5));
            const stats = {
                level: targetData.level,
                xp: targetData.xp,
                xpNeeded,
                rank,
            };

            const rankCard = await generateRankCard(targetUser, stats);

            if (!rankCard) {
                return interaction.editReply({ embeds: [createErrorEmbed('❌ خطأ', 'حدث خطأ أثناء توليد بطاقة الرتبة.')] });
            }

            const attachment = new AttachmentBuilder(rankCard, { name: 'rank.png' });
            return interaction.editReply({ files: [attachment] });
        }

        // ─── ملف ───
        if (subcommand === 'ملف') {
            await interaction.deferReply();
            const targetUser = interaction.options.getUser('العضو') || interaction.user;
            let targetData = targetUser.id === userId ? userData : await User.findOne({ userId: targetUser.id, guildId });

            if (!targetData && targetUser.id !== userId) {
                targetData = await User.create({ userId: targetUser.id, guildId });
            }

            // حساب الترتيب العالمي في السيرفر
            const allUsers = await User.find({ guildId }).sort({ level: -1, xp: -1 });
            const rank = allUsers.findIndex(u => u.userId === targetUser.id) + 1;

            const stats = {
                level: targetData.level,
                xp: targetData.xp,
                balance: targetData.balance,
                bank: targetData.bank,
                rank,
                badges: targetData.badges || []
            };

            const profileCard = await generateProfileCard(targetUser, stats);

            if (!profileCard) {
                return interaction.editReply({ embeds: [createErrorEmbed('❌ خطأ', 'حدث خطأ أثناء توليد بطاقة الملف الشخصي.')] });
            }

            const attachment = new AttachmentBuilder(profileCard, { name: 'profile.png' });
            return interaction.editReply({ files: [attachment] });
        }

        // ─── إيداع ───
        if (subcommand === 'ايداع') {
            const amount = interaction.options.getInteger('المبلغ');

            if (amount <= 0) {
                return interaction.reply({ embeds: [createErrorEmbed('❌ مبلغ غير صالح', 'المبلغ يجب أن يكون أكبر من 0.')], ephemeral: true });
            }

            if (userData.balance < amount) {
                return interaction.reply({ embeds: [createErrorEmbed('❌ رصيد غير كافٍ', `ليس لديك عملات كافية في محفظتك. رصيدك: 🪙 ${userData.balance.toLocaleString()}`)], ephemeral: true });
            }

            await User.updateOne({ userId: userData.userId, guildId }, { $inc: { balance: -amount, bank: amount } });
            // Update local object to render correct embed details immediately
            userData.balance -= amount;
            userData.bank += amount;

            return interaction.reply({
                embeds: [createSuccessEmbed('🏦 تم الإيداع', `تم إيداع 🪙 **${amount.toLocaleString()}** عملة في البنك.`)
                    .addFields(
                        { name: '💰 المحفظة', value: `🪙 ${userData.balance.toLocaleString()}`, inline: true },
                        { name: '🏦 البنك', value: `🏦 ${userData.bank.toLocaleString()}`, inline: true }
                    )],
            });
        }

        // ─── سحب ───
        if (subcommand === 'سحب') {
            const amount = interaction.options.getInteger('المبلغ');

            if (amount <= 0) {
                return interaction.reply({ embeds: [createErrorEmbed('❌ مبلغ غير صالح', 'المبلغ يجب أن يكون أكبر من 0.')], ephemeral: true });
            }

            if (userData.bank < amount) {
                return interaction.reply({ embeds: [createErrorEmbed('❌ رصيد بنك غير كافٍ', `ليس لديك عملات كافية في البنك. رصيد البنك: 🏦 ${userData.bank.toLocaleString()}`)], ephemeral: true });
            }

            await User.updateOne({ userId: userData.userId, guildId }, { $inc: { bank: -amount, balance: amount } });
            // Update local object to render correct embed details immediately
            userData.bank -= amount;
            userData.balance += amount;

            return interaction.reply({
                embeds: [createSuccessEmbed('🏧 تم السحب', `تم سحب 🪙 **${amount.toLocaleString()}** عملة من البنك.`)
                    .addFields(
                        { name: '💰 المحفظة', value: `🪙 ${userData.balance.toLocaleString()}`, inline: true },
                        { name: '🏦 البنك', value: `🏦 ${userData.bank.toLocaleString()}`, inline: true }
                    )],
            });
        }

        // ─── متجر ───
        if (subcommand === 'متجر') {
            const guildShopItems = await getShopItems(guildId);
            
            const embed = new EmbedBuilder()
                .setColor('#9B59B6')
                .setTitle('🏪 المتجر')
                .setDescription('استخدم `/اقتصاد شراء` لشراء أي عنصر!')
                .setFooter({ text: `رصيدك: 🪙 ${userData.balance.toLocaleString()} | البنك: 🏦 ${userData.bank.toLocaleString()}` });

            // تقسيم العناصر إلى صفحات (صفحة واحدة تضم 25 عنصر كحد أقصى)
            const fields = guildShopItems.map(item => ({
                name: `${item.emoji || '📦'} ${item.name}`,
                value: `السعر: 🪙 ${item.price.toLocaleString()} | ${item.description || 'بدون وصف'}`,
                inline: true,
            }));

            embed.addFields(fields);
            return interaction.reply({ embeds: [embed] });
        }

        // ─── شراء ───
        if (subcommand === 'شراء') {
            const itemId = interaction.options.getString('العنصر');
            const guildShopItems = await getShopItems(guildId);
            const item = guildShopItems.find(i => i.id === itemId);

            if (!item) {
                return interaction.reply({ embeds: [createErrorEmbed('❌ عنصر غير موجود', 'العنصر المختار غير موجود في المتجر.')], ephemeral: true });
            }

            if (userData.balance < item.price) {
                return interaction.reply({
                    embeds: [createErrorEmbed('❌ رصيد غير كافٍ',
                        `تحتاج 🪙 **${item.price.toLocaleString()}** عملة لشراء ${item.emoji || '📦'} **${item.name}**.\nرصيدك الحالي: 🪙 ${userData.balance.toLocaleString()}`
                    )], ephemeral: true,
                });
            }

            // خصم المبلغ
            userData.balance -= item.price;

            // إضافة للمخزون
            const existingItem = userData.inventory.find(i => i.itemId === item.id);
            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                userData.inventory.push({
                    itemId: item.id,
                    name: item.name,
                    quantity: 1,
                    price: item.price,
                });
            }

            // ─── نظام الرتب عند الشراء (Role Rewards) ───
            if (item.roleId) {
                try {
                    const member = await interaction.guild.members.fetch(userId);
                    if (member) await member.roles.add(item.roleId);
                } catch (e) {
                    logger.error(`Error adding role ${item.roleId} to ${userId}:`, e);
                }
            }

            await userData.save();

            return interaction.reply({
                embeds: [createSuccessEmbed('🛒 تم الشراء', `اشتريت ${item.emoji || '📦'} **${item.name}** مقابل 🪙 **${item.price.toLocaleString()}** عملة!`)
                    .addFields(
                        { name: '💰 رصيدك المتبقي', value: `🪙 ${userData.balance.toLocaleString()}`, inline: true },
                        { name: '📦 الكمية', value: `${existingItem ? existingItem.quantity : 1}`, inline: true }
                    )],
            });
        }

        // ─── ممتلكاتي ───
        if (subcommand === 'ممتلكاتي') {
            if (!userData.inventory || userData.inventory.length === 0) {
                return interaction.reply({ embeds: [createInfoEmbed('📦 المخزون', 'لا تملك أي عناصر حالياً. استخدم `/اقتصاد متجر` لمعرفة العناصر المتاحة!')] });
            }

            const guildShopItems = await getShopItems(guildId);
            const totalItems = userData.inventory.reduce((sum, item) => sum + item.quantity, 0);
            const totalValue = userData.inventory.reduce((sum, item) => sum + (item.price * item.quantity), 0);

            const embed = new EmbedBuilder()
                .setColor('#2ECC71')
                .setTitle(`📦 مخزون ${interaction.user.username}`)
                .setDescription(userData.inventory.map(item => {
                    const shopItem = guildShopItems.find(si => si.id === item.itemId) || SHOP_ITEMS.find(si => si.id === item.itemId);
                    const emoji = shopItem ? shopItem.emoji : '📦';
                    return `${emoji} **${item.name}** - الكمية: **${item.quantity}**`;
                }).join('\n'))
                .addFields(
                    { name: '📦 إجمالي العناصر', value: `${totalItems}`, inline: true },
                    { name: '💎 القيمة الإجمالية', value: `🪙 ${totalValue.toLocaleString()}`, inline: true }
                );

            return interaction.reply({ embeds: [embed] });
        }
    },
};

/**
 * بناء شريط تقدم بصري
 * @param {number} percentage - النسبة المئوية (0-100)
 * @param {number} length - طول الشريط
 * @returns {string} شريط التقدم
 */
function buildProgressBar(percentage, length) {
    const filled = Math.round((percentage / 100) * length);
    const empty = length - filled;
    return `${'█'.repeat(filled)}${'░'.repeat(empty)}`;
}
