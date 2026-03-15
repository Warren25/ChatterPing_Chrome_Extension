const request = require('supertest');
const app = require('../../server/src/index');

describe('GET /health', () => {
  test('should return OK status and ISO timestamp', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('OK');
    expect(response.body.timestamp).toBeDefined();
    expect(new Date(response.body.timestamp).toString()).not.toBe('Invalid Date');
  });
});
