const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { fetchMentions } = require('./reddit');
const { generateSummary } = require('./utils/openai');

const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

const app = express();

// CORS configuration for development and production
const corsOptions = {
  origin: (origin, callback) => {
    // Allow Chrome extensions (they have chrome-extension:// origin)
    // Allow localhost for development
    // Allow requests with no origin (like mobile apps or curl)
    const allowedPatterns = [
      /^chrome-extension:\/\//,  // Chrome extensions
      /^http:\/\/localhost/,      // Local development
      /^http:\/\/127\.0\.0\.1/,   // Local development
    ];
    
    if (!origin || allowedPatterns.some(pattern => pattern.test(origin))) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};

app.use(cors(corsOptions));

console.log(`Server running in ${NODE_ENV} mode`);

app.use(express.json());

// API key authentication middleware for protected endpoints
const CHATTERPING_API_KEY = process.env.CHATTERPING_API_KEY;

function requireApiKey(req, res, next) {
  if (!CHATTERPING_API_KEY) {
    // If no key is configured, skip auth (development convenience)
    return next();
  }
  const provided = req.headers['x-api-key'];
  if (provided !== CHATTERPING_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized: invalid or missing API key' });
  }
  next();
}

// Rate limiting: 20 requests per minute per IP for protected endpoints
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});

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

// Debug endpoint to see raw Reddit data
app.get('/debug/reddit', apiLimiter, requireApiKey, async (req, res) => {
  try {
    const keyword = req.query.keyword;
    if (!keyword) {
      return res.status(400).json({ error: 'Keyword parameter is required' });
    }
    const { mentions } = await fetchMentions(keyword);
    
    res.json({
      keyword: keyword,
      count: mentions.length,
      posts: mentions.map(post => ({
        id: post.id,
        title: post.title,
        subreddit: post.subreddit,
        author: post.author,
        score: post.score,
        numComments: post.numComments,
        url: post.url,
        excerpt: post.excerpt.substring(0, 100) + '...',
        createdAt: post.createdAt
      }))
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch Reddit data',
      message: error.message 
    });
  }
});

// Updated /summarize endpoint
app.get('/summarize', apiLimiter, requireApiKey, async (req, res) => {
  try {
    // Fetch mentions for user's keyword
    const keyword = req.query.keyword;
    if (!keyword) {
      return res.status(400).json({ error: 'Keyword parameter is required' });
    }
    const { mentions } = await fetchMentions(keyword);
    
    if (mentions.length === 0) {
      return res.json({ 
        summary: `No recent mentions found for ${keyword}.`,
        mentionCount: 0,
        keyword: keyword
      });
    }

    // Generate AI summary
    const summary = await generateSummary(mentions, keyword);
    
    res.json({
      summary: summary,
      mentionCount: mentions.length,
      keyword: keyword,
      lastUpdated: new Date().toISOString(),
      samplePosts: mentions.slice(0, 3).map(post => ({
        title: post.title,
        subreddit: post.subreddit,
        score: post.score,
        url: post.url
      }))
    });
    
  } catch (error) {
    console.error('Error in /summarize:', error);
    res.status(500).json({ 
      error: 'Failed to generate summary',
      message: error.message 
    });
  }
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`ChatterPing server running on http://localhost:${PORT}`);
  });
}

module.exports = app;