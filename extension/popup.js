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
    } catch (error) {
        summaryElement.textContent = 'Error fetching summary: ' + error.message;
    }

    // Update badge count (dummy value for now)
    badgeElement.textContent = '5'; // Replace with actual unread count logic
});