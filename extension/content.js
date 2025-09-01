// Content script for ChatterPing extension
// This script runs on all web pages to potentially detect keywords

console.log('ChatterPing content script loaded');

// For now, this is a placeholder
// In the future, this could:
// 1. Scan page content for keywords
// 2. Highlight mentions of tracked keywords
// 3. Send data back to background script

// Example: Listen for keyword mentions on the page
function detectKeywords() {
    const keywords = ['CentralDispatch']; // This would come from storage later
    const pageText = document.body.innerText.toLowerCase();
    
    keywords.forEach(keyword => {
        if (pageText.includes(keyword.toLowerCase())) {
            console.log(`ChatterPing: Found "${keyword}" on this page`);
            // Could send message to background script here
        }
    });
}

// Run detection when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', detectKeywords);
} else {
    detectKeywords();
}
