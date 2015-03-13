
var crypto = require('crypto'),
    $q = require('bluebird'),
    emitter = require('./Emitter.js'),
    models = require('./models'),
    mongoose = require('mongoose');

var DataStore = {
    // Keep track of each individual counts in memory
    keywordRelevance: {},
    total: 0,

    increment: function(word, amount) {
        if (!this.keywordRelevance[word]) {
            this.keywordRelevance[word] = { count: 0 };
        }

        this.keywordRelevance[word].count += amount;
        this.total++;

    },

    addHit: function(word, data) {
        var self = this,
            hash = hash = crypto.createHash('md5').update(data.from + word).digest('hex');
        models.Mention.find({ hash: hash }, function(err, docs) {
            if (err) throw err;
            if (docs.length === 0) {
                var newMention = new models.Mention({
                    hash: hash,
                    word: word.toUpperCase(),
                    type: data.type,
                    from: data.from,
                    contents: data.title,
                    date:  data.date
                });
                newMention.save(function(err) {
                    if (!err) {
                        //console.log('[INSERT ' + word + '] [' + data.type + '] ' + data.title);
                    }
                });

                models.Keyword.update(
                    { word: word.toUpperCase() },
                    {
                        $inc: { count: 1 }
                    },
                    { upsert: true }, function(err) {
                        if (!err) {
                            //console.log('[UPSERT] ' + word.toUpperCase());
                        }
                });

                emitter.emit('mentioned', newMention);
            }
        });
    },

    /**
     * Inserts a tracker hit into the database
     * @param  {object} [Data fields to set]
     * @return {promise}
     */
    insertTrackerHit: function(data) {
        var deferred = $q.defer(),
            trackerHits = this.db.collection('trackerhits');

        trackerHits.insert([
            data
        ], function(err, result) {
            if (err) {
                deferred.reject(err);
            } else {
                deferred.resolve();
            }
        });

        return deferred.promise;
    },

    /**
     * Updates keyword count in database.
     * If the keyword doesn't exist yet in the database, insert it.
     * @param  {string} word [Word to update]
     * @return {promise}
     */
    upsertKeyword: function(word) {
        var deferred = $q.defer(),
            keywords = this.db.collection('keywords');

        keywords.update(
            { word: word },
            { $inc: { count: 1 }},
            { upsert: true },
            function(err, result) {
                deferred.resolve();
            }
        );

        return deferred.promise;
    },

    /**
     * Checks if a track hit is already in the database.
     * Calculate a hash using data.from and data.word
     */
    isTracked: function(data, callback) {
        var collection = this.db.collection('trackerhits'),
            hash = crypto.createHash('md5').update(data.from + data.word).digest('hex');

        collection.find({ hash : hash }).toArray(function(err, docs) {
            if (!err) {
                callback((docs.length > 0));
            }
        });
    }
};

module.exports = DataStore;