const axios = require('axios');

const openaiApiKey = process.env.OPENAI_API_KEY;
const openaiUrl = 'https://api.openai.com/v1/chat/completions';

async function generateSummary(posts, keyword) {
    // Fallback if no API key
    if (!openaiApiKey || openaiApiKey === 'your_openai_api_key_here') {
        console.log('OpenAI API key not configured, using fallback summary');
        return {
            summary: `Found ${posts.length} mentions of "${keyword}". The overall sentiment appears mixed with users sharing various opinions and experiences. Most recent discussions involve community feedback and general topics related to ${keyword}.`,
            sentimentScore: 5.0,
            sentimentLabel: 'mixed'
        };
    }

    // Build context from posts
    const postsContext = posts.map((post, i) => 
        `[${i + 1}] r/${post.subreddit}: "${post.title}"\n${post.excerpt}`
    ).join('\n\n');

    const systemPrompt = `You are a brand monitoring assistant. Analyze social media mentions and respond with ONLY valid JSON (no markdown fences). The JSON must have exactly these keys:
- "summary": A brief, actionable summary under 100 words covering overall sentiment, key themes, notable praise/complaints, and urgent issues.
- "sentimentScore": A number from 0.0 to 10.0 (one decimal) where 0 = extremely negative, 5 = neutral, 10 = extremely positive.
- "sentimentLabel": One of "very negative", "negative", "mixed", "positive", or "very positive".`;

    const userPrompt = `Analyze these ${posts.length} recent mentions of "${keyword}":\n\n${postsContext}`;

    try {
        const response = await axios.post(openaiUrl, {
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            max_tokens: 300,
            temperature: 0.7
        }, {
            headers: {
                'Authorization': `Bearer ${openaiApiKey}`,
                'Content-Type': 'application/json'
            }
        });

        const raw = response.data.choices[0].message.content.trim();
        try {
            const parsed = JSON.parse(raw);
            return {
                summary: parsed.summary || raw,
                sentimentScore: typeof parsed.sentimentScore === 'number' ? parsed.sentimentScore : 5.0,
                sentimentLabel: parsed.sentimentLabel || 'mixed'
            };
        } catch {
            // If JSON parsing fails, treat raw text as summary with neutral sentiment
            return { summary: raw, sentimentScore: 5.0, sentimentLabel: 'mixed' };
        }
    } catch (error) {
        console.error('Error generating summary:', error.response?.data || error.message);
        return {
            summary: `Found ${posts.length} mentions of "${keyword}". The overall sentiment appears mixed with users sharing various opinions and experiences. Most recent discussions involve community feedback and general topics related to ${keyword}.`,
            sentimentScore: 5.0,
            sentimentLabel: 'mixed'
        };
    }
}

module.exports = {
    generateSummary
};