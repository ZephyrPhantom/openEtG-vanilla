"use strict";
exports.loaded = false;
function load(preload, postload){
	var singles = ["bg_default", "bg_game"];
	var assets = ["esheet", "backsheet", "cardborders", "statussheet", "statusborders", "typesheet"].concat(singles);
	var names = {
		esheet: ["eicons", 32],
		backsheet: ["cardBacks", 132],
		cardborders: ["cardBorders", 128],
		statussheet: ["sicons", 13],
		typesheet: ["ticons", 25],
		statusborders: ["sborders", 64],
	};
	var loadingBar = new PIXI.Graphics();
	preload(loadingBar);
	var loadCount = 0;
	assets.forEach(function(asset){
		var img = new Image();
		img.addEventListener("load", function(){
			loadCount++;
			loadingBar.clear();
			loadingBar.beginFill(loadCount == assets.length ? 0x336699 : 0xFFFFFF);
			loadingBar.drawRect(0, 284, 900*loadCount/assets.length, 32);
			loadingBar.endFill();
			var obj = names[asset], tex = new PIXI.Texture(new PIXI.BaseTexture(this));
			if (obj){
				var ts = [], w = obj[1];
				for (var x = 0; x < tex.width; x += w){
					ts.push(new PIXI.Texture(tex, new PIXI.Rectangle(x, 0, w, tex.height)));
				}
				exports[obj[0]] = ts;
			}else exports[asset] = tex;
			if (loadCount == assets.length){
				exports.loaded = true;
				postload();
			}
		});
		img.src = "../assets/" + asset + ".png";
	});
}
if (typeof PIXI !== "undefined"){
	exports.nopic = PIXI.Texture.emptyTexture;
	exports.nopic.width = exports.nopic.height = 0;
	exports.load = load;
}