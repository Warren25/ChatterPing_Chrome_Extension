document.addEventListener('DOMContentLoaded', async () => {
    const loadingElement = document.getElementById('loading');
    const contentElement = document.getElementById('content');
    const totalCountElement = document.getElementById('totalCount');
    const keywordElement = document.getElementById('keyword');
    const mentionsGridElement = document.getElementById('mentionsGrid');

    try {
        // Get stored data from popup
        const result = await chrome.storage.local.get(['mentionsData']);
        const data = result.mentionsData;

        if (!data || !data.posts) {
            throw new Error('No mentions data found');
        }

        // Hide loading, show content
        loadingElement.style.display = 'none';
        contentElement.style.display = 'block';

        // Update stats
        totalCountElement.textContent = data.count || 0;
        keywordElement.textContent = data.keyword || 'Unknown';

        // Populate mentions
        mentionsGridElement.innerHTML = data.posts.map(post => `
            <div class="mention-card">
                <div class="mention-header">
                    <div class="mention-title">${escapeHtml(post.title)}</div>
                    <div class="mention-score">↑ ${post.score}</div>
                </div>
                <div class="mention-meta">
                    <span>r/${escapeHtml(post.subreddit)}</span>
                    <span>by u/${escapeHtml(post.author)}</span>
                    <span>${post.numComments} comments</span>
                    <span>${formatDate(post.createdAt)}</span>
                </div>
                <div class="mention-excerpt">${escapeHtml(post.excerpt)}</div>
                <div class="mention-actions">
                    <a href="${post.url}" target="_blank" class="btn btn-primary">View on Reddit</a>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading mentions:', error);
        loadingElement.innerHTML = `
            <div style="color: #ef4444;">
                <p>Error loading mentions data</p>
                <p style="font-size: 14px; margin-top: 10px;">${error.message}</p>
            </div>
        `;
    }
});

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
        return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
        return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
        return 'Recently';
    }
}
