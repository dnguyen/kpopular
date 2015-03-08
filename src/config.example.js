var Config = {
    mongo: {
        connection: 'mongodb://localhost:27017/keyword_tracker'
    },
    checkTimeInterval: 1000 * 60,
    keywords: [],
    twitter: {
        consumerKey: '',
        consumerSecret: '',
        accessToken: '',
        accessTokenSecret: ''
    },
    sources: {
        twitterTimelines: [
            // Twitter screen names
        ],
        rssFeeds: [
            // RSS feed URLs
        ],
        subreddits: [
            // Subreddit names
        ]
    }
};

module.exports = Config;