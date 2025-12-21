// Configuration for ChatterPing Extension
const CONFIG = {
    // Development
    API_BASE_URL: window.location.hostname === 'localhost' 
        ? 'http://localhost:3001'
        : 'https://your-api-domain.com',
    
    // Production - update this after deploying backend
    PRODUCTION_API_URL: 'https://your-deployed-api.vercel.app'
};

// Use this in all fetch calls
const API_URL = CONFIG.API_BASE_URL;
