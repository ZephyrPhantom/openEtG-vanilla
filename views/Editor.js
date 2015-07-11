var px = require("../px");
var etg = require("../etg");
var gfx = require("../gfx");
var sock = require("../sock");
var Cards = require("../Cards");
var mkAi = require("../mkAi");
var etgutil = require("../../etgutil");
module.exports = function() {
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
			}else px.adjust(cardminus, editordeck[i], 1);
		}
		if (editordeck.length > 60){
			editordeck.length = 60;
		}
		marksprite.className = "ico e"+editormark;
		if (editordeck.length > 60) editordeck.length = 60;
		editordeck.sort(etg.cardCmp);
		decksprite.deck = editordeck;
		saveDeck();
		decksprite.renderDeck(0);
	}
	var cardminus = {}, dom = [];
	var editorui = px.mkView();
	var bclear = px.domButton("Clear", function() {
		cardminus = {};
		editordeck.length = 0;
		saveDeck();
		decksprite.renderDeck(0);
	});
	dom.push([8, 32, bclear]);
	function saveDeck() {
		deckimport.value = editordeck.join(" ") + " " + etg.toTrueMark(editormark);
	}
	var bimport = px.domButton("Import", function() {
		var dvalue = deckimport.value;
		editordeck = ~dvalue.indexOf(" ") ? dvalue.split(" ") : etgutil.decodedeck(dvalue);
		processDeck();
	});
	dom.push([8, 80, bimport]);
	var bai1 = px.domButton("Commoner", mkAi.mkAi(0));
	var bai2 = px.domButton("Mage", mkAi.mkAi(1));
	var bai3 = px.domButton("Champion", mkAi.mkAi(2));
	var bai4 = px.domButton("False God", mkAi.mkPremade());
	dom.push([8, 110, bai1]);
	dom.push([8, 140, bai2]);
	dom.push([8, 170, bai3]);
	dom.push([8, 200, bai4]);
	var bconvert = px.domButton("Convert Code", function() {
		deckimport.value = etgutil.encodedeck(editordeck) + "01" + etg.toTrueMark(editormark);
	});
	dom.push([8, 554, bconvert])
	var editordeck = sock.getDeck(true);
	var marksprite = document.createElement("span");
	dom.push([100, 234, marksprite]);
	var editormark = 0;
	for (var i = 0;i < 13;i++) {
		(function(_i) {
			var sprite = px.domEButton(i, function() {
				editormark = _i;
				marksprite.className = "ico e"+_i;
				saveDeck();
			});
			dom.push([200+i*32, 234, sprite]);
		})(i);
	}
	function setCardArt(code) {
		cardArt.texture = gfx.getArt(code);
		cardArt.visible = true;
	}
	var decksprite = new px.DeckDisplay(60, setCardArt,
		function(i){
			var code = decksprite.deck[i], card = Cards.Codes[code];
			if (card.type != etg.PillarEnum) {
				px.adjust(cardminus, code, -1);
			}
			decksprite.rmCard(i);
			saveDeck();
		}
	);
	editorui.addChild(decksprite);
	var cardsel = new px.CardSelector(dom, setCardArt,
		function(code){
			if (editordeck.length < 60) {
				var card = Cards.Codes[code];
				if (card.type != etg.PillarEnum) {
					if (Cards.Codes[code].type != etg.PillarEnum && sumCardMinus(cardminus, code) >= 6) {
						return;
					}
					px.adjust(cardminus, code, 1);
				}
				for (var i = 0;i < editordeck.length;i++) {
					var cmp = etg.cardCmp(editordeck[i], code);
					if (cmp >= 0) break;
				}
				decksprite.addCard(code);
				saveDeck();
			}
		}
	);
	editorui.addChild(cardsel);
	var cardArt = new PIXI.Sprite(gfx.nopic);
	cardArt.position.set(734, 8);
	editorui.addChild(cardArt);
	processDeck();
	function resetCardArt(){cardArt.visible=false}
	document.addEventListener("mousemove", resetCardArt, true);
	px.refreshRenderer({view:editorui, edom:dom, endnext:function(){document.removeEventListener("mousemove", resetCardArt, true)}});
}