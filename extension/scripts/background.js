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
    
    // Migrate legacy single-keyword storage to keywords array
    chrome.storage.sync.get(['keyword', 'keywords'], (data) => {
        if (data.keyword && !data.keywords) {
            chrome.storage.sync.set({ keywords: [data.keyword] }, () => {
                chrome.storage.sync.remove('keyword');
            });
        }
        if (!data.keywords && !data.keyword) {
            chrome.storage.sync.set({ keywords: [] });
        }
    });

    // Set default storage values
    chrome.storage.sync.set({
        checkInterval: 30, // minutes
        lastCheck: Date.now()
    });

    scheduleAlarm(30);
    
    // Do initial check for mentions
    checkForMentions();
});

// Periodic check for new mentions across all keywords
function checkForMentions() {
    chrome.storage.sync.get(['keywords', 'checkInterval'], (result) => {
        const keywords = result.keywords || [];
        const checkInterval = parseInt(result.checkInterval, 10) || 30;

        scheduleAlarm(checkInterval);

        if (keywords.length === 0) {
            updateBadgeCount(0);
            console.log('No keywords configured; skipping mention check');
            return;
        }

        let totalMentions = 0;
        let completed = 0;

        keywords.forEach(keyword => {
            fetch(`${API_URL}/summarize?keyword=${encodeURIComponent(keyword)}`, {
                headers: API_HEADERS
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Mention check failed with status ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                const mentionCount = Number.isFinite(data.mentionCount) ? data.mentionCount : 0;
                totalMentions += mentionCount;
            })
            .catch(error => {
                console.error(`Error checking mentions for "${keyword}":`, error);
            })
            .finally(() => {
                completed++;
                if (completed === keywords.length) {
                    updateBadgeCount(totalMentions);
                    chrome.storage.sync.set({ lastCheck: Date.now() });
                    console.log(`Updated badge count to: ${totalMentions} across ${keywords.length} keyword(s)`);
                }
            });
        });
    });
}

// Keep alarm schedule in sync when settings are changed in the popup.
chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'sync' && changes.checkInterval) {
        const interval = parseInt(changes.checkInterval.newValue, 10) || 30;
        scheduleAlarm(interval);
    }
    if (areaName === 'sync' && changes.keywords) {
        checkForMentions();
    }
});

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'checkMentions') {
        checkForMentions();
    }
});