const request = require('supertest');

jest.mock('../../server/src/reddit', () => ({
  fetchMentions: jest.fn(),
}));

const { fetchMentions } = require('../../server/src/reddit');
const app = require('../../server/src/index');

const mockMentions = [
  {
    id: 'debug-post-1',
    title: 'Debug post about ChatterPing',
    url: 'https://reddit.com/r/startups/debug-post-1',
    excerpt: 'This is a long debug excerpt about ChatterPing behavior in the wild.',
    subreddit: 'startups',
    author: 'debug_user',
    score: 12,
    numComments: 3,
    createdAt: '2026-03-10T10:00:00.000Z',
  },
];

describe('GET /', () => {
  test('should return API metadata and endpoint list', async () => {
    const response = await request(app).get('/');

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('ChatterPing API Server');
    expect(response.body.version).toBeDefined();
    expect(Array.isArray(response.body.endpoints)).toBe(true);
    expect(response.body.endpoints).toContain('GET /health - Server health check');
    expect(response.body.endpoints).toContain('GET /summarize - Get AI summary of mentions');
  });
});

describe('GET /debug/reddit', () => {
  test('should return 400 when keyword query param is missing', async () => {
    const response = await request(app).get('/debug/reddit');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Keyword parameter is required' });
  });

  test('should return transformed debug payload when mentions are found', async () => {
    fetchMentions.mockResolvedValue(mockMentions);

    const response = await request(app)
      .get('/debug/reddit')
      .query({ keyword: 'ChatterPing' });

    expect(response.status).toBe(200);
    expect(fetchMentions).toHaveBeenCalledWith('ChatterPing');
    expect(response.body.keyword).toBe('ChatterPing');
    expect(response.body.count).toBe(1);
    expect(Array.isArray(response.body.posts)).toBe(true);
    expect(response.body.posts).toHaveLength(1);
    expect(response.body.posts[0]).toEqual(
      expect.objectContaining({
        id: 'debug-post-1',
        title: 'Debug post about ChatterPing',
        subreddit: 'startups',
        author: 'debug_user',
        score: 12,
        numComments: 3,
        url: 'https://reddit.com/r/startups/debug-post-1',
        createdAt: '2026-03-10T10:00:00.000Z',
      })
    );
    expect(response.body.posts[0].excerpt.endsWith('...')).toBe(true);
  });

  test('should return 500 when mention fetch fails', async () => {
    fetchMentions.mockRejectedValue(new Error('Reddit API unavailable'));

    const response = await request(app)
      .get('/debug/reddit')
      .query({ keyword: 'ChatterPing' });

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Failed to fetch Reddit data');
    expect(response.body.message).toBe('Reddit API unavailable');
  });
});

describe('CORS behavior', () => {
  test('should allow localhost origin', async () => {
    const response = await request(app)
      .get('/health')
      .set('Origin', 'http://localhost:5173');

    expect(response.status).toBe(200);
    expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(response.headers['access-control-allow-credentials']).toBe('true');
  });

  test('should allow chrome-extension origin', async () => {
    const response = await request(app)
      .get('/health')
      .set('Origin', 'chrome-extension://abcdefghijklmnop');

    expect(response.status).toBe(200);
    expect(response.headers['access-control-allow-origin']).toBe('chrome-extension://abcdefghijklmnop');
    expect(response.headers['access-control-allow-credentials']).toBe('true');
  });

  test('should reject non-allowed origin in non-production mode', async () => {
    const response = await request(app)
      .get('/health')
      .set('Origin', 'https://malicious.example.com');

    expect(response.status).toBe(500);
    expect(response.text).toContain('Not allowed by CORS');
  });
});
