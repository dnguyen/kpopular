
var _ = require('lodash'),
    RSSSource = require('./sources/RSSSource.js'),
    TwitterSource = require('./sources/TwitterSource'),
    TwitterUserTimelineSource = require('./sources/TwitterUserTimelineSource.js'),
    TwitterStreamSource = require('./sources/TwitterStreamSource.js'),
    SubRedditSource = require('./sources/SubRedditSource.js'),
    DataStore = require('./DataStore.js'),
    config = require('./config.js');

var TrackingService = function() {
    var self = this;
    this.sources = [];

    _.each(config.sources.twitterTimelines, function(screenName) {
        self.sources.push(new TwitterUserTimelineSource({screenName: screenName}));
    });

    _.each(config.sources.rssFeeds, function(feedUrl) {
        self.sources.push(new RSSSource({feed: feedUrl, keywords: config.keywords }));
    });

    _.each(config.sources.subreddits, function(subreddit) {
        self.sources.push(new SubRedditSource({subreddit: subreddit}));
    });

};

TrackingService.prototype.start = function() {
    console.log('Starting Tracking Service');

    var twitterSource = new TwitterSource(),
        twitterStream = new TwitterStreamSource();
    var self = this;
    twitterStream.parse();
    // setInterval(function() {
    //     console.log('\n\n[BEGIN PARSING]\n\n');
    //     DataStore.total = 0;

    //     _.each(self.sources, function(source) {
    //         source.parse();
    //     });

    //     twitterSource.parse();

    // }, config.checkTimeInterval);
};

module.exports = TrackingService;