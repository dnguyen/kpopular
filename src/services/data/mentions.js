
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
MentionsService.prototype.getLastHour = function(data) {
    var deferred = Promise.defer(),
        timeNow = moment(),
        timeHourAgo = moment().subtract(1, 'hours');

    models.Mentions.getWithinTime(data.word.toUpperCase(), timeNow.toDate(), timeHourAgo.toDate()).then(function(data) {
        deferred.resolve(data);
    });

    return deferred.promise;
};

module.exports = MentionsService;