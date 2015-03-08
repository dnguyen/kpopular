
var mongoose = require('mongoose');

var mentionSchema = mongoose.Schema({
    hash: String,
    word: String,
    type: String,
    from: String,
    contents: String,
    date: Date,
    weight: Number
});

module.exports = {
    Mention: mongoose.model('Mention', mentionSchema)
};