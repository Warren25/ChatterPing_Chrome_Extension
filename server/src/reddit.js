function fetchMentions(keyword) {
    // Temporary static data for now
    return [
        {
            id: '1',
            title: 'Discussion about CentralDispatch',
            url: 'https://www.reddit.com/r/example/comments/1',
            excerpt: 'This is a great service for logistics...',
            createdAt: new Date().toISOString(),
        },
        {
            id: '2',
            title: 'CentralDispatch vs Competitor',
            url: 'https://www.reddit.com/r/example/comments/2',
            excerpt: 'I prefer CentralDispatch because...',
            createdAt: new Date().toISOString(),
        },
        {
            id: '3',
            title: 'How to use CentralDispatch effectively',
            url: 'https://www.reddit.com/r/example/comments/3',
            excerpt: 'Here are some tips on using CentralDispatch...',
            createdAt: new Date().toISOString(),
        },
        {
            id: '4',
            title: 'CentralDispatch feedback',
            url: 'https://www.reddit.com/r/example/comments/4',
            excerpt: 'I had a great experience with CentralDispatch...',
            createdAt: new Date().toISOString(),
        },
        {
            id: '5',
            title: 'CentralDispatch features',
            url: 'https://www.reddit.com/r/example/comments/5',
            excerpt: 'The new features in CentralDispatch are amazing...',
            createdAt: new Date().toISOString(),
        },
    ];
}

module.exports = { fetchMentions };