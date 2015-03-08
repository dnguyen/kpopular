var request = require('request'),
    FeedParser = require('feedparser'),
    moment = require('moment'),
    _ = require('lodash'),
    DataStore = require('../DataStore.js');

var RSSSource = function(options) {
    if (!options.feed) console.log('Invalid feed');
    this.feed = options.feed;
    this.keywords = options.keywords;
};

RSSSource.prototype.parse = function() {

    this.feedParser = new FeedParser();
    var req = request(this.feed),
        self = this,
        relevanceCount = 0;

    // Make request to feed
    req.on('response', function(res) {
        var stream = this;
        if (res.statusCode != 200) console.log('failed to connect.');

        stream.pipe(self.feedParser);
    });
    req.on('error', function(res) {
        console.log('error with reqeust');
    });
    // Start reading feed
    self.feedParser.on('readable', function() {
        var stream = this,
            meta = this.meta,
            item;

        // Find any posts that contain our keywords
        while (item = stream.read()) {
            _.each(self.keywords, function(word) {
                if (item.title.indexOf(word) > -1 || item.title.toLowerCase().indexOf(word) > -1) {
                    DataStore.increment(word, 1);
                    DataStore.addHit(word, {
                        from: item.link,
                        title: item.title,
                        type: 'RSS',
                        date: moment(item.pubdate).toDate()
                    });
                }
            });
        }
        //console.log(DataStore.keywordRelevance);
    });

    self.feedParser.on('error', function(error) {
        console.log('FEED ERROR');
        console.log(error);
    });
};

// TODO: Implement post parsing
// RSSSource.prototype.parsePost = function(postUrl) {

// };



module.exports = RSSSource;