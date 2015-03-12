
var Twit = require('twit'),
    _ = require('lodash'),
    moment = require('moment'),
    config = require('../config.js'),
    DataStore = require('../DataStore.js');

var TwitterStreamSource = function(options) {
    this.twit = new Twit({
        consumer_key: config.twitter.consumerKey,
        consumer_secret: config.twitter.consumerSecret,
        access_token: config.twitter.accessToken,
        access_token_secret: config.twitter.accessTokenSecret
    });
};

TwitterStreamSource.prototype.parse = function() {
    var keywordCSV = '';
    for (var i = 0; i < config.keywords.length; i++) {
        if (config.keywords[i].twitterQuery) {
            keywordCSV += config.keywords[i].twitterQuery;
        } else {
            keywordCSV += config.keywords[i].word;
        }
        if (i < config.keywords.length - 1) {
            keywordCSV += ',';
        }
    };
    console.log(keywordCSV);
    var stream = this.twit.stream('statuses/filter', { track: keywordCSV });
    stream.on('tweet', function(tweet) {
        _.each(config.keywords, function(wordObj) {
            var word = '';
            if (wordObj.twitterQuery) {
                word = wordObj.twitterQuery;
            } else {
                word = wordObj.word;
            }
            if (tweet.text.indexOf(word) > -1 || tweet.text.indexOf(word.toLowerCase()) > -1) {
                var created = moment(tweet.created_at, 'dd MMM DD HH:mm:ss ZZ YYYY', 'en');
                //console.log(tweet.text);
                // DataStore.increment(word, 1);
                DataStore.addHit(wordObj.word, {
                    from: tweet.id_str,
                    title: tweet.text,
                    type: 'tweet',
                    date: created.toDate()
                });
            }
        });
    });
};

module.exports = TwitterStreamSource;