"use strict";
var Effect = require("./Effect");
var etg = require("./etg");
var Cards = require("./Cards");
function mutantactive(t){
	lobo(t);
	var abilities = ["hatch","freeze","burrow","destroy","steal","dive","heal","paradox","lycanthropy","growth1","infect","gpull","devour","mutation","growth","ablaze","poison","deja","endow","guard","mitosis"];
	var index = t.owner.upto(abilities.length+2)-2;
	if (index<0){
		t.status[["momentum","immaterial"][~index]] = true;
	}else{
		var active = Actives[abilities[index]];
		if (active == Actives.growth1){
			t.active.death = active;
		}else{
			t.active.cast = active;
			return true;
		}
	}
}
function lobo(t){
	// TODO deal with combined actives
	for (var key in t.active){
		if (!(t.active[key].activename in etg.passives)) delete t.active[key];
	}
}
function adrenathrottle(f){
	return function(c){
		if (!c.status || (c.status.adrenaline || 0)<3){
			return f.apply(null, arguments);
		}
	}
}
var Actives = {
noluci:function(){},
ablaze:function(c,t){
	Effect.mkText("2|0", c);
	c.atk += 2;
},
acceleration:function(c,t){
	Effect.mkText("2|-1", c);
	c.atk += 2;
	c.dmg(1, true);
},
accelerationspell:function(c,t){
	lobo(t);
	t.active.auto = Actives.acceleration;
},
accretion:function(c,t){
	Actives.destroy(c, t);
	c.buffhp(15);
	if (c.truehp() > 45){
		c.die();
		if (c.owner.hand.length < 8){
			new etg.CardInstance(Cards.BlackHole.asUpped(c.card.upped), c.owner).place();
		}
	}
},
adrenaline:function(c,t){
	Effect.mkText("Adrenaline", t);
	t.status.adrenaline = 1;
},
aflatoxin:function(c,t){
	Effect.mkText("Aflatoxin", t);
	t.addpoison(2);
	if (!(t instanceof etg.Player)){
		t.status.aflatoxin = true;
	}
},
air:function(c,t){
	Effect.mkText("1:9", c);
	c.owner.spend(etg.Air, -1);
},
antimatter:function(c,t){
	Effect.mkText("Antimatter", t);
	t.atk -= t.trueatk()*2;
},
bblood:function(c,t){
	Effect.mkText("0|20", t);
	t.buffhp(20);
	t.status.delayed = 6;
},
blackhole:function(c,t){
	if (!t.sanctuary){
		for (var q=1; q<13; q++){
			c.owner.dmg(-Math.min(t.quanta[q],3));
			t.quanta[q] = Math.max(t.quanta[q]-3,0);
		}
	}
},
bless:function(c,t){
	Effect.mkText("3|3", t);
	t.atk += 3;
	t.buffhp(3);
},
boneyard:function(c,t){
	if (!t.card.isOf(Cards.Skeleton)){
		new etg.Creature(Cards.Skeleton.asUpped(c.card.upped), c.owner).place();
	}
},
bow:function(c,t){
	return c.owner.mark == etg.Air?1:0;
},
bravery:function(c,t){
	if (!c.owner.foe.sanctuary){
		for(var i=0; i<2 && c.owner.hand.length<8 && c.owner.foe.hand.length<8; i++){
			c.owner.drawcard();
			c.owner.foe.drawcard();
		}
	}
},
burrow:function(c,t){
	c.status.burrowed = true;
	c.active.cast = Actives.unburrow;
	c.cast = 0;
	c.atk = Math.floor(c.atk/2);
},
butterfly:function(c,t){
	lobo(t);
	t.active.cast = Actives.destroy;
	t.cast = 3;
	t.castele = etg.Entropy;
},
catapult:function(c,t){
	Effect.mkText("Catapult", t);
	t.die();
	c.owner.foe.dmg(Math.ceil(t.truehp()*(t.status.frozen?150:100)/(t.truehp()+100)));
	if (t.status.poison){
		c.owner.foe.addpoison(t.status.poison);
	}
	if (t.status.frozen){
		c.owner.foe.freeze(3);
	}
},
chimera:function(c,t){
	var atk=0, hp=0;
	for(var i=0; i<23; i++){
		if (c.owner.creatures[i]){
			atk += c.owner.creatures[i].trueatk();
			hp += c.owner.creatures[i].truehp();
		}
	}
	var chim = new etg.Creature(c.card, c.owner);
	chim.atk = atk;
	chim.maxhp = hp;
	chim.hp = hp;
	chim.active = {};
	chim.status.momentum = true;
	c.owner.creatures[0] = chim;
	c.owner.creatures.length = 1;
	c.owner.creatures.length = 23;
	c.owner.gpull = chim;
},
cpower:function(c,t){
	t.buffhp(c.owner.uptoceil(5));
	t.atk += c.owner.uptoceil(5);
},
cseed:function(c,t){
	Actives[["drainlife", "firebolt", "freeze", "gpullspell", "icebolt", "infect", "lightning", "lobotomize", "parallel", "rewind", "snipe", "swave"][c.owner.upto(12)]](c, t);
},
dagger:function(c,t){
	return c.owner.mark == etg.Darkness||c.owner.mark == etg.Death ? 1 : 0;
},
darkness:function(c,t){
	c.owner.spend(etg.Darkness, -1);
},
deadalive:function(c,t){
	c.deatheffect(c.getIndex());
},
decrsteam:function(c){
	c.defstatus("steamatk", 0);
	if (c.status.steamatk > 0){
		c.atk--;
		c.status.steamatk--;
	}
},
deja:function(c,t){
	delete c.active.cast;
	Actives.parallel(c, c);
},
dessication:function(c,t){
	function dryeffect(c,t){
		c.spend(etg.Water, -t.dmg(2));
	}
	c.owner.foe.masscc(c.owner, dryeffect);
},
destroy:function(c,t, dontsalvage, donttalk){
	if (!donttalk){
		Effect.mkText("Destroy", t);
	}
	if (t.status.stackable){
		if(--t.status.charges<=0){
			t.remove();
		}
	}else t.remove();
	if (!dontsalvage){
		t.procactive("destroy");
	}
},
devour:function(c,t){
	Effect.mkText("1|1", c);
	c.buffhp(1);
	c.atk += 1;
	if (t.status.poisonous){
		c.addpoison(1);
	}
	t.die();
},
die:function(c,t){
	c.die();
},
disfield:function(c,t, dmg){
	if (c.owner.sanctuary) return false;
	if (!c.owner.spend(etg.Other, dmg)){
		for(var i=1; i<13; i++){
			c.owner.quanta[i] = 0;
		}
		c.owner.shield = undefined;
	}
	return true;
},
disshield:function(c,t, dmg){
	if (c.owner.sanctuary) return false;
	if (!c.owner.spend(etg.Entropy, Math.ceil(dmg/3))){
		c.owner.quanta[etg.Entropy] = 0;
		c.owner.shield = undefined;
	}
	return true;
},
dive:function(c,t){
	Effect.mkText("Dive", c);
	c.defstatus("dive", 0);
	c.status.dive += c.trueatk();
},
divinity:function(c,t){
	c.owner.buffhp(c.owner.mark == etg.Light ? 24 : 16);
},
drainlife:function(c,t){
	c.owner.dmg(-t.spelldmg(2+Math.floor(c.owner.quanta[etg.Darkness]/10)*2));
},
dryspell:function(c,t){
	function dryeffect(c,t){
		c.spend(etg.Water, -t.dmg(1));
	}
	c.owner.foe.masscc(c.owner, dryeffect, true);
},
dshield:function(c,t){
	c.status.immaterial = true;
},
duality:function(c,t){
	if (c.owner.foe.deck.length > 0 && c.owner.hand.length < 8){
		new etg.CardInstance(c.owner.foe.deck[c.owner.foe.deck.length-1], c.owner).place();
	}
},
earth:function(c,t){
	Effect.mkText("1:4", c);
	c.owner.spend(etg.Earth, -1);
},
earthquake:function(c,t){
	Effect.mkText("Earthquake", t);
	if (t.status.charges>3){
		t.status.charges -= 3;
	}else{
		t.remove();
	}
	t.procactive("destroy");
},
empathy:function(c,t){
	var healsum = c.owner.countcreatures();
	Effect.mkText("+"+healsum, c);
	c.owner.dmg(-healsum);
},
enchant:function(c,t){
	Effect.mkText("Enchant", t);
	t.status.immaterial = true;
},
endow:function(c,t){
	Effect.mkText("Endow", t);
	if (t.status.momentum) c.status.momentum = true;
	c.active = etg.clone(t.active);
	c.cast = t.cast;
	c.castele = t.castele;
	c.atk += t.trueatk();
	if (t.active.buff){
		c.atk -= t.active.buff(t);
	}
	c.buffhp(2);
},
evolve:function(c,t){
	c.transform(Cards.Shrieker.asUpped(c.card.upped));
	delete c.status.burrowed;
},
fiery:function(c,t){
	return Math.floor(c.owner.quanta[etg.Fire]/5);
},
fire:function(c,t){
	Effect.mkText("1:6", c);
	c.owner.spend(etg.Fire, -1);
},
firebolt:function(c,t){
	t.spelldmg(3+3*Math.floor(c.owner.quanta[etg.Fire]/10));
},
flyingweapon: function(c, t) {
	var wp = c.owner.weapon;
	if (wp){
		var cr = new etg.Creature(wp.card, c.owner);
		cr.atk = wp.atk;
		cr.active = etg.clone(wp.active);
		cr.cast = wp.cast;
		cr.castele = wp.castele;
		cr.status = etg.clone(wp.status);
		cr.status.airborne = true;
		cr.place();
		c.owner.weapon = undefined;
	}
},
fractal:function(c,t){
	Effect.mkText("Fractal", t);
	for(var i=8; i>0; i--){
		new etg.CardInstance(t.card, c.owner).place();
	}
	c.owner.quanta[etg.Aether] = 0;
},
freeze:function(c,t){
	t.freeze(c.card.upped && c.card != Cards.PandemoniumUp ? 4 : 3);
},
gaincharge2:function(c,t){
	c.status.charges += 2;
},
gas:function(c,t){
	new etg.Permanent(Cards.UnstableGas.asUpped(c.card.upped), c.owner).place();
},
gpull:function(c,t){
	Effect.mkText("Pull", c);
	c.owner.gpull = c;
},
gpullspell:function(c,t){
	if (t instanceof etg.Player){
		delete t.gpull;
	}else Actives.gpull(t);
},
gratitude:function(c,t){
	Effect.mkText("G", c);
	c.owner.dmg(c.owner.mark == etg.Life ? -5 : -3);
},
growth: function (c, t) {
    Effect.mkText("2|2", c)
	c.buffhp(2);
	c.atk += 2;
},
growth1:function(c,t){
	Effect.mkText("1|1", c);
	c.atk += 1;
	c.buffhp(1);
},
guard:function(c,t){
	Effect.mkText("Guard", t);
	c.delay(1);
	t.delay(1);
	if (!t.status.airborne){
		t.dmg(c.trueatk());
	}
},
hammer:function(c,t){
	return c.owner.mark == etg.Gravity||c.owner.mark == etg.Earth?1:0;
},
hasten:function(c,t){
	c.owner.drawcard();
},
hatch:function(c,t){
	Effect.mkText("Hatch", c);
	var bans = [Cards.ShardofFocus, Cards.FateEgg, Cards.Immortal, Cards.Scarab, Cards.DevonianDragon, Cards.Chimera];
	c.transform(c.owner.randomcard(c.card.upped, function(x){return x.type == etg.CreatureEnum && !bans.some(function(ban){return x.isOf(ban)})}));
},
heal:function(c,t){
	t.dmg(-5);
},
heal20:function(c,t){
	c.owner.dmg(-20);
},
holylight:function(c,t){
	t.dmg(!(t instanceof etg.Player) && t.status.nocturnal?10:-10);
},
hope:function(c,t){
	var dr=c.card.upped?1:0;
	for(var i=0; i<23; i++){
		if(c.owner.creatures[i] && c.owner.creatures[i].hasactive("auto", "light")){
			dr++;
		}
	}
	c.dr = dr;
},
icebolt:function(c,t){
	var bolts = Math.floor(c.owner.quanta[etg.Water]/10);
	t.spelldmg(2+bolts*2);
	if (c.owner.rng() < .35+bolts/10){
		t.freeze(c.card.upped?4:3);
	}
},
ignite:function(c,t){
	c.die();
	c.owner.foe.spelldmg(20);
	c.owner.foe.masscc(c, function(c,x){x.dmg(1)}, true, true);
},
immolate:function(c,t){
	t.die();
	if (!t.hasactive("auto", "singularity")){
		for(var i=1; i<13; i++)
			c.owner.spend(i, -1);
		c.owner.spend(etg.Fire, c.card.upped?-7:-5);
	}
},
improve:function(c,t){
	Effect.mkText("Improve", t);
	var bans = [Cards.ShardofFocus, Cards.FateEgg, Cards.Immortal, Cards.Scarab, Cards.DevonianDragon, Cards.Chimera];
	t.transform(c.owner.randomcard(false, function(x){return x.type == etg.CreatureEnum && !~bans.indexOf(x)}));
	t.buffhp(c.owner.upto(5));
	t.atk += c.owner.upto(5);
	t.status.mutant = true;
	if(mutantactive(t)){
		t.cast = c.owner.uptoceil(2);
		t.castele = t.card.element;
	}
},
infect:function(c,t){
	Effect.mkText("Infect", t);
	t.addpoison(1);
},
infest:function(c,t){
	new etg.Creature(Cards.MalignantCell, c.owner).place();
},
integrity:function(c,t){
	var activeType = ["auto", "hit", "buff", "death"];
	var shardTally = [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0];
	var shardSkills = [
		[],
		["deadalive", "mutation", "paradox", "improve", "scramble", "antimatter"],
		["infect", "growth1", "poison", "poison", "aflatoxin", "poison2"],
		["devour", "devour", "devour", "devour", "devour", "blackhole"],
		["burrow", "stoneform", "guard", "guard", "bblood", "bblood"],
		["growth", "adrenaline", "adrenaline", "adrenaline", "adrenaline", "mitosis"],
		["ablaze", "ablaze", "fiery", "destroy", "destroy", "rage"],
		["steam", "steam", "freeze", "freeze", "nymph", "nymph"],
		["heal", "endow", "endow", "luciferin", "luciferin", "luciferin"],
		["queen", "queen", "snipe", "dive", "gas", "gas"],
		["scarab", "scarab", "deja", "neuro", "precognition", "precognition"],
		["siphon", "vampire", "vampire", "liquid", "liquid", "steal"],
		["lobotomize", "lobotomize", "lobotomize", "quint", "quint", "quint"],
	];
	var shardCosts = {
		burrow:1, stoneform:1, guard:1, petrify:2,
		deadalive:1, mutation: 2, paradox: 2, improve: 2, scramble: -2, antimatter: 4,
		infection:1, growth1: -4, poison: -2, aflatoxin: 2, poison2: -2,
		devour: 3, blackhole: 4,
		growth: 2, adrenaline: 2, mitosis: 4,
		ablaze: 1, fiery: -3, destroy: 3, rage: 2,
		steam: 2, freeze: 2, nymph: 4,
		heal: 1, endow: 2, luciferin: 4,
		queen: 2, snipe: 2, dive: 2, gas: 2,
		scarab: 2, deja: 4, neuro: -2, precognition: 2,
		siphon: -1, vampire: -2, liquid: 2, steal: 3,
		lobotomize: 2, quint: 2,
	};
	var stat=c.card.upped?1:0;
	for(var i=c.owner.hand.length-1; i>=0; i--){
		var card = c.owner.hand[i].card;
		if (etg.ShardList.some(function(x) { return x && card.isOf(Cards.Codes[x]); })){
			if (card.upped){
				stat++;
			}
			shardTally[card.element]++;
			c.owner.hand.splice(i, 1);
		}
	}
	var active = "burrow", num=0;
	for(var i=1; i<13; i++){
		stat += shardTally[i]*2;
		if (shardTally[i]>num){
			num = shardTally[i];
			active = shardSkills[i][num-1];
		}
	}
	var actives = {}, cost = shardCosts[active];
	actives[cost < 0 ? activeType[~cost] : "cast"] = Actives[active];
	var status = {};
	if (shardTally[etg.Air]>0){
		status.airborne = true;
	}
	if (shardTally[etg.Darkness]>0){
		status.voodoo = true;
	}
	if (shardTally[etg.Life]>0){
		status.poisonous = true;
	}
	if (shardTally[etg.Aether]>1){
		status.immaterial = true;
	}
	if (shardTally[etg.Gravity]>1){
		status.momentum = true;
	}
	if (shardTally[etg.Life]>0){
		status.adrenaline = 1;
	}
	c.owner.shardgolem = {
		stat: stat,
		status: status,
		active: actives,
		cast: cost
	};
	new etg.Creature(Cards.ShardGolem, c.owner).place();
},
light:function(c,t){
	Effect.mkText("1:8", c);
	c.owner.spend(etg.Light, -1);
},
lightning:function(c,t){
	Effect.mkText("-5", t);
	t.spelldmg(5);
},
liquid:function(c,t){
	Effect.mkText("Liquid", t);
	lobo(t);
	t.active.hit = Actives.vampire;
	t.addpoison(1);
},
lobotomize:function(c,t){
	Effect.mkText("Lobotomize", t);
	lobo(t);
	delete t.status.momentum;
	delete t.status.psion;
	delete t.status.mutant;
},
losecharge:function(c,t){
	if(--c.status.charges<0){
		c.remove();
	}
},
luciferin:function(c,t){
	c.owner.dmg(-10);
	// Fix salvagers & other passive-active-still-luciable
	c.owner.masscc(c, function(c,x){
		for (var key in x.active){
			if (x.active[key] && key != "ownplay"){
				return;
			}
		}
		x.active.auto = Actives.light;
	});
},
lycanthropy:function(c,t){
	Effect.mkText("5|5", c);
	c.buffhp(5);
	c.atk += 5;
	delete c.active.cast;
},
miracle:function(c,t){
	c.owner.quanta[etg.Light] = 0;
	if (c.owner.sosa){
		c.owner.hp = 1;
	}
	c.owner.hp = c.owner.maxhp-1;
},
mitosis:function(c,t){
	new etg.Creature(c.card, c.owner).place();
},
mitosisspell:function(c,t){
	lobo(t);
	t.active.cast = Actives.mitosis;
	t.castele = t.card.element;
	t.cast = t.card.cost;
},
momentum:function(c,t){
	Effect.mkText("Momentum", t);
	t.atk += 1;
	t.buffhp(1);
	t.status.momentum = true;
},
mutation:function(c,t){
	var rnd = c.owner.rng();
	if (rnd<.1){
		Effect.mkText("Death", t);
		t.die();
	}else if (rnd<.5){
		Actives.improve(c, t);
	}else{
		Effect.mkText("Abomination", t);
		t.transform(Cards.Abomination);
	}
},
neuro:adrenathrottle(function(c,t){
	t.addpoison(1);
	t.neuro = true;
}),
nightmare:function(c,t){
	if (!c.owner.foe.sanctuary){
		Effect.mkText("Nightmare", t);
		c.owner.dmg(-c.owner.foe.dmg(16-c.owner.foe.hand.length*2));
		for(var i = c.owner.foe.hand.length; i<8; i++){
			c.owner.foe.hand[i] = new etg.CardInstance(t.card, c.owner.foe);
		}
	}
},
nova:function(c,t){
	for (var i=1; i<13; i++){
		c.owner.spend(i, -1);
	}
	c.owner.nova += 2;
	if (c.owner.nova >= 6){
		new etg.Creature(Cards.Singularity, c.owner).place();
	}
},
nova2:function(c,t){
	for (var i=1; i<13; i++){
		c.owner.spend(i, -2);
	}
	c.owner.nova += 3;
	if (c.owner.nova >= 6){
		new etg.Creature(Cards.SingularityUp, c.owner).place();
	}
},
nymph:function(c,t){
	Effect.mkText("Nymph", t);
	var e = t.card.element || c.owner.uptoceil(12);
	Actives.destroy(c, t, false, true);
	new etg.Creature(Cards.Codes[etg.NymphList[e]].asUpped(t.card.upped), t.owner).place();
},
obsession:function(c,t){
	t.dmg(c.card.upped?13:10);
},
overdrive:function(c,t){
	Effect.mkText("3|-1", c);
	c.atk += 3;
	c.dmg(1, true);
},
overdrivespell:function(c,t){
	lobo(t);
	t.active.auto = Actives.overdrive;
},
pandemonium:function(c,t){
	c.owner.foe.masscc(c, Actives.cseed, c.card.upped);
},
paradox:function(c,t){
	Effect.mkText("Paradox", t);
	t.die();
},
parallel:function(c,t){
	Effect.mkText("Parallel", t);
	var copy = t.clone(c.owner);
	copy.place();
	copy.status.airborne = copy.card.status.airborne;
	if (copy.status.mutant){
		t.buffhp(c.owner.upto(5));
		t.atk += c.owner.upto(5);
		if(mutantactive(t)){
			t.cast = c.owner.uptoceil(2);
			t.castele = t.card.element;
		}
	}
	if (copy.status.voodoo){
		copy.owner.foe.dmg(copy.maxhp-copy.hp);
	}
},
phoenix:function(c,t, index){
	if (!c.owner.creatures[index]){
		c.owner.creatures[index] = new etg.Creature(Cards.Ash.asUpped(c.card.upped), c.owner);
	}
},
photosynthesis:function(c,t){
	Effect.mkText("2:5", c);
	c.owner.spend(etg.Life, -2);
	if (c.cast > 0){
		c.usedactive = false;
	}
},
plague:function(c,t){
	c.owner.foe.masscc(c, Actives.infect);
},
platearmor:function(c,t){
	var buff = c.card.upped?6:4;
	Effect.mkText("0|"+buff, t);
	t.buffhp(buff);
},
poison:adrenathrottle(function(c,t){
	(t || c.owner.foe).addpoison(1);
}),
poison2:adrenathrottle(function(c,t){
	(t || c.owner.foe).addpoison(2);
}),
poison3:function(c,t){
	(t || c.owner.foe).addpoison(3);
},
precognition:function(c,t){
	c.owner.precognition = true;
	c.owner.drawcard();
},
purify:function(c,t){
	t.status.poison = t.status.poison?Math.min(t.status.poison-2,-2):-2;
	if (t instanceof etg.Player){
		t.neuro = false;
		t.sosa = 0;
	}else{
		delete t.status.aflatoxin;
	}
},
queen:function(c,t){
	new etg.Creature(Cards.Firefly.asUpped(c.card.upped), c.owner).place();
},
quint:function(c,t){
	Effect.mkText("Immaterial", t);
	t.status.immaterial = true;
	t.status.frozen = 0;
},
rage:function(c,t){
	var dmg = c.card.upped?6:5;
	Effect.mkText(dmg+"|-"+dmg, t);
	t.atk += dmg;
	t.dmg(dmg);
},
readiness:function(c,t){
	Effect.mkText("Ready", t);
	if (t.active.cast){
		t.cast = 0;
		t.usedactive = false;
	}
},
rebirth:function(c,t){
	c.transform(Cards.Phoenix.asUpped(c.card.upped));
},
regenerate:function(c,t){
	Effect.mkText("+5", c);
	c.owner.dmg(-5);
},
relic:function(c,t){
	this.place();
},
rewind:function(c,t){
	if (t.card.isOf(Cards.Skeleton)){
		Actives.hatch(t);
	}else if (t.card.isOf(Cards.Mummy)){
		t.transform(Cards.Pharaoh.asUpped(t.card.upped));
	}else{
		Effect.mkText("Rewind", t);
		t.remove();
		t.owner.deck.push(t.card);
	}
},
salvage:function(c, t){
	if (c.owner != t.owner && !c.status.salvaged && !t.status.salvaged && c.owner.game.turn != c.owner){
		Effect.mkText("Salvage", c);
		c.status.salvaged = true;
		t.status.salvaged = true;
		new etg.CardInstance(t.card, c.owner).place();
	}
},
sanctuary:function(c,t){
	c.owner.sanctuary = true;
	Effect.mkText("+4", c);
	c.owner.dmg(-4);
},
scarab:function(c,t){
	new etg.Creature(Cards.Scarab.asUpped(c.card.upped), c.owner).place();
},
scramble:function(c,t){
	if (t instanceof etg.Player && !t.sanctuary){
		for (var i=0; i<9; i++){
			if (t.spend(etg.Other, 1)){
				t.spend(etg.Other, -1);
			}
		}
	}
},
serendipity:function(c,t){
	var cards = [], num = Math.min(8-c.owner.hand.length, 3), anyentro = false;
	for(var i=num-1; i>=0; i--){
		// Don't accept Marks/Nymphs
		cards[i] = c.owner.randomcard(c.card.upped, function(x){return (x.type != etg.PillarEnum || !x.name.match(/^Mark/)) && !etg.ShardList.some(function(shard){!shard || x.isOf(shard)}) && !etg.NymphList.some(function(nymph){!nymph || x.isOf(nymph)}) && (i>0 || anyentro || x.element == etg.Entropy)});
		anyentro |= cards[i].element == etg.Entropy;
	}
	for(var i=0; i<num; i++){
		new etg.CardInstance(cards[i], c.owner).place();
	}
},
silence:function(c,t){
	if (!c.owner.foe.sanctuary){
		c.owner.foe.silence = true;
	}
},
singularity:function(c,t){
	var r = c.owner.rng();
	if (r > .9){
		c.status.adrenaline = 1;
	}else if (r > .8){
		c.active.hit = Actives.vampire;
	}else if (r > .7){
		Actives.quint(c, c);
	}else if (r > .6){
		Actives.scramble(c, c.owner);
	}else if (r > .5){
		Actives.blackhole(c.owner.foe, c.owner);
	}else if (r > .4){
		c.atk -= c.owner.uptoceil(5);
		c.buffhp(c.owner.uptoceil(5));
	}else if (r > .3){
		Actives.nova(c.owner.foe);
		c.owner.foe.nova = 0;
	}else if (r > .2){
		Actives.parallel(c, c);
	}else if (r > .1 && c.owner.weapon){
		c.owner.weapon = new etg.Weapon(Cards.Dagger, c.owner);
	}
	c.dmg(c.trueatk(), true);
},
siphon:adrenathrottle(function(c, t) {
	if (!c.owner.foe.sanctuary && c.owner.foe.spend(etg.Other, 1)) {
		Effect.mkText("1:11", c);
		c.owner.spend(etg.Darkness, -1);
	}
}),
skyblitz:function(c,t){
	c.owner.quanta[etg.Air] = 0;
	for(var i=0; i<23; i++){
		var cr = c.owner.creatures[i];
		if (cr && cr.status.airborne && cr.isMaterialInstance(etg.Creature)){
			Effect.mkText("Dive", cr);
			cr.defstatus("dive", 0);
			cr.status.dive += cr.trueatk();
		}
	}
},
snipe:function(c,t){
	Effect.mkText("-3", t);
	t.dmg(3);
},
sosa:function(c,t){
	c.owner.sosa += 2;
	for(var i=1; i<13; i++){
		if (i != etg.Death){
			c.owner.quanta[i] = 0;
		}
	}
	c.owner.dmg((c.card.upped?40:48), true);
},
soulcatch:function(c,t){
	Effect.mkText("Soul", c);
	c.owner.spend(etg.Death, c.card.upped?-3:-2);
},
sskin:function(c,t){
	c.owner.buffhp(c.owner.quanta[etg.Earth]);
},
steal:function(c,t){
	if (t.status.stackable){
		Actives.destroy(c, t, true);
		if (t instanceof etg.Shield){
			if (c.owner.shield && c.owner.shield.card == t.card){
				c.owner.shield.status.charges++;
			}else{
				c.owner.shield = new etg.Shield(t.card, c.owner);
				c.owner.shield.status.charges = 1;
			}
		}else if (t instanceof etg.Weapon){
			if (c.owner.weapon && c.owner.weapon.card == t.card){
				c.owner.shield.status.charges++;
			}else{
				c.owner.weapon = new etg.Weapon(t.card, c.owner);
				c.owner.weapon.status.charges = 1;
			}
		}else if (t instanceof etg.Pillar){
			new etg.Pillar(t.card, c.owner).place();
		}else{
			new etg.Permanent(t.card, c.owner).place();
		}
	}else{
		t.remove();
		t.owner = c.owner;
		t.usedactive = true;
		t.place();
	}
},
steam:function(c,t){
	Effect.mkText("5|0", c);
	c.defstatus("steamatk", 0);
	c.status.steamatk += 5;
	c.atk += 5;
	if (!c.hasactive("postauto", "decrsteam")) c.addactive("postauto", Actives.decrsteam);
},
stoneform:function(c,t){
	Effect.mkText("0|20", c);
	c.buffhp(20);
	delete c.active.cast;
},
storm2:function(c,t){
	c.owner.foe.masscc(c, function(c,x){x.dmg(2)});
},
storm3:function(c,t){
	c.owner.foe.masscc(c, Actives.snipe);
},
swarm:function(c,t){
	var hp = 0;
	for (var i=0; i<23; i++){
		if (c.owner.creatures[i] && c.owner.creatures[i].active.hp == Actives.swarm){
			hp++;
		}
	}
	return hp;
},
swave:function(c,t){
	if (t.status.frozen){
		Effect.mkText("Death", t);
		t.die();
	}else{
		if (t instanceof etg.Player && t.weapon && t.weapon.status.frozen){
			Actives.destroy(c, t.weapon);
		}
		Effect.mkText("-4", t);
		t.spelldmg(4);
	}
},
unburrow:function(c,t){
	c.status.burrowed = false;
	c.active.cast = Actives.burrow;
	c.cast = 1;
	c.atk *= 2;
},
upkeep:function(c,t){
	if (!c.owner.spend(c.card.element, 1)){
		c.owner.quanta[c.card.element] = 0;
		c.die();
	}
},
vampire:function(c,t, dmg){
	c.owner.dmg(-dmg);
},
virusinfect:function(c,t){
	Actives.infect(c, t);
	c.die();
},
virusplague:function(c,t){
	Actives.plague(c, t);
	c.die();
},
void:function(c,t){
	c.owner.foe.maxhp = Math.max(c.owner.foe.maxhp-(c.owner.mark == etg.Darkness?3:2), 1);
	if (c.owner.foe.hp > c.owner.foe.maxhp){
		c.owner.foe.hp = c.owner.foe.maxhp;
	}
},
web:function(c,t){
	Effect.mkText("Web", t);
	delete t.status.airborne;
},
wisdom:function(c,t){
	Effect.mkText("4|0", t);
	t.atk += 4;
	if (t.status.immaterial){
		t.status.psion = true;
	}
},
pillar:function(c,t){
	if (!t)
		c.owner.spend(c.card.element, -c.status.charges * (c.card.element > 0 ? 1 : 3));
	else if (c == t)
		c.owner.spend(c.card.element, -(c.card.element > 0 ? 1 : 3))
},
pend:function(c,t){
	var ele = c.pendstate ? c.owner.mark : c.card.element;
	c.owner.spend(ele, -c.status.charges * (ele > 0 ? 1 : 3));
	c.pendstate ^= true;
},
blockwithcharge:function(c,t){
	if (--c.status.charges <= 0){
		c.owner.shield = undefined;
	}
	return true;
},
cold:function(c,t){
	if (t instanceof etg.Creature && c.owner.rng()<.3){
		t.freeze(3);
	}
},
evade100:function(c,t){
	return true;
},
evade40:function(c,t){
	return c.owner.rng() < .4;
},
evade50:function(c,t){
	return c.owner.rng() < .5;
},
firewall:function(c,t){
	if (t instanceof etg.Creature){
		t.dmg(1);
	}
},
skull:function(c,t){
	if (t instanceof etg.Creature && !t.card.isOf(Cards.Skeleton)) {
		var thp = t.truehp();
		if (thp == 0 || (thp>0 && c.owner.rng() < .5/thp)){
			var index = t.getIndex();
			t.die();
			if (!t.owner.creatures[index] || t.owner.creatures[index].card != Cards.MalignantCell){
				t.owner.creatures[index] = new etg.Creature(Cards.Skeleton.asUpped(t.card.upped), t.owner);
			}
		}
	}
},
slow:function(c,t){
	if (t instanceof etg.Creature){
		t.delay(2);
	}
},
solar:function(c,t){
	if (!c.owner.sanctuary) c.owner.spend(etg.Light, -1);
},
thorn:function(c,t){
	if (t instanceof etg.Creature && c.owner.rng() < .75){
		t.addpoison(1);
	}
},
weight:function(c,t){
	return t instanceof etg.Creature && t.truehp()>5;
},
wings:function(c,t){
	return !t.status.airborne && !t.status.ranged;
},
}
for(var key in Actives){
	Actives[key].activename = key;
}
module.exports = Actives