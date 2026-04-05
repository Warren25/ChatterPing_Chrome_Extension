// Configuration for ChatterPing Extension
const CONFIG = {
    // API URLs
    DEV_API_URL: 'http://localhost:3001',
    PROD_API_URL: 'https://chatterping-api.onrender.com',

    // API key — must match CHATTERPING_API_KEY on the server
    API_KEY: '9bb3b3efb8cafd512225a06846724524583a11464e6d58a4'
};

// Auto-detect environment: chrome-extension:// runs prod, everything else runs dev
const IS_EXTENSION = typeof chrome !== 'undefined'
    && chrome.runtime
    && chrome.runtime.id;
const API_URL = IS_EXTENSION ? CONFIG.PROD_API_URL : CONFIG.DEV_API_URL;

// Standard headers for authenticated API requests
const API_HEADERS = { 'x-api-key': CONFIG.API_KEY };
