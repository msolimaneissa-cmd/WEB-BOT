jest.mock('../../src/utils/logger', () => ({
    info: jest.fn(), warn: jest.fn(), error: jest.fn(), success: jest.fn(), debug: jest.fn(),
}));

jest.mock('axios');

const testUrl = 'https://example.com/webhook';
const testSecret = 'test-secret';

jest.mock('../../src/config', () => ({
    config: {
        websiteWebhookUrl: 'https://example.com/webhook',
        websiteWebhookSecret: 'test-secret',
    }
}));

const { sendWebhook, sendStreamStart, sendStreamEnd, sendServerStats, sendActivity } = require('../../src/utils/webhook');
const axios = require('axios');

describe('webhook', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        axios.post.mockResolvedValue({ status: 200 });
    });

    describe('sendWebhook', () => {
        test('sends POST with correct headers', async () => {
            const payload = { event: 'test', data: 'value' };
            await sendWebhook(payload);
            expect(axios.post).toHaveBeenCalledWith(
                testUrl,
                payload,
                expect.objectContaining({
                    headers: { 'Authorization': 'Bearer test-secret', 'Content-Type': 'application/json' },
                    timeout: 10000,
                })
            );
        });

        test('returns true on success', async () => {
            const result = await sendWebhook({ event: 'test' });
            expect(result).toBe(true);
        });

        test('returns false on error', async () => {
            axios.post.mockRejectedValue(new Error('Network error'));
            const result = await sendWebhook({ event: 'test' });
            expect(result).toBe(false);
        });
    });

    describe('sendStreamStart', () => {
        test('sends stream_start event', async () => {
            await sendStreamStart({ userId: '123', username: 'Streamer', streamUrl: 'https://twitch.tv/s', platform: 'twitch' });
            expect(axios.post).toHaveBeenCalledWith(
                testUrl,
                expect.objectContaining({ event: 'stream_start', userId: '123', username: 'Streamer', platform: 'twitch' }),
                expect.any(Object)
            );
        });
    });

    describe('sendStreamEnd', () => {
        test('sends stream_end event', async () => {
            await sendStreamEnd({ userId: '123', username: 'Streamer', streamUrl: 'https://twitch.tv/s', platform: 'twitch' });
            expect(axios.post).toHaveBeenCalledWith(
                testUrl,
                expect.objectContaining({ event: 'stream_end' }),
                expect.any(Object)
            );
        });
    });

    describe('sendServerStats', () => {
        test('sends server_stats with member counts', async () => {
            await sendServerStats({ guildId: '456', guildName: 'Test', memberCount: 100, onlineCount: 50, botCount: 5 });
            expect(axios.post).toHaveBeenCalledWith(
                testUrl,
                expect.objectContaining({ event: 'server_stats', memberCount: 100, onlineCount: 50 }),
                expect.any(Object)
            );
        });
    });

    describe('sendActivity', () => {
        test('sends activity event', async () => {
            await sendActivity({ event: 'custom_event', data: { key: 'value' } });
            expect(axios.post).toHaveBeenCalledWith(
                testUrl,
                expect.objectContaining({ event: 'custom_event', key: 'value' }),
                expect.any(Object)
            );
        });
    });
});
