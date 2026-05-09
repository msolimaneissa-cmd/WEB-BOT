/**
 * @file src/services/economyService.js
 * @description Core logic for the economy system, separated from Discord.js interactions.
 */

const { randomInt } = require('node:crypto');

const COOLDOWNS = {
    DAILY: 24 * 60 * 60 * 1000, // 24 hours
    WORK: 60 * 60 * 1000,      // 1 hour
    ROB: 2 * 60 * 60 * 1000,   // 2 hours
};

/**
 * Checks if a user can claim their daily reward.
 * @param {Date|null} lastDaily - The date the user last claimed their daily reward.
 * @returns {{canClaim: boolean, remaining: number}}
 */
function checkDailyCooldown(lastDaily) {
    if (!lastDaily) return { canClaim: true, remaining: 0 };
    
    const now = new Date();
    const elapsed = now.getTime() - lastDaily.getTime();
    
    if (elapsed < COOLDOWNS.DAILY) {
        return { canClaim: false, remaining: COOLDOWNS.DAILY - elapsed };
    }
    
    return { canClaim: true, remaining: 0 };
}

/**
 * Calculates the daily reward and streak.
 * @param {number} currentStreak - The current streak of the user.
 * @param {Date|null} lastDaily - The date the user last claimed their daily reward.
 * @returns {{baseAmount: number, streakBonus: number, total: number, newStreak: number}}
 */
function calculateDailyReward(currentStreak, lastDaily) {
    const now = new Date();
    let newStreak = currentStreak;

    // Reset streak if more than 48 hours passed since last claim
    if (!lastDaily || (now.getTime() - lastDaily.getTime()) > 48 * 60 * 60 * 1000) {
        newStreak = 1;
    } else {
        newStreak += 1;
    }

    const baseAmount = randomInt(500, 1501);
    const streakBonus = Math.min(newStreak * 50, 500);
    const total = baseAmount + streakBonus;

    return { baseAmount, streakBonus, total, newStreak };
}

/**
 * Checks if a user can work.
 * @param {Date|null} lastWork - The date the user last worked.
 * @returns {{canWork: boolean, remaining: number}}
 */
function checkWorkCooldown(lastWork) {
    if (!lastWork) return { canWork: true, remaining: 0 };
    
    const now = new Date();
    const elapsed = now.getTime() - lastWork.getTime();
    
    if (elapsed < COOLDOWNS.WORK) {
        return { canWork: false, remaining: COOLDOWNS.WORK - elapsed };
    }
    
    return { canWork: true, remaining: 0 };
}

/**
 * Calculates the work reward and picks a random job.
 * @returns {{job: {name: string, emoji: string}, earned: number}}
 */
function calculateWorkReward() {
    const jobs = [
        { name: 'مبرمج', emoji: '👨‍💻' },
        { name: 'طباخ', emoji: '👨‍🍳' },
        { name: 'مشرف ديسكورد', emoji: '🛡️' },
        { name: 'يوتيوبر', emoji: '🎥' },
        { name: 'لاعب محترف', emoji: '🎮' },
        { name: 'مصمم جرافيك', emoji: '🎨' },
        { name: 'كاتب محتوى', emoji: '✍️' },
        { name: 'مصور', emoji: '📸' },
        { name: 'مهندس', emoji: '🏗️' },
        { name: 'طبيب', emoji: '👨‍⚕️' },
    ];
    
    const job = jobs[randomInt(jobs.length)];
    const earned = randomInt(100, 801);
    
    return { job, earned };
}

/**
 * Processes a transfer between two users.
 * @param {number} senderBalance - The current balance of the sender.
 * @param {number} amount - The amount to transfer.
 * @returns {{success: boolean, error?: string}}
 */
function validateTransfer(senderBalance, amount) {
    if (amount <= 0) return { success: false, error: 'INVALID_AMOUNT' };
    if (senderBalance < amount) return { success: false, error: 'INSUFFICIENT_FUNDS' };
    return { success: true };
}

/**
 * Checks if a user can rob.
 * @param {Date|null} lastRob - The date the user last attempted a robbery.
 * @returns {{canRob: boolean, remaining: number}}
 */
function checkRobCooldown(lastRob) {
    if (!lastRob) return { canRob: true, remaining: 0 };
    
    const now = new Date();
    const elapsed = now.getTime() - lastRob.getTime();
    
    if (elapsed < COOLDOWNS.ROB) {
        return { canRob: false, remaining: COOLDOWNS.ROB - elapsed };
    }
    
    return { canRob: true, remaining: 0 };
}

/**
 * Processes a robbery attempt.
 * @param {number} targetBalance - The target user's balance.
 * @param {boolean} hasShield - Whether the target has a protection shield.
 * @returns {{success: boolean, caught: boolean, amount?: number, fine?: number, error?: string}}
 */
function processRob(targetBalance, hasShield) {
    if (targetBalance < 100) return { success: false, caught: false, error: 'TARGET_TOO_POOR' };
    if (hasShield) return { success: false, caught: false, error: 'TARGET_HAS_SHIELD' };

    const success = randomInt(100) < 40; // 40% success rate

    if (success) {
        const amount = randomInt(100, Math.min(targetBalance, 500) + 1);
        return { success: true, caught: false, amount };
    } else {
        const fine = 200;
        return { success: false, caught: true, fine };
    }
}

module.exports = {
    COOLDOWNS,
    checkDailyCooldown,
    calculateDailyReward,
    checkWorkCooldown,
    calculateWorkReward,
    validateTransfer,
    checkRobCooldown,
    processRob,
};
