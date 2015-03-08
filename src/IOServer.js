var server = require('net').createServer();
var emitter = require('./Emitter.js');
var socketio = require('socket.io');

var IOServer = function(options) {
    var self = this;
    this.sockets = [];
    this.io = socketio(options.server);
    this.io.on('connection', function(socket){
        console.log('socket io connection recieved');
        console.log(socket);
        self.sockets.push(socket);
        emitter.on('mentioned', function(data) {
            self.handleNewMention(socket, data)
        });
    });

    this.io.on('disconnect', function(socket) {
        console.log('disconnect');
        console.log(socket);
    });
};

/**
 * Emit mentioned socket event that includes the mention data.
 * @return {[type]} [description]
 */
IOServer.prototype.handleNewMention = function(socket, data) {
    socket.emit('mentioned', data);
};

module.exports = IOServer;