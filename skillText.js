"use strict";
var etg = require("./etg");
// TODO skeleton, mummy
var data = {
	ablaze:"Gain 2|0",
	accelerationspell:"Replaces target creature's skills with \"Acceleration: gain +2|-1 per turn\"",
	accretion:"Destroy target permanent & gain 0|15. Return to owner's hand as a Blackhole if health exceeds 45",
	adrenaline:"Target creature attacks multiple times per turn. Weaker creatures gain more attacks",
	aflatoxin:"Apply 2 poison to target. When target dies, it turns into a malignant cell",
	air:"Produce 1:9",
	antimatter:"Invert strength of target",
	bblood:"Target creature gains 0|20 & is delayed 6 turns",
	blackhole:"Absorb 3 quanta per element from target player. Heal 1 per absorbed quantum",
	bless:"Target gains 3|3",
	blockwithcharge:"Block attack per stack",
	boneyard:["When a creature dies, summon a 1|1 Skeleton", "When a creature dies, summon a 2|2 Skeleton"],
	bravery:"Foe draws 2 cards, you draw an equal amount of cards",
	butterfly:"Target something smaller than, or weaker than, 3. Replace target's skills with \"3:1 Destroy target permanent\"",
	catapult:"Sacrifice target creature to deal 100HP/(100+HP) damage foe. Frozen creatures increase damage by 50%. Poisoned creatures transfer poison",
	chimera:"Combine all your creatures to form a Chimera with momentum & gravity pull",
	cold:"30% chance to freeze non-ranged attackers for 3",
	cpower:"Target gains 1 to 5 strength. Target gains 1 to 5 largeness",
	cseed:"A random effect is inflicted to target creature",
	deadalive:"Trigger a death effect",
	decrsteam:"Decrement strength from steam after attack",
	deja:"Remove active & summon copy",
	dessication:"Deal 2 damage to opponent's creatures. Gain 1:7 per damage dealt. Removes cloak",
	destroy:"Destroy target permanent",
	devour:"Kill smaller target creature & gain 1|1",
	die:"Sacrifice",
	disfield:"Absorb damage. Consume 1:0 per damage absorbed",
	disshield:"Absorb damage. Consume 1:1 per 3 damage absorbed",
	divinity:"Add 24 to maximum health if mark 1:8, otherwise 16 & heal same",
	dive:"Double strength until next attack. Does not stack",
	drainlife:"Drains 2HP from target. Increment drain per 5:11 owned",
	dryspell:"Deal 1 damage to all creatures. Gain 1:7 per damage dealt. Removes cloak",
	dshield:"Become immaterial until next turn",
	duality:"Generate a copy of foe's next draw",
	earth:"Produce 1:4",
	earthquake:"Destroy up to 3 stacks from target permanent",
	empathy:"Heal owner per creature owned per turn. Upkeep per 8 creatures",
	enchant:"Target permanent becomes immaterial",
	endow:"Replicate attributes of target weapon",
	evade40:"40% chance to evade",
	evade50:"50% chance to evade",
	evade100:"100% chance to evade",
	evolve:"Become an unburrowed Shrieker",
	fiery:"Increment damage per 5:6 owned",
	fire:"Produce 1:6",
	firebolt:"Deals 3 damage to target. Increment damage per 4:6 owned. Thaws target",
	firewall:"Damage non-ranged attackers",
	flyingweapon:"Own weapon becomes a flying creature",
	fractal:"Fill hand with copies of target creature's card. Consumes remaining 1:12",
	freeevade:"Own airborne creatures have a 30% chance to either deal 50% more damage or bypass shields. 20% chance to evade targeting",
	freeze:["Freeze target for 3 turns. Being frozen disables attacking & per turn skills",
		"Freeze target for 4 turns. Being frozen disables attacking & per turn skills"],
	gaincharge2:"Gain 2 stacks per death",
	gas:"Summon an Unstable Gas",
	gpull:"Intercept attacks directed to owner",
	gpullspell:"Target creature intercepts attacks directed to its owner",
	gratitude:"Heal owner 4, 5 if 1:5",
	growth1:{
		death:"When a creature dies, gain 1|1",
		cast:"Gain 1|1",
	},
	growth:"Gain 2|2",
	guard:"Delay target creature & attack target if grounded. Delay self",
	hasten:"Draw",
	hatch:"Become a random creature",
	heal:"Heal self 20",
	holylight:"Heal target 10. Nocturnal targets are damaged instead",
	hope:"Increment damage reduction per own 1:8 producing creature",
	icebolt:"Deal 2 damage to target. Increment damage per 5:7 owned. May freeze target",
	ignite:"Deal 20 spell damage to foe & 1 damage to all creatures",
	immolate:function(c){return "Sacrifice a creature to produce "+(c.upped?7:5)+":6 & 1 quanta of each other element"},
	improve:"Mutate target creature",
	infect:"Poison target creature",
	inflation:"Increase cost of all actives by 1",
	ink:"Summon a Cloak which lasts 1 turn",
	integrity:"Combine all shards in hand to form a Shard Golem",
	light:{
		auto:"Produce 1:8",
		ownplay:"Produce 1:8 on play",
	},
	lightning:"Deal 5 damage to target",
	liquid:"Target creature is poisoned & skills replaced with \"Heal owner per damage dealt\"",
	lobotomize:"Remove skills from target creature",
	losecharge:function(c, inst){
		var charges = c.status.charges;
		return "Lasts " + charges + " turn" + (charges == 1?"":"s");
	},
	luciferin:"All your creatures without skills produce 1:8. Heal owner 10",
	lycanthropy:"Gain 5|5",
	mend:"Heal target creature 5",
	miracle:"Heal self to one below maximum HP. Consumes remaining 1:8",
	mitosis:"Summon a daughter creature",
	mitosisspell:"Non-weapon creature gains 0|1 & active \"Mitosis: Summon a daughter creature\" costing target's card's cost",
	momentum:"Target ignores shield effects & gains 1|1",
	mutation:"Mutate target creature into an abomination, or maybe something more. Slight chance of death",
	neuro:"Apply poison on hit, also inflicting neurotoxin. Neurotoxin applies poison per card played by victim. Throttled",
	nightmare:"Fill foe's hand with copies of target creature's card. Drain 2HP per added card",
	nova:"Produce 1 quanta of each element. Increment singularity danger by 2. Summon singularity if danger exceeds 5",
	nova2:"Produce 2 quanta of each element. Increment singularity danger by 3. Summon singularity if danger exceeds 5",
	nymph:"Turn target pillar into a Nymph of same element",
	obsession:["Damage owner 10 on discard", "Damage owner 13 on discard"],
	overdrivespell:"Replaces target creature's skills with \"Overdrive: gain +3|-1 per turn\"",
	pandemonium2:"Random effects are inflicted to target player's creatures. Removes cloak",
	pandemonium:"Random effects are inflicted to all creatures. Removes cloak",
	paradox:"Kill target creature which is stronger than it is large",
	parallel:"Duplicate target creature",
	phoenix:["Become an Ash on death", "Become a Minor Ash on death"],
	photosynthesis:"Convert 1:8 to 2:5. May activate multiple times",
	pillar:{
		auto:function(c){return "Produce "+(c.element?1:3)+":"+c.element},
		ownplay:function(c){return "Produce "+(c.element?1:3)+":"+c.element+" on play"}
	},
	pend:function(c){return "Oscilliate between producing "+(c.element?1:3)+":"+c.element + " & quanta of mark"},
	plague:"Poison foe's creatures. Removes cloak",
	platearmor:["Target gains 0|3", "Target gains 0|6"],
	poison:{
		hit:"Apply poison on hit. Throttled",
		cast:"Apply poison to foe"
	},
	poison2:{
		hit:"Apply 2 poison on hit. Throttled",
		cast:"Apply 2 poison to foe"
	},
	poison3:{
		hit:"Apply 3 poison on hit. Throttled",
		cast:"Apply 3 poison to foe"
	},
	precognition:"Reveal foe's hand until end of their turn. Draw",
	purify:"Replace poison statuses with 2 purify. Removes sacrifice",
	queen:"Summon a Firefly",
	quint:"Target creature becomes immaterial. Thaws",
	rage:["Target creature gains +5|-5. Thaws",
		"Target creature gains +6|-6. Thaws"],
	readiness:"Target creature's active becomes costless. Skill can be reactivated",
	rebirth:["Become a Phoenix", "Become a Minor Phoenix"],
	regenerate:"Heal owner 5",
	relic:"Worthless",
	rewind:"Remove target creature to top of owner's deck",
	salvage:"Restore permanents destroyed by foe to hand once per turn. Gain 1|1 if so",
	salvageoff:"Become ready to salvage again at start of next turn",
	sanctuary:"Heal 4 per turn. Protection during foe's turn from hand & quanta control",
	scarab:"Summon a Scarab",
	scramble:"Randomly scramble foe's quanta on hit",
	serendipity:["Generate 3 random non-pillar cards in hand. One will be 1:1",
		"Generate 3 random non-pillar upgraded cards in hand. One will be 1:1"],
	silence:"foe cannot play cards during their next turn, or target creature gains summoning sickness",
	singularity:"Not well behaved",
	siphon:"Siphon 1:0 from foe as 1:11. Throttled",
	skull:"Attacking creatures may die & become skeletons. Smaller creatures are more likely to die",
	skyblitz:"Dive all own airborne creatures. Consumes remaining 1:9",
	slow:"Delay non-ranged attackers",
	snipe:"Deal 3 damage to target creature",
	solar:"Produce 1:8 per attacker",
	sosa:["Sacrifice 48HP & consume all non 1:2 to invert damage for 2 turns",
		"Sacrifice 40HP & consume all non 1:2 to invert damage for 2 turns"],
	soulcatch:function(c){"When a creature dies, produce "+(c.upped?3:2)+":2"},
	sskin:"Increment maximum HP per 1:4 owned. Heal same",
	steal:"Steal target permanent",
	steam:"Gain 5|0",
	stoneform:"Gain 0|20 & become a golem",
	storm2:"Deals 2 damage to foe's creatures. Removes cloak",
	storm3:"Deals 3 damage to foe's creatures. Removes cloak",
	swarm:"Increment largeness per scarab",
	swave:"Deals 4 damage to target. Instantly kill creature or destroy weapon if frozen",
	thorn:"75% chance to poison non-ranged attackers",
	upkeep:function(c){return "Consumes 1:"+c.element},
	vampire:"Heal owner per damage dealt",
	virusinfect:"Sacrifice self & poison target creature",
	virusplague:"Sacrifice self & poison foe's creatures",
	void:"Reduce foe's maximum HP by 3",
	web:"Target creature loses airborne",
	weight:"Evade creatures larger than 5",
	wings:"Evade non-airborne & non-ranged attackers",
	wisdom:"Target gains 4|0. May target immaterial, granting psionic",
};
[["dagger", "1:2 1:11. Increment damage if cloaked"], ["hammer", "1:3 1:4"], ["bow", "1:9"]].forEach(function(x){
	data[x[0]] = "Increment damage if mark is "+x[1];
});
function auraText(tgts, bufftext, upbufftext){
	return function(c){
		return tgts + " gain " + (c.upped?bufftext:upbufftext) + " while " + c.name + " in play. Unique";
	}
}
var statusData = {
	cloak:"Cloaks own field",
	charges:function(c){return etg.Thing.prototype.hasactive.call(c, "auto", "losecharge") || c.status.charges == 1?"":"Enter with " + c.status.charges + (c.status.stackable?" stacks":" charges")},
	flooding:"Non aquatic creatures past first five creature slots die on turn end. Consumes 1:7. Unique",
	freedom:"",
	nightfall:auraText("Nocturnal creatures", "1|1", "2|1"),
	patience:"Each turn delay own creatures. They gain 2|2. 5|5 if flooded. Unique",
	stackable:"",
	stasis:"Prevent creatures attacking at end of turn",
	voodoo:"Repeat to foe negative status effects & non lethal damage",
};
function processEntry(c, event, entry){
	return typeof entry === "string" ? entry :
		entry instanceof Array ? entry[asCard(c).upped?1:0] :
		entry instanceof Function ? entry(asCard(c), c) :
		event in entry ? processEntry(c, event, entry[event]) : "";
}
function asCard(c){
	return c instanceof etg.Card?c:c.card;
}
function pushEntry(list, c, event, entry){
	var x = processEntry(c, event, entry);
	if (x) list.push(x);
}
module.exports = function(c, event){
	if (c instanceof etg.Card && c.type == etg.SpellEnum){
		var entry = data[c.active.activename[0]];
		return processEntry(c, "cast", entry);
	}else{
		var ret = [], stext = [];
		for(var key in c.status){
			if (!c.status[key]) continue;
			var entry = statusData[key];
			if (entry === undefined) stext.push(c.status[key]===true?key:c.status[key]+key);
			else pushEntry(ret, c, "", entry);
		}
		if (stext.length) ret.unshift(stext.join(" "));
		for(var key in c.active){
			c.active[key].activename.forEach(function(name){
				var entry = data[name];
				if (entry === undefined) return;
				pushEntry(ret, c, key, entry);
				if (key == "cast") ret[ret.length-1] = etg.casttext(c.cast, c.castele) + " " + ret[ret.length-1];
			});
		}
		return ret.join("\n");
	}
}