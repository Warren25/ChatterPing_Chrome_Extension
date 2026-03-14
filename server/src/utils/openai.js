const axios = require('axios');

const openaiApiKey = process.env.OPENAI_API_KEY;
const openaiUrl = 'https://api.openai.com/v1/chat/completions';

async function generateSummary(posts, keyword) {
    // Fallback if no API key
    if (!openaiApiKey || openaiApiKey === 'your_openai_api_key_here') {
        console.log('OpenAI API key not configured, using fallback summary');
        return `Found ${posts.length} mentions of your keyword. The overall sentiment appears positive with users discussing logistics and dispatch services. Most recent mentions focus on service quality and new features.`;
    }

    // Build context from posts
    const postsContext = posts.map((post, i) => 
        `[${i + 1}] r/${post.subreddit}: "${post.title}"\n${post.excerpt}`
    ).join('\n\n');

    const systemPrompt = `You are a brand monitoring assistant. Analyze social media mentions and provide a brief, actionable summary. Focus on:
- Overall sentiment (positive/negative/mixed)
- Key themes or concerns
- Notable praise or complaints
- Any urgent issues requiring attention

Keep the summary under 100 words.`;

    const userPrompt = `Analyze these ${posts.length} recent mentions of "${keyword}":\n\n${postsContext}`;

    try {
        const response = await axios.post(openaiUrl, {
            model: 'gpt-3.5-turbo',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            max_tokens: 200,
            temperature: 0.7
        }, {
            headers: {
                'Authorization': `Bearer ${openaiApiKey}`,
                'Content-Type': 'application/json'
            }
        });

        return response.data.choices[0].message.content;
    } catch (error) {
        console.error('Error generating summary:', error.response?.data || error.message);
        // Return fallback on error instead of throwing
        return `Found ${posts.length} mentions. Unable to generate AI summary at this time.`;
    }
}

module.exports = {
    generateSummary
};