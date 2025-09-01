const axios = require('axios');

const openaiApiKey = process.env.OPENAI_API_KEY;
const openaiUrl = 'https://api.openai.com/v1/chat/completions';

async function generateSummary(posts) {
    const messages = posts.map(post => ({
        role: 'user',
        content: post.excerpt
    }));

    try {
        const response = await axios.post(openaiUrl, {
            model: 'gpt-3.5-turbo',
            messages: messages,
            max_tokens: 150
        }, {
            headers: {
                'Authorization': `Bearer ${openaiApiKey}`,
                'Content-Type': 'application/json'
            }
        });

        return response.data.choices[0].message.content;
    } catch (error) {
        console.error('Error generating summary:', error);
        throw new Error('Failed to generate summary');
    }
}

module.exports = {
    generateSummary
};