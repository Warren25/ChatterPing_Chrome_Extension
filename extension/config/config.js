// Configuration for ChatterPing Extension
const CONFIG = {
    // Set to true for production, false for local development
    USE_PRODUCTION: false,
    
    // API URLs
    DEV_API_URL: 'http://localhost:3001',
    PROD_API_URL: 'https://chatterping-api.onrender.com',

    // API key — must match CHATTERPING_API_KEY on the server
    API_KEY: 'cb629b1027de83ea18322180343ed6de7f55b8335801b9b1'
};

// Use this in all fetch calls
const API_URL = CONFIG.USE_PRODUCTION ? CONFIG.PROD_API_URL : CONFIG.DEV_API_URL;

// Standard headers for authenticated API requests
const API_HEADERS = { 'x-api-key': CONFIG.API_KEY };
