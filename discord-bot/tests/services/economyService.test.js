/**
 * @file tests/services/economyService.test.js
 * @description Unit tests for the economy service logic.
 */

const {
    COOLDOWNS,
    checkDailyCooldown,
    calculateDailyReward,
    checkWorkCooldown,
    calculateWorkReward,
    validateTransfer,
    checkRobCooldown,
    processRob,
} = require('../../src/services/economyService');

describe('economyService', () => {
    describe('checkDailyCooldown', () => {
        test('returns canClaim: true if lastDaily is null', () => {
            const { canClaim } = checkDailyCooldown(null);
            expect(canClaim).toBe(true);
        });

        test('returns canClaim: false if 24 hours have not passed', () => {
            const lastDaily = new Date(Date.now() - 23 * 60 * 60 * 1000); // 23 hours ago
            const { canClaim, remaining } = checkDailyCooldown(lastDaily);
            expect(canClaim).toBe(false);
            expect(remaining).toBeGreaterThan(0);
        });

        test('returns canClaim: true if 24 hours have passed', () => {
            const lastDaily = new Date(Date.now() - 25 * 60 * 60 * 1000); // 25 hours ago
            const { canClaim } = checkDailyCooldown(lastDaily);
            expect(canClaim).toBe(true);
        });
    });

    describe('calculateDailyReward', () => {
        test('resets streak if more than 48 hours passed', () => {
            const lastDaily = new Date(Date.now() - 49 * 60 * 60 * 1000);
            const { newStreak } = calculateDailyReward(5, lastDaily);
            expect(newStreak).toBe(1);
        });

        test('increments streak if within 48 hours', () => {
            const lastDaily = new Date(Date.now() - 25 * 60 * 60 * 1000);
            const { newStreak } = calculateDailyReward(5, lastDaily);
            expect(newStreak).toBe(6);
        });

        test('returns reward within expected range', () => {
            const { baseAmount, total } = calculateDailyReward(1, null);
            expect(baseAmount).toBeGreaterThanOrEqual(500);
            expect(baseAmount).toBeLessThanOrEqual(1500);
            expect(total).toBeGreaterThan(baseAmount);
        });
    });

    describe('checkWorkCooldown', () => {
        test('returns canWork: true if lastWork is null', () => {
            const { canWork } = checkWorkCooldown(null);
            expect(canWork).toBe(true);
        });

        test('returns canWork: false if 1 hour has not passed', () => {
            const lastWork = new Date(Date.now() - 30 * 60 * 1000); // 30 mins ago
            const { canWork, remaining } = checkWorkCooldown(lastWork);
            expect(canWork).toBe(false);
            expect(remaining).toBeGreaterThan(0);
        });

        test('returns canWork: true if 1 hour has passed', () => {
            const lastWork = new Date(Date.now() - 61 * 60 * 1000); // 61 mins ago
            const { canWork } = checkWorkCooldown(lastWork);
            expect(canWork).toBe(true);
        });
    });

    describe('calculateWorkReward', () => {
        test('returns a valid job and earned amount', () => {
            const { job, earned } = calculateWorkReward();
            expect(job).toHaveProperty('name');
            expect(job).toHaveProperty('emoji');
            expect(earned).toBeGreaterThanOrEqual(100);
            expect(earned).toBeLessThanOrEqual(800);
        });
    });

    describe('validateTransfer', () => {
        test('returns error for insufficient funds', () => {
            const { success, error } = validateTransfer(100, 200);
            expect(success).toBe(false);
            expect(error).toBe('INSUFFICIENT_FUNDS');
        });

        test('returns success for sufficient funds', () => {
            const { success } = validateTransfer(500, 200);
            expect(success).toBe(true);
        });

        test('returns error for invalid amount', () => {
            const { success, error } = validateTransfer(500, -10);
            expect(success).toBe(false);
            expect(error).toBe('INVALID_AMOUNT');
        });
    });

    describe('checkRobCooldown', () => {
        test('returns canRob: true if lastRob is null', () => {
            const { canRob } = checkRobCooldown(null);
            expect(canRob).toBe(true);
        });

        test('returns canRob: false if 2 hours have not passed', () => {
            const lastRob = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
            const { canRob, remaining } = checkRobCooldown(lastRob);
            expect(canRob).toBe(false);
            expect(remaining).toBeGreaterThan(0);
        });
    });

    describe('processRob', () => {
        test('returns error for target having shield', () => {
            const { success, error } = processRob(500, true);
            expect(success).toBe(false);
            expect(error).toBe('TARGET_HAS_SHIELD');
        });

        test('returns error for poor target', () => {
            const { success, error } = processRob(50, false);
            expect(success).toBe(false);
            expect(error).toBe('TARGET_TOO_POOR');
        });
    });
});
