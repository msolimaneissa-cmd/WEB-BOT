jest.mock('../../src/utils/logger', () => ({
    info: jest.fn(),
    error: jest.fn(),
}));

const {
    play,
    pause,
    resume,
    skip,
    stop,
    shuffle,
    setRepeatMode,
    formatDuration,
    createProgressBar
} = require('../../src/services/musicService');

describe('musicService', () => {
    describe('formatDuration', () => {
        test('formats seconds to mm:ss correctly', () => {
            expect(formatDuration(0)).toBe('0:00');
            expect(formatDuration(45)).toBe('0:45');
            expect(formatDuration(65)).toBe('1:05');
            expect(formatDuration(125)).toBe('2:05');
            expect(formatDuration(600)).toBe('10:00');
        });

        test('returns 0:00 for invalid inputs', () => {
            expect(formatDuration(null)).toBe('0:00');
            expect(formatDuration(undefined)).toBe('0:00');
            expect(formatDuration('string')).toBe('0:00');
            expect(formatDuration({})).toBe('0:00');
        });
    });

    describe('createProgressBar', () => {
        test('generates accurate progress bar', () => {
            const bar0 = createProgressBar(0);
            expect(bar0).toContain('░'.repeat(15));
            expect(bar0).not.toContain('▓');

            const bar1 = createProgressBar(1);
            expect(bar1).toContain('▓'.repeat(15));
            expect(bar1).not.toContain('░');
            
            const middleBar = createProgressBar(0.5);
            expect(middleBar.split('▓').length - 1).toBe(8); // Math.round(15 * 0.5) = 8
            expect(middleBar.split('░').length - 1).toBe(7);
        });
    });

    describe('Distube Wrapper Functions', () => {
        let mockDistube;
        let mockQueue;

        beforeEach(() => {
            mockQueue = {
                pause: jest.fn(),
                resume: jest.fn(),
                skip: jest.fn().mockResolvedValue(true),
                stop: jest.fn().mockResolvedValue(true),
                shuffle: jest.fn(),
                songs: [{ id: 1 }, { id: 2 }]
            };

            mockDistube = {
                getQueue: jest.fn().mockReturnValue(mockQueue),
                play: jest.fn().mockResolvedValue(true)
            };
        });

        test('pause successfully', async () => {
            const result = await pause('guild1', mockDistube);
            expect(mockDistube.getQueue).toHaveBeenCalledWith('guild1');
            expect(mockQueue.pause).toHaveBeenCalled();
            expect(result.success).toBe(true);
        });

        test('pause fails if no queue', async () => {
            mockDistube.getQueue.mockReturnValue(null);
            const result = await pause('guild1', mockDistube);
            expect(mockDistube.getQueue).toHaveBeenCalledWith('guild1');
            expect(result.success).toBe(false);
            expect(result.error).toBe('لا توجد أغنية قيد التشغيل');
        });

        test('resume successfully', async () => {
            const result = await resume('guild1', mockDistube);
            expect(mockQueue.resume).toHaveBeenCalled();
            expect(result.success).toBe(true);
        });

        test('skip successfully', async () => {
            const result = await skip('guild1', mockDistube);
            expect(mockQueue.skip).toHaveBeenCalled();
            expect(result.success).toBe(true);
        });

        test('skip fails if 1 or 0 songs', async () => {
            mockQueue.songs = [{ id: 1 }];
            const result = await skip('guild1', mockDistube);
            expect(mockQueue.skip).not.toHaveBeenCalled();
            expect(result.success).toBe(false);
            expect(result.error).toBe('لا توجد أغاني أخرى في القائمة');
        });

        test('stop successfully', async () => {
            const result = await stop('guild1', mockDistube);
            expect(mockQueue.stop).toHaveBeenCalled();
            expect(result.success).toBe(true);
        });

        test('setRepeatMode sets correct repeat type', async () => {
            await setRepeatMode('guild1', mockDistube, 'song');
            expect(mockQueue.repeat).toBe(1);

            await setRepeatMode('guild1', mockDistube, 'queue');
            expect(mockQueue.repeat).toBe(2);

            await setRepeatMode('guild1', mockDistube, 'off');
            expect(mockQueue.repeat).toBe(0);
        });
    });
});
