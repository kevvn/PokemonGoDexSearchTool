/**
 * Trade Demand Tiers, Remote Trade Showcase (2026 Forever Friends),
 * and Anti-Hoarding Trade Audit pure domain model.
 */
import {
  GUARANTEED_LUCKY_CUTOFF_YEAR,
  GUARANTEED_LUCKY_LIMIT,
  GUARANTEED_LUCKY_YEAR_RANGE,
  REMOTE_TRADE_ELIGIBILITY_GUARDS,
  SCARCE_RARE_SPECIES_IDS,
  TRADEABLE_MYTHICAL_IDS,
  TRADE_ELIGIBILITY_GUARDS,
  TRADE_TIER_A_LUCKY_TARGET_IDS,
  TRADE_TIER_S_SPECIES_IDS,
  UNTRADEABLE_NON_MYTHICAL_IDS,
} from '../../data/speciesConstants';
import { ALL_COMMUNITY_DAY_PRE_EVO_IDS } from '../communityDayModel';
import { getTodayPlainDateString } from '../events/eventAgeUtils';
import {
  compressIds,
  joinClauses,
  negateCompressedRanges,
} from '../searchEngine';
import {
  createDefaultTagMap,
  getTagHash,
  mergeTagMap,
} from '../tagModel';
import {
  buildSafeTrashQuery,
  createDefaultSafetyShields,
} from '../triageFunnelModel';

export { TRADE_ELIGIBILITY_GUARDS, REMOTE_TRADE_ELIGIBILITY_GUARDS };

export const DEFAULT_DUPLICATE_CAP = 4;
export const DUPLICATE_CAP_OPTIONS = [3, 4, 5, 6];

const EMPTY_SPECIES_IDS = [];
const UNTRADEABLE_NON_MYTHICAL_SET = new Set(UNTRADEABLE_NON_MYTHICAL_IDS);
const TRADEABLE_MYTHICAL_RANGE = compressIds(TRADEABLE_MYTHICAL_IDS); // "808-809"
const LOCAL_MYTHICAL_GUARD = `!mythical,${TRADEABLE_MYTHICAL_RANGE}`;
const KANTO_BIRD_GUARD = '!144-146,galar,shiny,background,dynamax';

export const REMOTE_TRADE_RULES = [
  { id: 'age', label: 'Caught 30+ days ago', token: 'age30-', detail: 'Catches from the last 30 days cannot be remote-traded.' },
  { id: 'untraded', label: 'Never traded before', token: '!traded', detail: 'Previously traded Pokémon are locked.' },
  { id: 'untradeable', label: 'No Shadows, Mythicals or Fusions', token: '!shadow&!mythical&!fusion', detail: 'Also revert Crowned Zacian/Zamazenta (Form Changes, not Fusions) before trading.' },
  { id: 'active', label: 'Not defending Gyms/Power Spots', token: '!defender', detail: 'Also unassign active Buddies and wait for active Mega timers to expire.' },
];

/**
 * Derives valid stale-hoard upper-bound years dynamically from `GUARANTEED_LUCKY_CUTOFF_YEAR + 1`
 * through `currentYear - 1` (zero hardcoded year arrays).
 */
export function getStaleYearOptions(refDateStr = getTodayPlainDateString()) {
  const parsedYear = Number(String(refDateStr || '').slice(0, 4));
  const currentYear = Number.isInteger(parsedYear) && parsedYear >= 2022 ? parsedYear : new Date().getFullYear();
  const startYear = GUARANTEED_LUCKY_CUTOFF_YEAR + 1;
  const endYear = Math.max(startYear, currentYear - 1);
  const years = [];
  for (let y = startYear; y <= endYear; y += 1) {
    years.push(y);
  }
  return years;
}

export function getDefaultStaleMaxYear(refDateStr = getTodayPlainDateString()) {
  const options = getStaleYearOptions(refDateStr);
  if (options.length <= 1) return options[0] ?? GUARANTEED_LUCKY_CUTOFF_YEAR + 1;
  return options[Math.max(0, options.length - 2)];
}

/**
 * Computes deduplicated Trade Demand Tier species lists dynamically from
 * canonical speciesConstants + active metaSnapshot + Community Day registry.
 * Automatically filters out untradeable 1-per-account species (#718 Zygarde, #890 Eternatus).
 */
export function getTradeTierSpecies(metaSnapshot = {}) {
  const pve = metaSnapshot?.pve || {};
  const pvp = metaSnapshot?.pvp || {};

  const tierS = Array.from(
    new Set(TRADE_TIER_S_SPECIES_IDS.filter((id) => !UNTRADEABLE_NON_MYTHICAL_SET.has(id)))
  ).sort((a, b) => a - b);
  const tierSSet = new Set(tierS);

  const tierARaw = [
    ...SCARCE_RARE_SPECIES_IDS,
    ...TRADE_TIER_A_LUCKY_TARGET_IDS,
    ...(Array.isArray(pve.top30Overall) ? pve.top30Overall : []),
    ...(Array.isArray(pvp.ml?.top100?.all) ? pvp.ml.top100.all : []),
  ];
  const tierA = Array.from(
    new Set(
      tierARaw.filter((id) => !tierSSet.has(id) && !UNTRADEABLE_NON_MYTHICAL_SET.has(id))
    )
  ).sort((a, b) => a - b);
  const tierProtectedSet = new Set([...tierS, ...tierA]);

  const tierB = Array.from(
    new Set(
      ALL_COMMUNITY_DAY_PRE_EVO_IDS.filter(
        (id) => !tierProtectedSet.has(id) && !UNTRADEABLE_NON_MYTHICAL_SET.has(id)
      )
    )
  ).sort((a, b) => a - b);

  return {
    tierS,
    tierA,
    tierB,
    tierSAndA: Array.from(tierProtectedSet).sort((a, b) => a - b),
  };
}

/**
 * Builds the 4-step Trade Hoard Audit & Anti-Hoarding Cleanup workflow.
 * All destructive cleanup queries route through `buildSafeTrashQuery`.
 */
export function buildTradeHoardAudit({
  tagMap: customTagMap = null,
  metaSnapshot = {},
  precomputedTiers = null,
  safetyShields = {},
  duplicateCap = DEFAULT_DUPLICATE_CAP,
  staleMaxYear = getDefaultStaleMaxYear(),
} = {}) {
  const tagMap = customTagMap ? mergeTagMap(customTagMap) : createDefaultTagMap();
  const shields = { ...createDefaultSafetyShields(), ...safetyShields };
  const cap = Math.max(2, Math.min(20, Number(duplicateCap) || DEFAULT_DUPLICATE_CAP));
  const safeStaleMax = Math.max(GUARANTEED_LUCKY_CUTOFF_YEAR + 1, Number(staleMaxYear) || getDefaultStaleMaxYear());
  const staleYearToken = `year${GUARANTEED_LUCKY_CUTOFF_YEAR + 1}-${safeStaleMax}`;

  const trSpecHash = getTagHash('tr_spec', tagMap) || '#tr-spec';
  const trMirrorHash = getTagHash('tr_mirror', tagMap) || '#tr-mirror';
  const trDistHash = getTagHash('tr_dist', tagMap) || '#tr-dist';
  const allTradeHashes = [trSpecHash, trMirrorHash, trDistHash].filter(Boolean).join(',');

  const tiers = precomputedTiers || getTradeTierSpecies(metaSnapshot);
  const tierSDex = compressIds(tiers.tierS);
  const tierADex = compressIds(tiers.tierA);
  const tierBDex = compressIds(tiers.tierB);
  const tierSAndADex = compressIds(tiers.tierSAndA);
  const tierSAndANegation = negateCompressedRanges(tierSAndADex);

  const deadTradeAudits = [
    {
      id: 'dead_traded_in_trade_tags',
      badge: 'Dead Trade Audit',
      title: 'Already-Traded Pokémon Stuck in Trade Tags',
      subtitle: `Pokémon can only be traded once. Remove trade tags or route bad rerolls to ${tagMap.op_2xxfer?.name || 'OP-2xXfer'}.`,
      query: `${allTradeHashes}&traded`,
      actionMode: 'select-all',
      isTrash: false,
      accent: 'rose',
      tagSuggestion: tagMap.op_2xxfer?.name || 'OP-2xXfer',
    },
    {
      id: 'dead_untradeable_in_trade_tags',
      badge: 'Dead Trade Audit',
      title: 'Untradeable Classes Stuck in Trade Tags',
      subtitle: 'Shadows, Fusions, Mythicals (excluding tradeable Meltan/Melmetal #808–809), Zygarde (#718) & Eternatus (#890) cannot be traded.',
      query: `${allTradeHashes}&shadow,fusion,mythical,${compressIds(UNTRADEABLE_NON_MYTHICAL_IDS)}&!${TRADEABLE_MYTHICAL_RANGE}`,
      actionMode: 'review',
      isTrash: false,
      accent: 'amber',
    },
  ];

  const demandTierCards = [
    {
      id: 'tier_s_grails',
      tier: 'Tier S',
      badge: 'Tier S · Universal Grails',
      title: 'Shiny Backgrounds, Location BGs, G-Max & Top Legends',
      subtitle: `Highest global trade liquidity (includes Shiny Special BGs & Galarian Birds while excluding plain Kanto Birds). Keep in ${tagMap.tr_spec?.name || 'TR-Spec'}.`,
      query: joinClauses(
        ...TRADE_ELIGIBILITY_GUARDS,
        LOCAL_MYTHICAL_GUARD,
        '!favorite',
        '!4*',
        `shiny,locationbackground,gigantamax,${tierSDex}`,
        `background,gigantamax,${tierSDex}`,
        KANTO_BIRD_GUARD
      ),
      speciesIds: tiers.tierS,
      actionMode: 'review',
      isTrash: false,
      accent: 'purple',
      tagSuggestion: tagMap.tr_spec?.name || 'TR-Spec',
    },
    {
      id: 'tier_s_guaranteed_lucky',
      tier: 'Tier S',
      badge: `Tier S · 2016–${GUARANTEED_LUCKY_CUTOFF_YEAR} Lucky`,
      title: `Guaranteed Lucky Trade Bait (Up to ${GUARANTEED_LUCKY_LIMIT})`,
      subtitle: `Catches from 2016–${GUARANTEED_LUCKY_CUTOFF_YEAR} guarantee Lucky trades until your ${GUARANTEED_LUCKY_LIMIT} cap. Never transfer without checking!`,
      query: joinClauses(
        GUARANTEED_LUCKY_YEAR_RANGE,
        ...TRADE_ELIGIBILITY_GUARDS,
        LOCAL_MYTHICAL_GUARD,
        '!favorite',
        '!4*'
      ),
      speciesIds: EMPTY_SPECIES_IDS,
      actionMode: 'review',
      isTrash: false,
      accent: 'amber',
      tagSuggestion: tagMap.tr_spec?.name || 'TR-Spec',
    },
    {
      id: 'tier_a_liquid',
      tier: 'Tier A',
      badge: 'Tier A · High-Demand Liquid',
      title: 'Regionals, Scarce Eggs & Top Lucky Trade Targets',
      subtitle: 'Strong local & remote demand (Larvesta, Dreepy, Tinkatink, Regionals, Cosmog, Kubfu, Ultra Beasts, Top ML/PvE Legends). Keep ~3–6 spares.',
      query: joinClauses(
        ...TRADE_ELIGIBILITY_GUARDS,
        LOCAL_MYTHICAL_GUARD,
        '!favorite',
        '!4*',
        tierADex
      ),
      speciesIds: tiers.tierA,
      actionMode: 'review',
      isTrash: false,
      accent: 'emerald',
      tagSuggestion: tagMap.tr_spec?.name || 'TR-Spec',
    },
    {
      id: 'tier_b_capped',
      tier: 'Tier B',
      badge: `Tier B · Cap < ${cap} Mirror / CD`,
      title: `Plain Community Day & Mirror Spares (count${cap}-)`,
      subtitle: 'Saturated in most communities. Excludes Shinies, Backgrounds & Costumes — Sort by # and keep only 2–3 spares.',
      query: joinClauses(
        ...TRADE_ELIGIBILITY_GUARDS,
        '!favorite',
        '!4*',
        '!shiny',
        '!background',
        '!costume',
        `count${cap}-`,
        tierBDex
      ),
      speciesIds: tiers.tierB,
      actionMode: 'review',
      isTrash: false,
      accent: 'teal',
      tagSuggestion: tagMap.tr_mirror?.name || 'TR-Mirror',
    },
  ];

  const duplicatePruners = [
    {
      id: 'prune_excess_shinies',
      badge: 'Sort by # · Variant-Safe',
      title: 'Common Shiny Surplus Review (Sort by #)',
      subtitle: 'Omits countN- so 1-of-1 shinies are never miscounted alongside normal copies. Sort by # — keep 2–3 trade spares per species.',
      query: joinClauses(
        'shiny',
        '!background',
        '!costume',
        '!legendary',
        '!mythical',
        '!ultrabeast',
        '!favorite',
        '!4*'
      ),
      actionMode: 'review',
      isTrash: false,
      accent: 'indigo',
    },
    {
      id: 'prune_excess_costumes',
      badge: 'Sort by # · Variant-Safe',
      title: 'Non-Shiny Costume Surplus Review (Sort by #)',
      subtitle: 'Omits countN- (all Pikachu hats share Dex #25). Sort by # so identical outfits group together — keep 1–2 favorites + 1–2 spares.',
      query: joinClauses(
        'costume',
        '!shiny',
        '!background',
        '!favorite',
        '!4*'
      ),
      actionMode: 'review',
      isTrash: false,
      accent: 'indigo',
    },
    {
      id: 'prune_excess_legends',
      badge: `Sort by # · count${cap}-`,
      title: `Excess Plain Raid Legendaries & UBs (count${cap}-)`,
      subtitle: `Plain non-shiny, non-BG, non-Shadow, non-Max, non-Fusion, non-Lucky copies only. Route low-IV excess to ${tagMap.op_2xxfer?.name || 'OP-2xXfer'}.`,
      query: joinClauses(
        `count${cap}-`,
        'legendary,ultrabeast',
        '!shiny',
        '!background',
        '!costume',
        '!shadow',
        '!maxmove1-',
        '!fusion',
        '!lucky',
        '!favorite',
        '!4*',
        '0*,1*,2*'
      ),
      actionMode: 'review',
      isTrash: false,
      accent: 'amber',
      tagSuggestion: tagMap.op_2xxfer?.name || 'OP-2xXfer',
    },
  ];

  // Deduplicate SCARCE_RARE_SPECIES_IDS: tierSAndANegation already covers every scarce/regional ID
  const dedupedShields = shields.rareSpecies
    ? { ...shields, rareSpecies: false }
    : shields;

  const staleHoardTrashQuery = buildSafeTrashQuery({
    ageScope: '',
    starScope: '0*,1*,2*',
    excludeTraded: true,
    extraExclusions: [staleYearToken, tierSAndANegation].filter(Boolean),
    safetyShields: dedupedShields,
  });

  const staleCleanup = {
    id: 'stale_non_rare_hoard',
    badge: `Safe Trash · ${GUARANTEED_LUCKY_CUTOFF_YEAR + 1}–${safeStaleMax}`,
    title: `Stale ${GUARANTEED_LUCKY_CUTOFF_YEAR + 1}–${safeStaleMax} Non-Rare Hoard Cleanup`,
    subtitle: `Protects 2016–${GUARANTEED_LUCKY_CUTOFF_YEAR} Guaranteed Luckies, Tier S/A tradeables, Shinies, BGs, Costumes, Legendaries, PvP IVs & Nundos. Surfaces old 0★–2★ non-rare catches.`,
    query: staleHoardTrashQuery,
    actionMode: 'review',
    isTrash: true,
    accent: 'rose',
  };

  return {
    deadTradeAudits,
    demandTierCards,
    duplicatePruners,
    staleCleanup,
    tiers,
  };
}

/**
 * Builds Forever Friends Remote Trade Showcase queries (2026 Remote Trade rules).
 */
export function buildRemoteTradeShowcaseQueries({
  tagMap: customTagMap = null,
  metaSnapshot = {},
} = {}) {
  const tagMap = customTagMap ? mergeTagMap(customTagMap) : createDefaultTagMap();
  const trSpecHash = getTagHash('tr_spec', tagMap) || '#tr-spec';
  const tiers = getTradeTierSpecies(metaSnapshot);
  const tierSDex = compressIds(tiers.tierS);
  const scarceDex = compressIds(SCARCE_RARE_SPECIES_IDS);

  return [
    {
      id: 'remote_from_tr_spec',
      badge: 'Eligible Now · age30-',
      title: `Promote ${tagMap.tr_spec?.name || 'TR-Spec'} to Remote Trade Tag`,
      subtitle: 'Filters your existing Special Trade tag for Pokémon that pass all 30-day & eligibility checks right now.',
      query: joinClauses(trSpecHash, ...REMOTE_TRADE_ELIGIBILITY_GUARDS),
      speciesIds: EMPTY_SPECIES_IDS,
      actionMode: 'review',
      accent: 'emerald',
      tagSuggestion: 'Remote Trade',
    },
    {
      id: 'remote_tier_s_showcase',
      badge: 'Tier S Showcase',
      title: 'High-Demand Remote Showcase (Shinies, BGs, G-Max & Tier S)',
      subtitle: 'Surfaces your highest-value tradeables eligible for Remote Trading (excluding plain Kanto Birds) so Forever Friends pick something great.',
      query: joinClauses(
        ...REMOTE_TRADE_ELIGIBILITY_GUARDS,
        '!favorite',
        '!4*',
        `shiny,locationbackground,gigantamax,${tierSDex}`,
        KANTO_BIRD_GUARD
      ),
      speciesIds: tiers.tierS,
      actionMode: 'review',
      accent: 'purple',
      tagSuggestion: 'Remote Trade',
    },
    {
      id: 'remote_regionals_rares',
      badge: 'Global Demand',
      title: 'Regionals, Unown, Rotom & Scarce Hatches (Remote Ready)',
      subtitle: 'International Forever Friends crave your local regionals and scarce egg spawns. Tag 1–3 spares per species.',
      query: joinClauses(
        ...REMOTE_TRADE_ELIGIBILITY_GUARDS,
        '!favorite',
        '!4*',
        scarceDex
      ),
      speciesIds: SCARCE_RARE_SPECIES_IDS,
      actionMode: 'review',
      accent: 'teal',
      tagSuggestion: 'Remote Trade',
    },
    {
      id: 'remote_guaranteed_lucky',
      badge: `2016–${GUARANTEED_LUCKY_CUTOFF_YEAR} Lucky`,
      title: `Guaranteed Lucky Remote Offers (2016–${GUARANTEED_LUCKY_CUTOFF_YEAR})`,
      subtitle: `Every 2016–${GUARANTEED_LUCKY_CUTOFF_YEAR} catch is already >30 days old and triggers Guaranteed Lucky (up to ${GUARANTEED_LUCKY_LIMIT} cap).`,
      query: joinClauses(
        GUARANTEED_LUCKY_YEAR_RANGE,
        ...REMOTE_TRADE_ELIGIBILITY_GUARDS,
        '!favorite',
        '!4*'
      ),
      speciesIds: EMPTY_SPECIES_IDS,
      actionMode: 'review',
      accent: 'amber',
      tagSuggestion: 'Remote Trade',
    },
    {
      id: 'remote_cooldown_preview',
      badge: 'Cooldown · age0-29',
      title: 'Pending 30-Day Remote Trade Cooldown',
      subtitle: `Shows ${tagMap.tr_spec?.name || 'TR-Spec'} catches from the last 29 days that will unlock for Remote Trade once they hit age30-.`,
      query: joinClauses(trSpecHash, 'age0-29', ...TRADE_ELIGIBILITY_GUARDS, '!mythical'),
      speciesIds: EMPTY_SPECIES_IDS,
      actionMode: 'review',
      accent: 'indigo',
    },
  ];
}
