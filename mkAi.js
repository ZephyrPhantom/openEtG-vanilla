var ui = require("./ui");
var etg = require("./etg");
var sock = require("./sock");
var Cards = require("./Cards");
var etgutil = require("../etgutil");
var aiDecks = require("./Decks");
exports.mkPremade = function() {
	return function() {
		var urdeck = sock.getDeck();
		if (urdeck.length < 9) {
			return;
		}
		var foedata = aiDecks.giveRandom();
		var gameData = { deck: foedata[1], urdeck: urdeck, seed: Math.random() * etgutil.MAX_INT, foename: foedata[0] };
		gameData.p2hp = 200;
		gameData.p2markpower = 3;
		gameData.p2drawpower = 2;
		gameData.level = 3;
		return require("./views/Match")(gameData, true);
	}
}
exports.mkAi = function(level) {
	return function() {
		if (Cards.loaded){
			var urdeck = sock.getDeck();
			var deck = require("./ai/deck")(level);
			if (urdeck.length <  9) {
				return;
			}
			var randomNames = [
				"Adrienne", "Audrie",
				"Billie", "Brendon",
				"Charles", "Caddy",
				"Dane", "Digna",
				"Emory", "Evan",
				"Fern",
				"Garland", "Gord",
				"Margie", "Mariah", "Martina", "Monroe", "Murray",
				"Page", "Pariah",
				"Rocky", "Ronald", "Ren",
				"Seth", "Sherman", "Stormy",
				"Tammi",
				"Yuriko"
			];

			var gameData = { deck: deck, urdeck: urdeck, seed: Math.random() * etgutil.MAX_INT, p2hp: level == 0 ? 100 : level == 1 ? 125 : 150, p2markpower: level > 1 ? 2 : 1, foename: etg.PlayerRng.choose(randomNames), p2drawpower: level == 2 ? 2 : 1 };
			gameData.level = level;
			return require("./views/Match")(gameData, true);
		}
	}
}