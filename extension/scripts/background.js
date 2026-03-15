// Background script for ChatterPing extension
// This runs in the background and handles extension lifecycle events

// Import config
importScripts('../config/config.js');

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

function scheduleAlarm(checkInterval) {
    const interval = Number.isFinite(checkInterval) && checkInterval > 0 ? checkInterval : 30;
    chrome.alarms.create('checkMentions', { periodInMinutes: interval });
}

// Listen for extension installation
chrome.runtime.onInstalled.addListener(() => {
    console.log('ChatterPing extension installed');
    
    // Set default storage values (keyword left empty - user must configure)
    chrome.storage.sync.set({
        keyword: '',
        checkInterval: 30, // minutes
        lastCheck: Date.now()
    });

    scheduleAlarm(30);
    
    // Do initial check for mentions
    checkForMentions();
});

// Periodic check for new mentions (example)
function checkForMentions() {
    chrome.storage.sync.get(['keyword', 'checkInterval'], (result) => {
        const keyword = (result.keyword || '').trim();
        const checkInterval = parseInt(result.checkInterval, 10) || 30;

        scheduleAlarm(checkInterval);

        if (!keyword) {
            updateBadgeCount(0);
            console.log('No keyword configured; skipping mention check');
            return;
        }

        fetch(`${API_URL}/summarize?keyword=${encodeURIComponent(keyword)}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Mention check failed with status ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            const mentionCount = Number.isFinite(data.mentionCount) ? data.mentionCount : 0;
            updateBadgeCount(mentionCount);
            chrome.storage.sync.set({ lastCheck: Date.now() });
            console.log(`Updated badge count to: ${mentionCount} for "${keyword}"`);
        })
        .catch(error => {
            console.error('Error checking mentions:', error);
            updateBadgeCount(0);
        });
    });
}

// Keep alarm schedule in sync when settings are changed in the popup.
chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'sync' && changes.checkInterval) {
        const interval = parseInt(changes.checkInterval.newValue, 10) || 30;
        scheduleAlarm(interval);
    }
    if (areaName === 'sync' && changes.keyword) {
        checkForMentions();
    }
});

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'checkMentions') {
        checkForMentions();
    }
});

// Do initial check when background script loads
checkForMentions();