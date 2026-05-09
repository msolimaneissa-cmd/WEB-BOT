/**
 * @file src/services/levelingService.js
 * @description خدمة المستويات والخبرات المتقدمة - أفضل من ProBot و Carl-bot
 * تدعم XP، Levels، Ranks، Prestige، Role Rewards، وLeaderboards
 */

const User = require('../database/schemas/userSchema');
const ServerConfig = require('../database/schemas/serverConfigSchema');
const logger = require('../utils/logger');

// تخزين مؤقت لمنع الحسابات المتكررة
const xpCooldowns = new Map();
const roleRewardsCache = new Map();

// تنظيف دوري للـ cooldowns
setInterval(() => {
    const now = Date.now();
    for (const [key, timestamp] of xpCooldowns.entries()) {
        if (now - timestamp > 60000) { // دقيقة واحدة
            xpCooldowns.delete(key);
        }
    }
}, 120000);

/**
 * حساب XP المطلوب للمستوى التالي
 * @param {number} level - المستوى الحالي
 * @returns {number} - XP المطلوب
 */
function calculateXPForLevel(level) {
    // معادلة متقدمة: 5 * level^2 + 50 * level
    return Math.floor(5 * Math.pow(level, 2) + 50 * level);
}

/**
 * إضافة XP للمستخدم
 * @param {string} userId - معرف المستخدم
 * @param {string} guildId - معرف السيرفر
 * @param {number} amount - كمية XP
 * @returns {Promise<Object>} - نتيجة الإضافة
 */
async function addXP(userId, guildId, amount) {
    try {
        const key = `${userId}_${guildId}`;
        
        // التحقق من cooldown
        if (xpCooldowns.has(key)) {
            return { success: false, error: 'cooldown' };
        }
        
        xpCooldowns.set(key, Date.now());
        
        let user = await User.findOne({ userId, guildId });
        
        if (!user) {
            user = await User.create({
                userId,
                guildId,
                xp: 0,
                level: 0,
                prestige: 0,
                badges: [],
                title: null,
                background: null,
                customColor: null
            });
        }
        
        const oldLevel = user.level;
        user.xp += amount;
        
        // حساب المستوى الجديد
        let level = user.level;
        let requiredXP = calculateXPForLevel(level);
        
        while (user.xp >= requiredXP) {
            user.xp -= requiredXP;
            level++;
            requiredXP = calculateXPForLevel(level);
        }
        
        const leveledUp = level > oldLevel;
        user.level = level;
        await user.save();
        
        // التحقق من مكافآت المستوى
        if (leveledUp) {
            const roleRewards = await checkRoleRewards(guildId, level);
            return {
                success: true,
                leveledUp,
                newLevel: level,
                roleRewards
            };
        }
        
        return { success: true, leveledUp: false };
        
    } catch (error) {
        logger.error('خطأ في إضافة XP:', error);
        return { success: false, error: error.message };
    }
}

/**
 * التحقق من مكافآت المستوى
 * @param {string} guildId
 * @param {number} level
 * @returns {Promise<string[]>} - قائمة الـ IDs للأدوار المكتسبة
 */
async function checkRoleRewards(guildId, level) {
    try {
        const cacheKey = `${guildId}_rewards`;
        let rewards = roleRewardsCache.get(cacheKey);
        
        if (!rewards) {
            const config = await ServerConfig.findOne({ guildId });
            rewards = config?.leveling?.roleRewards || [];
            roleRewardsCache.set(cacheKey, rewards);
            
            // انتهاء الصلاحية بعد 10 دقائق
            setTimeout(() => roleRewardsCache.delete(cacheKey), 600000);
        }
        
        const earnedRoles = [];
        
        for (const reward of rewards) {
            if (reward.level === level && reward.roleId) {
                earnedRoles.push(reward.roleId);
            }
        }
        
        return earnedRoles;
        
    } catch (error) {
        logger.error('خطأ في التحقق من مكافآت المستوى:', error);
        return [];
    }
}

/**
 * الحصول على رتبة المستخدم
 * @param {string} userId
 * @param {string} guildId
 * @returns {Promise<Object>}
 */
async function getRank(userId, guildId) {
    try {
        const user = await User.findOne({ userId, guildId });
        
        if (!user) {
            return {
                exists: false,
                rank: null,
                xp: 0,
                level: 0,
                totalUsers: 0
            };
        }
        
        // حساب الترتيب
        const totalUsers = await User.countDocuments({ guildId });
        const higherRank = await User.countDocuments({
            guildId,
            $or: [
                { level: { $gt: user.level } },
                { level: user.level, xp: { $gt: user.xp } }
            ]
        });
        
        return {
            exists: true,
            rank: higherRank + 1,
            xp: user.xp,
            level: user.level,
            requiredXP: calculateXPForLevel(user.level),
            totalUsers,
            badges: user.badges || [],
            title: user.title,
            prestige: user.prestige
        };
        
    } catch (error) {
        logger.error('خطأ في الحصول على الرتبة:', error);
        return null;
    }
}

/**
 * الحصول على لوحة المتصدرين
 * @param {string} guildId
 * @param {number} limit - عدد المستخدمين
 * @returns {Promise<Array>}
 */
async function getLeaderboard(guildId, limit = 10) {
    try {
        const users = await User.find({ guildId })
            .sort({ level: -1, xp: -1 })
            .limit(limit)
            .select('userId level xp prestige badges');
        
        return users.map((user, index) => ({
            rank: index + 1,
            userId: user.userId,
            level: user.level,
            xp: user.xp,
            prestige: user.prestige || 0,
            badges: user.badges || []
        }));
        
    } catch (error) {
        logger.error('خطأ في الحصول على لوحة المتصدرين:', error);
        return [];
    }
}

/**
 * تعيين مستوى للمستخدم (للآدمنز فقط)
 * @param {string} userId
 * @param {string} guildId
 * @param {number} level
 * @returns {Promise<Object>}
 */
async function setLevel(userId, guildId, level) {
    try {
        let user = await User.findOne({ userId, guildId });
        
        if (!user) {
            user = await User.create({
                userId,
                guildId,
                xp: 0,
                level: 0
            });
        }
        
        user.level = Math.max(0, Math.min(1000, level));
        user.xp = 0;
        await user.save();
        
        return { success: true, newLevel: user.level };
        
    } catch (error) {
        logger.error('خطأ في تعيين المستوى:', error);
        return { success: false, error: error.message };
    }
}

/**
 * إضافة شارة للمستخدم
 * @param {string} userId
 * @param {string} guildId
 * @param {string} badgeId
 * @returns {Promise<Object>}
 */
async function addBadge(userId, guildId, badgeId) {
    try {
        let user = await User.findOne({ userId, guildId });
        
        if (!user) {
            return { success: false, error: 'المستخدم غير موجود' };
        }
        
        if (!user.badges) {
            user.badges = [];
        }
        
        if (user.badges.includes(badgeId)) {
            return { success: false, error: 'الشارة موجودة بالفعل' };
        }
        
        user.badges.push(badgeId);
        await user.save();
        
        return { success: true, badges: user.badges };
        
    } catch (error) {
        logger.error('خطأ في إضافة الشارة:', error);
        return { success: false, error: error.message };
    }
}

/**
 * إزالة شارة من المستخدم
 * @param {string} userId
 * @param {string} guildId
 * @param {string} badgeId
 * @returns {Promise<Object>}
 */
async function removeBadge(userId, guildId, badgeId) {
    try {
        const user = await User.findOne({ userId, guildId });
        
        if (!user) {
            return { success: false, error: 'المستخدم غير موجود' };
        }
        
        if (!user.badges || !user.badges.includes(badgeId)) {
            return { success: false, error: 'الشارة غير موجودة' };
        }
        
        user.badges = user.badges.filter(b => b !== badgeId);
        await user.save();
        
        return { success: true, badges: user.badges };
        
    } catch (error) {
        logger.error('خطأ في إزالة الشارة:', error);
        return { success: false, error: error.message };
    }
}

/**
 * تعيين عنوان مخصص للمستخدم
 * @param {string} userId
 * @param {string} guildId
 * @param {string} title
 * @returns {Promise<Object>}
 */
async function setTitle(userId, guildId, title) {
    try {
        let user = await User.findOne({ userId, guildId });
        
        if (!user) {
            return { success: false, error: 'المستخدم غير موجود' };
        }
        
        user.title = title ? title.slice(0, 50) : null;
        await user.save();
        
        return { success: true, title: user.title };
        
    } catch (error) {
        logger.error('خطأ في تعيين العنوان:', error);
        return { success: false, error: error.message };
    }
}

/**
 * ترقية Prestige (إعادة ضبط المستوى مع مكافأة)
 * @param {string} userId
 * @param {string} guildId
 * @returns {Promise<Object>}
 */
async function prestige(userId, guildId) {
    try {
        const user = await User.findOne({ userId, guildId });
        
        if (!user) {
            return { success: false, error: 'المستخدم غير موجود' };
        }
        
        if (user.level < 100) {
            return { 
                success: false, 
                error: 'يجب الوصول للمستوى 100 على الأقل للترقية' 
            };
        }
        
        user.prestige = (user.prestige || 0) + 1;
        user.level = 0;
        user.xp = 0;
        await user.save();
        
        return {
            success: true,
            prestige: user.prestige,
            bonus: user.prestige * 10 // نسبة بونص لكل prestige
        };
        
    } catch (error) {
        logger.error('خطأ في الترقية Prestige:', error);
        return { success: false, error: error.message };
    }
}

/**
 * الحصول على إعدادات leveling للسيرفر
 * @param {string} guildId
 * @returns {Promise<Object>}
 */
async function getLevelingConfig(guildId) {
    try {
        const config = await ServerConfig.findOne({ guildId });
        return config?.leveling || {
            enabled: false,
            xpPerMessage: 10,
            xpCooldown: 60,
            roleRewards: [],
            announceLevelUp: false,
            levelUpChannel: null
        };
        
    } catch (error) {
        logger.error('خطأ في الحصول على إعدادات leveling:', error);
        return null;
    }
}

/**
 * تحديث إعدادات leveling
 * @param {string} guildId
 * @param {Object} updates
 * @returns {Promise<Object>}
 */
async function updateLevelingConfig(guildId, updates) {
    try {
        let config = await ServerConfig.findOne({ guildId });
        
        if (!config) {
            config = await ServerConfig.create({ guildId });
        }
        
        if (!config.leveling) {
            config.leveling = {};
        }
        
        // دمج التحديثات
        Object.assign(config.leveling, updates);
        await config.save();
        
        // مسح الكاش
        roleRewardsCache.delete(`${guildId}_rewards`);
        
        return { success: true, config: config.leveling };
        
    } catch (error) {
        logger.error('خطأ في تحديث إعدادات leveling:', error);
        return { success: false, error: error.message };
    }
}

module.exports = {
    calculateXPForLevel,
    addXP,
    getRank,
    getLeaderboard,
    setLevel,
    addBadge,
    removeBadge,
    setTitle,
    prestige,
    getLevelingConfig,
    updateLevelingConfig,
    checkRoleRewards
};
