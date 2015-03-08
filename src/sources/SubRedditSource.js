
var request = require('request'),
    _ = require('lodash'),
    moment = require('moment'),
    config = require('../config'),
    DataStore = require('../DataStore');

var SubRedditSource = function(options) {
    this.subreddit = options.subreddit;
};

SubRedditSource.prototype.parse = function() {
    console.log('Searching subreddit ' + this.subreddit);
    var self = this;

    request('https://www.reddit.com/r/' + this.subreddit + '/new.json?sort=new', function(err, response, body) {
        if (!err && response.statusCode == 200) {
            var bodyObj = JSON.parse(body);
            _.each(bodyObj.data.children, function(post) {
                var postData = post.data;

                _.each(config.keywords, function(word) {
                    if (postData.title.indexOf(word) > -1) {
                        DataStore.increment(word, 1);
                        DataStore.addHit(word, {
                            from: postData.permalink,
                            title: postData.title,
                            type: 'subreddit_post',
                            date: moment(postData.created, 'X').toDate()
                        });
                    }
                });
            });
        }
    });

};

module.exports = SubRedditSource;