var chat = require("./chat");
var etgutil = require("./etgutil");
var socket = new WebSocket("ws://"+location.hostname+":13602");
socket.onopen = function(){
	chat("Connected");
}
socket.onclose = function reconnect(){
	chat("Reconnecting in 99ms");
	setTimeout(function(){
		var oldsock = socket;
		socket = new WebSocket("ws://"+location.hostname+":13602");
		socket.onopen = oldsock.onopen;
		socket.onclose = oldsock.onclose;
		socket.onmessage = oldsock.onmessage;
	}, 99);
}
exports.et = socket;
exports.emit = function(x, data){
	if (!data) data = {};
	data.x = x;
	socket.send(JSON.stringify(data));
}
exports.getDeck = function(limit) {
	var deck = ~deckimport.value.indexOf(" ") ? deckimport.value.split(" ") :
		etgutil.decodedeck(deckimport.value);
	if (limit && deck.length > 60){
		deck.length = 60;
	}
	return deck;
}