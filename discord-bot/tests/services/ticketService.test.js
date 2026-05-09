jest.mock('../../src/utils/logger', () => ({
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
}));

jest.mock('../../src/database/schemas/ticketSchema', () => ({
    findOne: jest.fn(),
    create: jest.fn(),
    countDocuments: jest.fn(),
    aggregate: jest.fn(),
}));

jest.mock('../../src/database/schemas/serverConfigSchema', () => ({
    findOne: jest.fn(),
}));

const {
    changeTicketPriority,
    moveTicket,
    getTicketStats
} = require('../../src/services/ticketService');
const Ticket = require('../../src/database/schemas/ticketSchema');

describe('ticketService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('changeTicketPriority', () => {
        test('changes priority successfully', async () => {
            const mockTicket = { priority: 'low', save: jest.fn().mockResolvedValue(true) };
            Ticket.findOne.mockResolvedValue(mockTicket);
            
            const result = await changeTicketPriority('channel1', 'high');
            expect(mockTicket.priority).toBe('high');
            expect(mockTicket.save).toHaveBeenCalled();
            expect(result.success).toBe(true);
        });

        test('returns error for invalid priority', async () => {
            Ticket.findOne.mockResolvedValue({});
            const result = await changeTicketPriority('channel1', 'invalid');
            expect(result.success).toBe(false);
            expect(result.error).toBe('الأولوية غير صحيحة');
        });

        test('returns error if ticket not found', async () => {
            Ticket.findOne.mockResolvedValue(null);
            const result = await changeTicketPriority('channel1', 'high');
            expect(result.success).toBe(false);
            expect(result.error).toBe('التذكرة غير موجودة');
        });
    });

    describe('moveTicket', () => {
        test('moves ticket to new category successfully', async () => {
            const mockChannel = { setParent: jest.fn(), send: jest.fn() };
            const mockCategory = { name: 'New Category' };
            
            const mockGuild = {
                channels: {
                    cache: {
                        get: jest.fn().mockImplementation((id) => {
                            if (id === 'channel1') return mockChannel;
                            if (id === 'cat1') return mockCategory;
                            return null;
                        })
                    }
                }
            };
            const mockClient = {
                guilds: { cache: { get: jest.fn().mockReturnValue(mockGuild) } }
            };
            const mockTicket = { category: 'oldCat', save: jest.fn(), guildId: 'guild1' };
            Ticket.findOne.mockResolvedValue(mockTicket);

            const result = await moveTicket('channel1', 'cat1', mockClient);
            expect(result.success).toBe(true);
            expect(mockTicket.category).toBe('cat1');
            expect(mockTicket.save).toHaveBeenCalled();
            expect(mockChannel.setParent).toHaveBeenCalledWith('cat1');
            expect(mockChannel.send).toHaveBeenCalled();
        });

        test('fails if server not found', async () => {
            const mockClient = { guilds: { cache: { get: jest.fn().mockReturnValue(null) } } };
            const mockTicket = { guildId: 'guild1' };
            Ticket.findOne.mockResolvedValue(mockTicket);

            const result = await moveTicket('channel1', 'cat1', mockClient);
            expect(result.success).toBe(false);
            expect(result.error).toBe('السيرفر غير موجود');
        });
    });

    describe('getTicketStats', () => {
        test('returns correct stats object', async () => {
            Ticket.countDocuments.mockImplementation(async (query) => {
                if (query.closed === undefined && !query.openedAt && !query.closedAt) return 100;
                if (query.closed === false && !query.openedAt) return 10;
                if (query.closed === true && !query.closedAt) return 90;
                if (query.openedAt) return 5;
                if (query.closedAt) return 4;
                return 0;
            });
            Ticket.aggregate.mockResolvedValue([{ avgTime: 3600000 }]); // 1 hour

            const stats = await getTicketStats('guild1');
            expect(stats.total).toBe(100);
            expect(stats.open).toBe(10);
            expect(stats.closed).toBe(90);
            expect(stats.todayOpen).toBe(5);
            expect(stats.todayClosed).toBe(4);
            expect(stats.avgResponseTime).toBe(3600000);
        });
    });
});
