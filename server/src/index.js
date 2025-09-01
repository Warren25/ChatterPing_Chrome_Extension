const express = require('express');
const cors = require('cors');
const { fetchMentions } = require('./reddit');
const { generateSummary } = require('./utils/openai');

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for extension
app.use(cors({
  origin: ['chrome-extension://*', 'http://localhost:*']
}));

app.use(express.json());

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'ChatterPing API Server',
    version: '0.1.0',
    endpoints: [
      'GET /health - Server health check',
      'GET /summarize - Get AI summary of mentions'
    ]
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Updated /summarize endpoint
app.get('/summarize', async (req, res) => {
  try {
    // Fetch mentions for hardcoded keyword
    const keyword = 'CentralDispatch';
    const mentions = await fetchMentions(keyword);
    
    if (mentions.length === 0) {
      return res.json({ 
        summary: 'No recent mentions found for CentralDispatch.',
        mentionCount: 0,
        keyword: keyword
      });
    }

    // Generate AI summary
    const summary = await generateSummary(mentions);
    
    res.json({
      summary: summary,
      mentionCount: mentions.length,
      keyword: keyword,
      lastUpdated: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error in /summarize:', error);
    res.status(500).json({ 
      error: 'Failed to generate summary',
      message: error.message 
    });
  }
});

app.listen(PORT, () => {
  console.log(`ChatterPing server running on http://localhost:${PORT}`);
});