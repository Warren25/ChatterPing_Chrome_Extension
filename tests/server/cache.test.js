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
  jest.restoreAllMocks();
});

describe('Server-side response cache', () => {
  test('second identical request should use cache (fetchMentions called once)', async () => {
    fetchMentions.mockResolvedValue({ mentions: [], mock: true, reason: 'test' });

    await request(app)
      .get('/summarize')
      .set('x-api-key', API_KEY)
      .query({ keyword: 'CacheTest' });

    await request(app)
      .get('/summarize')
      .set('x-api-key', API_KEY)
      .query({ keyword: 'CacheTest' });

    expect(fetchMentions).toHaveBeenCalledTimes(1);
  });

  test('different keywords should cache independently', async () => {
    fetchMentions.mockResolvedValue({ mentions: [], mock: true, reason: 'test' });

    await request(app)
      .get('/summarize')
      .set('x-api-key', API_KEY)
      .query({ keyword: 'Alpha' });

    await request(app)
      .get('/summarize')
      .set('x-api-key', API_KEY)
      .query({ keyword: 'Beta' });

    expect(fetchMentions).toHaveBeenCalledTimes(2);
  });

  test('cache expires after 5 minutes (TTL)', async () => {
    fetchMentions.mockResolvedValue({ mentions: [], mock: true, reason: 'test' });

    const realNow = Date.now();
    const spy = jest.spyOn(Date, 'now');

    // First call at real time
    spy.mockReturnValue(realNow);
    await request(app)
      .get('/summarize')
      .set('x-api-key', API_KEY)
      .query({ keyword: 'TTLTest' });

    // Second call 6 minutes later (past 5-min TTL)
    spy.mockReturnValue(realNow + 6 * 60 * 1000);
    await request(app)
      .get('/summarize')
      .set('x-api-key', API_KEY)
      .query({ keyword: 'TTLTest' });

    expect(fetchMentions).toHaveBeenCalledTimes(2);
  });

  test('clearCache forces refetch on next request', async () => {
    fetchMentions.mockResolvedValue({ mentions: [], mock: true, reason: 'test' });

    await request(app)
      .get('/summarize')
      .set('x-api-key', API_KEY)
      .query({ keyword: 'ClearTest' });

    clearCache();

    await request(app)
      .get('/summarize')
      .set('x-api-key', API_KEY)
      .query({ keyword: 'ClearTest' });

    expect(fetchMentions).toHaveBeenCalledTimes(2);
  });

  test('cache is case-insensitive for keywords', async () => {
    fetchMentions.mockResolvedValue({ mentions: [], mock: true, reason: 'test' });

    await request(app)
      .get('/summarize')
      .set('x-api-key', API_KEY)
      .query({ keyword: 'MyApp' });

    await request(app)
      .get('/summarize')
      .set('x-api-key', API_KEY)
      .query({ keyword: 'myapp' });

    expect(fetchMentions).toHaveBeenCalledTimes(1);
  });
});
