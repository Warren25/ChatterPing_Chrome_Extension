document.addEventListener('DOMContentLoaded', async () => {
    const summaryElement = document.getElementById('summary');
    const badgeElement = document.getElementById('badge');
    const todayCountElement = document.getElementById('today-count');
    const keywordBadge = document.getElementById('keyword-badge');

    // Get keyword from storage
    const settings = await chrome.storage.sync.get(['keyword']);
    const keyword = settings.keyword;
    
    if (!keyword) {
        summaryElement.innerHTML = `
            <strong>No keyword configured</strong><br><br>
            Click <strong>Settings</strong> to add a keyword to monitor.
        `;
        badgeElement.textContent = '—';
        todayCountElement.textContent = '—';
        if (keywordBadge) keywordBadge.textContent = 'NOT SET';
        setupButtonHandlers();
        return;
    }
    
    // Update keyword badge in UI
    if (keywordBadge) {
        keywordBadge.textContent = keyword.toUpperCase();
    }

    // Fetch summary from the server with user's keyword
    try {
        const response = await fetch(`http://localhost:3001/summarize?keyword=${encodeURIComponent(keyword)}`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        summaryElement.textContent = data.summary;
        
        // Update both badge counts with real data from server
        const mentionCount = data.mentionCount || 0;
        badgeElement.textContent = mentionCount;
        todayCountElement.textContent = mentionCount; // For now, use same count for both
    } catch (error) {
        // User-friendly error messages
        document.querySelector('.sync-indicator').style.display = 'none';
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

    // Add button functionality
    setupButtonHandlers();
});

function setupButtonHandlers() {
    // View Details button - opens detailed mentions view
    const viewDetailsBtn = document.querySelector('.btn-primary');
    if (viewDetailsBtn) {
        viewDetailsBtn.addEventListener('click', async () => {
            try {
                // Get keyword from storage
                const settings = await chrome.storage.sync.get(['keyword']);
                const keyword = settings.keyword || '';
                
                // Fetch detailed Reddit data with user's keyword
                const response = await fetch(`http://localhost:3001/debug/reddit?keyword=${encodeURIComponent(keyword)}`);
                const data = await response.json();
                
                // Create a new tab with detailed view
                chrome.tabs.create({
                    url: chrome.runtime.getURL('details.html')
                });
                
                // Store the data for the details page
                chrome.storage.local.set({ mentionsData: data });
            } catch (error) {
                console.error('Error fetching details:', error);
                alert('Unable to load details. Please check your connection and try again.');
            }
        });
    }

    // Settings button - opens options page
    const settingsBtn = document.querySelector('.btn-secondary');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            chrome.runtime.openOptionsPage();
        });
    }
}