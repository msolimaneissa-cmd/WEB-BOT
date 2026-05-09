module.exports = {
    testEnvironment: 'node',
    roots: ['<rootDir>/tests'],
    testMatch: ['**/*.test.js'],
    moduleFileExtensions: ['js', 'json'],
    moduleNameMapper: {
        '^chalk$': '<rootDir>/__mocks__/chalk.js',
        '^#ansi-styles$': '<rootDir>/__mocks__/chalk.js',
        '^#supports-color$': '<rootDir>/__mocks__/chalk.js',
    },
    transformIgnorePatterns: [
        '/node_modules/(?!(chalk|#ansi-styles|#supports-color)/)'
    ],
};
