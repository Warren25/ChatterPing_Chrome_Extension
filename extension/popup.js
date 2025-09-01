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
});