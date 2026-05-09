jest.mock('../../src/utils/logger', () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    success: jest.fn(),
    debug: jest.fn(),
}));

jest.mock('../../src/database/schemas/autoResponderSchema');

const { processVariables } = require('../../src/services/autoResponderService');

describe('processVariables', () => {
    const context = {
        user: { id: '123', username: 'TestUser', tag: 'TestUser#1234' },
        guild: { name: 'Test Server' },
        channel: { name: 'general' }
    };

    test('replaces {user} with username', () => {
        expect(processVariables('Hello {user}', context)).toBe('Hello TestUser');
    });

    test('replaces {mention} with user mention', () => {
        expect(processVariables('Welcome {mention}', context)).toBe('Welcome <@123>');
    });

    test('replaces {tag} with full tag', () => {
        expect(processVariables('Hi {tag}', context)).toBe('Hi TestUser#1234');
    });

    test('replaces {server} with guild name', () => {
        expect(processVariables('Server: {server}', context)).toBe('Server: Test Server');
    });

    test('replaces {channel} with channel name', () => {
        expect(processVariables('Channel: {channel}', context)).toBe('Channel: general');
    });

    test('replaces unknown user with Unknown', () => {
        const result = processVariables('Hello {user}', {});
        expect(result).toBe('Hello Unknown');
    });

    test('replaces all occurrences of same variable', () => {
        expect(processVariables('{user} {user}', context)).toBe('TestUser TestUser');
    });

    test('leaves template unchanged when no variables match', () => {
        expect(processVariables('Just a plain message', context)).toBe('Just a plain message');
    });
});
