var server = require('net').createServer();
var emitter = require('./Emitter.js');
var socketio = require('socket.io');

var IOServer = function(options) {
    var self = this;
    this.sockets = {};
    this.io = socketio(options.server);
    this.io.on('connection', function(socket){
        console.log('socket io connection recieved');
        console.log(socket.id);
        self.sockets[socket.id] = socket;
    });

    this.io.on('disconnect', function(socket) {
        console.log('disconnect');
        console.log(socket);
        delete self.sockets[socket.id];
    });

    // emitter.on('mentioned', function(data) {
    //     self.handleNewMention(socket, data)
    // });
    // emitter.on('ioserver:mention_count_update', function(data) {
    //     self.handleMentionCountUpdate(socket, data);
    // });
};

/**
 * Emit mentioned socket event that includes the mention data.
 * @return {[type]} [description]
 */
IOServer.prototype.handleNewMention = function(socket, data) {
    //socket.emit('mentioned', data);
};

/**
 *  Send client updated mention count for a word.
 */
IOServer.prototype.handleMentionCountUpdate = function(socket, data) {
    socket.emit('mention_count_update', data);
};

module.exports = IOServer;