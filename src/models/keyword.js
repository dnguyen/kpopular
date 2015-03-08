
var mongoose = require('mongoose');

var keywordSchema = new mongoose.Schema({
    word: String,
    count: Number
}, { collection: 'keywords' });

module.exports = {
    Keyword: mongoose.model('Keyword', keywordSchema)
};

