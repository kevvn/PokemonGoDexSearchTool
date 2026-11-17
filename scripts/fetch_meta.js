import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { getFamilyIds } from '../src/utils/familyUtils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PVPOKE_URLS = {
  great_league: 'https://raw.githubusercontent.com/pvpoke/pvpoke/master/src/data/rankings/all/overall/rankings-1500.json',
  ultra_league: 'https://raw.githubusercontent.com/pvpoke/pvpoke/master/src/data/rankings/all/overall/rankings-2500.json',
  master_league: 'https://raw.githubusercontent.com/pvpoke/pvpoke/master/src/data/rankings/all/overall/rankings-10000.json',
};

// DialgaDex Top PvE Raid Attackers & Meta Benchmarks (eDPS, DPS, Party Power, Recommended Movesets)
const DIALGADEX_PVE_DATABASE = [
  // Tier S+ (God Tier eDPS >= 28.0 & Primal/Mega/Fusion)
  { dexId: 800, species: 'Dusk Mane Necrozma', baseName: 'necrozma', tier: 'S+', role: 'Steel', edps: 33.5, dps: 31.0, partyPower: 'ELITE', fastMove: 'Metal Claw', chargedMoves: ['Sunsteel Strike'], isLegacyMove: true, notes: '#1 Steel Attacker' },
  { dexId: 800, species: 'Dawn Wings Necrozma', baseName: 'necrozma', tier: 'S+', role: 'Ghost / Dark', edps: 33.8, dps: 31.5, partyPower: 'ELITE', fastMove: 'Shadow Claw', chargedMoves: ['Moongeist Beam'], isLegacyMove: true, notes: '#1 Ghost Attacker' },
  { dexId: 384, species: 'Mega Rayquaza / Rayquaza', baseName: 'rayquaza', tier: 'S+', role: 'Flying / Dragon', edps: 32.8, dps: 31.2, partyPower: 'ELITE', fastMove: 'Dragon Tail', chargedMoves: ['Dragon Ascent', 'Breaking Swipe'], isLegacyMove: true, notes: '#1 Flying & Dragon Mega' },
  { dexId: 383, species: 'Primal Groudon / Groudon', baseName: 'groudon', tier: 'S+', role: 'Ground', edps: 31.6, dps: 29.5, partyPower: 'ELITE', fastMove: 'Mud Shot', chargedMoves: ['Precipice Blades'], isLegacyMove: true, notes: '#1 Ground Attacker' },
  { dexId: 382, species: 'Primal Kyogre / Kyogre', baseName: 'kyogre', tier: 'S+', role: 'Water', edps: 31.4, dps: 29.2, partyPower: 'ELITE', fastMove: 'Waterfall', chargedMoves: ['Origin Pulse'], isLegacyMove: true, notes: '#1 Water Attacker' },
  { dexId: 150, species: 'Shadow Mewtwo / Mewtwo', baseName: 'mewtwo', tier: 'S+', role: 'Psychic / Ice / Ghost', edps: 35.4, dps: 33.6, partyPower: 'HIGH', fastMove: 'Psycho Cut', chargedMoves: ['Psystrike', 'Shadow Ball'], isLegacyMove: true, notes: '#1 Psychic Attacker' },
  { dexId: 448, species: 'Mega Lucario / Lucario', baseName: 'lucario', tier: 'S+', role: 'Fighting', edps: 32.1, dps: 30.8, partyPower: 'HIGH', fastMove: 'Force Palm', chargedMoves: ['Aura Sphere'], isLegacyMove: true, notes: '#1 Fighting Attacker' },
  { dexId: 639, species: 'Terrakion', baseName: 'terrakion', tier: 'S+', role: 'Fighting / Rock', edps: 28.0, dps: 25.5, partyPower: 'HIGH', fastMove: 'Double Kick', chargedMoves: ['Sacred Sword'], isLegacyMove: true, notes: '#1 Non-Mega Fighting' },
  { dexId: 798, species: 'Kartana', baseName: 'kartana', tier: 'S+', role: 'Grass', edps: 28.8, dps: 30.5, partyPower: 'HIGH', fastMove: 'Razor Leaf', chargedMoves: ['Leaf Blade'], isLegacyMove: false, notes: '#1 Grass Attacker' },
  { dexId: 484, species: 'Origin Palkia', baseName: 'palkia', tier: 'S+', role: 'Dragon / Water', edps: 28.0, dps: 26.5, partyPower: 'ELITE', fastMove: 'Dragon Tail', chargedMoves: ['Spacial Rend'], isLegacyMove: true, notes: 'Adventure Effect + Top Dragon' },
  { dexId: 483, species: 'Origin Dialga', baseName: 'dialga', tier: 'S+', role: 'Dragon / Steel', edps: 27.5, dps: 25.8, partyPower: 'ELITE', fastMove: 'Dragon Breath', chargedMoves: ['Roar of Time'], isLegacyMove: true, notes: 'Adventure Effect + Top Dragon' },
  { dexId: 643, species: 'Reshiram', baseName: 'reshiram', tier: 'S+', role: 'Fire', edps: 28.2, dps: 26.5, partyPower: 'ELITE', fastMove: 'Fire Fang', chargedMoves: ['Fusion Flare'], isLegacyMove: true, notes: '#1 Non-Mega Fire' },
  { dexId: 644, species: 'Zekrom', baseName: 'zekrom', tier: 'S+', role: 'Electric', edps: 27.8, dps: 26.0, partyPower: 'ELITE', fastMove: 'Charge Beam', chargedMoves: ['Fusion Bolt'], isLegacyMove: true, notes: '#1 Non-Mega Electric' },
  { dexId: 646, species: 'Black / White Kyurem', baseName: 'kyurem', tier: 'S+', role: 'Ice / Dragon', edps: 31.0, dps: 29.4, partyPower: 'ELITE', fastMove: 'Dragon Tail', chargedMoves: ['Glaciate', 'Freeze Shock', 'Ice Burn'], isLegacyMove: true, notes: '#1 Ice Attacker' },

  // Tier S (Elite Raid Counters & Shadow Staples)
  { dexId: 376, species: 'Shadow / Mega Metagross', baseName: 'metagross', tier: 'S', role: 'Steel', edps: 31.0, dps: 29.4, partyPower: 'HIGH', fastMove: 'Bullet Punch', chargedMoves: ['Meteor Mash'], isLegacyMove: true, notes: 'Premier Steel Raid Anchor' },
  { dexId: 464, species: 'Shadow Rhyperior', baseName: 'rhyperior', tier: 'S', role: 'Rock / Ground', edps: 31.2, dps: 28.8, partyPower: 'ELITE', fastMove: 'Smack Down / Mud-Slap', chargedMoves: ['Rock Wrecker', 'Breaking Swipe'], isLegacyMove: true, notes: '#1 Shadow Rock / Ground' },
  { dexId: 473, species: 'Shadow Mamoswine', baseName: 'mamoswine', tier: 'S', role: 'Ice / Ground', edps: 31.0, dps: 29.0, partyPower: 'HIGH', fastMove: 'Powder Snow', chargedMoves: ['Avalanche', 'High Horsepower'], isLegacyMove: false, notes: 'Top Shadow Ice & Ground' },
  { dexId: 445, species: 'Shadow / Mega Garchomp', baseName: 'garchomp', tier: 'S', role: 'Ground / Dragon', edps: 31.8, dps: 30.2, partyPower: 'ELITE', fastMove: 'Mud Shot / Dragon Tail', chargedMoves: ['Earth Power', 'Outrage'], isLegacyMove: true, notes: 'Dual Ground/Dragon Elite' },
  { dexId: 248, species: 'Shadow / Mega Tyranitar', baseName: 'tyranitar', tier: 'S', role: 'Dark / Rock', edps: 30.8, dps: 28.8, partyPower: 'HIGH', fastMove: 'Bite / Smack Down', chargedMoves: ['Brutal Swing', 'Stone Edge'], isLegacyMove: true, notes: '#1 Dark Mega & Shadow' },
  { dexId: 373, species: 'Shadow / Mega Salamence', baseName: 'salamence', tier: 'S', role: 'Dragon / Flying', edps: 32.0, dps: 31.2, partyPower: 'ELITE', fastMove: 'Dragon Tail', chargedMoves: ['Outrage', 'Fly'], isLegacyMove: true, notes: 'Elite Dragon DPS' },
  { dexId: 409, species: 'Shadow Rampardos', baseName: 'rampardos', tier: 'S', role: 'Rock', edps: 30.5, dps: 34.2, partyPower: 'ELITE', fastMove: 'Smack Down', chargedMoves: ['Rock Slide'], isLegacyMove: false, notes: 'Highest Raw Rock DPS' },
  { dexId: 609, species: 'Shadow Chandelure', baseName: 'chandelure', tier: 'S', role: 'Ghost / Fire', edps: 30.2, dps: 32.4, partyPower: 'ELITE', fastMove: 'Hex / Fire Spin', chargedMoves: ['Shadow Ball', 'Overheat'], isLegacyMove: false, notes: 'Dual Ghost/Fire Glass Cannon' },
  { dexId: 635, species: 'Hydreigon', baseName: 'hydreigon', tier: 'S', role: 'Dark', edps: 25.8, dps: 24.5, partyPower: 'HIGH', fastMove: 'Bite', chargedMoves: ['Brutal Swing'], isLegacyMove: true, notes: 'Top Non-Shadow Dark' },
  { dexId: 998, species: 'Baxcalibur', baseName: 'baxcalibur', tier: 'S', role: 'Ice / Dragon', edps: 26.0, dps: 25.5, partyPower: 'HIGH', fastMove: 'Ice Fang', chargedMoves: ['Avalanche', 'Glaive Rush'], isLegacyMove: true, notes: 'Elite Ice/Dragon Pseudo' },
  { dexId: 534, species: 'Shadow Conkeldurr', baseName: 'conkeldurr', tier: 'S', role: 'Fighting', edps: 29.5, dps: 28.2, partyPower: 'HIGH', fastMove: 'Counter', chargedMoves: ['Dynamic Punch', 'Brutal Swing'], isLegacyMove: true, notes: 'Top Shadow Fighting Tank' },
  { dexId: 530, species: 'Shadow Excadrill', baseName: 'excadrill', tier: 'S', role: 'Ground / Steel', edps: 29.8, dps: 30.6, partyPower: 'HIGH', fastMove: 'Mud-Slap / Metal Claw', chargedMoves: ['Scorching Sands', 'Iron Head'], isLegacyMove: false, notes: 'Top Ground & Dynamax Anchor' },
  { dexId: 68, species: 'Shadow Machamp', baseName: 'machamp', tier: 'S', role: 'Fighting', edps: 27.8, dps: 27.6, partyPower: 'HIGH', fastMove: 'Counter', chargedMoves: ['Dynamic Punch'], isLegacyMove: false, notes: 'Core Fighting Raid Staple' },
  { dexId: 796, species: 'Xurkitree', baseName: 'xurkitree', tier: 'S', role: 'Electric', edps: 27.5, dps: 29.8, partyPower: 'HIGH', fastMove: 'Thunder Shock', chargedMoves: ['Discharge', 'Power Whip'], isLegacyMove: false, notes: 'Top Electric Ultra Beast' },
  { dexId: 806, species: 'Blacephalon', baseName: 'blacephalon', tier: 'S', role: 'Fire / Ghost', edps: 26.8, dps: 29.5, partyPower: 'ELITE', fastMove: 'Incinerate / Astonish', chargedMoves: ['Mystical Fire', 'Shadow Ball'], isLegacyMove: false, notes: 'Top Fire/Ghost Glass Cannon' },
  { dexId: 793, species: 'Nihilego', baseName: 'nihilego', tier: 'S', role: 'Poison / Rock', edps: 25.2, dps: 25.0, partyPower: 'HIGH', fastMove: 'Poison Jab', chargedMoves: ['Sludge Bomb'], isLegacyMove: false, notes: '#1 Poison Attacker' },
  { dexId: 645, species: 'Landorus (Therian)', baseName: 'landorus', tier: 'S', role: 'Ground', edps: 26.8, dps: 26.0, partyPower: 'ELITE', fastMove: 'Mud Shot', chargedMoves: ['Sandsear Storm'], isLegacyMove: true, notes: 'Top Ground Legendary' },
  { dexId: 905, species: 'Enamorus', baseName: 'enamorus', tier: 'S', role: 'Fairy / Flying', edps: 26.0, dps: 26.5, partyPower: 'HIGH', fastMove: 'Fairy Wind', chargedMoves: ['Fly', 'Dazzling Gleam'], isLegacyMove: false, notes: '#1 Non-Mega Fairy' },
  { dexId: 637, species: 'Volcarona', baseName: 'volcarona', tier: 'S', role: 'Bug / Fire', edps: 25.5, dps: 26.0, partyPower: 'ELITE', fastMove: 'Bug Bite / Fire Spin', chargedMoves: ['Bug Buzz', 'Overheat'], isLegacyMove: false, notes: '#1 Non-Mega Bug' },
  { dexId: 555, species: 'Shadow / Galarian Darmanitan', baseName: 'darmanitan', tier: 'S', role: 'Fire / Ice', edps: 28.4, dps: 31.0, partyPower: 'ELITE', fastMove: 'Fire Fang / Ice Fang', chargedMoves: ['Overheat', 'Avalanche'], isLegacyMove: false, notes: 'Top Fire & Ice DPS' },
  { dexId: 94, species: 'Mega / Shadow Gengar', baseName: 'gengar', tier: 'S', role: 'Ghost / Poison', edps: 28.8, dps: 33.0, partyPower: 'HIGH', fastMove: 'Lick / Shadow Claw', chargedMoves: ['Shadow Ball', 'Sludge Bomb'], isLegacyMove: true, notes: 'Premier Ghost Mega & G-Max' },
  { dexId: 282, species: 'Mega / Shadow Gardevoir', baseName: 'gardevoir', tier: 'S', role: 'Fairy / Psychic', edps: 28.2, dps: 28.2, partyPower: 'HIGH', fastMove: 'Charm / Confusion', chargedMoves: ['Dazzling Gleam', 'Psychic'], isLegacyMove: false, notes: '#1 Fairy Mega & Shadow' },
  { dexId: 257, species: 'Mega / Shadow Blaziken', baseName: 'blaziken', tier: 'S', role: 'Fire / Fighting', edps: 28.5, dps: 29.0, partyPower: 'HIGH', fastMove: 'Counter / Fire Spin', chargedMoves: ['Blast Burn', 'Aura Sphere'], isLegacyMove: true, notes: '#1 Fire Mega' },
  { dexId: 260, species: 'Mega / Shadow Swampert', baseName: 'swampert', tier: 'S', role: 'Water / Ground', edps: 27.6, dps: 27.0, partyPower: 'HIGH', fastMove: 'Water Gun / Mud Shot', chargedMoves: ['Hydro Cannon', 'Earthquake'], isLegacyMove: true, notes: 'Top Water/Ground Mega' },
  { dexId: 254, species: 'Mega Sceptile', baseName: 'sceptile', tier: 'S', role: 'Grass', edps: 28.9, dps: 29.5, partyPower: 'HIGH', fastMove: 'Fury Cutter', chargedMoves: ['Frenzy Plant'], isLegacyMove: true, notes: '#1 Grass Mega' },
  { dexId: 6, species: 'Mega Charizard Y / Shadow', baseName: 'charizard', tier: 'S', role: 'Fire / Flying', edps: 28.0, dps: 27.5, partyPower: 'HIGH', fastMove: 'Fire Spin / Wing Attack', chargedMoves: ['Blast Burn'], isLegacyMove: true, notes: 'Elite Fire Mega & G-Max' },
  { dexId: 719, species: 'Mega Diancie', baseName: 'diancie', tier: 'S', role: 'Rock', edps: 29.2, dps: 31.0, partyPower: 'HIGH', fastMove: 'Rock Throw', chargedMoves: ['Rock Slide'], isLegacyMove: false, notes: '#1 Rock Mega' },
  { dexId: 214, species: 'Mega Heracross', baseName: 'heracross', tier: 'S', role: 'Bug / Fighting', edps: 28.1, dps: 27.5, partyPower: 'ELITE', fastMove: 'Counter / Struggle Bug', chargedMoves: ['Megahorn', 'Close Combat'], isLegacyMove: false, notes: '#1 Bug Mega' },

  // Tier A (Strong Raid Counters, Shadows & Dynamax Staples)
  { dexId: 3, species: 'Mega / Shadow Venusaur', baseName: 'venusaur', tier: 'A', role: 'Grass / Poison', edps: 24.5, dps: 24.0, partyPower: 'HIGH', fastMove: 'Vine Whip', chargedMoves: ['Frenzy Plant'], isLegacyMove: true, notes: 'Core Grass Mega & G-Max' },
  { dexId: 9, species: 'Mega / G-Max Blastoise', baseName: 'blastoise', tier: 'A', role: 'Water', edps: 23.8, dps: 23.0, partyPower: 'HIGH', fastMove: 'Water Gun', chargedMoves: ['Hydro Cannon'], isLegacyMove: true, notes: 'Water Mega & G-Max Tank' },
  { dexId: 149, species: 'Shadow Dragonite', baseName: 'dragonite', tier: 'A', role: 'Dragon', edps: 27.2, dps: 26.8, partyPower: 'ELITE', fastMove: 'Dragon Tail', chargedMoves: ['Outrage', 'Draco Meteor'], isLegacyMove: false, notes: 'Reliable Shadow Dragon' },
  { dexId: 466, species: 'Shadow Electivire', baseName: 'electivire', tier: 'A', role: 'Electric', edps: 26.5, dps: 29.0, partyPower: 'HIGH', fastMove: 'Thunder Shock', chargedMoves: ['Wild Charge'], isLegacyMove: false, notes: 'Top Shadow Electric' },
  { dexId: 462, species: 'Shadow Magnezone', baseName: 'magnezone', tier: 'A', role: 'Electric / Steel', edps: 25.8, dps: 26.5, partyPower: 'HIGH', fastMove: 'Spark', chargedMoves: ['Wild Charge'], isLegacyMove: false, notes: 'Bulky Shadow Electric' },
  { dexId: 461, species: 'Shadow Weavile', baseName: 'weavile', tier: 'A', role: 'Ice / Dark', edps: 25.5, dps: 27.2, partyPower: 'HIGH', fastMove: 'Ice Shard / Snarl', chargedMoves: ['Triple Axel', 'Foul Play'], isLegacyMove: false, notes: 'Dual Ice/Dark Raider' },
  { dexId: 407, species: 'Roserade', baseName: 'roserade', tier: 'A', role: 'Grass / Poison', edps: 23.5, dps: 24.5, partyPower: 'HIGH', fastMove: 'Magical Leaf / Poison Jab', chargedMoves: ['Grass Knot', 'Sludge Bomb'], isLegacyMove: false, notes: 'Top Budget Grass/Poison' },
  { dexId: 612, species: 'Haxorus', baseName: 'haxorus', tier: 'A', role: 'Dragon', edps: 25.0, dps: 26.2, partyPower: 'HIGH', fastMove: 'Dragon Tail', chargedMoves: ['Breaking Swipe'], isLegacyMove: true, notes: 'High Attack Dragon' },
  { dexId: 983, species: 'Kingambit', baseName: 'kingambit', tier: 'A', role: 'Dark / Steel', edps: 25.4, dps: 24.8, partyPower: 'HIGH', fastMove: 'Snarl / Metal Claw', chargedMoves: ['Kowtow Cleave', 'Dark Pulse'], isLegacyMove: true, notes: 'Bulky Dark/Steel Attacker' },
  { dexId: 243, species: 'Shadow Raikou', baseName: 'raikou', tier: 'A', role: 'Electric', edps: 27.0, dps: 26.2, partyPower: 'HIGH', fastMove: 'Thunder Shock', chargedMoves: ['Wild Charge'], isLegacyMove: false, notes: 'Elite Shadow Electric' },
  { dexId: 244, species: 'Shadow Entei', baseName: 'entei', tier: 'A', role: 'Fire', edps: 26.5, dps: 25.8, partyPower: 'ELITE', fastMove: 'Fire Fang', chargedMoves: ['Overheat'], isLegacyMove: false, notes: 'Elite Shadow Fire' },
  { dexId: 146, species: 'Shadow Moltres', baseName: 'moltres', tier: 'A', role: 'Flying / Fire', edps: 27.2, dps: 27.8, partyPower: 'HIGH', fastMove: 'Wing Attack / Fire Spin', chargedMoves: ['Sky Attack', 'Overheat'], isLegacyMove: true, notes: 'Top Shadow Flying/Fire' },
  { dexId: 485, species: 'Shadow / Magma Storm Heatran', baseName: 'heatran', tier: 'A', role: 'Fire', edps: 27.5, dps: 26.0, partyPower: 'HIGH', fastMove: 'Fire Spin', chargedMoves: ['Magma Storm'], isLegacyMove: true, notes: 'Bulky Fire Raid Anchor' },
  { dexId: 491, species: 'Darkrai', baseName: 'darkrai', tier: 'A', role: 'Dark', edps: 25.2, dps: 26.0, partyPower: 'HIGH', fastMove: 'Snarl', chargedMoves: ['Dark Pulse', 'Shadow Ball'], isLegacyMove: false, notes: 'Mythical Dark Attacker' },
  { dexId: 487, species: 'Origin Giratina', baseName: 'giratina', tier: 'A', role: 'Ghost', edps: 26.0, dps: 24.8, partyPower: 'ELITE', fastMove: 'Shadow Claw', chargedMoves: ['Shadow Force', 'Shadow Ball'], isLegacyMove: true, notes: 'Tanky Ghost Raid Anchor' },
  { dexId: 716, species: 'Xerneas', baseName: 'xerneas', tier: 'A', role: 'Fairy', edps: 25.8, dps: 25.0, partyPower: 'ELITE', fastMove: 'Geomancy', chargedMoves: ['Moonblast'], isLegacyMove: true, notes: 'Top Fairy Legendary' },
  { dexId: 717, species: 'Yveltal', baseName: 'yveltal', tier: 'A', role: 'Flying / Dark', edps: 25.6, dps: 24.8, partyPower: 'HIGH', fastMove: 'Gust / Snarl', chargedMoves: ['Oblivion Wing', 'Dark Pulse'], isLegacyMove: true, notes: 'Top Flying/Dark Legendary' },
  { dexId: 812, species: 'G-Max / Rillaboom', baseName: 'rillaboom', tier: 'A', role: 'Grass', edps: 25.2, dps: 24.8, partyPower: 'HIGH', fastMove: 'Scratch / Razor Leaf', chargedMoves: ['Frenzy Plant', 'Grass Knot'], isLegacyMove: true, notes: 'Top Grass Dynamax/G-Max' },
  { dexId: 815, species: 'G-Max / Cinderace', baseName: 'cinderace', tier: 'A', role: 'Fire', edps: 25.0, dps: 25.5, partyPower: 'ELITE', fastMove: 'Fire Spin', chargedMoves: ['Blast Burn', 'Flame Charge'], isLegacyMove: true, notes: 'Top Fire Dynamax/G-Max' },
  { dexId: 818, species: 'G-Max / Inteleon', baseName: 'inteleon', tier: 'A', role: 'Water', edps: 25.4, dps: 26.8, partyPower: 'HIGH', fastMove: 'Water Gun', chargedMoves: ['Hydro Cannon', 'Surf'], isLegacyMove: true, notes: 'Top Water Dynamax/G-Max' },
  { dexId: 888, species: 'Zacian', baseName: 'zacian', tier: 'A', role: 'Fairy', edps: 25.5, dps: 25.2, partyPower: 'ELITE', fastMove: 'Metal Claw / Quick Attack', chargedMoves: ['Play Rough', 'Wild Charge'], isLegacyMove: false, notes: 'ML & Raid Hybrid' },
  { dexId: 242, species: 'Blissey (Gym Tank & D-Max Healer)', baseName: 'blissey', tier: 'A', role: 'Gym / Max Healer', edps: 15.0, dps: 14.0, partyPower: 'STANDARD', fastMove: 'Pound', chargedMoves: ['Dazzling Gleam', 'Psychic'], isLegacyMove: false, notes: '#1 Gym Defender & Max Spirit Tank' },
];

function buildNameToIdMap(pokedex) {
  const map = new Map();
  pokedex.forEach((p) => {
    const clean = p.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    map.set(clean, p.id);
    // Also index base token before hyphen (e.g. "deoxys-normal" -> "deoxys", "giratina-altered" -> "giratina")
    const base = p.name.toLowerCase().split('-')[0].replace(/[^a-z0-9]/g, '');
    if (!map.has(base)) {
      map.set(base, p.id);
    }
  });

  // Explicit overrides for PvPoke speciesId edge cases
  const manualOverrides = {
    nidoranfemale: 29,
    nidoranf: 29,
    nidoranmale: 32,
    nidoranm: 32,
    farfetchd: 83,
    sirfetchd: 865,
    mrmime: 122,
    mrrime: 866,
    mimejr: 439,
    hooh: 250,
    porygonz: 474,
    porygon2: 233,
    jangmoo: 782,
    hakamoo: 783,
    kommoo: 784,
    tapukoko: 785,
    tapulele: 786,
    tapubulu: 787,
    tapufini: 788,
    typenull: 772,
    flabebe: 669,
    tinglu: 1003,
    chienpao: 1002,
    wochien: 1001,
    chiyu: 1004,
  };
  Object.entries(manualOverrides).forEach(([k, v]) => map.set(k, v));
  return map;
}

function resolveDexId(speciesId, speciesName, nameMap) {
  const raw = (speciesId || speciesName || '').toLowerCase();
  // Strip shadow, xl, mega, alolan, galarian, hisuian, paldean, origin, altered, therian, incarnate, complete, dusk, dawn, etc.
  const stripped = raw
    .replace(/_shadow$/i, '')
    .replace(/_xl$/i, '')
    .split('_')[0]
    .replace(/[^a-z0-9]/g, '');

  if (nameMap.has(stripped)) {
    return nameMap.get(stripped);
  }

  const fullClean = raw
    .replace(/shadow/g, '')
    .replace(/alolan|galarian|hisuian|paldean|origin|altered|therian|incarnate|complete|hero|crowned|dusk|dawn|mane|wings|standard|zen|ordinary|resolute|aria|pirouette|burn|chill|douse|shock|wash|heat|frost|fan|mow|plant|sandy|trash|sunny|rainy|snowy|attack|defense|speed|black|white|female|male|large|small|super|average|50|10|apex/g, '')
    .replace(/[^a-z0-9]/g, '');

  if (nameMap.has(fullClean)) {
    return nameMap.get(fullClean);
  }

  for (const [k, id] of nameMap.entries()) {
    if (k.length >= 4 && (raw.startsWith(k) || fullClean.startsWith(k))) {
      return id;
    }
  }
  return null;
}

function formatMoveName(moveSlug) {
  if (!moveSlug) return '';
  return moveSlug
    .toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

async function main() {
  const pokedexPath = path.join(__dirname, '../src/data/pokedex.json');
  const pokedex = JSON.parse(fs.readFileSync(pokedexPath, 'utf-8'));
  const nameMap = buildNameToIdMap(pokedex);

  const leagues = {};
  const allPvpDexIds = new Set();
  const allPvpFamilyIds = new Set();

  for (const [leagueKey, url] of Object.entries(PVPOKE_URLS)) {
    console.log(`Fetching PvPoke Top 100 for ${leagueKey} from ${url}...`);
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} fetching ${url}`);
    }
    const data = await res.json();

    // Collect top 100 unique species (or top 120 raw entries to ensure 100 unique dex/form entries)
    const topEntries = [];
    const leagueDexIds = new Set();
    const leagueFamilyIds = new Set();

    for (let i = 0; i < data.length && topEntries.length < 100; i++) {
      const item = data[i];
      const dexId = resolveDexId(item.speciesId, item.speciesName, nameMap);
      if (!dexId) continue;

      const familyIds = getFamilyIds(dexId);
      leagueDexIds.add(dexId);
      allPvpDexIds.add(dexId);
      familyIds.forEach((fid) => {
        leagueFamilyIds.add(fid);
        allPvpFamilyIds.add(fid);
      });

      const moveset = item.moveset || [];
      const fastMove = moveset[0] ? formatMoveName(moveset[0]) : '';
      const chargedMoves = moveset.slice(1).map(formatMoveName);

      topEntries.push({
        rank: topEntries.length + 1,
        speciesId: item.speciesId,
        speciesName: item.speciesName || item.speciesId.replace(/_/g, ' '),
        dexId,
        familyIds,
        score: item.score || 0,
        fastMove,
        chargedMoves,
        isShadow: item.speciesId.includes('_shadow'),
      });
    }

    leagues[leagueKey] = {
      entries: topEntries,
      dexIds: Array.from(leagueDexIds).sort((a, b) => a - b),
      familyIds: Array.from(leagueFamilyIds).sort((a, b) => a - b),
    };
    console.log(` -> ${leagueKey}: ${topEntries.length} ranked entries (${leagueDexIds.size} base species, ${leagueFamilyIds.size} family IDs)`);
  }

  // Build PvE DialgaDex summary & expand family IDs
  const pveDexIds = new Set();
  const pveFamilyIds = new Set();
  const pveEntries = DIALGADEX_PVE_DATABASE.map((entry, idx) => {
    const familyIds = getFamilyIds(entry.dexId);
    pveDexIds.add(entry.dexId);
    familyIds.forEach((fid) => pveFamilyIds.add(fid));
    return {
      rank: idx + 1,
      ...entry,
      familyIds,
    };
  });

  // Combined Protected Meta Family IDs (GL Top 100 + UL Top 100 + ML Top 100 + DialgaDex PvE)
  const combinedMetaFamilyIds = new Set([...allPvpFamilyIds, ...pveFamilyIds]);

  const output = {
    lastUpdated: new Date().toISOString(),
    source: {
      pvp: 'PvPoke (raw.githubusercontent.com/pvpoke/pvpoke - Top 100 GL/UL/ML)',
      pve: 'DialgaDex eDPS / DPS Raid Meta Benchmarks',
    },
    pvp: leagues,
    pve: {
      entries: pveEntries,
      dexIds: Array.from(pveDexIds).sort((a, b) => a - b),
      familyIds: Array.from(pveFamilyIds).sort((a, b) => a - b),
    },
    combinedMetaFamilyIds: Array.from(combinedMetaFamilyIds).sort((a, b) => a - b),
  };

  const outPath = path.join(__dirname, '../src/data/meta_cache.json');
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log(`Saved complete PvPoke + DialgaDex cache to ${outPath}`);
  console.log(`Total Protected Meta Family IDs (GL + UL + ML + PvE): ${output.combinedMetaFamilyIds.length} / ${pokedex.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
