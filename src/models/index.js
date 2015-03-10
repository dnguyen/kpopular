
var fs = require('fs'),
    Promise = require('bluebird'),
    mongoose = require('mongoose'),
    _ = require('lodash');

var models = {
    exclusionList: ['index.js'],

    init: function() {
        var self = this;

        // Auto load all files in models folder
        fs.readdir('src/models', function(err, files) {
            if (err) throw err;
            _.each(files, function(file) {
                _.each(self.exclusionList, function(excludedFile) {
                    if (file.indexOf(excludedFile) === -1) {
                        console.log(file);
                        var modelFile = require('./' + file);
                        _.extend(self, modelFile);
                    }
                });
            });
        });
    }
};

module.exports = models;