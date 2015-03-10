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

    if (statistic === 'hour') {
        var now = moment();
        mentionsService.getLastHour({ word: name }).then(function(data) {

            var currentBucket = 11,
                timeNow = moment(),
                currentMinTime = moment().subtract(5, 'minutes'),
                currentMaxTime = moment(),
                buckets = createBuckets(12);

            // data is retuned sorted by date/time in descending order. so we can just
            // iterate through each one and add it to the current bucket until the current mention's
            // time is outside the range of the current bucket
            _.each(data, function(mention) {
                if (currentBucket >= 0) {
                    var currentMentionDate = moment(mention.date);
                    if (currentMentionDate.isAfter(currentMinTime) && currentMentionDate.isBefore(currentMaxTime)) {
                        buckets[currentBucket].push(mention);
                    } else {
                        currentBucket--;
                        currentMinTime.subtract(5, 'minutes');
                        currentMaxTime.subtract(5, 'minutes');
                    }
                }
            });

            deferred.resolve(buckets);
        });

        return deferred.promise;
    }
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
            getMentionsWithStatistic(name, statistic).then(function(data) {
                return res.json(data);
            });
        }
    }
};

module.exports = ArtistsController;