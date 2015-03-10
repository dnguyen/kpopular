var _ = require('lodash'),
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
            mentionsService = new MentionsService();

        if (statistic) {
            if (statistic === 'hour') {
                var now = moment();
                mentionsService.getLastHour({ word: name }).then(function(data) {

                    // keep pushing onto bucket i until time > i's max time (currentMaxTime),
                    // Then move onto the next bucket
                    var currentBucket = 11,
                        timeNow = moment(),
                        currentMinTime = moment().subtract(5, 'minutes'),
                        currentMaxTime = moment(),
                        buckets = createBuckets(12);

                    _.each(data, function(mention) {
                        var currentMentionDate = moment(mention.date);
                        if (currentMentionDate.isAfter(currentMinTime) && currentMentionDate.isBefore(currentMaxTime)) {
                            buckets[currentBucket].push(mention);
                        } else {
                            currentBucket--;
                            currentMinTime.subtract(5, 'minutes');
                            currentMaxTime.subtract(5, 'minutes');
                        }
                    });

                    return res.json(buckets);
                });
            }
        }
    }
};

module.exports = ArtistsController;