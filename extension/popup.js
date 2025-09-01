document.addEventListener('DOMContentLoaded', async () => {
    const summaryElement = document.getElementById('summary');
    const badgeElement = document.getElementById('badge');

    // Fetch summary from the server
    try {
        const response = await fetch('http://localhost:3001/summarize');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        summaryElement.textContent = data.summary;
        
        // Update badge count with real data from server
        badgeElement.textContent = data.mentionCount || '0';
    } catch (error) {
        summaryElement.textContent = 'Error fetching summary: ' + error.message;
        badgeElement.textContent = '?';
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
                // Fetch detailed Reddit data
                const response = await fetch('http://localhost:3001/debug/reddit');
                const data = await response.json();
                
                // Create a new tab with detailed view
                chrome.tabs.create({
                    url: chrome.runtime.getURL('details.html')
                });
                
                // Store the data for the details page
                chrome.storage.local.set({ mentionsData: data });
            } catch (error) {
                console.error('Error fetching details:', error);
                alert('Unable to load detailed view');
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