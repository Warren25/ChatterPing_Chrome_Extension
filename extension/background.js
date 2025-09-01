// Background script for ChatterPing extension
// This runs in the background and handles extension lifecycle events

console.log('ChatterPing background script loaded');

// Set up extension icon badge
chrome.action.setBadgeBackgroundColor({color: '#FF0000'});

// Initialize badge count
updateBadgeCount(0);

// Function to update badge count
function updateBadgeCount(count) {
    chrome.action.setBadgeText({
        text: count > 0 ? count.toString() : ''
    });
}

// Listen for extension installation
chrome.runtime.onInstalled.addListener(() => {
    console.log('ChatterPing extension installed');
    
    // Set default storage values
    chrome.storage.sync.set({
        keyword: 'CentralDispatch',
        checkInterval: 30, // minutes
        lastCheck: Date.now()
    });
});

// Periodic check for new mentions (example)
function checkForMentions() {
    fetch('http://localhost:3001/summarize')
        .then(response => response.json())
        .then(data => {
            if (data.mentionCount) {
                updateBadgeCount(data.mentionCount);
            }
        })
        .catch(error => {
            console.error('Error checking mentions:', error);
        });
}

// Set up periodic checks (every 30 minutes)
chrome.alarms.create('checkMentions', { periodInMinutes: 30 });

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'checkMentions') {
        checkForMentions();
    }
});