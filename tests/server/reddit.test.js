const { transformRedditData, removeDuplicates, strictFilter } = require('../../server/src/reddit');

// --- transformRedditData ---

describe('transformRedditData', () => {
  const makeChild = (overrides = {}) => ({
    data: {
      id: 'abc123',
      title: 'Test Post Title',
      permalink: '/r/test/comments/abc123/test_post/',
      selftext: 'Some body text here.',
      subreddit: 'test',
      author: 'testuser',
      score: 42,
      num_comments: 5,
      created_utc: 1700000000,
      ...overrides,
    },
  });

  test('transforms valid Reddit API data into correct shape', () => {
    const children = [makeChild()];
    const result = transformRedditData(children);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      id: 'abc123',
      title: 'Test Post Title',
      url: 'https://www.reddit.com/r/test/comments/abc123/test_post/',
      excerpt: 'Some body text here.',
      subreddit: 'test',
      author: 'testuser',
      score: 42,
      numComments: 5,
      createdAt: new Date(1700000000 * 1000).toISOString(),
    });
  });

  test('truncates excerpt to 200 chars with ellipsis', () => {
    const longText = 'A'.repeat(250);
    const result = transformRedditData([makeChild({ selftext: longText })]);

    expect(result[0].excerpt).toBe('A'.repeat(200) + '...');
  });

  test('uses title as excerpt when selftext is empty', () => {
    const result = transformRedditData([makeChild({ selftext: '' })]);
    expect(result[0].excerpt).toBe('Test Post Title');
  });

  test('returns empty array for empty input', () => {
    expect(transformRedditData([])).toEqual([]);
  });

  test('handles multiple children correctly', () => {
    const children = [
      makeChild({ id: 'a', title: 'First' }),
      makeChild({ id: 'b', title: 'Second' }),
      makeChild({ id: 'c', title: 'Third' }),
    ];
    const result = transformRedditData(children);
    expect(result).toHaveLength(3);
    expect(result.map(r => r.id)).toEqual(['a', 'b', 'c']);
  });
});

// --- removeDuplicates ---

describe('removeDuplicates', () => {
  test('removes mentions with duplicate IDs', () => {
    const mentions = [
      { id: '1', title: 'First' },
      { id: '2', title: 'Second' },
      { id: '1', title: 'First duplicate' },
    ];
    const result = removeDuplicates(mentions);
    expect(result).toHaveLength(2);
    expect(result[0].title).toBe('First');
    expect(result[1].title).toBe('Second');
  });

  test('keeps all when no duplicates', () => {
    const mentions = [
      { id: '1', title: 'A' },
      { id: '2', title: 'B' },
    ];
    expect(removeDuplicates(mentions)).toHaveLength(2);
  });

  test('returns empty array for empty input', () => {
    expect(removeDuplicates([])).toEqual([]);
  });

  test('handles single item', () => {
    const result = removeDuplicates([{ id: '1', title: 'Only' }]);
    expect(result).toEqual([{ id: '1', title: 'Only' }]);
  });
});

// --- strictFilter ---

describe('strictFilter', () => {
  // Use recent dates to pass the 6-month recency filter
  const recentDate = new Date().toISOString();

  const makeMention = (title, excerpt) => ({
    id: Math.random().toString(36).slice(2),
    title,
    excerpt,
    createdAt: recentDate,
  });

  test('keeps mention when keyword is in title only', () => {
    const result = strictFilter(
      [makeMention('ChatterPing is great', 'No keyword here')],
      'ChatterPing'
    );
    expect(result).toHaveLength(1);
  });

  test('keeps mention when keyword is in excerpt only', () => {
    const result = strictFilter(
      [makeMention('Some random title', 'I love ChatterPing so much')],
      'ChatterPing'
    );
    expect(result).toHaveLength(1);
  });

  test('filters out mention when keyword is in neither title nor excerpt', () => {
    const result = strictFilter(
      [makeMention('Unrelated post', 'Nothing relevant here')],
      'ChatterPing'
    );
    expect(result).toHaveLength(0);
  });

  test('matching is case-insensitive', () => {
    const result = strictFilter(
      [makeMention('chatterping rocks', 'test')],
      'ChatterPing'
    );
    expect(result).toHaveLength(1);
  });

  test('matches camelCase keyword split into words', () => {
    // strictFilter generates variations like "Central Dispatch" from "CentralDispatch"
    const result = strictFilter(
      [makeMention('Central Dispatch discussion', 'test')],
      'CentralDispatch'
    );
    expect(result).toHaveLength(1);
  });

  test('filters out posts older than 6 months', () => {
    const oldDate = new Date();
    oldDate.setMonth(oldDate.getMonth() - 7);
    const mentions = [{
      id: 'old',
      title: 'ChatterPing ancient post',
      excerpt: 'ChatterPing stuff',
      createdAt: oldDate.toISOString(),
    }];
    const result = strictFilter(mentions, 'ChatterPing');
    expect(result).toHaveLength(0);
  });

  test('returns empty array for empty input', () => {
    expect(strictFilter([], 'anything')).toEqual([]);
  });

  test('partial word match works (keyword is substring)', () => {
    const result = strictFilter(
      [makeMention('MyChatterPingApp review', 'test')],
      'ChatterPing'
    );
    expect(result).toHaveLength(1);
  });
});
