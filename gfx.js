"use strict";
exports.loaded = false;
function load(preload, postload){
	var singles = ["../assets/bg_default.png", "../assets/bg_game.png"];
	var preLoader = new PIXI.AssetLoader(["../assets/esheet.png", "../assets/backsheet.png",
		"../assets/cardborders.png", "../assets/statussheet.png", "../assets/statusborders.png", "../assets/typesheet.png"].concat(singles));
	var loadingBarGraphic = new PIXI.Graphics();
	preLoader.onProgress = function(e) {
		loadingBarGraphic.clear();
		loadingBarGraphic.beginFill(0xFFFFFF);
		loadingBarGraphic.drawRect(0, 284, 900*(1-this.loadCount/this.assetURLs.length), 32);
		loadingBarGraphic.endFill();
	}
	preLoader.onComplete = function() {
		singles.forEach(function(single){
			exports[single.slice(10, -4)] = PIXI.Texture.fromFrame(single);
		});
		var names = {
			eicons: {name: "esheet", w: 32},
			cardBacks: {name: "backsheet", w: 132},
			cardBorders: {name: "cardborders", w: 128},
			sicons: {name: "statussheet", w: 13},
			ticons: {name: "typesheet", w: 25},
			sborders: {name: "statusborders", w: 64}
		};
		for(var name in names){
			var obj = names[name], ts = [], tex = PIXI.Texture.fromFrame("../assets/" + obj.name + ".png");
			for (var x = 0;x < tex.width;x += obj.w) ts.push(new PIXI.Texture(tex, new PIXI.Rectangle(x, 0, obj.w, tex.height)));
			exports[name] = ts;
		}
		exports.loaded = true;
		postload();
	}
	preload(loadingBarGraphic);
	preLoader.load();
}
if (typeof PIXI !== "undefined"){
	exports.nopic = PIXI.Texture.emptyTexture;
	exports.nopic.width = exports.nopic.height = 0;
	exports.load = load;
}