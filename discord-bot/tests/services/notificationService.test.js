const { buildStreamUrl, shouldCheckNow } = require('../../src/services/notificationService');

describe('notificationService helpers', () => {
    describe('buildStreamUrl', () => {
        test('prefers channelLink when provided', () => {
            const url = buildStreamUrl({ platform: 'twitch', username: 'x', channelLink: 'https://example.com/live' });
            expect(url).toBe('https://example.com/live');
        });

        test('builds twitch url', () => {
            const url = buildStreamUrl({ platform: 'twitch', username: 'someuser', channelLink: '' });
            expect(url).toBe('https://twitch.tv/someuser');
        });

        test('builds youtube url', () => {
            const url = buildStreamUrl({ platform: 'youtube', username: '@channel', channelLink: '' });
            expect(url).toBe('https://www.youtube.com/@channel/live');
        });

        test('builds kick url', () => {
            const url = buildStreamUrl({ platform: 'kick', username: 'someuser', channelLink: '' });
            expect(url).toBe('https://kick.com/someuser');
        });

        test('builds tiktok url', () => {
            const url = buildStreamUrl({ platform: 'tiktok', username: 'someuser', channelLink: '' });
            expect(url).toBe('https://www.tiktok.com/@someuser/live');
        });
    });

    describe('shouldCheckNow', () => {
        test('checks when no lastChecked exists', () => {
            const detection = { checkInterval: 60 };
            const streamers = [{ lastChecked: null }];
            expect(shouldCheckNow(detection, streamers)).toBe(true);
        });

        test('does not check when lastChecked is within interval', () => {
            const detection = { checkInterval: 60 };
            const streamers = [{ lastChecked: new Date(Date.now() - 30 * 60_000).toISOString() }];
            expect(shouldCheckNow(detection, streamers)).toBe(false);
        });

        test('checks when lastChecked exceeded interval', () => {
            const detection = { checkInterval: 60 };
            const streamers = [{ lastChecked: new Date(Date.now() - 61 * 60_000).toISOString() }];
            expect(shouldCheckNow(detection, streamers)).toBe(true);
        });
    });
});

