const axios = require('axios');

async function fetchMentions(keyword) {
    try {
        // Try multiple search strategies for better results
        const mentions = await searchMultipleStrategies(keyword);
        
        console.log(`Found ${mentions.length} Reddit mentions for "${keyword}" using multi-strategy search`);
        
        // If no results found (possibly due to Reddit blocking cloud IPs), use mock data
        if (mentions.length === 0) {
            console.log('No Reddit results found (may be blocked), using mock data');
            return {
                mentions: [],
                mock: true,
                reason: 'No Reddit mentions found for the subject or Reddit API may be blocked.'
            };
        }
        
        return {
            mentions,
            mock: false,
            reason: null
        };

    } catch (error) {
        console.error('Error fetching Reddit mentions:', error.message);
        // Fallback to mock data if Reddit API fails
        console.log('Falling back to mock data');
        return {
            mentions: [],
            mock: true,
            reason: 'Error fetching Reddit mentions or server issue.'
        };
    }
}

async function searchMultipleStrategies(keyword) {
    const allMentions = [];
    const keywordLower = keyword.toLowerCase();
    
    // Strategy 1: Exact phrase search in quotes
    try {
        const exactPhraseResults = await searchReddit(`"${keyword}"`, 'new', 15);
        allMentions.push(...exactPhraseResults);
    } catch (error) {
        console.warn('Exact phrase search failed:', error.message);
    }
    
    // Strategy 2: General search (most recent)
    try {
        const generalResults = await searchReddit(keyword, 'new', 15);
        allMentions.push(...generalResults);
    } catch (error) {
        console.warn('General search failed:', error.message);
    }
    
    // Strategy 3: Search with keyword variations (for camelCase keywords)
    const variations = [
        keyword,
        keyword.replace(/([A-Z])/g, ' $1').trim(), // CentralDispatch -> Central Dispatch
        keyword.replace(/([a-z])([A-Z])/g, '$1 $2'), // camelCase -> camel Case
    ];
    
    for (const variation of variations) {
        if (variation !== keyword) {
            try {
                const variationResults = await searchReddit(variation, 'new', 5);
                allMentions.push(...variationResults);
            } catch (error) {
                console.warn(`Search for variation "${variation}" failed:`, error.message);
            }
        }
    }
    
    // Remove duplicates and apply strict filtering
    const uniqueMentions = removeDuplicates(allMentions);
    const strictlyFilteredMentions = strictFilter(uniqueMentions, keyword);
    
    return strictlyFilteredMentions.slice(0, 25); // Limit to 25 results
}

async function searchReddit(query, sort = 'new', limit = 10) {
    const searchUrl = `https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&sort=${sort}&limit=${limit}&type=link&restrict_sr=false`;
    
    const response = await axios.get(searchUrl, {
        headers: {
            'User-Agent': 'ChatterPing/1.0 (Chrome Extension for keyword monitoring)',
            'Accept': 'application/json'
        }
    });

    // Check if we got HTML instead of JSON (blocked)
    if (typeof response.data === 'string' && response.data.includes('<html')) {
        throw new Error('Reddit API returned HTML (likely blocked)');
    }

    return transformRedditData(response.data.data.children);
}

function transformRedditData(children) {
    return children.map(post => {
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
}

function removeDuplicates(mentions) {
    const seen = new Set();
    return mentions.filter(mention => {
        if (seen.has(mention.id)) {
            return false;
        }
        seen.add(mention.id);
        return true;
    });
}

function strictFilter(mentions, keyword) {
    const keywordLower = keyword.toLowerCase();
    const keywordVariations = [
        keywordLower,
        keyword.replace(/([A-Z])/g, ' $1').trim().toLowerCase(), // CentralDispatch -> central dispatch
        keyword.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase(), // camelCase -> camel case
    ];
    
    // Calculate 6 months ago for recency filtering
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    return mentions.filter(mention => {
        const title = mention.title.toLowerCase();
        const excerpt = mention.excerpt.toLowerCase();
        const combinedText = `${title} ${excerpt}`;
        const postDate = new Date(mention.createdAt);
        
        // Check if any variation of the keyword appears in the content
        const hasKeyword = keywordVariations.some(variation => 
            combinedText.includes(variation)
        );
        
        if (!hasKeyword) return false;
        
        // Filter out posts older than 6 months
        if (postDate < sixMonthsAgo) {
            console.log(`Filtering out old post (${postDate.toDateString()}): "${mention.title}"`);
            return false;
        }
        
        return true;
    });
}

module.exports = { fetchMentions };