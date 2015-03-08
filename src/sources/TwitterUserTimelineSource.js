
var Twit = require('twit'),
    moment = require('moment'),
    _ = require('lodash'),
    config = require('../config.js');
    DataStore = require('../DataStore.js');

var TwitterUserTimelineSource = function(options) {
    this.twit = new Twit({
        consumer_key: config.twitter.consumerKey,
        consumer_secret: config.twitter.consumerSecret,
        access_token: config.twitter.accessToken,
        access_token_secret: config.twitter.accessTokenSecret
    });
    this.screenName = options.screenName;
};

TwitterUserTimelineSource.prototype.parse = function() {
    this.twit.get('statuses/user_timeline', {
        screen_name: encodeURI(this.screenName),
        lang: 'en',
        count: 20
    }, function(err, data, response) {
        if (err) console.log(err);
        _.each(data, function(tweet) {
            _.each(config.keywords, function(word) {
                if (tweet.text.indexOf(word) > -1 || tweet.text.indexOf(word.toLowerCase()) > -1) {
                    DataStore.increment(word, 1);
                    DataStore.addHit(word, {
                        from: tweet.id_str,
                        title: tweet.text,
                        type: 'tweet',
                        date: moment(tweet.created_at, 'dd MMM DD HH:mm:ss ZZ YYYY', 'en').toDate()
                    });
                }
            });
        });
    });
};

module.exports = TwitterUserTimelineSource;