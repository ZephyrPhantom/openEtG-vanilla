"use strict";
PIXI.AUTO_PREVENT_DEFAULT = false;
(function() {
var htmlElements = ["leftpane", "chatinput", "deckimport", "foename", "challenge", "chatBox", "bottompane", "username"];
htmlElements.forEach(function(name){
	window[name] = document.getElementById(name);
});
})();
(function(){
require("./etg.client").loadcards(function(){
	if (gfx.loaded) startEditor();
});
var guestname, muteset = {}, muteall;
var etgutil = require("./etgutil");
var etg = require("./etg");
var Actives = require("./Actives");
var Effect = require("./Effect");
var ui = require("./uiutil");
var Cards = require("./Cards");
var lastError = 0;
window.onerror = function(){
	var now = Date.now();
	if (lastError+999<now){
		chat(Array.apply(null, arguments).join(", "));
		lastError = now;
	}
}
function maybeSetText(obj, text) {
	if (obj.text != text) obj.setText(text);
}
function maybeSetTexture(obj, text) {
	if (text) {
		obj.visible = true;
		obj.setTexture(text);
	} else obj.visible = false;
}
function setClick(obj, click){
	obj.click = click;
}
function hitTest(obj, pos) {
	var x = obj.position.x - obj.width * obj.anchor.x, y = obj.position.y - obj.height * obj.anchor.y;
	return pos.x > x && pos.y > y && pos.x < x + obj.width && pos.y < y + obj.height;
}
function setInteractive() {
	for (var i = 0;i < arguments.length;i++) {
		arguments[i].interactive = true;
	}
}
function sockEmit(x, data){
	if (!data) data = {};
	data.x = x;
	socket.send(JSON.stringify(data));
}
function refreshRenderer(stage, animCb) {
	if (realStage.children.length > 1){
		var oldstage = realStage.children[1];
		if (oldstage.endnext) oldstage.endnext();
		realStage.removeChildAt(1);
	}
	realStage.addChild(stage);
	realStage.next = animCb;
}

var renderer = new PIXI.autoDetectRenderer(900, 600, {view:leftpane, transparent:true});
var realStage = new PIXI.Stage();
renderer.view.addEventListener("click", function(){this.blur()});
var caimgcache = {}, crimgcache = {}, wsimgcache = {}, artcache = {}, artimagecache = {};
var elecols = [0xa99683, 0xaa5999, 0x777777, 0x996633, 0x5f4930, 0x50a005, 0xcc6611, 0x205080, 0xa9a9a9, 0x337ddd, 0xccaa22, 0x333333, 0x77bbdd];

function lighten(c) {
	return ((c & 255) + 255 >> 1) | (((c >> 8) & 255) + 255 >> 1 << 8) | (((c >> 16) & 255) + 255 >> 1 << 16);
}
function maybeLighten(card){
	return card.upped ? lighten(elecols[card.element]) : elecols[card.element];
}
function makeArt(card, art, oldrend) {
	var rend = oldrend || new PIXI.RenderTexture(132, 256);
	var template = new PIXI.DisplayObjectContainer();
	template.addChild(new PIXI.Sprite(gfx.cardBacks[card.element+(card.upped?13:0)]));
	if (art) {
		var artspr = new PIXI.Sprite(art);
		artspr.position.set(2, 20);
		template.addChild(artspr);
	}
	var typemark = new PIXI.Sprite(gfx.ticons[card.type]);
	typemark.anchor.set(1, 1);
	typemark.position.set(128, 252);
	template.addChild(typemark);
	var nametag = new PIXI.Text(card.name, { font: "12px Dosis", fill: card.upped ? "black" : "white" });
	nametag.position.set(2, 4);
	template.addChild(nametag);
	if (card.cost) {
		var text = new PIXI.Text(card.cost, { font: "12px Dosis", fill: card.upped ? "black" : "white" });
		text.anchor.x = 1;
		text.position.set(rend.width - 20, 4);
		template.addChild(text);
		if (card.costele) {
			var eleicon = new PIXI.Sprite(gfx.eicons[card.costele]);
			eleicon.position.set(rend.width - 1, 10);
			eleicon.anchor.set(1, .5);
			eleicon.scale.set(.5, .5);
			template.addChild(eleicon);
		}
	}
	var infospr = new PIXI.Sprite(ui.getTextImage(card.info(), ui.mkFont(11, card.upped ? "black" : "white"), "", rend.width-4))
	infospr.position.set(2, 150);
	template.addChild(infospr);
	rend.render(template, null, true);
	return rend;
}
function getArtImage(code, cb){
	if (!(code in artimagecache)){
		var loader = new PIXI.ImageLoader("../Cards/" + code + ".png");
		loader.addEventListener("loaded", function() {
			cb(artimagecache[code] = PIXI.Texture.fromFrame("../Cards/" + code + ".png"));
		});
		loader.load();
	}
	return cb(artimagecache[code]);
}
function getArt(code) {
	if (artcache[code]) return artcache[code];
	else {
		return getArtImage(code, function(art){
			return artcache[code] = makeArt(Cards.Codes[code], art, artcache[code]);
		});
	}
}
function getCardImage(code) {
	if (caimgcache[code]) return caimgcache[code];
	else {
		var card = Cards.Codes[code];
		var rend = new PIXI.RenderTexture(100, 20);
		var graphics = new PIXI.Graphics();
		graphics.lineStyle(2, 0x222222, 1);
		graphics.beginFill(card ? maybeLighten(card) : code == "0" ? 0x887766 : 0x111111);
		graphics.drawRect(0, 0, 100, 20);
		graphics.endFill();
		if (card) {
			var clipwidth = 2;
			if (card.cost) {
				var text = new PIXI.Text(card.cost, { font: "11px Dosis", fill: card.upped ? "black" : "white" });
				text.anchor.x = 1;
				text.position.set(rend.width - 20, 5);
				graphics.addChild(text);
				clipwidth += text.width + 22;
				if (card.costele) {
					var eleicon = new PIXI.Sprite(gfx.eicons[card.costele]);
					eleicon.position.set(rend.width - 1, 10);
					eleicon.anchor.set(1, .5);
					eleicon.scale.set(.5, .5);
					graphics.addChild(eleicon);
				}
			}
			var text, loopi = 0;
			do text = new PIXI.Text(card.name.substring(0, card.name.length - (loopi++)), { font: "11px Dosis", fill: card.upped ? "black" : "white" }); while (text.width > rend.width - clipwidth);
			text.position.set(2, 5);
			graphics.addChild(text);
		}
		rend.render(graphics);
		return caimgcache[code] = rend;
	}
}
function getCreatureImage(code) {
	if (crimgcache[code]) return crimgcache[code];
	else {
		return getArtImage(code, function(art){
			var card = Cards.Codes[code];
			var rend = new PIXI.RenderTexture(64, 82);
			var graphics = new PIXI.Graphics();
			var border = new PIXI.Sprite(gfx.cardBorders[card.element + (card.upped ? 13 : 0)]);
			border.scale.set(0.5, 0.5);
			graphics.addChild(border);
			graphics.beginFill(card ? maybeLighten(card) : elecols[0]);
			graphics.drawRect(0, 9, 64, 64);
			graphics.endFill();
			if (art) {
				var artspr = new PIXI.Sprite(art);
				artspr.scale.set(0.5, 0.5);
				artspr.position.set(0, 9);
				graphics.addChild(artspr);
			}
			if (card) {
				var text = new PIXI.Text(card.name, { font: "8px Dosis", fill: card.upped ? "black" : "white" });
				text.anchor.x = 0.5;
				text.position.set(33, 72);
				graphics.addChild(text);
			}
			rend.render(graphics);
			return crimgcache[code] = rend;
		});
	}
}
var getPermanentImage = getCreatureImage; // Different name in case a makeover happens
function getWeaponShieldImage(code) {
	if (wsimgcache[code]) return wsimgcache[code];
	else {
		return getArtImage(code, function(art){
			var card = Cards.Codes[code];
			var rend = new PIXI.RenderTexture(80, 102);
			var graphics = new PIXI.Graphics();
			var border = (new PIXI.Sprite(gfx.cardBorders[card.element + (card.upped ? 13 : 0)]));
			border.scale.set(5/8, 5/8);
			graphics.addChild(border);
			graphics.beginFill(card ? maybeLighten(card) : elecols[0]);
			graphics.drawRect(0, 11, 80, 80);
			graphics.endFill();
			if (art) {
				var artspr = new PIXI.Sprite(art);
				artspr.scale.set(5/8, 5/8);
				artspr.position.set(0, 11);
				graphics.addChild(artspr);
			}
			if (card) {
				var text = new PIXI.Text(card.name, { font: "10px Dosis", fill: card.upped ? "black" : "white" });
				text.anchor.x = 0.5;
				text.position.set(40, 91);
				graphics.addChild(text);
			}
			rend.render(graphics);
			return wsimgcache[code] = rend;
		});
	}
}
function initGame(data) {
	var game = new etg.Game(data.seed, data.flip);
	if (data.p1hp) {
		game.player1.maxhp = game.player1.hp = data.p1hp;
	}
	if (data.p2hp) {
		game.player2.maxhp = game.player2.hp = data.p2hp;
	}
	if (data.p1markpower !== undefined) {
		game.player1.markpower = data.p1markpower;
	}
	if (data.p2markpower !== undefined) {
		game.player2.markpower = data.p2markpower;
	}
	if (data.p1drawpower !== undefined) {
		game.player1.drawpower = data.p1drawpower;
	}
	if (data.p2drawpower !== undefined) {
		game.player2.drawpower = data.p2drawpower;
	}
	var deckpower = [data.p1deckpower, data.p2deckpower];
	var idx, code, decks = [data.urdeck, data.deck];
	for (var j = 0;j < 2;j++) {
		var pl = game.players(j);
		for (var i = 0;i < decks[j].length;i++) {
			if (Cards.Codes[code = decks[j][i]]) {
				pl.deck.push(Cards.Codes[code]);
			} else if (~(idx = etg.fromTrueMark(code))) {
				pl.mark = idx;
			}
		}
		if (deckpower[j]) {
			pl.deck = deckPower(pl.deck, deckpower[j]);
		}
		else if (pl.drawpower > 1){
			pl.deck = deckPower(pl.deck, 2);
		}
	}
	game.turn.drawhand();
	game.turn.foe.drawhand();
	if (data.foename) game.foename = data.foename;
	startMatch(game);
	return game;
}
function deckPower(deck, amount) {
	var res = deck;
	for (var i = 1;i < amount;i++) {
		res = res.concat(deck);
	}
	return res;
}
function getDeck(limit) {
	var deck = ~deckimport.value.indexOf(" ") ? deckimport.value.split(" ") :
		etgutil.decodedeck(deckimport.value);
	if (limit && deck.length > 60){
		deck.length = 60;
	}
	return deck;
}
function listify(maybeArray) {
	if (maybeArray instanceof Array) return maybeArray;
	else return maybeArray.split();
}
function count(haystack, needle){
	var c = 0, i=-1;
	for(;;){
		i = haystack.indexOf(needle, i+1);
		if (~i) c++;
		else return c;
	}
}
function victoryScreen(game) {
	var victoryui = new PIXI.DisplayObjectContainer();
	victoryui.interactive = true;
	var winner = game.winner == game.player1;

	victoryui.addChild(makeText(10, 290, "Plies: " + game.ply + "\nTime: " + (game.time/1000).toFixed(1) + " seconds"));
	if (winner){
		var tinfo = makeText(450, game.cardreward ? 130 : 250, "You won!", true, 500);
		tinfo.anchor.x = 0.5;
		tinfo.anchor.y = 1;
		victoryui.addChild(tinfo);
	}

	var bexit = makeButton(412, 430, "Exit");
	setClick(bexit, startEditor);
	victoryui.addChild(bexit);
	refreshRenderer(victoryui);
}
// Asset Loading
var gfx = require("./gfx");
gfx.load(function(loadingScreen){
	realStage.addChild(loadingScreen);
	requestAnimate();
}, function(){
	realStage.removeChildren();
	realStage.addChild(new PIXI.Sprite(gfx.bg_default));
	if (Cards.loaded) startEditor();
});
function makeButton(x, y, img, mouseoverfunc) {
	var b;
	if (typeof img == "string"){
		b = new PIXI.Sprite(gfx.button);
		var txt = new PIXI.Text(img, {font: "14px Dosis"});
		txt.anchor.set(.5, .5);
		txt.position.set(b.width/2, b.height/2);
		if (txt.width>b.width-6) txt.width=b.width-6;
		b.addChild(txt);
		b.setText = function(x){
			if (x){
				maybeSetText(txt, x.toString());
				this.visible = true;
			}else this.visible = false;
		}
	}else{
		b = new PIXI.Sprite(img);
	}
	b.interactive = true;
	b.buttonMode = true;
	b.position.set(x, y);
	b.mousedown = function() {
		b.tint = 0x666666;
	}
	b.mouseover = b.mouseup = function() {
		if (mouseoverfunc) mouseoverfunc();
		b.tint = 0xAAAAAA;
	}
	b.mouseout = function() {
		b.tint = 0xFFFFFF;
	}
	return b;
}

function makeText(x, y, txt, vis, width) {
	var t = new PIXI.Sprite(gfx.nopic);
	t.position.set(x, y);
	t.setText = function(x, width){
		if (x){
			t.setTexture(ui.getTextImage(x, { font: "14px Verdana", fill: "white", stroke: "black", strokeThickness: 2 }, "", width));
			t.visible = true;
		}else{
			t.visible = false;
		}
	}
	t.setText(txt, width);
	t.visible = vis === undefined || vis;
	return t;
}

function toggleB() {
	for (var i = 0;i < arguments.length;i++) {
		arguments[i].visible = !arguments[i].visible;
		arguments[i].interactive = !arguments[i].interactive;
		arguments[i].buttonMode = !arguments[i].buttonMode;
	}
}
function editorCardCmp(x, y) {
	var cx = Cards.Codes[x], cy = Cards.Codes[y];
	return cx.upped - cy.upped || cx.element - cy.element || cx.cost - cy.cost || cx.type - cy.type || (x > y) - (x < y);
}
function adjust(cardminus, code, x) {
	if (code in cardminus) {
		cardminus[code] += x;
	} else cardminus[code] = x;
}
function makeCardSelector(cardmouseover, cardclick){
	var cardsel = new PIXI.DisplayObjectContainer();
	cardsel.interactive = true;
	var elefilter = 0, rarefilter = 0;
	var columns = [[],[],[],[],[],[]], columnspr = [[],[],[],[],[],[]];
	for (var i = 0;i < 13;i++) {
		var sprite = makeButton((!i || i&1?4:40), 316 + Math.floor((i-1)/2) * 32, gfx.eicons[i]);
		sprite.interactive = true;
		(function(_i) {
			setClick(sprite, function() {
				elefilter = _i;
				makeColumns();
			});
		})(i);
		cardsel.addChild(sprite);
	}
	for (var i = 0;i < 6;i++) {
		for (var j = 0;j < 15;j++) {
			var sprite = new PIXI.Sprite(gfx.nopic);
			sprite.position.set(100 + i * 130, 272 + j * 20);
			var sprcount = new PIXI.Text("", { font: "12px Dosis" });
			sprcount.position.set(102, 4);
			sprite.addChild(sprcount);
			(function(_i, _j) {
				if (cardclick){
					setClick(sprite, function() {
						cardclick(columns[_i][_j]);
					});
				}
				if (cardmouseover){
					sprite.mouseover = function(){
						cardmouseover(columns[_i][_j]);
					}
				}
			})(i, j);
			sprite.interactive = true;
			cardsel.addChild(sprite);
			columnspr[i].push(sprite);
		}
	}
	function makeColumns(){
		for (var i = 0;i < 6;i++) {
			columns[i] = etg.filtercards(i > 2,
				function(x) { return x.element == elefilter &&
					((i % 3 == 0 && x.type == etg.CreatureEnum) || (i % 3 == 1 && x.type <= etg.PermanentEnum) || (i % 3 == 2 && x.type == etg.SpellEnum));
				}, editorCardCmp);
			for (var j = 0;j < columns[i].length;j++) {
				var spr = columnspr[i][j], code = columns[i][j], card = Cards.Codes[code];
				spr.setTexture(getCardImage(code));
				spr.visible = true;
			}
			for (;j < 15;j++) {
				columnspr[i][j].visible = false;
			}
		}
	}
	makeColumns();
	return cardsel;
}
function startEditor() {
	function sumCardMinus(cardminus, code){
		var sum = 0;
		for (var i=0; i<2; i++){
			sum += cardminus[etgutil.asUpped(code, i==0)] || 0;
		}
		return sum;
	}
	function processDeck() {
		cardminus = {};
		for (var i = editordeck.length - 1;i >= 0;i--) {
			if (!(editordeck[i] in Cards.Codes)) {
				var index = etg.fromTrueMark(editordeck[i]);
				if (~index) {
					editormark = index;
				}
				editordeck.splice(i, 1);
			}else adjust(cardminus, editordeck[i], 1);
		}
		if (editordeck.length > 60){
			editordeck.length = 60;
		}
		editormarksprite.setTexture(gfx.eicons[editormark]);
		editordeck.sort(editorCardCmp);
		saveDeck();
	}
	var cardminus = {};
	var editorui = new PIXI.DisplayObjectContainer();
	editorui.interactive = true;
	var bclear = makeButton(8, 32, "Clear");
	setClick(bclear, function() {
		cardminus = {};
		editordeck.length = 0;
		saveDeck();
	});
	editorui.addChild(bclear);
	function saveDeck(){
		deckimport.value = etgutil.encodedeck(editordeck) + "01" + etg.toTrueMark(editormark);
	}
	var bimport = makeButton(8, 80, "Import");
	setClick(bimport, function() {
		var dvalue = deckimport.value;
		editordeck = ~dvalue.indexOf(" ") ? dvalue.split(" ") : etgutil.decodedeck(dvalue);
		processDeck();
	});
	editorui.addChild(bimport);
	var bconvert = makeButton(5, 554, "Convert Code");
	setClick(bconvert, function() {
		deckimport.value = editordeck.join(" ") + " " + etg.toTrueMark(editormark);
	});
	editorui.addChild(bconvert);
	var editordecksprites = [];
	var editordeck = getDeck(true);
	var editormarksprite = new PIXI.Sprite(gfx.nopic);
	editormarksprite.position.set(100, 234);
	editorui.addChild(editormarksprite);
	var editormark = 0;
	processDeck();
	for (var i = 0;i < 13;i++) {
		var sprite = makeButton(200 + i * 32, 234, gfx.eicons[i]);
		sprite.interactive = true;
		(function(_i) {
			setClick(sprite, function() {
				editormark = _i;
				editormarksprite.setTexture(gfx.eicons[_i]);
				saveDeck();
			});
		})(i);
		editorui.addChild(sprite);
	}
	for (var i = 0;i < 60;i++) {
		var sprite = new PIXI.Sprite(gfx.nopic);
		sprite.position.set(100 + Math.floor(i / 10) * 100, 32 + (i % 10) * 20);
		(function(_i) {
			setClick(sprite, function() {
				var code = editordeck[_i], card = Cards.Codes[code];
				if (card.type != etg.PillarEnum) {
					adjust(cardminus, code, -1);
				}
				editordeck.splice(_i, 1);
				saveDeck();
			});
			sprite.mouseover = function() {
				cardArt.setTexture(getArt(editordeck[_i]));
				cardArt.visible = true;
			}
		})(i);
		sprite.interactive = true;
		editorui.addChild(sprite);
		editordecksprites.push(sprite);
	}
	setInteractive.apply(null, editordecksprites);
	var cardsel = makeCardSelector(
		function(code){
			cardArt.setTexture(getArt(code));
			cardArt.visible = true;
		},
		function(code){
			if (editordeck.length < 60) {
				var card = Cards.Codes[code];
				if (card.type != etg.PillarEnum) {
					if (Cards.Codes[code].type != etg.PillarEnum && sumCardMinus(cardminus, code) >= 6) {
						return;
					}
					adjust(cardminus, code, 1);
				}
				for (var i = 0;i < editordeck.length;i++) {
					var cmp = editorCardCmp(editordeck[i], code);
					if (cmp >= 0) break;
				}
				editordeck.splice(i, 0, code);
				saveDeck();
			}
		});
	editorui.addChild(cardsel);
	var cardArt = new PIXI.Sprite(gfx.nopic);
	cardArt.position.set(734, 8);
	editorui.addChild(cardArt);
	refreshRenderer(editorui, function() {
		for (var i = 0;i < editordeck.length;i++) {
			editordecksprites[i].visible = true;
			editordecksprites[i].setTexture(getCardImage(editordeck[i]));
		}
		for (;i < 60;i++) {
			editordecksprites[i].visible = false;
		}
	});
}
function startMatch(game) {
	function drawBorder(obj, spr) {
		if (obj) {
			if (game.targetingMode) {
				if (game.targetingMode(obj)) {
					fgfx.lineStyle(2, 0xff0000);
					fgfx.drawRect(spr.position.x - spr.width / 2, spr.position.y - spr.height / 2, spr.width, spr.height);
					fgfx.lineStyle(2, 0xffffff);
				}
			} else if (obj.canactive() && !(obj.owner == game.player2 && game.player2.isCloaked())) {
				fgfx.lineStyle(2, obj.card.element == 8 ? 0x000000 : 0xffffff);
				fgfx.drawRect(spr.position.x - spr.width / 2, spr.position.y - spr.height / 2, spr.width, (obj instanceof etg.Weapon || obj instanceof etg.Shield ? 12 : 10));
			}
		}
	}
	function drawStatus(obj, spr) {
		spr.getChildAt(0).getChildAt(0).visible = obj.status.psion;
		spr.getChildAt(0).getChildAt(1).visible = obj.status.aflatoxin;
		spr.getChildAt(0).getChildAt(2).visible = obj.status.poison > 0;
		spr.getChildAt(0).getChildAt(3).visible = obj.status.airborne || obj.status.ranged;
		spr.getChildAt(0).getChildAt(4).visible = obj.status.momentum;
		spr.getChildAt(0).getChildAt(5).visible = obj.status.adrenaline;
		spr.getChildAt(0).getChildAt(6).visible = obj.status.poison < 0;
		spr.getChildAt(0).getChildAt(7).visible = obj.status.delayed;
		spr.getChildAt(0).getChildAt(8).visible = obj == obj.owner.gpull;
		spr.getChildAt(0).getChildAt(9).visible = obj.status.frozen;
		spr.alpha = obj.status.immaterial || obj.status.burrowed ? .7 : 1;
	}
	var gameui = new PIXI.DisplayObjectContainer(), discarding;
	gameui.interactive = true;
	var redlines = new PIXI.Sprite(gfx.bg_game);
	redlines.position.y = 12;
	gameui.addChild(redlines);
	var cloakgfx = new PIXI.Graphics();
	cloakgfx.beginFill(0);
	cloakgfx.drawRect(130, 20, 660, 280);
	cloakgfx.endFill();
	gameui.addChild(cloakgfx);
	var winnername = new PIXI.Text("", { font: "16px Dosis" });
	winnername.position.set(800, 500);
	gameui.addChild(winnername);
	var endturn = makeButton(800, 540, "Accept Hand");
	var cancel = makeButton(800, 500, " ");
	var resign = makeButton(8, 24, "Resign");
	gameui.addChild(endturn);
	gameui.addChild(cancel);
	gameui.addChild(resign);
	var turntell = new PIXI.Text("", { font: "16px Dosis" });
	var foename = new PIXI.Text(game.foename || "Unknown Opponent", { font: "bold 18px Dosis", align: "center" });
	foename.position.set(5, 75);
	gameui.addChild(foename);
	function addNoHealData(game) {
		var data = game.dataNext || {};
		if (game.noheal){
			data.p1hp = game.player1.hp;
			data.p1maxhp = game.player1.maxhp;
		}
		return data;
	}
	setClick(endturn, function(e, discard) {
		if (game.winner) {
			victoryScreen(game);
		} else if (game.turn == game.player1) {
			if (discard == undefined && game.player1.hand.length == 8) {
				discarding = true;
			} else {
				discarding = false;
				sockEmit("endturn", {bits: discard});
				game.player1.endturn(discard);
				delete game.targetingMode;
				if (foeplays.children.length)
					foeplays.removeChildren();
			}
		}
	});
	setClick(cancel, function() {
		if (resigning) {
			resign.setText("Resign");
			resigning = false;
		} else if (game.turn == game.player1) {
			if (game.targetingMode) {
				delete game.targetingMode;
			} else if (discarding) {
				discarding = false;
			}
		}
	});
	var resigning;
	setClick(resign, function() {
		if (resigning){
			sockEmit("foeleft");
			game.setWinner(game.player2);
			endturn.click();
		}else{
			resign.setText("Confirm");
			resigning = true;
		}
	});
	turntell.position.set(800, 570);
	gameui.addChild(turntell);
	function setInfo(obj) {
		if (obj.owner != game.player2 || !cloakgfx.visible || !obj.card || obj.card.isOf(Cards.Cloak)) {
			infobox.setTexture(ui.getTextImage(obj.info(), ui.mkFont(10, "white"), 0, (obj instanceof etg.Weapon || obj instanceof etg.Shield ? 92 : 76)));
			var mousePosition = realStage.getMousePosition();
			infobox.position.set(mousePosition.x, mousePosition.y);
			infobox.visible = true;
		}
	}
	var handsprite = [new Array(8), new Array(8)];
	var creasprite = [new Array(23), new Array(23)];
	var permsprite = [new Array(16), new Array(16)];
	var weapsprite = [new PIXI.Sprite(gfx.nopic), new PIXI.Sprite(gfx.nopic)];
	var shiesprite = [new PIXI.Sprite(gfx.nopic), new PIXI.Sprite(gfx.nopic)];
	var marksprite = [new PIXI.Sprite(gfx.nopic), new PIXI.Sprite(gfx.nopic)];
	var marktext = [new PIXI.Text("", { font: "18px Dosis" }), new PIXI.Text("", { font: "18px Dosis" })];
	var quantatext = [new PIXI.DisplayObjectContainer(), new PIXI.DisplayObjectContainer()];
	var hptext = [new PIXI.Text("", { font: "18px Dosis" }), new PIXI.Text("", { font: "18px Dosis" })];
	var damagetext = [new PIXI.Text("", { font: "14px Dosis" }), new PIXI.Text("", { font: "14px Dosis" })];
	var poisontext = [new PIXI.Sprite(gfx.nopic), new PIXI.Sprite(gfx.nopic)];
	var decktext = [new PIXI.Text("", { font: "16px Dosis" }), new PIXI.Text("", { font: "16px Dosis" })];
	for (var j = 0;j < 2;j++) {
		(function(_j) {
			for (var i = 0;i < 8;i++) {
				handsprite[j][i] = new PIXI.Sprite(gfx.nopic);
				handsprite[j][i].position.set(j ? 20 : 780, (j ? 130 : 310) + 20 * i);
				(function(_i) {
					setClick(handsprite[j][i], function() {
						if (game.phase != etg.PlayPhase) return;
						var cardinst = game.players(_j).hand[_i];
						if (cardinst) {
							if (!_j && discarding) {
								endturn.click(null, _i);
							} else if (game.targetingMode) {
								if (game.targetingMode(cardinst)) {
									delete game.targetingMode;
									game.targetingModeCb(cardinst);
								}
							} else if (!_j && cardinst.canactive()) {
								if (cardinst.card.type != etg.SpellEnum) {
									console.log("summoning", _i);
									sockEmit("cast", {bits: game.tgtToBits(cardinst)});
									cardinst.useactive();
								} else {
									game.getTarget(cardinst, cardinst.card.active, function(tgt) {
										sockEmit("cast", {bits: game.tgtToBits(cardinst) | game.tgtToBits(tgt) << 9});
										cardinst.useactive(tgt);
									});
								}
							}
						}
					});
				})(i);
				gameui.addChild(handsprite[j][i]);
			}
			function makeInst(makestatuses, insts, i, pos, scale){
				if (scale === undefined) scale = 1;
				var spr = new PIXI.Sprite(gfx.nopic);
				if (makestatuses){
					var statuses = new PIXI.SpriteBatch();
					for (var k=0; k<7; k++){
						var icon = new PIXI.Sprite(gfx.sicons[k]);
						icon.alpha = .6;
						icon.anchor.y = 1;
						icon.position.set(-34 * scale + [4, 1, 1, 0, 3, 2, 1][k] * 8, 30 * scale);
						statuses.addChild(icon);
					}
					for (var k=0; k<3; k++){
						var icon = new PIXI.Sprite(gfx.sborders[k]);
						icon.position.set(-32 * scale, -40 * scale);
						icon.scale.set(scale, scale);
						statuses.addChild(icon);
					}
					spr.addChild(statuses);
				}
				var stattext = new PIXI.Sprite(gfx.nopic);
				stattext.position.set(-32 * scale, -32 * scale);
				spr.addChild(stattext);
				var activetext = new PIXI.Sprite(gfx.nopic);
				activetext.position.set(-32 * scale, -42 * scale);
				spr.addChild(activetext);
				spr.anchor.set(.5, .5);
				spr.position = pos;
				setClick(spr, function() {
					if (game.phase != etg.PlayPhase) return;
					var inst = insts ? insts[i] : game.players(_j)[i];
					if (!inst) return;
					if (game.targetingMode && game.targetingMode(inst)) {
						delete game.targetingMode;
						game.targetingModeCb(inst);
					} else if (_j == 0 && !game.targetingMode && inst.canactive()) {
						game.getTarget(inst, inst.active.cast, function(tgt) {
							delete game.targetingMode;
							sockEmit("cast", {bits: game.tgtToBits(inst) | game.tgtToBits(tgt) << 9});
							inst.useactive(tgt);
						});
					}
				});
				return spr;
			}
			for (var i = 0;i < 23;i++) {
				creasprite[j][i] = makeInst(true, game.players(j).creatures, i, ui.creaturePos(j, i));
			}
			for (var i = 0;i < 23;i++){
				gameui.addChild(creasprite[j][j?22-i:i]);
			}
			for (var i = 0;i < 16;i++) {
				permsprite[j][i] = makeInst(false, game.players(j).permanents, i, ui.permanentPos(j, i));
			}
			for (var i = 0;i < 16;i++){
				gameui.addChild(permsprite[j][j?15-i:i]);
			}
			setInteractive.apply(null, handsprite[j]);
			setInteractive.apply(null, creasprite[j]);
			setInteractive.apply(null, permsprite[j]);
			marksprite[j].anchor.set(.5, .5);
			marksprite[j].position.set(740, 470);
			gameui.addChild(weapsprite[j] = makeInst(true, null, "weapon", new PIXI.Point(666, 512), 5/4));
			gameui.addChild(shiesprite[j] = makeInst(false, null, "shield", new PIXI.Point(710, 532), 5/4));
			if (j) {
				ui.reflectPos(weapsprite[j]);
				ui.reflectPos(shiesprite[j]);
				ui.reflectPos(marksprite[j]);
			}
			gameui.addChild(marksprite[j]);
			marktext[j].anchor.set(.5, .5);
			hptext[j].anchor.set(.5, .5);
			poisontext[j].anchor.set(.5, .5);
			decktext[j].anchor.set(.5, .5);
			damagetext[j].anchor.set(.5, .5);
			marktext[j].position.set(768, 470);
			quantatext[j].position.set(j ? 792 : 0, j ? 100 : 308);
			hptext[j].position.set(50, 550);
			poisontext[j].position.set(50, 570);
			decktext[j].position.set(50, 530);
			damagetext[j].position.set(50, 510);
			if (j) {
				ui.reflectPos(marktext[j]);
				ui.reflectPos(hptext[j]);
				ui.reflectPos(poisontext[j]);
				ui.reflectPos(decktext[j]);
				ui.reflectPos(damagetext[j]);
			}
			var child;
			for (var k = 1;k < 13;k++) {
				quantatext[j].addChild(child = new PIXI.Text("", { font: "16px Dosis" }));
				child.position.set((k & 1) ? 32 : 86, Math.floor((k - 1) / 2) * 32 + 8);
				quantatext[j].addChild(child = new PIXI.Sprite(gfx.eicons[k]));
				child.position.set((k & 1) ? 0 : 54, Math.floor((k - 1) / 2) * 32);
			}
			setClick(hptext[j], function() {
				if (game.phase != etg.PlayPhase) return;
				if (game.targetingMode && game.targetingMode(game.players(_j))) {
					delete game.targetingMode;
					game.targetingModeCb(game.players(_j));
				}
			});
		})(j);
		setInteractive.apply(null, weapsprite);
		setInteractive.apply(null, shiesprite);
		setInteractive.apply(null, hptext);
		gameui.addChild(marktext[j]);
		gameui.addChild(quantatext[j]);
		gameui.addChild(hptext[j]);
		gameui.addChild(poisontext[j]);
		gameui.addChild(decktext[j]);
		gameui.addChild(damagetext[j]);
	}
	var fgfx = new PIXI.Graphics();
	gameui.addChild(fgfx);
	var anims = new PIXI.DisplayObjectContainer();
	gameui.addChild(anims);
	Effect.register(anims);
	var foeplays = new PIXI.SpriteBatch();
	gameui.addChild(foeplays);
	var infobox = new PIXI.Sprite(gfx.nopic);
	infobox.alpha = .7;
	infobox.anchor.set(.5, 1);
	gameui.addChild(infobox);
	var cardart = new PIXI.Sprite(gfx.nopic);
	cardart.position.set(654, 300);
	cardart.anchor.set(.5, 0);
	gameui.addChild(cardart);
	function onkeydown(e) {
		if (e.keyCode == 32) { // spc
			endturn.click();
		} else if (e.keyCode == 8) { // bsp
			cancel.click();
		} else if (e.keyCode >= 49 && e.keyCode <= 56) {
			handsprite[0][e.keyCode-49].click();
		} else if (e.keyCode == 83 || e.keyCode == 87) { // s/w
			hptext[e.keyCode == 87?1:0].click();
		}
	}
	document.addEventListener("keydown", onkeydown);
	gameui.cmds = {
		endturn: function(data) {
			game.player2.endturn(data.bits);
		},
		cast: function(data) {
			var bits = data.bits, c = game.bitsToTgt(bits & 511), t = game.bitsToTgt((bits >> 9) & 511);
			console.log("cast", c.toString(), (t || "-").toString(), bits);
			if (c instanceof etg.CardInstance) {
				var sprite = new PIXI.Sprite(gfx.nopic);
				sprite.position.set((foeplays.children.length % 9) * 100, Math.floor(foeplays.children.length / 9) * 20);
				sprite.card = c.card;
				foeplays.addChild(sprite);
			}
			c.useactive(t);
		},
		foeleft: function(){
			game.setWinner(game.player1);
		}
	};
	gameui.endnext = function() {
		document.removeEventListener("keydown", onkeydown);
	}
	refreshRenderer(gameui, function() {
		var pos = realStage.getMousePosition();
		var cardartcode, cardartx;
		infobox.setTexture(gfx.nopic);
		foeplays.children.forEach(function(foeplay){
			if (hitTest(foeplay, pos)) {
				cardartcode = foeplay.card.code;
			}
		});
		for (var j = 0;j < 2;j++) {
			var pl = game.players(j);
			if (j == 0 || game.player1.precognition) {
				for (var i = 0;i < pl.hand.length;i++) {
					if (hitTest(handsprite[j][i], pos)) {
						cardartcode = pl.hand[i].card.code;
					}
				}
			}
			if (j == 0 || !(cloakgfx.visible)) {
				for (var i = 0;i < 23;i++) {
					var cr = pl.creatures[i];
					if (cr && hitTest(creasprite[j][i], pos)) {
						cardartcode = cr.card.code;
						cardartx = creasprite[j][i].position.x;
						setInfo(cr);
					}
				}
				for (var i = 0;i < 16;i++) {
					var pr = pl.permanents[i];
					if (pr && hitTest(permsprite[j][i], pos)) {
						cardartcode = pr.card.code;
						cardartx = permsprite[j][i].position.x;
						setInfo(pr);
					}
				}
				if (pl.weapon && hitTest(weapsprite[j], pos)) {
					cardartcode = pl.weapon.card.code;
					cardartx = weapsprite[j].position.x;
					setInfo(pl.weapon);
				}
				if (pl.shield && hitTest(shiesprite[j], pos)) {
					cardartcode = pl.shield.card.code;
					cardartx = shiesprite[j].position.x;
					setInfo(pl.shield);
				}
			}
		}
		if (cardartcode) {
			cardart.setTexture(getArt(cardartcode));
			cardart.visible = true;
			cardart.position.set(cardartx || 654, pos.y > 300 ? 44 : 300);
		} else cardart.visible = false;
		if (game.phase != etg.EndPhase) {
			if (game.turn == game.player1){
				endturn.setText(game.phase == etg.PlayPhase ? "End Turn" : "Accept Hand");
				cancel.setText(game.targetingMode || discarding || resigning ? "Cancel" : null);
			}else cancel.visible = endturn.visible = false;
		}else{
			winnername.setText(game.winner == game.player1 ? "Won" : "Lost");
			endturn.setText("Continue");
		}
		maybeSetText(turntell, discarding ? "Discard" : game.targetingMode ? game.targetingText : game.turn == game.player1 ? "Your Turn" : "Their Turn");
		foeplays.children.forEach(function(foeplay){
			maybeSetTexture(foeplay, getCardImage(foeplay.card.code));
		});
		cloakgfx.visible = game.player2.isCloaked();
		fgfx.clear();
		if (game.turn == game.player1 && !game.targetingMode && game.phase != etg.EndPhase) {
			for (var i = 0;i < game.player1.hand.length;i++) {
				var card = game.player1.hand[i].card;
				if (game.player1.canspend(card.costele, card.cost)) {
					fgfx.beginFill(elecols[etg.Light]);
					fgfx.drawRect(handsprite[0][i].position.x + 100, handsprite[0][i].position.y, 20, 20);
					fgfx.endFill();
				}
			}
		}
		fgfx.beginFill(0, 0);
		fgfx.lineStyle(2, 0xffffff);
		for (var j = 0;j < 2;j++) {
			var pl = game.players(j);
			for (var i = 0;i < 23;i++) {
				drawBorder(pl.creatures[i], creasprite[j][i]);
			}
			for (var i = 0;i < 16;i++) {
				drawBorder(pl.permanents[i], permsprite[j][i]);
			}
			drawBorder(pl.weapon, weapsprite[j]);
			drawBorder(pl.shield, shiesprite[j]);
		}
		if (game.targetingMode) {
			fgfx.lineStyle(2, 0xff0000);
			for (var j = 0;j < 2;j++) {
				if (game.targetingMode(game.players(j))) {
					var spr = hptext[j];
					fgfx.drawRect(spr.position.x - spr.width / 2, spr.position.y - spr.height / 2, spr.width, spr.height);
				}
				for (var i = 0;i < game.players(j).hand.length;i++) {
					if (game.targetingMode(game.players(j).hand[i])) {
						var spr = handsprite[j][i];
						fgfx.drawRect(spr.position.x, spr.position.y, spr.width, spr.height);
					}
				}
			}
		}
		fgfx.lineStyle(0, 0, 0);
		fgfx.endFill();
		for (var j = 0;j < 2;j++) {
			var pl = game.players(j);
			if (pl.sosa) {
				var spr = hptext[j];
				fgfx.beginFill(elecols[etg.Death], .5);
				fgfx.drawRect(spr.position.x - spr.width / 2, spr.position.y - spr.height / 2, spr.width, spr.height);
				fgfx.endFill();
			}
			var statuses = { flatline: etg.Death, silence: etg.Aether, sanctuary: etg.Light };
			for(var status in statuses){
				if (pl[status]) {
					fgfx.beginFill(elecols[statuses[status]], .3);
					fgfx.drawRect(handsprite[j][0].position.x - 2, handsprite[j][0].position.y - 2, 124, 164);
					fgfx.endFill();
				}
			}
			if (pl.nova > 1 || pl.nova2){
				fgfx.beginFill(elecols[etg.Entropy], .3);
				fgfx.drawRect(handsprite[j][0].position.x - 2, handsprite[j][0].position.y - 2, 124, 164);
				fgfx.endFill();
			}
			for (var i = 0;i < 8;i++) {
				maybeSetTexture(handsprite[j][i], getCardImage(pl.hand[i] ? (j == 0 || game.player1.precognition ? pl.hand[i].card.code : "0") : "1"));
			}
			for (var i = 0;i < 23;i++) {
				var cr = pl.creatures[i];
				if (cr && !(j == 1 && cloakgfx.visible)) {
					creasprite[j][i].setTexture(getCreatureImage(cr.card));
					creasprite[j][i].visible = true;
					var child = creasprite[j][i].getChildAt(1);
					child.setTexture(ui.getTextImage(cr.trueatk() + "|" + cr.truehp() + (cr.status.charges ? " x" + cr.status.charges : ""), ui.mkFont(10, cr.card.upped ? "black" : "white"), maybeLighten(cr.card)));
					var child2 = creasprite[j][i].getChildAt(2);
					child2.setTexture(ui.getTextImage(cr.activetext1(), ui.mkFont(8, cr.card.upped ? "black" : "white")));
					drawStatus(cr, creasprite[j][i]);
				} else creasprite[j][i].visible = false;
			}
			for (var i = 0;i < 16;i++) {
				var pr = pl.permanents[i];
				if (pr && !(j == 1 && cloakgfx.visible && !pr.status.cloak)) {
					permsprite[j][i].setTexture(getPermanentImage(pr.card.code));
					permsprite[j][i].visible = true;
					permsprite[j][i].alpha = pr.status.immaterial ? .7 : 1;
					var child = permsprite[j][i].getChildAt(0);
					if (pr instanceof etg.Pillar) {
						child.setTexture(ui.getTextImage("1:" + (pr.pendstate ? pr.owner.mark : pr.card.element) + " x" + pr.status.charges, ui.mkFont(10, pr.card.upped ? "black" : "white"), maybeLighten(pr.card)));
					}
					else if (pr.active.auto && pr.active.auto.activename == "locket") {
						child.setTexture(ui.getTextImage("1:" + (pr.status.mode || pr.owner.mark),ui.mkFont(10, pr.card.upped ? "black" : "white"), maybeLighten(pr.card)));
					}
					else child.setTexture(ui.getTextImage(pr.status.charges !== undefined ? " " + pr.status.charges : "", ui.mkFont(10, pr.card.upped ? "black" : "white"), maybeLighten(pr.card)));
					var child2 = permsprite[j][i].getChildAt(1);
					child2.setTexture(pr instanceof etg.Pillar ? gfx.nopic : ui.getTextImage(pr.activetext1(), ui.mkFont(8, pr.card.upped ? "black" : "white")));
				} else permsprite[j][i].visible = false;
			}
			var wp = pl.weapon;
			if (wp && !(j == 1 && cloakgfx.visible)) {
				weapsprite[j].visible = true;
				var child = weapsprite[j].getChildAt(1);
				child.setTexture(ui.getTextImage(wp.trueatk() + (wp.status.charges ? " x" + wp.status.charges : ""), ui.mkFont(12, wp.card.upped ? "black" : "white"), maybeLighten(wp.card)));
				child.visible = true;
				var child = weapsprite[j].getChildAt(2);
				child.setTexture(ui.getTextImage(wp.activetext1(), ui.mkFont(12, wp.card.upped ? "black" : "white")));
				child.visible = true;
				weapsprite[j].setTexture(getWeaponShieldImage(wp.card.code));
				drawStatus(wp, weapsprite[j]);
			} else weapsprite[j].visible = false;
			var sh = pl.shield;
			if (sh && !(j == 1 && cloakgfx.visible)) {
				shiesprite[j].visible = true;
				var child = shiesprite[j].getChildAt(0);
				child.setTexture(ui.getTextImage(sh.status.charges ? "x" + sh.status.charges: "" + sh.dr + "", ui.mkFont(12, sh.card.upped ? "black" : "white"), maybeLighten(sh.card)));
				child.visible = true;
				var child = shiesprite[j].getChildAt(1);
				child.setTexture(ui.getTextImage(sh.activetext1(), ui.mkFont(12, sh.card.upped ? "black" : "white")));
				child.visible = true;
				shiesprite[j].alpha = sh.status.immaterial ? .7 : 1;
				shiesprite[j].setTexture(getWeaponShieldImage(sh.card.code));
			} else shiesprite[j].visible = false;
			marksprite[j].setTexture(gfx.eicons[pl.mark]);
			if (pl.markpower != 1){
				maybeSetText(marktext[j], "x" + pl.markpower);
				marktext[j].visible = true;
			}else marktext[j].visible = false;
			for (var i = 1;i < 13;i++) {
				maybeSetText(quantatext[j].getChildAt(i*2-2), pl.quanta[i].toString());
			}
			var yOffset = j == 0 ? 28 : -44;
			fgfx.beginFill(0);
			fgfx.drawRect(hptext[j].x - 41, hptext[j].y + yOffset-1, 82, 16);
			fgfx.endFill();
			if (pl.hp > 0){
				fgfx.beginFill(elecols[etg.Life]);
				fgfx.drawRect(hptext[j].x - 40, hptext[j].y + yOffset, 80 * pl.hp / pl.maxhp, 14);
				fgfx.endFill();
				if (game.expectedDamage[j]) {
					fgfx.beginFill(elecols[game.expectedDamage[j] >= pl.hp ? etg.Fire : game.expectedDamage[j] > 0 ? etg.Time : etg.Water]);
					fgfx.drawRect(hptext[j].x - 40 + 80 * pl.hp / pl.maxhp, hptext[j].y + yOffset, -80 * Math.min(game.expectedDamage[j], pl.hp) / pl.maxhp, 14);
					fgfx.endFill();
				}
			}
			maybeSetText(hptext[j], pl.hp + "/" + pl.maxhp);
			if (hitTest(hptext[j], pos)){
				setInfo(pl);
			}
			var poison = pl.status.poison;
			var poisoninfo = !poison ? "" : (poison > 0 ? poison + " 1:2" : -poison + " 1:7") + (pl.neuro ? " 1:10" : "");
			poisontext[j].setTexture(ui.getTextImage(poisoninfo,16));
			maybeSetText(decktext[j], pl.deck.length + "cards");
			maybeSetText(damagetext[j], !cloakgfx.visible && game.expectedDamage[j] ? "Next HP loss: " + game.expectedDamage[j] : "");
		}
		Effect.next(cloakgfx.visible);
	});
}
function addChatSpan(span) {
	span.appendChild(document.createElement("br"));
	var scroll = chatBox.scrollTop == (chatBox.scrollHeight - chatBox.offsetHeight);
	chatBox.appendChild(span);
	if (scroll) chatBox.scrollTop = chatBox.scrollHeight;
}
function chat(message, fontcolor, nodecklink) {
	var span = document.createElement("span");
	span.style.color = fontcolor || "red";
	if (!nodecklink) message = message.replace(/\b(([01][0-9a-v]{4})+)\b/g, "<a href='../deck/$1' target='_blank'>$1</a>");
	span.innerHTML = message;
	addChatSpan(span);
}
var socket = eio({hostname: location.hostname, port: 13602});
socket.on("open", function(){ chat.bind("Connected") });
socket.on("close", function(){
	chat("Reconnecting in 100ms");
	setTimeout(function(){socket.open()}, 100);
});
socket.on("error", function(err){
	console.log(err);
	chat("Connection error");
});
socket.on("message", function(data){
	data = JSON.parse(data);
	var func = sockEvents[data.x] || (realStage.children.length > 1 && realStage.children[1].cmds && (func = realStage.children[1].cmds[data.x]));
	if (func){
		func.call(socket, data);
	}
});
var sockEvents = {
	pvpgive: initGame,
	chat:function(data){
		if (data.u in muteset) return;
		var now = new Date(), h = now.getHours(), m = now.getMinutes(), s = now.getSeconds();
		if (h < 10) h = "0"+h;
		if (m < 10) m = "0"+m;
		if (s < 10) s = "0"+s;
		var msg = h + ":" + m + ":" + s + " " + (data.u ? "<b>" + sanitizeHtml(data.u) + ":</b> " : "") + sanitizeHtml(data.msg);
		chat(msg, data.mode || "black");
	}
};
function chatmute(){
	var muted = [];
	for(var name in muteset){
		muted.push(name);
	}
	chat((muteall?"You have chat muted. ":"") + "Muted: " + muted.join(", "));
}
function maybeSendChat(e) {
	e.cancelBubble = true;
	if (e.keyCode == 13 && chatinput.value) {
		e.preventDefault();
		var msg = chatinput.value;
		chatinput.value = "";
		if (msg == "/clear"){
			while (chatBox.firstChild) chatBox.firstChild.remove();
		}else if (msg == "/who"){
			sockEmit("who");
		}else if (msg.match(/^\/roll( |$)\d*d?\d*$/)){
			var data = {u:""}
			var ndn = msg.slice(6).split("d");
			if (!ndn[1]){
				data.X = parseInt(ndn[0] || etgutil.MAX_INT);
			}else{
				data.A = parseInt(ndn[0]);
				data.X = parseInt(ndn[1]);
			}
			sock.emit("roll", data);
		}else if (msg == "/mute"){
			muteall = true;
			chatmute();
		}else if (msg == "/unmute"){
			muteall = false;
			chatmute();
		}else if (msg.match(/^\/mute /)){
			muteset[msg.substring(6)] = true;
			chatmute();
		}else if (msg.match(/^\/unmute /)){
			delete muteset[msg.substring(8)];
			chatmute();
		}else if (!msg.match(/^\/[^/]/)) {
			var name = username.value || guestname || (guestname = (10000 + Math.floor(Math.random() * 89999)) + "V");
			sockEmit("guestchat", { msg: msg, u: name });
		}else chat("Not a command: " + msg);
	}
}
function sanitizeHtml(x) {
	return x.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function unaryParseInt(x) {
	return parseInt(x, 10);
}
function maybeChallenge(e) {
	e.cancelBubble = true;
	if (e.keyCode != 13) return;
	if (foename.value) {
		challengeClick();
	}
}
function animate() {
	setTimeout(requestAnimate, 40);
	if (realStage.next) {
		realStage.next();
	}
	renderer.render(realStage);
}
function requestAnimate() { requestAnimFrame(animate); }
function parseInput(data, key, value) {
	var value = parseInt(value);
	if (value === 0 || value > 0)
		data[key] = value;
}
function challengeClick() {
	if (Cards.loaded) {
		var deck = getDeck();
		if (deck.length < 31){
			return;
		}
		var gameData = {};
		parseInput(gameData, "p1hp", pvphp.value);
		parseInput(gameData, "p1draw", pvpdraw.value);
		parseInput(gameData, "p1mark", pvpmark.value);
		parseInput(gameData, "p1deck", pvpdeck.value);
		gameData.deck = deck;
		gameData.room = foename.value;
		sockEmit("pvpwant", gameData);
	}
}
var expofuncs = [maybeChallenge, maybeSendChat, challengeClick];
for(var i=0; i<expofuncs.length; i++){
	window[expofuncs[i].name] = expofuncs[i];
}
})();