var chat = require("./chat");
var etgutil = require("./etgutil");
var socket = eio({hostname: location.hostname, port: 13602});
socket.on("close", function(){
	require("./chat")("Reconnecting in 99ms");
	setTimeout(socket.open.bind(socket), 99);
});
socket.on("open", function(){
	chat("Connected");
});
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