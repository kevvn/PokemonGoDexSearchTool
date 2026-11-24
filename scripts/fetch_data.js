import fs from 'fs';
import path from 'path';
import process from 'node:process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const POKEMON_GO_API_URL = 'https://pokemon-go-api.github.io/pokemon-go-api/api/pokedex.json';
export const EXPECTED_POKEDEX_COUNT = 1025;

export const REGIONS = [
  { name: 'Kanto', start: 1, end: 151 },
  { name: 'Johto', start: 152, end: 251 },
  { name: 'Hoenn', start: 252, end: 386 },
  { name: 'Sinnoh', start: 387, end: 493 },
  { name: 'Unova', start: 494, end: 649 },
  { name: 'Kalos', start: 650, end: 721 },
  { name: 'Alola', start: 722, end: 809 },
  { name: 'Galar', start: 810, end: 898 },
  { name: 'Hisui', start: 899, end: 905 },
  { name: 'Paldea', start: 906, end: 1025 },
];

export const VALID_REGION_NAMES = new Set(REGIONS.map((r) => r.name));
export const VALID_CLASSES = new Set(['standard', 'legendary', 'mythical', 'ultrabeast']);
export const VALID_TYPES = new Set([
  'bug', 'dark', 'dragon', 'electric', 'fairy', 'fighting',
  'fire', 'flying', 'ghost', 'grass', 'ground', 'ice',
  'normal', 'poison', 'psychic', 'rock', 'steel', 'water',
]);

// Canonical cross-gen evolution edges that may be absent from in-game evolutions[]
// (e.g., raid-only Hisuian evolutions or not-yet-wired Paldean/Gen 9 evolutions)
export const SUPPLEMENTAL_EVOLUTION_EDGES = [
  [550, 902], // Basculin -> Basculegion
  [123, 900], // Scyther -> Kleavor
  [234, 899], // Stantler -> Wyrdeer
  [203, 981], // Girafarig -> Farigiraf
  [884, 1018], // Duraludon -> Archaludon
];

export const BASCULEGION_FALLBACK = {
  id: 'BASCULEGION',
  dexNr: 902,
  names: { English: 'Basculegion' },
  primaryType: { names: { English: 'Water' } },
  secondaryType: { names: { English: 'Ghost' } },
  pokemonClass: null,
  stats: { attack: 217, defense: 144, stamina: 260 },
  evolutions: [],
  hasMegaEvolution: false,
  hasGigantamaxEvolution: false,
  regionForms: {},
};

export function getRegion(id) {
  const region = REGIONS.find((r) => id >= r.start && id <= r.end);
  return region ? region.name : 'Unknown';
}

export function getSpriteUrl(id) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
}

export function normalizePokemonClass(rawClass) {
  switch (rawClass) {
    case 'POKEMON_CLASS_LEGENDARY':
      return 'legendary';
    case 'POKEMON_CLASS_MYTHIC':
    case 'POKEMON_CLASS_MYTHICAL':
      return 'mythical';
    case 'POKEMON_CLASS_ULTRA_BEAST':
      return 'ultrabeast';
    default:
      return 'standard';
  }
}

export function extractRegionalForms(rawEntry) {
  const forms = new Set();
  const regionFormsObj = rawEntry?.regionForms || {};
  for (const key of Object.keys(regionFormsObj)) {
    const upper = key.toUpperCase();
    if (upper.includes('_ALOLA')) forms.add('alola');
    if (upper.includes('_GALAR')) forms.add('galar');
    if (upper.includes('_HISUI')) forms.add('hisui');
    if (upper.includes('_PALDEA')) forms.add('paldea');
  }
  return [...forms].sort();
}

export function extractEvolveCandy(rawEntry) {
  const candidates = [];
  const collect = (evos) => {
    if (!Array.isArray(evos)) return;
    for (const evo of evos) {
      if (typeof evo?.candies === 'number' && evo.candies > 0) {
        candidates.push(evo.candies);
      }
    }
  };
  collect(rawEntry?.evolutions);
  if (candidates.length === 0 && rawEntry?.regionForms) {
    for (const rf of Object.values(rawEntry.regionForms)) {
      collect(rf?.evolutions);
    }
  }
  return candidates.length > 0 ? Math.min(...candidates) : null;
}

export async function fetchWithRetry(url, options = {}) {
  const {
    retries = 4,
    baseDelayMs = 1000,
    timeoutMs = 15000,
    headers = { 'User-Agent': 'PokemonGoDexSearchTool/1.0 (build-time snapshot)' },
    fetchImpl = fetch,
  } = options;

  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = typeof AbortController !== 'undefined' && timeoutMs > 0 ? new AbortController() : null;
    const timeoutId = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
    try {
      const response = await fetchImpl(url, { headers, signal: controller?.signal });
      if (response.ok) {
        return response;
      }
      const retryable = response.status === 429 || response.status >= 500;
      lastError = new Error(`HTTP ${response.status} ${response.statusText} for ${url}`);
      if (!retryable || attempt === retries) {
        throw lastError;
      }
    } catch (err) {
      lastError = err;
      if (attempt === retries) {
        throw lastError;
      }
    } finally {
      if (timeoutId !== null) clearTimeout(timeoutId);
    }
    const delayMs = baseDelayMs * Math.pow(2, attempt);
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  throw lastError;
}

export function computeFamilies(rawEntries, supplementalEdges = SUPPLEMENTAL_EVOLUTION_EDGES) {
  const idToDex = new Map();
  const allDexes = new Set();

  for (const entry of rawEntries) {
    if (typeof entry?.dexNr === 'number' && entry.dexNr >= 1 && entry.dexNr <= EXPECTED_POKEDEX_COUNT) {
      allDexes.add(entry.dexNr);
      if (entry.id) {
        idToDex.set(entry.id.toUpperCase(), entry.dexNr);
      }
    }
  }

  // Disjoint Set Union (Union-Find)
  const parent = new Map();
  for (const dex of allDexes) parent.set(dex, dex);

  const find = (x) => {
    let root = x;
    while (parent.get(root) !== root) {
      root = parent.get(root);
    }
    let curr = x;
    while (curr !== root) {
      const next = parent.get(curr);
      parent.set(curr, root);
      curr = next;
    }
    return root;
  };

  const union = (a, b) => {
    if (!parent.has(a) || !parent.has(b)) return;
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) {
      if (ra < rb) parent.set(rb, ra);
      else parent.set(ra, rb);
    }
  };

  const linkEvolutions = (sourceDex, evolutions) => {
    if (!Array.isArray(evolutions)) return;
    for (const evo of evolutions) {
      const targetId = evo?.id?.toUpperCase();
      if (targetId && idToDex.has(targetId)) {
        union(sourceDex, idToDex.get(targetId));
      }
    }
  };

  for (const entry of rawEntries) {
    if (typeof entry?.dexNr !== 'number' || !allDexes.has(entry.dexNr)) continue;
    linkEvolutions(entry.dexNr, entry.evolutions);
    if (entry.regionForms && typeof entry.regionForms === 'object') {
      for (const rf of Object.values(entry.regionForms)) {
        linkEvolutions(entry.dexNr, rf?.evolutions);
      }
    }
  }

  for (const [a, b] of supplementalEdges) {
    union(a, b);
  }

  const groups = new Map();
  for (const dex of allDexes) {
    const root = find(dex);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root).push(dex);
  }

  const familyByDex = new Map();
  for (const members of groups.values()) {
    members.sort((a, b) => a - b);
    const familyId = members[0];
    for (const dex of members) {
      familyByDex.set(dex, { familyId, familyDexes: [...members] });
    }
  }

  return familyByDex;
}

export function transformPokedexData(rawData) {
  if (!Array.isArray(rawData)) {
    throw new Error('Upstream pokedex payload is not an array');
  }

  // Deduplicate by dexNr within 1..1025
  const byDex = new Map();
  for (const entry of rawData) {
    const dex = Number(entry?.dexNr);
    if (Number.isInteger(dex) && dex >= 1 && dex <= EXPECTED_POKEDEX_COUNT && !byDex.has(dex)) {
      byDex.set(dex, entry);
    }
  }

  // Patch missing #902 Basculegion cleanly
  if (!byDex.has(902)) {
    byDex.set(902, BASCULEGION_FALLBACK);
  }

  const normalizedRaw = [...byDex.values()].sort((a, b) => a.dexNr - b.dexNr);
  const familyMap = computeFamilies(normalizedRaw);

  return normalizedRaw.map((entry) => {
    const id = entry.dexNr;
    const primary = entry.primaryType?.names?.English?.toLowerCase();
    const secondary = entry.secondaryType?.names?.English?.toLowerCase();
    const types = [primary, secondary].filter((t) => Boolean(t) && VALID_TYPES.has(t));
    const uniqueTypes = [...new Set(types)];

    const family = familyMap.get(id) || { familyId: id, familyDexes: [id] };
    const atk = Number(entry.stats?.attack ?? 0);
    const def = Number(entry.stats?.defense ?? 0);
    const sta = Number(entry.stats?.stamina ?? 0);

    return {
      id,
      name: entry.names?.English || entry.id || `Pokemon #${id}`,
      types: uniqueTypes,
      region: getRegion(id),
      familyId: family.familyId,
      familyDexes: family.familyDexes,
      pokemonClass: normalizePokemonClass(entry.pokemonClass),
      stats: { atk, def, sta },
      evolveCandy: extractEvolveCandy(entry),
      hasMega: Boolean(entry.hasMegaEvolution),
      hasGmax: Boolean(entry.hasGigantamaxEvolution),
      regionalForms: extractRegionalForms(entry),
      sprite: getSpriteUrl(id),
    };
  });
}

export function validatePokedex(pokedex) {
  const errors = [];
  if (!Array.isArray(pokedex)) {
    return { valid: false, errors: ['Pokedex must be an array'] };
  }
  if (pokedex.length !== EXPECTED_POKEDEX_COUNT) {
    errors.push(`Expected ${EXPECTED_POKEDEX_COUNT} entries, got ${pokedex.length}`);
  }

  for (let i = 0; i < pokedex.length; i++) {
    const p = pokedex[i];
    const expectedId = i + 1;
    if (!p || typeof p !== 'object') {
      errors.push(`Entry at index ${i} is not an object`);
      continue;
    }
    if (p.id !== expectedId) {
      errors.push(`Non-contiguous ID at index ${i}: expected ${expectedId}, got ${p.id}`);
      if (errors.length > 20) break;
    }
    if (typeof p.name !== 'string' || p.name.trim().length === 0) {
      errors.push(`Invalid name for #${p.id}`);
    }
    if (!Array.isArray(p.types) || p.types.length < 1 || p.types.length > 2 || !p.types.every((t) => VALID_TYPES.has(t))) {
      errors.push(`Invalid types for #${p.id}: ${JSON.stringify(p.types)}`);
    }
    if (!VALID_REGION_NAMES.has(p.region)) {
      errors.push(`Invalid region for #${p.id}: ${p.region}`);
    }
    if (!Number.isInteger(p.familyId) || !Array.isArray(p.familyDexes) || !p.familyDexes.includes(p.id) || p.familyDexes[0] !== p.familyId) {
      errors.push(`Invalid family metadata for #${p.id}`);
    }
    if (!VALID_CLASSES.has(p.pokemonClass)) {
      errors.push(`Invalid pokemonClass for #${p.id}: ${p.pokemonClass}`);
    }
    if (
      !p.stats ||
      !Number.isInteger(p.stats.atk) || p.stats.atk <= 0 ||
      !Number.isInteger(p.stats.def) || p.stats.def <= 0 ||
      !Number.isInteger(p.stats.sta) || p.stats.sta <= 0
    ) {
      errors.push(`Invalid stats for #${p.id}: ${JSON.stringify(p.stats)}`);
    }
    if (p.evolveCandy !== null && (!Number.isInteger(p.evolveCandy) || p.evolveCandy <= 0)) {
      errors.push(`Invalid evolveCandy for #${p.id}: ${p.evolveCandy}`);
    }
    if (typeof p.hasMega !== 'boolean' || typeof p.hasGmax !== 'boolean') {
      errors.push(`Invalid Mega/Gmax flags for #${p.id}`);
    }
    if (!Array.isArray(p.regionalForms)) {
      errors.push(`Invalid regionalForms for #${p.id}`);
    }
    if (p.sprite !== getSpriteUrl(p.id)) {
      errors.push(`Invalid sprite URL for #${p.id}: ${p.sprite}`);
    }
    if (errors.length > 25) break;
  }

  // Domain sanity assertions
  if (pokedex.length === EXPECTED_POKEDEX_COUNT) {
    const pikachu = pokedex[24];
    const eevee = pokedex[132];
    const basculegion = pokedex[901];
    if (JSON.stringify(pikachu.familyDexes) !== JSON.stringify([25, 26, 172])) {
      errors.push(`Pikachu family mismatch: ${JSON.stringify(pikachu.familyDexes)}`);
    }
    if (JSON.stringify(eevee.familyDexes) !== JSON.stringify([133, 134, 135, 136, 196, 197, 470, 471, 700])) {
      errors.push(`Eevee family mismatch: ${JSON.stringify(eevee.familyDexes)}`);
    }
    if (basculegion.name !== 'Basculegion' || basculegion.region !== 'Hisui') {
      errors.push(`Basculegion #902 sanity failed: ${JSON.stringify(basculegion)}`);
    }
  }

  return { valid: errors.length === 0, errors };
}

export function writeJsonAtomically(outputPath, data, validator) {
  if (validator) {
    const { valid, errors } = validator(data);
    if (!valid) {
      throw new Error(`Validation failed before writing ${outputPath}:\n- ${errors.join('\n- ')}`);
    }
  }
  const serialized = JSON.stringify(data, null, 2) + '\n';
  const dir = path.dirname(outputPath);
  fs.mkdirSync(dir, { recursive: true });
  const tmpPath = `${outputPath}.tmp.${process.pid}.${Date.now()}`;
  try {
    fs.writeFileSync(tmpPath, serialized, 'utf8');
    fs.renameSync(tmpPath, outputPath);
  } catch (err) {
    if (fs.existsSync(tmpPath)) {
      try { fs.unlinkSync(tmpPath); } catch { /* ignore cleanup error */ }
    }
    throw err;
  }
}

export async function fetchData(outputPath = path.join(__dirname, '../src/data/pokedex.json')) {
  console.log(`Fetching Pokédex data from ${POKEMON_GO_API_URL}...`);
  const response = await fetchWithRetry(POKEMON_GO_API_URL);
  const rawData = await response.json();
  const pokedex = transformPokedexData(rawData);

  writeJsonAtomically(outputPath, pokedex, validatePokedex);

  const bytes = fs.statSync(outputPath).size;
  const hisuiCount = pokedex.filter((p) => p.region === 'Hisui').length;
  const megaCount = pokedex.filter((p) => p.hasMega).length;
  const gmaxCount = pokedex.filter((p) => p.hasGmax).length;
  console.log(
    `Saved ${pokedex.length} Pokémon to ${outputPath} (${(bytes / 1024).toFixed(1)} KB; Hisui=${hisuiCount}, Mega=${megaCount}, Gmax=${gmaxCount})`
  );
  return pokedex;
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  fetchData().catch((err) => {
    console.error('Fatal error updating pokedex.json (existing file preserved):', err);
    process.exit(1);
  });
}
