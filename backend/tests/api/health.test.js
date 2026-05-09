const request = require('supertest');
const app = require('../../server'); // Importe l'application Express sans la démarrer

describe('API Integration Tests - Health Check', () => {
    it('GET /health should return 200 OK and UP status', async () => {
        const response = await request(app).get('/health');
        
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('status', 'UP');
        expect(response.body).toHaveProperty('timestamp');
        expect(response.body).toHaveProperty('env');
    });

    it('GET /api/ should trigger the rate limiter (or 404 if no exact route)', async () => {
        const response = await request(app).get('/api/');
        // Puisque la route /api/ racine n'existe pas, elle renverra 404 (mais le rate limit est appliqué avant)
        expect(response.status).toBe(404);
    });
});
