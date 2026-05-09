jest.mock('../../src/utils/logger', () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    success: jest.fn(),
    debug: jest.fn(),
    command: jest.fn(),
    database: jest.fn(),
    event: jest.fn(),
    separator: jest.fn(),
}));

const { calculateXPForLevel } = require('../../src/services/levelingService');

describe('calculateXPForLevel', () => {
    test('returns 0 for level 0', () => {
        expect(calculateXPForLevel(0)).toBe(0);
    });

    test('returns 55 for level 1', () => {
        expect(calculateXPForLevel(1)).toBe(55);
    });

    test('returns 375 for level 5', () => {
        expect(calculateXPForLevel(5)).toBe(375);
    });

    test('returns 1000 for level 10', () => {
        expect(calculateXPForLevel(10)).toBe(1000);
    });

    test('returns 15000 for level 50', () => {
        expect(calculateXPForLevel(50)).toBe(15000);
    });

    test('returns 55000 for level 100', () => {
        expect(calculateXPForLevel(100)).toBe(55000);
    });

    test('returns integer (floor)', () => {
        const result = calculateXPForLevel(3.7);
        expect(Number.isInteger(result)).toBe(true);
    });
});
