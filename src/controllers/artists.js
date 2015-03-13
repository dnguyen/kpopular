var _ = require('lodash'),
    Promise = require('bluebird'),
    moment = require('moment'),
    models = require('../models'),
    MentionsService = require('../services/data/mentions');


function createBuckets(amount) {
    var buckets = [];
    for (var i = 0; i < amount; i++) {
        buckets[i] = new Array();
    }

    return buckets;
}

function getMentionsWithStatistic(name, statistic) {
    var deferred = Promise.defer();
    var mentionsService = new MentionsService();

    mentionsService.getMentionsWithStatistic(name, statistic).then(function(data) {

        console.log('pulled for artist ' + name + ' ' + data.length);
        // Default to statistic=hour
        var currentBucket = 11,
            buckets = createBuckets(12),
            currentMinTime  = moment().subtract(5, 'minutes'),
            currentMaxTime = moment();

        if (statistic === 'day') {
            currentMinTime = moment().subtract(2, 'hours');
        }

        // data is retuned sorted by date/time in descending order. so we can just
        // iterate through each one and add it to the current bucket until the current mention's
        // time is outside the range of the current bucket
        _.each(data, function(mention) {
            var currentMentionDate = moment(mention.date);
            if (currentMentionDate.isAfter(currentMinTime) && currentMentionDate.isBefore(currentMaxTime)) {
                buckets[currentBucket].push(mention);
            } else {
                if (currentBucket > 0) {
                    currentBucket--;
                }

                if (statistic === 'hour') {
                    currentMinTime.subtract(5, 'minutes');
                    currentMaxTime.subtract(5, 'minutes');
                } else if (statistic === 'day') {
                    currentMinTime = currentMinTime.subtract(2, 'hours');
                    currentMaxTime = currentMaxTime.subtract(2, 'hours');
                }
            }
        });

        deferred.resolve(buckets);
    });

    return deferred.promise;
}

var ArtistsController = {
    index: function(req, res) {

        models.Keyword.find({}, function(err, docs) {
            return res.json(docs);
        });

    },

    get: function(req, res) {
        console.log(req.params);
        models.Keyword.find({ word: req.params.name.toUpperCase() }, function(err, docs) {
            return res.json(docs);
        });
    },

    getMentions: function(req, res) {
        var name = req.params.name,
            statistic = req.query.statistic;

        if (statistic) {
            if (statistic === 'hour' || statistic === 'day') {
                getMentionsWithStatistic(name, statistic).then(function(data) {
                    return res.json(data);
                });
            } else {
                return res.status(500).json({ error: 'Invalid statistic option' });
            }
        }
    }
};

module.exports = ArtistsController;