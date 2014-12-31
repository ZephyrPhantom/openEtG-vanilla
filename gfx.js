"use strict";
exports.loaded = false;
function load(preload, postload){
	var singles = ["bg_default", "bg_game"];
	var assets = ["eicons", "cardBacks", "cardBorders", "sicons", "sborders", "ticons"].concat(singles);
	var widths = {
		eicons: 32,
		cardBacks: 132,
		cardBorders: 128,
		sicons: 13,
		ticons: 25,
		sborders: 64,
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
			var w = widths[asset], tex = new PIXI.Texture(new PIXI.BaseTexture(this));
			if (w){
				var ts = [];
				for (var x = 0; x < tex.width; x += w){
					ts.push(new PIXI.Texture(tex, new PIXI.Rectangle(x, 0, w, tex.height)));
				}
				exports[asset] = ts;
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