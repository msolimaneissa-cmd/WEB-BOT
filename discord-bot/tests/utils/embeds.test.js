const mockEmbedBuilder = jest.fn().mockImplementation(() => {
    const embed = {
        setColor: jest.fn().mockReturnThis(),
        setTitle: jest.fn().mockReturnThis(),
        setDescription: jest.fn().mockReturnThis(),
        setFooter: jest.fn().mockReturnThis(),
        setThumbnail: jest.fn().mockReturnThis(),
        setImage: jest.fn().mockReturnThis(),
        setURL: jest.fn().mockReturnThis(),
        setAuthor: jest.fn().mockReturnThis(),
        addFields: jest.fn().mockReturnThis(),
        setTimestamp: jest.fn().mockReturnThis(),
        toJSON: jest.fn().mockReturnValue({}),
    };

    embed.toJSON.mockImplementation(() => ({
        color: embed.color,
        title: embed.title,
        description: embed.description,
        footer: embed.footer,
        timestamp: embed.timestamp
    }));

    embed.setColor.mockImplementation((color) => {
        embed.color = color;
        return embed;
    });
    embed.setTitle.mockImplementation((title) => {
        embed.title = title;
        return embed;
    });
    embed.setDescription.mockImplementation((description) => {
        embed.description = description;
        return embed;
    });
    embed.setFooter.mockImplementation((footer) => {
        embed.footer = footer;
        return embed;
    });
    embed.setTimestamp.mockImplementation(() => {
        embed.timestamp = new Date();
        return embed;
    });

    return embed;
});

// Mock discord.js
jest.mock('discord.js', () => ({
    EmbedBuilder: mockEmbedBuilder
}), { virtual: true });

const { createSuccessEmbed, createErrorEmbed, createInfoEmbed } = require('../../src/utils/embeds');

describe('Embed Utility Functions', () => {
    const title = 'Test Title';
    const description = 'Test Description';

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('createSuccessEmbed should return a success embed', () => {
        const embed = createSuccessEmbed(title, description);
        const data = embed.toJSON();

        expect(mockEmbedBuilder).toHaveBeenCalled();
        expect(embed.setColor).toHaveBeenCalledWith(0x57F287);
        expect(embed.setTitle).toHaveBeenCalledWith(title);
        expect(embed.setDescription).toHaveBeenCalledWith(description);
        expect(embed.setFooter).toHaveBeenCalled();
        expect(embed.setTimestamp).toHaveBeenCalled();

        expect(data.color).toBe(0x57F287);
        expect(data.title).toBe(title);
        expect(data.description).toBe(description);
        expect(data.footer).toBeDefined();
        expect(data.timestamp).toBeDefined();
    });

    test('createErrorEmbed should return an error embed', () => {
        const embed = createErrorEmbed(title, description);
        const data = embed.toJSON();

        expect(mockEmbedBuilder).toHaveBeenCalled();
        expect(embed.setColor).toHaveBeenCalledWith(0xED4245);
        expect(embed.setTitle).toHaveBeenCalledWith(title);
        expect(embed.setDescription).toHaveBeenCalledWith(description);
        expect(embed.setFooter).toHaveBeenCalled();
        expect(embed.setTimestamp).toHaveBeenCalled();

        expect(data.color).toBe(0xED4245);
        expect(data.title).toBe(title);
        expect(data.description).toBe(description);
        expect(data.footer).toBeDefined();
        expect(data.timestamp).toBeDefined();
    });

    test('createInfoEmbed should return an info embed', () => {
        const embed = createInfoEmbed(title, description);
        const data = embed.toJSON();

        expect(mockEmbedBuilder).toHaveBeenCalled();
        expect(embed.setColor).toHaveBeenCalledWith(0x5865F2);
        expect(embed.setTitle).toHaveBeenCalledWith(title);
        expect(embed.setDescription).toHaveBeenCalledWith(description);
        expect(embed.setFooter).toHaveBeenCalled();
        expect(embed.setTimestamp).toHaveBeenCalled();

        expect(data.color).toBe(0x5865F2);
        expect(data.title).toBe(title);
        expect(data.description).toBe(description);
        expect(data.footer).toBeDefined();
        expect(data.timestamp).toBeDefined();
    });
});
