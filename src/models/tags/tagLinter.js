/**
 * Tag name validation, collision linting, and namespace prefix/hash helpers.
 */
import { NATIVE_POGO_KEYWORDS } from '../searchEngine';
import {
  TAG_NAMESPACES,
  TAG_COLOR_LABELS,
  ALL_TAG_DEFINITIONS,
} from './tagDefinitions';

export { NATIVE_POGO_KEYWORDS };

export const SHORTCUT_KEYWORDS = ['mega', 'count', 'dynamax', 'gigantamax'];
export const FORBIDDEN_TAG_CHAR_REGEX = /[&|,;:!@#<>=+]/;

export function createDefaultTagMap() {
  const map = {};
  for (const def of ALL_TAG_DEFINITIONS) {
    map[def.id] = {
      name: def.defaultName,
      enabled: !def.optional,
    };
  }
  return map;
}

export function mergeTagMap(savedMap) {
  const base = createDefaultTagMap();
  if (!savedMap || typeof savedMap !== 'object') return base;

  for (const def of ALL_TAG_DEFINITIONS) {
    const entry = savedMap[def.id];
    if (entry && typeof entry === 'object') {
      base[def.id] = {
        name: typeof entry.name === 'string' ? entry.name : def.defaultName,
        enabled: typeof entry.enabled === 'boolean' ? entry.enabled : !def.optional,
      };
    }
  }
  return base;
}

export function resolveTagsList(tagMap) {
  const merged = mergeTagMap(tagMap);
  return ALL_TAG_DEFINITIONS.map((def) => ({
    ...def,
    name: merged[def.id]?.name ?? def.defaultName,
    enabled: merged[def.id]?.enabled ?? !def.optional,
  }));
}

export function lintTagName(name, otherNames = []) {
  const errors = [];
  const warnings = [];

  if (typeof name !== 'string' || name.trim().length === 0) {
    errors.push({
      code: 'EMPTY_NAME',
      message: 'Tag name cannot be empty.',
    });
    return { valid: false, errors, warnings };
  }

  if (name !== name.trim()) {
    errors.push({
      code: 'EDGE_WHITESPACE',
      message: 'Remove leading or trailing spaces (mobile autocorrect trailing spaces break #tag searches).',
    });
  }

  const trimmed = name.trim();
  const lower = trimmed.toLowerCase();

  if (FORBIDDEN_TAG_CHAR_REGEX.test(trimmed)) {
    const match = trimmed.match(FORBIDDEN_TAG_CHAR_REGEX)?.[0] || '';
    errors.push({
      code: 'FORBIDDEN_CHAR',
      message: `Character "${match}" is a Pokémon GO search operator and cannot be used in tag names. (Internal hyphens "-" are safe.)`,
    });
  }

  if (NATIVE_POGO_KEYWORDS.has(lower)) {
    errors.push({
      code: 'NATIVE_KEYWORD_COLLISION',
      message: `"${trimmed}" collides with a native Pokémon GO search keyword and will hijack/break built-in searches.`,
    });
  }

  if (/^\d+(?:-\d+)?$/.test(lower)) {
    errors.push({
      code: 'NUMERIC_DEX_COLLISION',
      message: `"${trimmed}" is purely numeric and collides with National Pokédex ID searches (e.g., searching "${trimmed}" matches Dex #${trimmed}).`,
    });
  }

  if (
    /^(?:mega|count|dynamax|gigantamax|maxmove|maxguard|maxspirit|age|year|distance|cp|hp|buddy|candykm|countcandy|countcandyxl)\d/.test(
      lower
    ) ||
    /^[0-4](?:-[0-4])?(?:attack|defense|hp)$/.test(lower)
  ) {
    errors.push({
      code: 'NATIVE_KEYWORD_COLLISION',
      message: `"${trimmed}" collides with a native Pokémon GO range search phrase.`,
    });
  }

  if (trimmed.startsWith('-')) {
    warnings.push({
      code: 'LEADING_HYPHEN',
      message: 'Avoid starting a tag name with "-" (internal hyphens like "PVP-GL" are safe).',
    });
  }

  if (/\s/.test(trimmed)) {
    warnings.push({
      code: 'INTERNAL_WHITESPACE',
      message: 'Spaces inside tag names are harder to type quickly on mobile; consider using "-" instead.',
    });
  }

  if (/^[^\x20-\x7E]/.test(trimmed)) {
    warnings.push({
      code: 'LEADING_EMOJI',
      message: 'Putting emojis or non-ASCII symbols at the start slows down #tag typing; put icons at the end instead.',
    });
  }

  for (const shortcut of SHORTCUT_KEYWORDS) {
    if (lower !== shortcut && lower.startsWith(shortcut) && !lower.startsWith(`${shortcut}-`)) {
      warnings.push({
        code: 'SHORTCUT_PREFIX_COLLISION',
        message: `Tag starts with Pokémon GO shortcut "${shortcut}" — always query with "#" prefix to avoid shortcut coercion.`,
      });
      break;
    }
  }

  for (const peerRaw of otherNames) {
    if (typeof peerRaw !== 'string') continue;
    const peerTrimmed = peerRaw.trim();
    if (!peerTrimmed) continue;
    const peerLower = peerTrimmed.toLowerCase();

    if (peerLower === lower) {
      errors.push({
        code: 'DUPLICATE_TAG',
        message: `Duplicate tag name "${trimmed}" (tag search is case-insensitive).`,
      });
      break;
    }

    if (peerLower.startsWith(lower)) {
      warnings.push({
        code: 'PREFIX_OVERLAP',
        message: `Searching "#${lower}" will also match "${peerTrimmed}" because Pokémon GO prefix-matches tags.`,
      });
    } else if (lower.startsWith(peerLower)) {
      warnings.push({
        code: 'PREFIX_OVERLAP',
        message: `Searching "#${peerLower}" will also match "${trimmed}" because Pokémon GO prefix-matches tags.`,
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export function lintTagMap(tagMap) {
  const merged = mergeTagMap(tagMap);
  const byId = {};
  let errorCount = 0;
  let warningCount = 0;

  const enabledEntries = ALL_TAG_DEFINITIONS
    .filter((def) => merged[def.id]?.enabled)
    .map((def) => ({ id: def.id, name: merged[def.id].name }));

  for (const def of ALL_TAG_DEFINITIONS) {
    const entry = merged[def.id];
    if (!entry.enabled) {
      byId[def.id] = { valid: true, errors: [], warnings: [] };
      continue;
    }
    const peers = enabledEntries
      .filter((e) => e.id !== def.id)
      .map((e) => e.name);
    const result = lintTagName(entry.name, peers);
    byId[def.id] = result;
    errorCount += result.errors.length;
    warningCount += result.warnings.length;
  }

  return {
    valid: errorCount === 0,
    byId,
    errorCount,
    warningCount,
  };
}

export function getTagHash(tagId, tagMap) {
  const merged = tagMap ? mergeTagMap(tagMap) : createDefaultTagMap();
  const entry = merged[tagId];
  if (!entry || !entry.enabled) return '';
  const name = (entry.name || '').trim().toLowerCase();
  return name ? `#${name}` : '';
}

/**
 * Returns namespace umbrella hash(es). Keeps the trailing hyphen (`#ev-`, `#tr-`, `#op-`,
 * `#pvp-`, `#pve-`, `#max-`, `#keep-`) so external user tags like "Trash", "Trade", "Evolve",
 * or "Open" are NEVER accidentally matched or excluded by Pokémon GO prefix matching.
 */
export function getNamespaceHashes(namespaceId, tagMap) {
  const merged = tagMap ? mergeTagMap(tagMap) : createDefaultTagMap();
  const nsDefs = ALL_TAG_DEFINITIONS.filter((d) => d.namespace === namespaceId && merged[d.id]?.enabled);
  const nsNames = nsDefs.map((d) => (merged[d.id].name || '').trim().toLowerCase()).filter(Boolean);

  if (nsNames.length === 0) return [];
  if (nsNames.length === 1) return [`#${nsNames[0]}`];

  const nsMeta = TAG_NAMESPACES.find((n) => n.id === namespaceId);
  const defaultPrefix = nsMeta ? nsMeta.defaultPrefix.toLowerCase() : '';

  if (defaultPrefix && nsNames.every((n) => n.startsWith(defaultPrefix))) {
    const outsideCollision = ALL_TAG_DEFINITIONS.some((d) => {
      if (d.namespace === namespaceId || !merged[d.id]?.enabled) return false;
      const otherName = (merged[d.id].name || '').trim().toLowerCase();
      return otherName.startsWith(defaultPrefix);
    });
    if (!outsideCollision) {
      return [`#${defaultPrefix}`];
    }
  }

  return nsNames.map((n) => `#${n}`);
}

export function getNamespaceExclusions(namespaceId, tagMap) {
  return getNamespaceHashes(namespaceId, tagMap).map((h) => `!${h}`);
}

export function getRecommendedDragOrder(tagMap) {
  const merged = mergeTagMap(tagMap);
  return [...ALL_TAG_DEFINITIONS]
    .sort((a, b) => a.dragOrder - b.dragOrder)
    .map((def) => ({
      ...def,
      name: merged[def.id].name,
      enabled: merged[def.id].enabled,
    }));
}

export function formatTagSetupListText(tagMap) {
  const ordered = getRecommendedDragOrder(tagMap).filter((t) => t.enabled);
  const lines = [
    'Pokémon GO Tag Setup List (Recommended Drag-and-Drop Order)',
    '===========================================================',
    ...ordered.map((tag, idx) => {
      const swatch = TAG_COLOR_LABELS[tag.color] || tag.color;
      const hash = getTagHash(tag.id, tagMap) || `#${tag.name.toLowerCase()}`;
      return `${String(idx + 1).padStart(2, '0')}. ${tag.name}  [${swatch}]  (${hash}) — ${tag.purpose}`;
    }),
  ];
  return lines.join('\n');
}
