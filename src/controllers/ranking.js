var _ = require('lodash'),
    Promise = require('bluebird'),
    moment = require('moment'),
    config = require('../config'),
    models = require('../models');

var RankingController = {
    index: function(req, res) {
        var statistic = req.query.statistic,
            startTime = moment(),
            endTime,
            rankings = [];

        if (!statistic) {
            statistic = 'hour';
        }

        if (statistic === 'hour') {
            endTime = moment().subtract(1, 'hours');
        } else if (statistic === 'day') {
            endTime = moment().subtract(1, 'days');
        } else {
            endTime = moment(1318781876406);
        }

        // Calculate rankings based on mentions, chart rankings (gaon, mnet), subreddit, and blog posts
        // Value chart rankings, reddit, and blog posts higher than tweets
        // Force popular new releases towards the top by weighing chart rankings heavily

        // First get number of mentions for each word
        Promise.map(config.keywords, function(wordObj) {
            return models.Mentions.getWithinTime(wordObj.word, startTime.toDate(), endTime.toDate()).then(function(data) {
                rankings.push({ word: wordObj.word, popularity: data.length });
            });
        }).then(function() {
            return res.json(rankings);
        });
    }
};

module.exports = RankingController;