// Configuration for ChatterPing Extension
const CONFIG = {
    // API URLs
    DEV_API_URL: 'http://localhost:3001',
    PROD_API_URL: 'https://chatterping-api.onrender.com',

    // API key — must match CHATTERPING_API_KEY on the server
    API_KEY: 'cb629b1027de83ea18322180343ed6de7f55b8335801b9b1'
};

// Auto-detect environment: chrome-extension:// runs prod, everything else runs dev
const IS_EXTENSION = typeof chrome !== 'undefined'
    && chrome.runtime
    && chrome.runtime.id;
const API_URL = IS_EXTENSION ? CONFIG.PROD_API_URL : CONFIG.DEV_API_URL;

// Standard headers for authenticated API requests
const API_HEADERS = { 'x-api-key': CONFIG.API_KEY };
