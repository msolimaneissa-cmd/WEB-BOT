jest.mock('../../src/utils/logger', () => ({
    info: jest.fn(),
    error: jest.fn(),
}));

jest.mock('../../src/database/schemas/serverConfigSchema', () => ({
    findOne: jest.fn(),
    create: jest.fn(),
}));

jest.mock('../../src/utils/welcomeImage', () => ({
    createWelcomeImage: jest.fn().mockResolvedValue(Buffer.from('test_image')),
}));

const ServerConfig = require('../../src/database/schemas/serverConfigSchema');
const { processWelcomeVariables, getWelcomeConfig, updateWelcomeConfig, giveAutoRole } = require('../../src/services/welcomeService');

describe('welcomeService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('processWelcomeVariables', () => {
        test('replaces variables correctly', () => {
            const member = {
                user: {
                    username: 'testuser',
                    id: '123',
                    tag: 'testuser#1234',
                    createdAt: new Date('2023-01-01T00:00:00Z'),
                },
                guild: {
                    name: 'Test Server',
                    memberCount: 42,
                },
                joinedAt: new Date('2023-01-02T00:00:00Z'),
            };

            const template = 'Welcome {user} ({mention}) to {server}! You are member #{members}. ID: {id} Tag: {tag}';
            const result = processWelcomeVariables(template, member);
            expect(result).toBe('Welcome testuser (<@123>) to Test Server! You are member #42. ID: 123 Tag: testuser#1234');
        });
    });

    describe('getWelcomeConfig', () => {
        test('returns config if found', async () => {
            const mockConfig = { welcome: { enabled: true, channelId: '123' } };
            ServerConfig.findOne.mockResolvedValue(mockConfig);

            const result = await getWelcomeConfig('guild1');
            expect(ServerConfig.findOne).toHaveBeenCalledWith({ guildId: 'guild1' });
            expect(result).toEqual(mockConfig.welcome);
        });

        test('returns default if not found or no welcome config', async () => {
            ServerConfig.findOne.mockResolvedValue(null);
            const result = await getWelcomeConfig('guild1');
            expect(result.enabled).toBe(false);
            expect(result.channelId).toBeNull();
        });
    });

    describe('updateWelcomeConfig', () => {
        test('updates existing config', async () => {
            const mockDoc = {
                welcome: { enabled: false },
                save: jest.fn().mockResolvedValue(true)
            };
            ServerConfig.findOne.mockResolvedValue(mockDoc);

            const result = await updateWelcomeConfig('guild1', { enabled: true });
            expect(mockDoc.welcome.enabled).toBe(true);
            expect(mockDoc.save).toHaveBeenCalled();
            expect(result.success).toBe(true);
        });

        test('creates new config if not found', async () => {
            ServerConfig.findOne.mockResolvedValue(null);
            const mockDoc = {
                welcome: {},
                save: jest.fn().mockResolvedValue(true)
            };
            ServerConfig.create.mockResolvedValue(mockDoc);

            const result = await updateWelcomeConfig('guild1', { channelId: '999' });
            expect(ServerConfig.create).toHaveBeenCalledWith({ guildId: 'guild1' });
            expect(mockDoc.welcome.channelId).toBe('999');
            expect(mockDoc.save).toHaveBeenCalled();
            expect(result.success).toBe(true);
        });
    });

    describe('giveAutoRole', () => {
        test('adds single role to member', async () => {
            const roleId = 'role1';
            const member = {
                roles: {
                    cache: { has: jest.fn().mockReturnValue(false) },
                    add: jest.fn().mockResolvedValue(true)
                },
                guild: {
                    roles: {
                        cache: { get: jest.fn().mockReturnValue({ position: 1 }) },
                        everyone: { position: 0 }
                    }
                }
            };

            const result = await giveAutoRole(member, roleId);
            expect(member.roles.add).toHaveBeenCalledWith([roleId]);
            expect(result).toBe(true);
        });

        test('does not add role if already has it', async () => {
            const roleId = 'role1';
            const member = {
                roles: {
                    cache: { has: jest.fn().mockReturnValue(true) },
                    add: jest.fn()
                },
                guild: {
                    roles: {
                        cache: { get: jest.fn().mockReturnValue({ position: 1 }) },
                        everyone: { position: 0 }
                    }
                }
            };

            const result = await giveAutoRole(member, roleId);
            expect(member.roles.add).not.toHaveBeenCalled();
            expect(result).toBe(false);
        });
    });
});
