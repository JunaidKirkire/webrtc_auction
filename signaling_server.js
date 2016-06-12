var express  = require('express');
var websocket = require("websocket").server;
var fs   = require('fs');
var mysql = require('mysql');

var app = express();
app.use('/scripts', express.static(__dirname + '/'));

var index = fs.readFileSync('index.html')

var http = require('http').Server(app);

app.get('/', function(req, res) {
	res.write(index);
	res.end();
});

http.listen(8888, function() {
	console.log("Listening on port 8888");
});

webrtc_sessions = {}

var websocket_server = new websocket({ httpServer : http });
websocket_server.on("request", function(request) {
  var connection = request.accept(null, request.origin);
  connection.on("message", function(message) {
    console.log("Message " + message.utf8Data);
    data = JSON.parse(message.utf8Data);
    if (data.type == "init") {
      webrtc_sessions[data.sid] = [];
      webrtc_sessions[data.sid].push(connection);
    } else if (data.type == "join") {
      console.log("Session count " + webrtc_sessions[data.sid].length);
      webrtc_sessions[data.sid][0].send(JSON.stringify({sid:data.sid, type:"joined"}));
      webrtc_sessions[data.sid].push(connection);
    } else if (data.type == "offer_sent") {
      webrtc_sessions[data.sid][1].send(JSON.stringify({sid:data.sid, type:"offer_sent", sdp:data.sdp}));
    } else if (data.type == "answer_sent") {
      webrtc_sessions[data.sid][0].send(JSON.stringify({sid:data.sid, type:"answer_sent", sdp:data.sdp}));
    } else if (data.type == "ice") {
      if (data.isStart) {
        webrtc_sessions[data.sid][1].send(JSON.stringify({sid:data.sid, type:"ice", icec:data.icec}));
      } else {
        webrtc_sessions[data.sid][0].send(JSON.stringify({sid:data.sid, type:"ice", icec:data.icec}));
      }
    } else {
      console.log("Unknown type sent " + data.type);
    }

    // conn = mysql.createConnection({ host:'localhost', user:'deploy', pass:'', database:'test' });
    // conn.query("INSERT INTO auction_room (session_id, user_email, is_owner) VALUES('" + data.sid + "', 'test@test.com', "+(data.type == "join" ? 0 : 1)+")");
    // conn.end();

    console.log("Clients " + webrtc_sessions[data.sid]);
  });
  connection.on("close", function (reasonCode, desc) {
    console.log("reasonCode " + reasonCode);
    console.log("desc " + desc);
    console.log("Closed connection");
  });
});
