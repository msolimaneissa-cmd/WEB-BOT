jest.mock('../../src/utils/logger', () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    success: jest.fn(),
    debug: jest.fn(),
}));

const { addToContext, getContext, clearContext } = require('../../src/utils/aiChat');

describe('aiChat context management', () => {
    beforeEach(() => {
        clearContext('user1', 'guild1');
        clearContext('user2', 'guild2');
    });

    describe('addToContext and getContext', () => {
        test('stores and retrieves a message', () => {
            addToContext('user1', 'guild1', 'user', 'Hello');
            const context = getContext('user1', 'guild1');
            expect(context).toHaveLength(1);
            expect(context[0]).toEqual({ role: 'user', content: 'Hello' });
        });

        test('stores multiple messages in order', () => {
            addToContext('user1', 'guild1', 'user', 'First');
            addToContext('user1', 'guild1', 'assistant', 'Second');
            const context = getContext('user1', 'guild1');
            expect(context).toHaveLength(2);
            expect(context[0].content).toBe('First');
            expect(context[1].content).toBe('Second');
        });

        test('separates contexts by user and guild', () => {
            addToContext('user1', 'guild1', 'user', 'Message from guild 1');
            addToContext('user1', 'guild2', 'user', 'Message from guild 2');
            expect(getContext('user1', 'guild1')).toHaveLength(1);
            expect(getContext('user1', 'guild2')).toHaveLength(1);
            expect(getContext('user1', 'guild1')[0].content).toBe('Message from guild 1');
        });

        test('truncates message content to 500 chars', () => {
            const long = 'a'.repeat(1000);
            addToContext('user1', 'guild1', 'user', long);
            const context = getContext('user1', 'guild1');
            expect(context[0].content).toHaveLength(500);
        });

        test('returns empty array for unknown user/guild', () => {
            expect(getContext('unknown', 'unknown')).toEqual([]);
        });
    });

    describe('clearContext', () => {
        test('clears messages for a specific user/guild', () => {
            addToContext('user1', 'guild1', 'user', 'Hello');
            clearContext('user1', 'guild1');
            expect(getContext('user1', 'guild1')).toEqual([]);
        });

        test('does not affect other users', () => {
            addToContext('user1', 'guild1', 'user', 'Hello');
            addToContext('user2', 'guild2', 'user', 'World');
            clearContext('user1', 'guild1');
            expect(getContext('user2', 'guild2')).toHaveLength(1);
        });
    });
});
