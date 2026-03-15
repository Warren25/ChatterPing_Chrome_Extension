document.addEventListener('DOMContentLoaded', async () => {
    // Initialize tabs
    setupTabs();
    
    // Load summary data
    await loadSummary();
    
    // Load settings into form
    await loadSettings();
    
    // Setup settings form
    setupSettingsForm();
    
    // Setup retry button
    setupRetryButton();
});

// ============== TAB NAVIGATION ==============

function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.dataset.tab;
            switchTab(targetTab);
            
            // Load details when switching to details tab
            if (targetTab === 'details') {
                loadDetails();
            }
        });
    });
}

function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    
    // Update tab panes
    document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.toggle('active', pane.id === `tab-${tabName}`);
    });
}

// ============== SUMMARY TAB ==============

async function loadSummary() {
    const summaryElement = document.getElementById('summary');
    const badgeElement = document.getElementById('badge');
    const todayCountElement = document.getElementById('today-count');
    const keywordBadge = document.getElementById('keyword-badge');
    const syncIndicator = document.getElementById('sync-indicator');

    // Get keyword from storage
    const settings = await chrome.storage.sync.get(['keyword']);
    const keyword = settings.keyword;
    
    if (!keyword) {
        summaryElement.innerHTML = `
            <strong>No keyword configured</strong><br><br>
            Click <strong>Settings</strong> tab to add a keyword to monitor.
        `;
        badgeElement.textContent = '—';
        todayCountElement.textContent = '—';
        if (keywordBadge) keywordBadge.textContent = 'NOT SET';
        return;
    }
    
    // Update keyword badge in UI
    if (keywordBadge) {
        keywordBadge.textContent = keyword.toUpperCase();
    }

    // Fetch summary from the server
    try {
        const response = await fetch(`http://localhost:3001/summarize?keyword=${encodeURIComponent(keyword)}`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        summaryElement.textContent = data.summary;
        
        const mentionCount = data.mentionCount || 0;
        badgeElement.textContent = mentionCount;
        todayCountElement.textContent = mentionCount;
    } catch (error) {
        if (syncIndicator) syncIndicator.style.display = 'none';
        if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
            summaryElement.innerHTML = `
                <strong>Unable to connect</strong><br><br>
                Please check your internet connection and try again.
            `;
        } else {
            summaryElement.textContent = 'Something went wrong. Please try again later.';
        }
        badgeElement.textContent = '—';
        todayCountElement.textContent = '—';
    }
}

function setupRetryButton() {
    const retryBtn = document.getElementById('retry-details-btn');
    if (retryBtn) {
        retryBtn.addEventListener('click', () => {
            loadDetails();
        });
    }
}

// ============== DETAILS TAB ==============

async function loadDetails() {
    const loadingEl = document.getElementById('details-loading');
    const contentEl = document.getElementById('details-content');
    const errorEl = document.getElementById('details-error');
    const totalCountEl = document.getElementById('totalCount');
    const keywordEl = document.getElementById('details-keyword');
    const mentionsListEl = document.getElementById('mentionsList');
    
    // Show loading
    loadingEl.style.display = 'block';
    contentEl.style.display = 'none';
    errorEl.style.display = 'none';
    
    try {
        const settings = await chrome.storage.sync.get(['keyword']);
        const keyword = settings.keyword;
        
        if (!keyword) {
            loadingEl.style.display = 'none';
            errorEl.innerHTML = '<p>Please configure a keyword in Settings first</p>';
            errorEl.style.display = 'block';
            return;
        }
        
        const response = await fetch(`http://localhost:3001/debug/reddit?keyword=${encodeURIComponent(keyword)}`);
        if (!response.ok) throw new Error('Failed to fetch');
        
        const data = await response.json();
        
        // Hide loading, show content
        loadingEl.style.display = 'none';
        contentEl.style.display = 'block';
        
        // Update stats
        totalCountEl.textContent = data.count || 0;
        keywordEl.textContent = data.keyword || keyword;
        
        // Populate mentions
        if (data.posts && data.posts.length > 0) {
            mentionsListEl.innerHTML = data.posts.map(post => `
                <div class="mention-card">
                    <div class="mention-title">${escapeHtml(post.title)}</div>
                    <div class="mention-meta">
                        <span>r/${escapeHtml(post.subreddit)}</span>
                        <span class="mention-score">↑ ${post.score}</span>
                        <span>${formatDate(post.createdAt)}</span>
                    </div>
                    <a href="${post.url}" target="_blank" class="mention-link">View on Reddit →</a>
                </div>
            `).join('');
        } else {
            mentionsListEl.innerHTML = '<p style="color: #64748b; text-align: center; padding: 20px;">No mentions found</p>';
        }
    } catch (error) {
        console.error('Error loading details:', error);
        loadingEl.style.display = 'none';
        errorEl.style.display = 'block';
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
        return `${diffDays}d ago`;
    } else if (diffHours > 0) {
        return `${diffHours}h ago`;
    } else {
        return 'Recently';
    }
}

// ============== SETTINGS TAB ==============

async function loadSettings() {
    try {
        const result = await chrome.storage.sync.get({
            keyword: '',
            checkInterval: 30,
            notifications: true,
            autoSummary: true
        });

        document.getElementById('keyword-input').value = result.keyword;
        document.getElementById('checkInterval').value = result.checkInterval;
        document.getElementById('notifications').checked = result.notifications;
        document.getElementById('autoSummary').checked = result.autoSummary;
    } catch (error) {
        console.error('Error loading settings:', error);
        showSettingsStatus('Error loading settings', 'error');
    }
}

function setupSettingsForm() {
    const form = document.getElementById('settings-form');
    const resetBtn = document.getElementById('resetBtn');

    form.addEventListener('submit', handleSettingsSave);
    resetBtn.addEventListener('click', handleSettingsReset);
}

async function handleSettingsSave(event) {
    event.preventDefault();
    
    try {
        const settings = {
            keyword: document.getElementById('keyword-input').value.trim(),
            checkInterval: parseInt(document.getElementById('checkInterval').value),
            notifications: document.getElementById('notifications').checked,
            autoSummary: document.getElementById('autoSummary').checked
        };

        if (!settings.keyword) {
            throw new Error('Keyword is required');
        }

        await chrome.storage.sync.set(settings);
        showSettingsStatus('Settings saved!', 'success');
        
        // Refresh summary with new keyword
        setTimeout(() => {
            switchTab('summary');
            loadSummary();
        }, 1000);
    } catch (error) {
        console.error('Error saving settings:', error);
        showSettingsStatus('Error: ' + error.message, 'error');
    }
}

async function handleSettingsReset() {
    try {
        const defaults = {
            keyword: '',
            checkInterval: 30,
            notifications: true,
            autoSummary: true
        };

        await chrome.storage.sync.set(defaults);
        await loadSettings();
        showSettingsStatus('Settings reset', 'success');
    } catch (error) {
        console.error('Error resetting settings:', error);
        showSettingsStatus('Error resetting', 'error');
    }
}

function showSettingsStatus(message, type) {
    const statusEl = document.getElementById('settings-status');
    statusEl.textContent = message;
    statusEl.className = `status-message status-${type}`;
    
    setTimeout(() => {
        statusEl.className = 'status-message';
    }, 3000);
}