var app = require('express')(),
    request = require('request'),
    mongoose = require('mongoose'),
    config = require('./config'),
    IOServer = require('./IOServer.js'),
    TrackingService = require('./TrackingService.js'),
    models = require('./models');

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
}