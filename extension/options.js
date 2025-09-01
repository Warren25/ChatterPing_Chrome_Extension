document.addEventListener('DOMContentLoaded', async () => {
    await loadSettings();
    setupEventListeners();
});

async function loadSettings() {
    try {
        const result = await chrome.storage.sync.get({
            keyword: 'CentralDispatch',
            checkInterval: 30,
            notifications: true,
            autoSummary: true
        });

        document.getElementById('keyword').value = result.keyword;
        document.getElementById('checkInterval').value = result.checkInterval;
        document.getElementById('notifications').checked = result.notifications;
        document.getElementById('autoSummary').checked = result.autoSummary;
    } catch (error) {
        console.error('Error loading settings:', error);
        showStatus('Error loading settings', 'error');
    }
}

function setupEventListeners() {
    const form = document.getElementById('options-form');
    const resetBtn = document.getElementById('resetBtn');

    form.addEventListener('submit', handleSave);
    resetBtn.addEventListener('click', handleReset);
}

async function handleSave(event) {
    event.preventDefault();
    
    try {
        const formData = new FormData(event.target);
        const settings = {
            keyword: formData.get('keyword').trim(),
            checkInterval: parseInt(formData.get('checkInterval')),
            notifications: document.getElementById('notifications').checked,
            autoSummary: document.getElementById('autoSummary').checked
        };

        // Validate keyword
        if (!settings.keyword) {
            throw new Error('Keyword is required');
        }

        // Save settings
        await chrome.storage.sync.set(settings);
        
        // Update alarm if interval changed
        await updateAlarm(settings.checkInterval);
        
        showStatus('Settings saved successfully!', 'success');
    } catch (error) {
        console.error('Error saving settings:', error);
        showStatus('Error saving settings: ' + error.message, 'error');
    }
}

async function handleReset() {
    try {
        const defaults = {
            keyword: 'CentralDispatch',
            checkInterval: 30,
            notifications: true,
            autoSummary: true
        };

        await chrome.storage.sync.set(defaults);
        await loadSettings();
        await updateAlarm(defaults.checkInterval);
        
        showStatus('Settings reset to defaults', 'success');
    } catch (error) {
        console.error('Error resetting settings:', error);
        showStatus('Error resetting settings', 'error');
    }
}

async function updateAlarm(intervalMinutes) {
    try {
        // Clear existing alarm
        await chrome.alarms.clear('fetchMentions');
        
        // Create new alarm
        await chrome.alarms.create('fetchMentions', {
            delayInMinutes: intervalMinutes,
            periodInMinutes: intervalMinutes
        });
    } catch (error) {
        console.error('Error updating alarm:', error);
    }
}

function showStatus(message, type) {
    const statusEl = document.getElementById('status');
    statusEl.textContent = message;
    statusEl.className = `status-message status-${type}`;
    statusEl.style.display = 'block';
    
    // Hide after 3 seconds
    setTimeout(() => {
        statusEl.style.display = 'none';
    }, 3000);
}