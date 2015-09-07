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
        var totalBucketCount = 12;
        var currentTime = moment().startOf('hour');
        if (statistic === 'minutes') {
            currentTime = moment().startOf('minute');
            totalBucketCount = 5;
        }


        var buckets = createBuckets(totalBucketCount),
            currentBucket = buckets.length - 1,
            currentMinTime  = currentTime.clone().subtract(5, 'minutes'),
            currentMaxTime = currentTime.clone();
        if (statistic === 'day') {
            currentMinTime = currentTime.clone().subtract(2, 'hours');
        } else if (statistic === 'minutes') {
            currentMinTime = currentTime.clone().subtract(12, 'seconds');
        }
        console.log('currenttime', currentTime.format());
        console.log('start range', currentMinTime.format(), currentMaxTime.format());
        console.log(data.length);

        // data is retuned sorted by date/time in descending order. so we can just
        // iterate through each one and add it to the current bucket until the current mention's
        // time is outside the range of the current bucket
        _.each(data, function(mention) {
            //console.log('min:', currentMinTime.format(), 'max:', currentMaxTime.format());
            var currentMentionDate = moment(mention.date).startOf('minute');
            if ((currentMentionDate.isAfter(currentMinTime) && currentMentionDate.isBefore(currentMaxTime)) || currentMentionDate.isSame(currentMinTime)) {
                buckets[currentBucket].push(mention);
            } else {
                console.log('[out of range]', currentMentionDate.format());
                console.log('checking mention for range', currentMentionDate.format(), '-', currentMinTime.format(), currentMaxTime.format());

                if (currentBucket > 0) {
                    currentBucket--;
                }

                if (statistic === 'hour') {
                    currentMinTime.subtract(5, 'minutes');
                    currentMaxTime.subtract(5, 'minutes');
                } else if (statistic === 'day') {
                    currentMinTime = currentMinTime.subtract(2, 'hours');
                    currentMaxTime = currentMaxTime.subtract(2, 'hours');
                } else if (statistic === 'minutes') {
                    currentMinTime = currentMinTime.subtract(12, 'seconds');
                    currentMaxTime = currentMaxTime.subtract(12, 'seconds');
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
            statistic = req.query.statistic,
            content = req.query.content;

        // var mentionsService = new MentionsService();

        // mentionsService.getMentionsWithStatistic(name, statistic).then(function(data) {
        //     console.log(data.length);
        //     console.log(data);
        // });

        if (statistic) {
            if (statistic === 'hour' || statistic === 'day' || statistic === 'minutes') {
                getMentionsWithStatistic(name, statistic).then(function(data) {
                    if (content && content === 'all') {
                        return res.json(data);
                    } else {
                        var returnData = [];
                        _.each(data, function(bucket) {
                            returnData.push(bucket.length);
                        });
                        return res.json(returnData);
                    }
                });
            } else {
                return res.status(500).json({ error: 'Invalid statistic option' });
            }
        }
    }
};

module.exports = ArtistsController;