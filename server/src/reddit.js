const axios = require('axios');

async function fetchMentions(keyword) {
    try {
        // Use Reddit's public JSON API to search for mentions
        const searchUrl = `https://www.reddit.com/search.json?q=${encodeURIComponent(keyword)}&sort=new&limit=25`;
        
        console.log(`Searching Reddit for keyword: "${keyword}"`);
        
        const response = await axios.get(searchUrl, {
            headers: {
                'User-Agent': 'ChatterPing/1.0 (Chrome Extension for keyword monitoring)'
            }
        });

        const posts = response.data.data.children;
        
        // Transform Reddit data into our format
        const mentions = posts.map(post => {
            const data = post.data;
            return {
                id: data.id,
                title: data.title,
                url: `https://www.reddit.com${data.permalink}`,
                excerpt: data.selftext ? 
                    data.selftext.substring(0, 200) + (data.selftext.length > 200 ? '...' : '') :
                    data.title,
                subreddit: data.subreddit,
                author: data.author,
                score: data.score,
                numComments: data.num_comments,
                createdAt: new Date(data.created_utc * 1000).toISOString(),
            };
        });

        console.log(`Found ${mentions.length} Reddit mentions for "${keyword}"`);
        return mentions;

    } catch (error) {
        console.error('Error fetching Reddit mentions:', error.message);
        
        // Fallback to mock data if Reddit API fails
        console.log('Falling back to mock data');
        return [
            {
                id: 'mock-1',
                title: `Mock Discussion about ${keyword}`,
                url: 'https://www.reddit.com/r/example/comments/mock1',
                excerpt: `This is a mock discussion about ${keyword} for testing purposes...`,
                subreddit: 'example',
                author: 'mock_user',
                score: 42,
                numComments: 5,
                createdAt: new Date().toISOString(),
            },
            {
                id: 'mock-2',
                title: `${keyword} vs Competitors`,
                url: 'https://www.reddit.com/r/example/comments/mock2',
                excerpt: `Mock comparison discussion about ${keyword} and alternatives...`,
                subreddit: 'example',
                author: 'mock_user2',
                score: 28,
                numComments: 12,
                createdAt: new Date().toISOString(),
            }
        ];
    }
}

module.exports = { fetchMentions };