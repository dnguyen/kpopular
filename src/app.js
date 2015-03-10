var app = require('express')(),
    cors = require('cors'),
    request = require('request'),
    _ = require('lodash'),
    Promise = require('bluebird'),
    mongoose = Promise.promisifyAll(require('mongoose')),
    config = require('./config'),
    IOServer = require('./IOServer.js'),
    TrackingService = require('./TrackingService.js'),
    models = require('./models');

app.use(cors());

mongoose.connect(config.mongo.connection);
mongoose.connection.on('connected', function() {

    models.init();
    start();

});


function start() {

    var server = require('http').Server(app),
        ioServer = new IOServer({ server: server }),
        trackingService = new TrackingService();

    trackingService.start();
    var MentionsService = require('./services/data/mentions');
    var mentionsService = new MentionsService();
    server.listen(3000, function() {
        var host = server.address().address;
        var port = server.address().port;

        console.log('App listening at http://%s:%s', host, port);
    });

    app.get('/keywords', function(req, res) {

        models.Keyword.find({}, function(err, docs) {
            return res.json(docs);
        });
    });

    app.get('/mentions', function(req, res) {
        var moment = require('moment');
        var now = moment();
        mentionsService.getLastHour({ word: req.query.word }).then(function(data) {

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

    });
}


function createBuckets(amount) {
    var buckets = [];
    for (var i = 0; i < amount; i++) {
        buckets[i] = new Array();
    }

    return buckets;
}