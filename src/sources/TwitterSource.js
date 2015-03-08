
var Twit = require('twit'),
    _ = require('lodash'),
    moment = require('moment'),
    config = require('../config.js'),
    DataStore = require('../DataStore.js');

var TwitterSource = function(options) {
    this.twit = new Twit({
        consumer_key: config.twitter.consumerKey,
        consumer_secret: config.twitter.consumerSecret,
        access_token: config.twitter.accessToken,
        access_token_secret: config.twitter.accessTokenSecret
    });
};

TwitterSource.prototype.parse = function() {
    var self = this;
    _.each(config.keywords, function(word) {

        self.twit.get('search/tweets', { q: encodeURI(word), lang: 'en', result_type: 'recent', count: 100 }, function(err, data, response) {
            if (err) {
                console.log('error with loading tweets');
                console.log(err);
            } else {
                _.each(data.statuses, function(tweet) {
                    console.log(tweet.text);
                    _.each(config.keywords, function(word) {
                        if (tweet.text.indexOf(word) > -1 || tweet.text.indexOf(word.toLowerCase()) > -1) {
                            var created = moment(tweet.created_at, 'dd MMM DD HH:mm:ss ZZ YYYY', 'en');

                            DataStore.increment(word, 1);
                            DataStore.addHit(word, {
                                from: tweet.id_str,
                                title: tweet.text,
                                type: 'tweet',
                                date: created.toDate()
                            });
                        }
                    });
                });
            }
        });

    });
};

module.exports = TwitterSource;