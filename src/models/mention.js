
var Promise = require('bluebird'),
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
            console.time('mentionsfetch' + word);
            model.find({
                $query: {
                    word: word,
                    date: {
                        $lt: start,
                        $gte: end
                    }
                },
                $orderby: { date: -1 }
            },
            { hash: 1, contents: 1, date: 1, _id: 0 },
            function(err, docs) {
                if (err) throw err;
                console.timeEnd('mentionsfetch' + word);
                deferred.resolve(docs);
            });


            return deferred.promise;
        }
    }
};