// Currently selected keyword per tab (shared state)
let selectedKeyword = null;

document.addEventListener('DOMContentLoaded', async () => {
    setVersionLabel();

    // Migrate legacy single-keyword storage to keywords array
    await migrateKeywordStorage();

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

async function migrateKeywordStorage() {
    const data = await chrome.storage.sync.get(['keyword', 'keywords']);
    if (data.keyword && !data.keywords) {
        await chrome.storage.sync.set({ keywords: [data.keyword] });
        await chrome.storage.sync.remove('keyword');
    }
}

async function getKeywords() {
    const data = await chrome.storage.sync.get({ keywords: [] });
    return data.keywords;
}

// ============== LOCAL DATA PERSISTENCE ==============

function localCacheKey(prefix, keyword) {
    return `${prefix}:${keyword.toLowerCase()}`;
}

async function getLocalCache(prefix, keyword) {
    const key = localCacheKey(prefix, keyword);
    const data = await chrome.storage.local.get(key);
    return data[key] || null;
}

async function setLocalCache(prefix, keyword, value) {
    const key = localCacheKey(prefix, keyword);
    await chrome.storage.local.set({ [key]: { ...value, cachedAt: Date.now() } });
}

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

function updateSentimentDisplay(score, label) {
    const row = document.getElementById('sentiment-row');
    const scoreEl = document.getElementById('sentiment-score');
    const labelEl = document.getElementById('sentiment-label');
    if (!row || !scoreEl || !labelEl) return;

    if (score == null || label == null) {
        row.style.display = 'none';
        return;
    }

    row.style.display = 'flex';
    scoreEl.textContent = `${Number(score).toFixed(1)}/10`;
    labelEl.textContent = label.charAt(0).toUpperCase() + label.slice(1);
    labelEl.className = 'sentiment-label sentiment-' + label.replace(/\s+/g, '-');
}

// ============== KEYWORD SELECTOR ==============

function renderKeywordSelector(containerId, keywords, onSelect) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (keywords.length === 0) {
        container.innerHTML = '';
        return;
    }

    // Auto-select first keyword or preserve current selection
    if (!selectedKeyword || !keywords.includes(selectedKeyword)) {
        selectedKeyword = keywords[0];
    }

    container.innerHTML = keywords.map(kw => {
        const active = kw === selectedKeyword ? 'active' : '';
        return `<button class="kw-pill ${active}" data-keyword="${escapeHtml(kw)}">${escapeHtml(kw)}</button>`;
    }).join('');

    container.querySelectorAll('.kw-pill').forEach(pill => {
        pill.addEventListener('click', () => {
            selectedKeyword = pill.dataset.keyword;
            // Update all selectors to reflect choice
            document.querySelectorAll('.keyword-selector').forEach(sel => {
                sel.querySelectorAll('.kw-pill').forEach(p => {
                    p.classList.toggle('active', p.dataset.keyword === selectedKeyword);
                });
            });
            onSelect(selectedKeyword);
        });
    });
}

// ============== SUMMARY TAB ==============

async function loadSummary(options = {}) {
    const { animateRefresh = false } = options;
    const summaryElement = document.getElementById('summary');
    const badgeElement = document.getElementById('badge');
    const todayCountElement = document.getElementById('today-count');
    const keywordBadge = document.getElementById('keyword-badge');
    const syncIndicator = document.getElementById('sync-indicator');

    const keywords = await getKeywords();

    // Render keyword selector
    renderKeywordSelector('summary-keyword-selector', keywords, (kw) => {
        loadSummary({ animateRefresh: false });
    });
    
    if (keywords.length === 0) {
        summaryElement.innerHTML = `
            <p><strong>No keywords configured</strong></p>
            <p style="margin-top: 8px;">Go to the <strong>Settings</strong> tab to add keywords to monitor.</p>
        `;
        badgeElement.textContent = '—';
        todayCountElement.textContent = '—';
        if (keywordBadge) keywordBadge.textContent = 'NOT SET';
        return;
    }

    const keyword = selectedKeyword || keywords[0];
    
    // Update keyword badge in UI
    if (keywordBadge) {
        keywordBadge.textContent = keyword.toUpperCase();
        keywordBadge.classList.add('loading');
    }

    summaryElement.classList.add('is-loading');
    if (animateRefresh) {
        summaryElement.classList.add('is-refreshing');
    }

    // Show cached data immediately if available
    const cached = await getLocalCache('summary', keyword);
    if (cached) {
        summaryElement.classList.remove('is-loading', 'is-refreshing');
        renderSummaryWithFade(summaryElement, cached.summary);
        badgeElement.textContent = cached.mentionCount || 0;
        todayCountElement.textContent = cached.mentionCount || 0;
        updateSentimentDisplay(cached.sentimentScore, cached.sentimentLabel);
        if (keywordBadge) {
            keywordBadge.textContent = keyword.toUpperCase();
            keywordBadge.classList.remove('loading');
        }
    } else {
        summaryElement.innerHTML = `
            <div class="loading-spinner"></div>
            <div class="summary-loading-copy">
                <p><strong>Refreshing summary for ${escapeHtml(keyword)}...</strong></p>
                <p>Fetching fresh mentions and generating a new AI summary.</p>
            </div>
        `;
    }

    // Fetch summary from the server
    try {
        const response = await fetch(`${API_URL}/summarize?keyword=${encodeURIComponent(keyword)}`, {
            headers: API_HEADERS
        });
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        summaryElement.classList.remove('is-loading', 'is-refreshing');
        renderSummaryWithFade(summaryElement, data.summary);
        
        const mentionCount = data.mentionCount || 0;
        badgeElement.textContent = mentionCount;
        todayCountElement.textContent = mentionCount;
        updateSentimentDisplay(data.sentimentScore, data.sentimentLabel);
        if (keywordBadge) keywordBadge.classList.remove('loading');

        // Persist to local storage for instant display next time
        await setLocalCache('summary', keyword, {
            summary: data.summary,
            mentionCount,
            sentimentScore: data.sentimentScore,
            sentimentLabel: data.sentimentLabel
        });
    } catch (error) {
        summaryElement.classList.remove('is-loading', 'is-refreshing');
        if (keywordBadge) keywordBadge.classList.remove('loading');
        if (syncIndicator) syncIndicator.style.display = 'none';
        // If we already showed cached data, don't overwrite with error
        if (cached) return;
        if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
            renderSummaryWithFade(summaryElement, `
                <p>Unable to reach the ChatterPing server</p>
                <p style="font-size:12px;color:#64748b;margin-top:6px;">Check your internet connection or try again later.</p>
                <button class="btn btn-primary" id="retry-summary-btn" style="margin-top:12px;">Retry</button>
            `, true);
        } else {
            renderSummaryWithFade(summaryElement, `
                <p>Something went wrong</p>
                <button class="btn btn-primary" id="retry-summary-btn" style="margin-top:12px;">Retry</button>
            `, true);
        }
        const retryBtn = summaryElement.querySelector('#retry-summary-btn');
        if (retryBtn) retryBtn.addEventListener('click', () => loadSummary());
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

    const keywords = await getKeywords();

    // Render keyword selector
    renderKeywordSelector('details-keyword-selector', keywords, (kw) => {
        loadDetails();
    });
    
    // Show loading
    loadingEl.style.display = 'block';
    contentEl.style.display = 'none';
    errorEl.style.display = 'none';

    let showedCache = false;
    
    try {
        const keyword = selectedKeyword || keywords[0];
        
        if (!keyword || keywords.length === 0) {
            loadingEl.style.display = 'none';
            errorEl.innerHTML = '<p>Please configure a keyword in Settings first</p>';
            errorEl.style.display = 'block';
            return;
        }

        // Show cached details immediately if available
        const cached = await getLocalCache('details', keyword);
        if (cached && cached.posts) {
            showedCache = true;
            renderDetailsContent(cached, keyword, { totalCountEl, keywordEl, mentionsListEl, contentEl, loadingEl });
        }
        
        const response = await fetch(`${API_URL}/debug/reddit?keyword=${encodeURIComponent(keyword)}`, {
            headers: API_HEADERS
        });
        if (!response.ok) throw new Error('Failed to fetch');
        
        const data = await response.json();

        // Save to local cache
        await setLocalCache('details', keyword, data);
        
        renderDetailsContent(data, keyword, { totalCountEl, keywordEl, mentionsListEl, contentEl, loadingEl });
    } catch (error) {
        console.warn('Error loading details:', error.message);
        loadingEl.style.display = 'none';
        if (!showedCache) {
            if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
                errorEl.innerHTML = '<p>Unable to reach the ChatterPing server</p><p style="font-size:12px;color:#64748b;margin-top:6px;">Check your internet connection or try again later.</p><button class="btn btn-primary" id="retry-details-btn" style="margin-top:12px;">Retry</button>';
            } else {
                errorEl.innerHTML = '<p>Unable to load mentions</p><button class="btn btn-primary" id="retry-details-btn" style="margin-top:12px;">Retry</button>';
            }
            errorEl.style.display = 'block';
            const retryBtn = errorEl.querySelector('#retry-details-btn');
            if (retryBtn) retryBtn.addEventListener('click', () => loadDetails());
        }
    }
}

function renderDetailsContent(data, keyword, els) {
    const { totalCountEl, keywordEl, mentionsListEl, contentEl, loadingEl } = els;

    loadingEl.style.display = 'none';
    contentEl.style.display = 'block';
    
    totalCountEl.textContent = data.count || 0;
    keywordEl.textContent = data.keyword || keyword;
    
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

const MAX_KEYWORDS = 5;

async function loadSettings() {
    try {
        const result = await chrome.storage.sync.get({
            keywords: [],
            checkInterval: 30,
            notifications: true,
            autoSummary: true
        });

        renderKeywordChips(result.keywords);
        document.getElementById('keyword-input').value = '';
        document.getElementById('checkInterval').value = result.checkInterval;
        document.getElementById('notifications').checked = result.notifications;
        document.getElementById('autoSummary').checked = result.autoSummary;
    } catch (error) {
        console.error('Error loading settings:', error);
        showSettingsStatus('Error loading settings', 'error');
    }
}

function renderKeywordChips(keywords) {
    const container = document.getElementById('keyword-chips');
    const countEl = document.getElementById('keyword-count');
    const addBtn = document.getElementById('add-keyword-btn');
    const input = document.getElementById('keyword-input');

    countEl.textContent = `(${keywords.length}/${MAX_KEYWORDS})`;

    if (keywords.length >= MAX_KEYWORDS) {
        addBtn.disabled = true;
        input.disabled = true;
        input.placeholder = 'Maximum keywords reached';
    } else {
        addBtn.disabled = false;
        input.disabled = false;
        input.placeholder = 'e.g., Your Brand';
    }

    container.innerHTML = keywords.map(kw => `
        <span class="keyword-chip">
            ${escapeHtml(kw)}
            <button type="button" class="chip-remove" data-keyword="${escapeHtml(kw)}">&times;</button>
        </span>
    `).join('');

    container.querySelectorAll('.chip-remove').forEach(btn => {
        btn.addEventListener('click', async () => {
            const kw = btn.dataset.keyword;
            const data = await chrome.storage.sync.get({ keywords: [] });
            const updated = data.keywords.filter(k => k !== kw);
            await chrome.storage.sync.set({ keywords: updated });
            renderKeywordChips(updated);
            showSettingsStatus('Keyword removed', 'success');
        });
    });
}

function setupSettingsForm() {
    const form = document.getElementById('settings-form');
    const resetBtn = document.getElementById('resetBtn');
    const addBtn = document.getElementById('add-keyword-btn');
    const keywordInput = document.getElementById('keyword-input');

    form.addEventListener('submit', handleSettingsSave);
    resetBtn.addEventListener('click', handleSettingsReset);

    addBtn.addEventListener('click', addKeywordFromInput);
    keywordInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addKeywordFromInput();
        }
    });
}

async function addKeywordFromInput() {
    const input = document.getElementById('keyword-input');
    const keyword = input.value.trim();

    if (!keyword) return;

    const data = await chrome.storage.sync.get({ keywords: [] });
    const keywords = data.keywords;

    if (keywords.length >= MAX_KEYWORDS) {
        showSettingsStatus(`Maximum of ${MAX_KEYWORDS} keywords allowed`, 'error');
        return;
    }

    if (keywords.some(k => k.toLowerCase() === keyword.toLowerCase())) {
        showSettingsStatus('Keyword already exists', 'error');
        return;
    }

    keywords.push(keyword);
    await chrome.storage.sync.set({ keywords });
    input.value = '';
    renderKeywordChips(keywords);
    showSettingsStatus('Keyword added', 'success');
}

async function handleSettingsSave(event) {
    event.preventDefault();
    
    try {
        const data = await chrome.storage.sync.get({ keywords: [] });

        const settings = {
            keywords: data.keywords,
            checkInterval: parseInt(document.getElementById('checkInterval').value),
            notifications: document.getElementById('notifications').checked,
            autoSummary: document.getElementById('autoSummary').checked
        };

        if (settings.keywords.length === 0) {
            throw new Error('At least one keyword is required');
        }

        await chrome.storage.sync.set(settings);
        showSettingsStatus('Settings saved!', 'success');

        // Reset selected keyword since list may have changed
        selectedKeyword = settings.keywords[0];
        
        // Refresh summary with updated keywords
        setTimeout(() => {
            switchTab('summary');
            loadSummary({ animateRefresh: true });
        }, 500);
    } catch (error) {
        console.warn('Settings save blocked:', error.message);
        showSettingsStatus('Error: ' + error.message, 'error');
    }
}

async function handleSettingsReset() {
    try {
        const defaults = {
            keywords: [],
            checkInterval: 30,
            notifications: true,
            autoSummary: true
        };

        await chrome.storage.sync.set(defaults);
        selectedKeyword = null;
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