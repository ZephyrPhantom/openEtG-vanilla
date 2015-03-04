"use strict";
exports.loaded = false;
exports.Targeting = {};
exports.Codes = {};
var etg = require("./etg");
var etgutil = require("../etgutil");
exports.parseCsv = function(type, file){
	var keys;
	etg.iterSplit(file, "\n", function(line){
		if (!keys){
			keys = line.split(",")
		}else{
			var cardinfo = {}, nth = 0;
			etg.iterSplit(line, ",", function(value){
				cardinfo[keys[nth++]] = value;
			});
			var cardcode = cardinfo.Code;
			if (cardcode in exports.Codes){
				console.log(cardcode + " duplicate " + cardinfo.Name + " " + exports.Codes[cardcode].name);
			}else{
				var nospacename = cardinfo.Name.replace(/ |'/g, "");
				exports[nospacename in exports?nospacename+"Up":nospacename] = exports.Codes[cardcode] = new etg.Card(type, cardinfo);
			}
		}
	});
}
exports.parseTargeting = function(file){
	var csv = file.split("\n");
	csv.forEach(function(line){
		var keypair = line.split(",");
		exports.Targeting[keypair[0]] = getTargetFilter(keypair[1]);
	});
}
function getTargetFilter(str){
	function getFilterFunc(funcname){ return TargetFilters[funcname]; }
	if (str in TargetFilters){
		return TargetFilters[str];
	}else{
		var splitIdx = str.lastIndexOf(":");
		var prefixes = ~splitIdx ? str.substr(0, splitIdx).split(":").map(getFilterFunc) : [],
			filters = (~splitIdx ? str.substr(splitIdx+1) : str).split("+").map(getFilterFunc);
		return TargetFilters[str] = function(c, t){
			function check(f){ return f(c, t); }
			return prefixes.every(check) && filters.some(check);
		}
	}
}
var TargetFilters = {
	own:function(c, t){
		return c.owner == t.owner;
	},
	foe:function(c, t){
		return c.owner != t.owner
	},
	notself:function(c, t){
		return c != t;
	},
	pill:function(c, t){
		return t.isMaterialInstance(etg.Pillar);
	},
	weap:function(c, t){
		return (t instanceof etg.Weapon || (t instanceof etg.Creature && t.card.type == etg.WeaponEnum)) && !t.status.immaterial && !t.status.burrowed;
	},
	perm:function(c, t){
		return t.isMaterialInstance(etg.Permanent);
	},
	crea:function(c, t){
		return t.isMaterialInstance(etg.Creature);
	},
	creaonly:function(c, t){
		return t.isMaterialInstance(etg.Creature) && t.card.type == etg.CreatureEnum;
	},
	creanonspell:function(c, t){
		return t.isMaterialInstance(etg.Creature) && t.card.type != etg.SpellEnum;
	},
	play:function(c, t){
		return t instanceof etg.Player;
	},
	butterfly:function(c, t){
		return t.isMaterialInstance(etg.Creature) && t.trueatk()<3;
	},
	devour:function(c, t){
		return t.isMaterialInstance(etg.Creature) && t.truehp()<c.truehp();
	},
	paradox:function(c, t){
		return t.isMaterialInstance(etg.Creature) && t.truehp()<t.trueatk();
	},
	wisdom:function(c, t){
		return (t instanceof etg.Creature || t instanceof etg.Weapon) && !t.status.burrowed;
	}
};