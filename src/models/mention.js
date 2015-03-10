
var bluebird = require('bluebird'),
    mongoose = require('mongoose');

var mentionSchema = mongoose.Schema({
    hash: String,
    word: String,
    type: String,
    from: String,
    contents: String,
    date: Date,
    weight: Number
});


var model = mongoose.model('Mention', mentionSchema)

module.exports = {
    Mention: model,
    Mentions: {
        getWithinTime: function(word, start, end) {
            var deferred = Promise.defer();

            model.find({
                $query: {
                    word: word,
                    date: {
                        $lt: start,
                        $gte: end
                    }
                },
                $orderby: { date: -1 }
            }, function(err, docs) {
                if (err) throw err;

                deferred.resolve(docs);
            });


            return deferred.promise;
        }
    }
};