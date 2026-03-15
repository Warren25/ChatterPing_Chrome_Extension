// Configuration for ChatterPing Extension
const CONFIG = {
    // Set to true for production, false for local development
    USE_PRODUCTION: true,
    
    // API URLs
    DEV_API_URL: 'http://localhost:3001',
    PROD_API_URL: 'https://chatterping-api.onrender.com'
};

// Use this in all fetch calls
const API_URL = CONFIG.USE_PRODUCTION ? CONFIG.PROD_API_URL : CONFIG.DEV_API_URL;
