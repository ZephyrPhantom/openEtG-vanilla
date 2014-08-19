#!/usr/bin/node
"use strict";
var connect = require("connect");
var fs = require("fs");
var app = require("http").createServer(connect().use(require("compression")()).use(cardRedirect).use(require("serve-static")(__dirname)));
var io = require("socket.io")(app.listen(13602));
var etgutil = require("./etgutil");

function cardRedirect(req, res, next){
	if (req.url.match(/^\/Cards\/...\.png$/)){
		var code = req.url.substr(7, 3);
		if (code > "6qn"){
			fs.exists(__dirname + req.url, function(exists){
				if (!exists){
					res.writeHead("302", {Location: "http://" + req.headers.host + "/Cards/" + etgutil.asShiny(etgutil.asUpped(code, false), false) + ".png"});
					res.end();
				}else next();
			});
			return;
		}
	}
	next();
}

var rooms = {};
var sockinfo = {};
function dropsock(){
	var info = sockinfo[this.id];
	if (info){
		if (info.foe){
			info.foe.emit("foeleft");
		}
		if (info.trade){
			var foesock = usersock[info.trade.foe];
			if (foesock){
				foesock.emit("tradecanceled");
				var foesockinfo = sockinfo[foesock.id];
				if (foesockinfo){
					delete foesockinfo.trade;
				}
			}
		}
		delete sockinfo[this.id];
	}
}
function genericChat(socket, data){
	if (data.msg == "/who") {
		var usersonline = activeUsers().join(", ");
		socket.emit("chat", { mode: "info", msg: usersonline ? "Users online: " + usersonline + "." : "There are no users online :(" })
	}
	else io.emit("chat", data)
}
io.on("connection", function(socket) {
	sockinfo[socket.id] = {};
	socket.on("disconnect", dropsock);
	socket.on("reconnect_failed", dropsock);
	function foeEcho(event){
		socket.on(event, function(data){
			console.log(event);
			var foe = sockinfo[this.id].foe;
			if (foe){
				foe.emit(event, data);
			}
		});
	}
	foeEcho("endturn");
	foeEcho("cast");
	foeEcho("foeleft");
	foeEcho("mulligan");
	socket.on("guestchat", function (data) {
		data.mode = "guest";
		data.u = "Guest" + (data.u ? "_" + data.u : "");
		genericChat(socket, data);
	});
	socket.on("pvpwant", function(data) {
		var pendinggame=rooms[data.room];
		console.log(this.id + ": " + (pendinggame?pendinggame.id:"-"));
		sockinfo[this.id].deck = data.deck;
		sockinfo[this.id].pvpstats = { hp: data.hp, markpower: data.mark, deckpower: data.deck, drawpower: data.draw };
		if (this == pendinggame){
			return;
		}
		if (pendinggame && pendinggame.id in sockinfo){
			var seed = Math.random()*etgutil.MAX_INT;
			var first = seed<etgutil.MAX_INT/2;
			sockinfo[this.id].foe = pendinggame;
			sockinfo[pendinggame.id].foe = this;
			var deck0 = sockinfo[pendinggame.id].deck, deck1 = data.deck;
			var owndata = { first: first, seed: seed, deck: deck0, urdeck: deck1};
			var foedata = { first: !first, seed: seed, deck: deck1, urdeck: deck0};
			var stat = sockinfo[this.id].pvpstats, foestat = sockinfo[pendinggame.id].pvpstats;
			for (var key in stat) {
				owndata["p1" + key] = stat[key];
				foedata["p2" + key] = stat[key];
			}
			for (var key in foestat) {
				owndata["p2" + key] = foestat[key];
				foedata["p1" + key] = foestat[key];
			}
			this.emit("pvpgive", owndata);
			pendinggame.emit("pvpgive", foedata);
			delete rooms[data.room];
		}else{
			rooms[data.room] = this;
		}
	});
});