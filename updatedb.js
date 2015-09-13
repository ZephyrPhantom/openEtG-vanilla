#!/usr/bin/node
"use strict";
var fs = require("fs"), zlib = require("zlib"), http = require("https");
function download(gid, writeStream, cb){
	http.get({
		host:"docs.google.com",
		path:"/spreadsheets/d/15G8h9S0Ph7UfzaZMyn35LpJY8gTgmTtru6K2QmdTUmw/export?format=csv&id=15G8h9S0Ph7UfzaZMyn35LpJY8gTgmTtru6K2QmdTUmw&gid="+gid,
		headers: { "GData-Version": "3.0", "Accept-Encoding":"gzip" },
	}, function(res){
		if (res.headers["content-encoding"] == "gzip"){
			res = res.pipe(zlib.createGunzip());
		}
		res.pipe(writeStream);
		res.on("end", function(){
			cb(null);
		});
	}).on("error", function(err){
		cb(err);
	});
}
var dbgid = [
	["pillar", "0"],
	["weapon", "1863409466"],
	["shield", "457582620"],
	["permanent", "420516648"],
	["spell", "1605384839"],
	["creature", "1045918250"],
	["active", "657211460"],
];
dbgid.forEach(function(pair){
	if (process.argv.length == 2 || process.argv.some(function(x) { return x.indexOf(pair[0]) == 0; })){
		download(pair[1], fs.createWriteStream(pair[0]+".csv"), function(err){
			if (err){
				console.log("Failed to download " + pair[0], err.message);
			}else console.log(pair[0]);
		});
	}
});