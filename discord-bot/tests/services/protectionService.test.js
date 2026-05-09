/**
 * @file tests/services/protectionService.test.js
 * @description Unit tests for the protection service logic (Anti-Nuke tracking).
 */

const { trackAction, resetActionTracker } = require('../../src/services/protectionService');

describe('protectionService', () => {
    const guildId = '123456789012345678';
    const executorId = '987654321098765432';
    const config = {
        protection: {
            antiNuke: {
                enabled: true,
                cooldown: 1000, // 1 second for testing
                maxChannelDelete: 2,
                maxRoleDelete: 2,
                maxKick: 3,
                maxBan: 3,
            }
        }
    };

    beforeEach(() => {
        // Reset the tracker for each test to ensure isolation
        resetActionTracker(executorId, 'channel_delete', guildId);
        resetActionTracker(executorId, 'role_delete', guildId);
        resetActionTracker(executorId, 'member_kick', guildId);
        resetActionTracker(executorId, 'member_ban', guildId);
    });

    describe('trackAction', () => {
        test('returns false if anti-nuke is disabled', () => {
            const disabledConfig = { protection: { antiNuke: { enabled: false } } };
            const result = trackAction(executorId, 'channel_delete', guildId, disabledConfig);
            expect(result).toBe(false);
        });

        test('returns false if limit is not exceeded', () => {
            // First action
            let result = trackAction(executorId, 'channel_delete', guildId, config);
            expect(result).toBe(false);

            // Second action (limit is 2)
            result = trackAction(executorId, 'channel_delete', guildId, config);
            expect(result).toBe(false);
        });

        test('returns true if limit is exceeded', () => {
            // First action
            trackAction(executorId, 'channel_delete', guildId, config);
            // Second action
            trackAction(executorId, 'channel_delete', guildId, config);
            // Third action (limit is 2)
            const result = trackAction(executorId, 'channel_delete', guildId, config);
            expect(result).toBe(true);
        });

        test('resets count after cooldown passes', (done) => {
            // First action
            trackAction(executorId, 'channel_delete', guildId, config);
            
            // Wait for cooldown (1.5 seconds)
            setTimeout(() => {
                // Should reset count to 1
                const result = trackAction(executorId, 'channel_delete', guildId, config);
                expect(result).toBe(false);
                done();
            }, 1500);
        });

        test('handles different action types separately', () => {
            // 2 channel deletes (limit 2)
            trackAction(executorId, 'channel_delete', guildId, config);
            trackAction(executorId, 'channel_delete', guildId, config);
            
            // Should still be false for role delete
            const result = trackAction(executorId, 'role_delete', guildId, config);
            expect(result).toBe(false);
        });

        test('respects different limits for different actions', () => {
            // 2 channel deletes (limit 2)
            trackAction(executorId, 'channel_delete', guildId, config);
            trackAction(executorId, 'channel_delete', guildId, config);
            expect(trackAction(executorId, 'channel_delete', guildId, config)).toBe(true);

            // 3 kicks (limit 3)
            trackAction(executorId, 'member_kick', guildId, config);
            trackAction(executorId, 'member_kick', guildId, config);
            trackAction(executorId, 'member_kick', guildId, config);
            expect(trackAction(executorId, 'member_kick', guildId, config)).toBe(true);
        });
    });
});
