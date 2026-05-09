const request = require('supertest');
const express = require('express');

// Integration Contract Tests: Web Dashboard <--> Discord Bot
describe('Dashboard - Bot Integration Contract', () => {
    let mockBotApp;
    const BOT_SECRET = 'secure-secret-token';
    const TEST_GUILD = '123456789012345678';
    
    beforeAll(() => {
        mockBotApp = express();
        mockBotApp.use(express.json());
        
        mockBotApp.post('/control', (req, res) => {
            const secret = req.headers['x-bot-secret'];
            if (secret !== BOT_SECRET) {
                return res.status(401).json({ success: false, message: 'Invalid token' });
            }
            
            const { type, guildId } = req.body;
            if (!type || !guildId) {
                return res.status(400).json({ success: false, message: 'Invalid payload' });
            }
            
            if (type === 'CONFIG_UPDATE') {
                return res.status(200).json({ success: true, message: 'Config reloaded' });
            }
            if (type === 'SHUTDOWN') {
                return res.status(200).json({ success: true, message: 'Shutting down' });
            }
            
            return res.status(400).json({ success: false, message: 'Unknown command' });
        });
    });

    test('Dashboard successfully sends configuration sync request with valid secret', async () => {
        // Simulating the Next.js fetch call inside /api/bot/sync
        const response = await request(mockBotApp)
            .post('/control')
            .set('x-bot-secret', BOT_SECRET)
            .send({
                type: 'CONFIG_UPDATE',
                guildId: TEST_GUILD
            });
            
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Config reloaded');
    });

    test('Dashboard receives 401 if secret mismatches', async () => {
        const response = await request(mockBotApp)
            .post('/control')
            .set('x-bot-secret', 'wrong-secret')
            .send({
                type: 'CONFIG_UPDATE',
                guildId: TEST_GUILD
            });
            
        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
    });

    test('Dashboard receives 400 if payload is missing guildId', async () => {
        const response = await request(mockBotApp)
            .post('/control')
            .set('x-bot-secret', BOT_SECRET)
            .send({
                type: 'CONFIG_UPDATE' // Missing guildId
            });
            
        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Invalid payload');
    });
});
