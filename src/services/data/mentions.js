
var Promise = require('bluebird'),
    moment = require('moment'),
    emitter = require('../../Emitter'),
    models = require('../../models');

/**
 * Mentions service.
 * Service for handling real time mentions graphs
 */
var MentionsService = function() {
    // setInterval(function() {
    //     models.Keyword.find({ word: 'SNSD' }, function(err, docs) {
    //         if (err) throw err;
    //         emitter.emit('ioserver:mention_count_update', docs[0]);
    //     });
    // }, 5000);
};

/**
 * Get all mentions that occured in the last hour for an artist
 */
MentionsService.prototype.getMentionsWithStatistic = function(word, statistic) {
    var deferred = Promise.defer(),
        timeNow = moment().startOf('hour'),
        timeMin;

    if (statistic === 'hour') {
        timeMin = timeNow.clone().subtract(1, 'hours');
    } else if (statistic === 'day') {
        timeMin = timeNow.clone().subtract(1, 'day');
    } else if(statistic === 'minutes') {
        timeNow = moment().startOf('minute');
        timeMin = timeNow.clone().subtract(1, 'minutes');
    }

    models.Mentions.getWithinTime(word.toUpperCase(), timeNow.toDate(), timeMin.toDate()).then(function(data) {
        deferred.resolve(data);
    });

    return deferred.promise;
};

module.exports = MentionsService;