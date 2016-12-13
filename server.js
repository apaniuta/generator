var express = require('express');
var sockjs  = require('sockjs');
var http    = require('http');
var Chance = require('chance'),
    chance = new Chance();

// 1. Echo sockjs server
var sockjs_opts = {sockjs_url: "http://cdn.jsdelivr.net/sockjs/1.0.1/sockjs.min.js"};

var rndNum = function() {
    return chance.natural({min: 1, max: 5});
};

var sockjs_gen = sockjs.createServer(sockjs_opts);

sockjs_gen.on('connection', function(conn) {
    var timerId;

    conn.on('close', function() {
        console.log('close ' + conn);
        clearInterval(timerId);
    });

    conn.on('data', function(message) {
        console.log(message);
        conn.write(message);


        if (message === 'add' && !timerId) {
            timerId = setInterval(function(){
                conn.write(rndNum());
            }, 2000);
        }

        if (message === 'stop') {
            clearInterval(timerId);
        }
    });
});

// 2. Express server
var app = express(); /* express.createServer will not work here */

var server = http.createServer(app);

sockjs_gen.installHandlers(server, {prefix:'/generator'});

console.log(' [*] Listening on localhost:9999' );
server.listen(9999, 'localhost');

//app.use(express.static(__dirname + '/'));
// app.get('/', function (req, res) {
//     res.sendFile(__dirname + '/index.html');
// });