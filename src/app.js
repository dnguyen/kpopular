var app = require('express')(),
    cors = require('cors'),
    compression = require('compression'),
    _ = require('lodash'),
    Promise = require('bluebird'),
    mongoose = Promise.promisifyAll(require('mongoose')),
    config = require('./config'),
    IOServer = require('./IOServer.js'),
    TrackingService = require('./TrackingService.js'),
    models = require('./models'),
    MentionsController = require('./controllers/mentions'),
    ArtistsController = require('./controllers/artists'),
    RankingController = require('./controllers/ranking');

app.use(cors());
app.use(compression());

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

    server.listen(3005, function() {
        var host = server.address().address;
        var port = server.address().port;

        console.log('App listening at http://%s:%s', host, port);
    });

    app.get('/artists', ArtistsController.index);
    app.get('/artists/:name', ArtistsController.get);
    app.get('/artists/:name/mentions', ArtistsController.getMentions);
    app.get('/mentions', MentionsController.index);
    app.get('/ranking', RankingController.index);

}

