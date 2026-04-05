const request = require('supertest');

jest.mock('../../server/src/reddit', () => ({
  fetchMentions: jest.fn(),
}));

jest.mock('../../server/src/utils/openai', () => ({
  generateSummary: jest.fn(),
}));

const { fetchMentions } = require('../../server/src/reddit');
const { generateSummary } = require('../../server/src/utils/openai');
const app = require('../../server/src/index');
const { clearCache } = require('../../server/src/index');

const API_KEY = process.env.CHATTERPING_API_KEY;

beforeEach(() => {
  clearCache();
});

const mockMentions = [
  {
    id: 'post-1',
    title: 'ChatterPing launch update',
    url: 'https://reddit.com/r/startups/post-1',
    excerpt: 'People are discussing the launch and onboarding flow.',
    subreddit: 'startups',
    author: 'user1',
    score: 33,
    numComments: 10,
    createdAt: '2026-03-01T10:00:00.000Z',
  },
  {
    id: 'post-2',
    title: 'ChatterPing feedback thread',
    url: 'https://reddit.com/r/SaaS/post-2',
    excerpt: 'Mixed sentiment around notifications and summary quality.',
    subreddit: 'SaaS',
    author: 'user2',
    score: 21,
    numComments: 7,
    createdAt: '2026-03-02T10:00:00.000Z',
  },
];

describe('GET /summarize', () => {
  test('should return 401 when API key is missing', async () => {
    const response = await request(app).get('/summarize').query({ keyword: 'Test' });

    expect(response.status).toBe(401);
    expect(response.body.error).toMatch(/Unauthorized/);
  });

  test('should return 400 when keyword query param is missing', async () => {
    const response = await request(app)
      .get('/summarize')
      .set('x-api-key', API_KEY);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Keyword parameter is required' });
  });

  test('should return summary payload when mentions are found', async () => {
    fetchMentions.mockResolvedValue({ mentions: mockMentions, mock: false, reason: null });
    generateSummary.mockResolvedValue('Positive momentum with a few reliability concerns.');

    const response = await request(app)
      .get('/summarize')
      .set('x-api-key', API_KEY)
      .query({ keyword: 'ChatterPing' });

    expect(response.status).toBe(200);
    expect(fetchMentions).toHaveBeenCalledWith('ChatterPing');
    expect(generateSummary).toHaveBeenCalledWith(mockMentions, 'ChatterPing');

    expect(response.body.summary).toBe('Positive momentum with a few reliability concerns.');
    expect(response.body.mentionCount).toBe(2);
    expect(response.body.keyword).toBe('ChatterPing');
    expect(response.body.lastUpdated).toBeDefined();
    expect(Array.isArray(response.body.samplePosts)).toBe(true);
    expect(response.body.samplePosts).toHaveLength(2);
  });

  test('should return no-mentions response when mentions array is empty', async () => {
    fetchMentions.mockResolvedValue({ mentions: [], mock: true, reason: 'No mentions found' });

    const response = await request(app)
      .get('/summarize')
      .set('x-api-key', API_KEY)
      .query({ keyword: 'NoSuchKeyword' });

    expect(response.status).toBe(200);
    expect(fetchMentions).toHaveBeenCalledWith('NoSuchKeyword');
    expect(generateSummary).not.toHaveBeenCalled();
    expect(response.body).toEqual({
      summary: 'No recent mentions found for NoSuchKeyword.',
      mentionCount: 0,
      keyword: 'NoSuchKeyword',
    });
  });

  test('should return 500 when reddit fetch fails', async () => {
    fetchMentions.mockRejectedValue(new Error('Reddit is unavailable'));

    const response = await request(app)
      .get('/summarize')
      .set('x-api-key', API_KEY)
      .query({ keyword: 'ChatterPing' });

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Failed to generate summary');
    expect(response.body.message).toBe('Reddit is unavailable');
  });

  test('should return 500 when summary generation fails', async () => {
    fetchMentions.mockResolvedValue({ mentions: mockMentions, mock: false, reason: null });
    generateSummary.mockRejectedValue(new Error('OpenAI timeout'));

    const response = await request(app)
      .get('/summarize')
      .set('x-api-key', API_KEY)
      .query({ keyword: 'ChatterPing' });

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Failed to generate summary');
    expect(response.body.message).toBe('OpenAI timeout');
  });
});
