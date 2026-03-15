document.addEventListener('DOMContentLoaded', async () => {
    setVersionLabel();

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

function setVersionLabel() {
    const versionLabel = document.getElementById('app-version');
    if (!versionLabel) return;

    const manifest = chrome.runtime.getManifest();
    versionLabel.textContent = `Version ${manifest.version}`;
}

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

function renderSummaryWithFade(summaryElement, content, asHtml = false) {
    summaryElement.classList.remove('summary-fade-in');
    if (asHtml) {
        summaryElement.innerHTML = content;
    } else {
        summaryElement.textContent = content;
    }

    // Force reflow so repeated loads retrigger the animation.
    void summaryElement.offsetWidth;
    summaryElement.classList.add('summary-fade-in');
}

// ============== SUMMARY TAB ==============

async function loadSummary(options = {}) {
    const { animateRefresh = false } = options;
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
            <p><strong>No keyword configured</strong></p>
            <p style="margin-top: 8px;">Go to the <strong>Settings</strong> tab to add a keyword to monitor.</p>
        `;
        badgeElement.textContent = '—';
        todayCountElement.textContent = '—';
        if (keywordBadge) keywordBadge.textContent = 'NOT SET';
        return;
    }
    
    // Update keyword badge in UI
    if (keywordBadge) {
        keywordBadge.textContent = keyword.toUpperCase();
        keywordBadge.classList.add('loading');
    }

    summaryElement.classList.add('is-loading');
    if (animateRefresh) {
        summaryElement.classList.add('is-refreshing');
    }
    summaryElement.innerHTML = `
        <div class="loading-spinner"></div>
        <div class="summary-loading-copy">
            <p><strong>Refreshing summary for ${escapeHtml(keyword)}...</strong></p>
            <p>Fetching fresh mentions and generating a new AI summary.</p>
        </div>
    `;

    // Fetch summary from the server
    try {
        const response = await fetch(`${API_URL}/summarize?keyword=${encodeURIComponent(keyword)}`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        summaryElement.classList.remove('is-loading', 'is-refreshing');
        renderSummaryWithFade(summaryElement, data.summary);
        
        const mentionCount = data.mentionCount || 0;
        badgeElement.textContent = mentionCount;
        todayCountElement.textContent = mentionCount;
        if (keywordBadge) keywordBadge.classList.remove('loading');
    } catch (error) {
        summaryElement.classList.remove('is-loading', 'is-refreshing');
        if (keywordBadge) keywordBadge.classList.remove('loading');
        if (syncIndicator) syncIndicator.style.display = 'none';
        if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
            renderSummaryWithFade(summaryElement, `
                <strong>Unable to connect</strong><br><br>
                Please check your internet connection and try again.
            `, true);
        } else {
            renderSummaryWithFade(summaryElement, 'Something went wrong. Please try again later.');
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
        
        const response = await fetch(`${API_URL}/debug/reddit?keyword=${encodeURIComponent(keyword)}`);
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
        const currentSettings = await chrome.storage.sync.get(['keyword']);
        const previousKeyword = (currentSettings.keyword || '').trim();

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

        const keywordChanged = previousKeyword.toLowerCase() !== settings.keyword.toLowerCase();
        
        // Refresh summary with new keyword
        setTimeout(() => {
            switchTab('summary');
            loadSummary({ animateRefresh: keywordChanged });
        }, 500);
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