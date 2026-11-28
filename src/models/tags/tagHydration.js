/**
 * 6-Stage Box Hydration query registry (data-driven map with year/event scoping & actionMode metadata).
 */
import {
  compressIds,
  SCARCE_RARE_SPECIES_IDS,
  PVP_IV_EXCLUDE_CLAUSE,
} from '../searchEngine';
import {
  calculateAgeSearchString,
  mergeAgeIntervals,
  formatIntervalToAgeToken,
  getTodayPlainDateString,
} from '../events/eventAgeUtils';
import { ALL_COMMUNITY_DAY_PRE_EVO_IDS } from '../communityDayModel';
import {
  CANDY_12_FODDER_IDS,
  CLASSIC_GL_XL_FLOOR_IDS,
  GUARANTEED_LUCKY_CUTOFF_YEAR,
  GUARANTEED_LUCKY_LIMIT,
  GUARANTEED_LUCKY_YEAR_RANGE,
  REMOTE_TRADE_ELIGIBILITY_GUARDS,
  TRADEABLE_MYTHICAL_IDS,
  TRADE_ELIGIBILITY_GUARDS,
  TRADE_EVOLVE_IDS,
} from '../../data/speciesConstants';
import eventsArchiveJson from '../../data/events_archive.json';
import { HYDRATION_STAGES, TAG_DEFINITION_BY_ID } from './tagDefinitions';
import { createDefaultTagMap, mergeTagMap, getTagHash } from './tagLinter';

const COMPRESSED_CD_PRE_EVO_DEX = compressIds(ALL_COMMUNITY_DAY_PRE_EVO_IDS);
const SCARCE_RARE_SPECIES_RANGES = compressIds(SCARCE_RARE_SPECIES_IDS);

const DEFAULT_ARCHIVE_EVENTS = eventsArchiveJson.events.map((ev) => ({
  ...ev,
  attended: Boolean(ev.attendedDefault),
}));

/**
 * Available event years derived from the bundled archive (descending).
 */
export const EVENT_HYDRATION_YEARS = Array.from(
  new Set(eventsArchiveJson.events.map((ev) => Number(ev.year)).filter(Number.isFinite))
).sort((a, b) => b - a);

function normalizeEventYearToken(eventYear) {
  if (
    eventYear === undefined ||
    eventYear === null ||
    eventYear === '' ||
    String(eventYear).toUpperCase() === 'ALL'
  ) {
    return { yearNum: null, yearToken: '' };
  }
  const parsed = Number(eventYear);
  if (!Number.isInteger(parsed) || parsed < 2016 || parsed > 2100) {
    return { yearNum: null, yearToken: '' };
  }
  return { yearNum: parsed, yearToken: `year${parsed}` };
}

function buildAttendedEventAgeContext(events, { yearNum, scope, backgroundType, refDateStr, bufferMode }) {
  const sourceEvents = Array.isArray(events) && events.length > 0 ? events : DEFAULT_ARCHIVE_EVENTS;
  const effectiveRef = refDateStr || getTodayPlainDateString();
  const effectiveBuffer = bufferMode || 'evening-safe';

  const intervals = [];
  const regionalIds = [];
  let matchedCount = 0;

  for (const ev of sourceEvents) {
    if (!ev || !ev.attended || ev.end === 'PRESENT') continue;
    if (yearNum !== null && Number(ev.year) !== yearNum) continue;
    if (scope && ev.scope !== scope) continue;
    if (backgroundType && ev.backgroundType !== backgroundType) continue;

    const calc = calculateAgeSearchString(ev.start, ev.end, effectiveRef, { bufferMode: effectiveBuffer });
    if (calc.isUpcoming) continue;

    matchedCount += 1;
    intervals.push(calc);
    if (Array.isArray(ev.regionalRareIds)) {
      regionalIds.push(...ev.regionalRareIds);
    }
  }

  const merged = mergeAgeIntervals(intervals);
  const ageUnion = merged.map(formatIntervalToAgeToken).join(',');
  const regionalDex = compressIds(regionalIds);

  return { ageUnion, regionalDex, matchedCount };
}

const HYDRATION_BUILDERS = {
  ev_shbg: ({ yearToken, yearSuffix }) => [
    {
      id: 'ev_shbg_primary',
      label: `Shiny + Background${yearSuffix}`,
      query: [yearToken, 'shiny', 'background', '!#'].filter(Boolean).join('&'),
      actionMode: 'select-all',
      note: 'Dual-lock every hit with Favorite (★) + tag.',
    },
  ],

  ev_locbg: ({ yearToken, yearSuffix }) => [
    {
      id: 'ev_locbg_primary',
      label: `Location Backgrounds${yearSuffix}`,
      query: [yearToken, 'locationbackground', '!shiny', '!#'].filter(Boolean).join('&'),
      actionMode: 'select-all',
      note: 'Excludes !shiny so EV-ShBG grails stay isolated even if run out of order.',
    },
  ],

  ev_global: ({ yearNum, yearToken, yearSuffix, options }) => {
    const globalCtx = buildAttendedEventAgeContext(options.events, {
      yearNum,
      scope: 'global',
      backgroundType: 'specialbackground',
      refDateStr: options.refDateStr,
      bufferMode: options.bufferMode,
    });

    const queries = [
      {
        id: 'ev_global_keepers',
        label: `Global BG Keepers${yearSuffix}`,
        query: [
          yearToken,
          'specialbackground',
          '!locationbackground',
          '!shiny',
          '3*,4*,legendary,mythical,ultrabeast,gigantamax,costume',
          '!#',
        ]
          .filter(Boolean)
          .join('&'),
        actionMode: 'review',
        note: 'Isolates high-IV, Legendary/Mythical/UB, G-Max, and Costume Special BGs (excluding Location BGs & Shinies). Sort by # → tag keepers into EV-Global and spares into TR-Spec.',
      },
    ];

    if (globalCtx.ageUnion) {
      queries.push({
        id: 'ev_global_attended',
        label: yearNum ? `Attended ${yearNum} Global Event BGs` : 'Attended Global Event BGs',
        query: [
          yearToken,
          'specialbackground',
          '!locationbackground',
          '!shiny',
          globalCtx.ageUnion,
          '!#',
        ]
          .filter(Boolean)
          .join('&'),
        actionMode: 'review',
        isSecondary: true,
        note: `Scoped strictly to your ${globalCtx.matchedCount} attended Global event window(s) (GO Fest, GO Tour, Wild Area) — skips seasonal/CD research BGs.`,
      });
    }

    queries.push(
      {
        id: 'ev_global_surplus',
        label: `0★–2★ Global BG Surplus${yearSuffix}`,
        query: [
          yearToken,
          'specialbackground',
          '!locationbackground',
          '!shiny',
          '0*,1*,2*',
          '!favorite',
          '!#',
        ]
          .filter(Boolean)
          .join('&'),
        actionMode: 'review',
        isSecondary: true,
        note: 'Low-IV Special Background duplicates — Sort by # to keep 1–2 favorites or route tradeables to TR-Spec before transferring excess.',
      },
      {
        id: 'ev_global_profile',
        label: `Profile Backgrounds${yearSuffix}`,
        query: [yearToken, 'profilebackground', '!#'].filter(Boolean).join('&'),
        actionMode: 'select-all',
        isSecondary: true,
      }
    );

    return queries;
  },

  ev_inperson: ({ yearNum, yearToken, yearSuffix, options }) => {
    const inPersonCtx = buildAttendedEventAgeContext(options.events, {
      yearNum,
      scope: 'in-person',
      refDateStr: options.refDateStr,
      bufferMode: options.bufferMode,
    });

    const queries = [];

    if (inPersonCtx.ageUnion) {
      queries.push({
        id: 'ev_inperson_attended',
        label: yearNum ? `Attended ${yearNum} In-Person Souvenirs` : 'Attended In-Person Souvenirs',
        query: [
          yearToken,
          inPersonCtx.ageUnion,
          'shiny,costume,201,479',
          '!remoteraid',
          '!hatched',
          '!traded',
          '!#',
        ]
          .filter(Boolean)
          .join('&'),
        actionMode: 'review',
        note: `Anchored to your ${inPersonCtx.matchedCount} attended in-person event date window(s) — works for both local & traveled venues while excluding remote raids and 7km egg hatches.`,
      });

      if (inPersonCtx.regionalDex) {
        queries.push({
          id: 'ev_inperson_regionals',
          label: yearNum ? `Attended ${yearNum} Event Regionals & Rares` : 'Attended Event Regionals & Rares',
          query: [
            yearToken,
            inPersonCtx.ageUnion,
            inPersonCtx.regionalDex,
            '!remoteraid',
            '!traded',
            '!#',
          ]
            .filter(Boolean)
            .join('&'),
          actionMode: 'review',
          isSecondary: true,
          note: 'Surfaces event-featured regionals, Unown (#201), Rotom (#479), and special spawns caught during your attended in-person event windows.',
        });
      }
    }

    queries.push({
      id: 'ev_inperson_travel',
      label: `100km+ Travel Souvenirs${yearSuffix}`,
      query: [
        yearToken,
        'distance100-',
        'shiny,costume,201,479',
        '!remoteraid',
        '!hatched',
        '!traded',
        '!#',
      ]
        .filter(Boolean)
        .join('&'),
      actionMode: 'review',
      isSecondary: Boolean(inPersonCtx.ageUnion),
      note: 'Fallback for untracked trips/events 100km+ away — excludes !remoteraid and !hatched so couch raids and 7km friend eggs never leak in.',
    });

    return queries;
  },

  keep_trophy: () => [
    {
      id: 'keep_trophy_nundos',
      label: 'Nundos (0%)',
      query: '0attack&0defense&0hp&!#',
      actionMode: 'select-all',
    },
    {
      id: 'keep_trophy_costumes',
      label: 'Untagged Costumes (Sort by #)',
      query: 'costume&!shiny&!background&!#',
      actionMode: 'review',
      note: 'Sort by # so identical outfits group together — tag 1–2 keepers into KEEP-Trophy (and spare tradeables into TR-Spec) before combat/trade sweeps.',
    },
    {
      id: 'keep_trophy_singletons',
      label: 'Non-Combat 1-of-1 Singletons',
      query: 'count1&@3mov&!candyxl&!legendary&!mythical&!ultrabeast&!shadow&!maxmove1-&!#',
      actionMode: 'review',
      note: 'Excludes double-moved, XL-powered, Legendaries, Mythicals, UBs, Shadows, and Max Battle Pokémon so combat 1-of-1s stay untagged for Stages 3–4.',
    },
    {
      id: 'keep_trophy_legacy',
      label: 'Singleton True Legacy Moves',
      query: '@special&!@frustration&!@return&!shadow&!purified&count1&!#',
      actionMode: 'review',
      note: 'Excludes Shadow Frustration and Purified Return (which PoGO counts as @special) so combat shadows and raid squads stay free for Stages 3–6.',
    },
    {
      id: 'keep_trophy_vintage',
      label: `Vintage 2016–${GUARANTEED_LUCKY_CUTOFF_YEAR} Catches (Guaranteed Lucky)`,
      query: `${GUARANTEED_LUCKY_YEAR_RANGE}&!#`,
      actionMode: 'review',
      isSecondary: true,
    },
  ],

  pvp_gl: ({ merged, pvp }) => {
    const glLow = Array.isArray(pvp.gl?.top100?.lowAtk) ? pvp.gl.top100.lowAtk : [];
    const rawGlHigh = Array.isArray(pvp.gl?.top100?.highAtk) ? pvp.gl.top100.highAtk : [];
    const glHigh = rawGlHigh.length > 0 ? [...rawGlHigh, ...CLASSIC_GL_XL_FLOOR_IDS] : [];
    const glLowDex = compressIds(glLow);
    const glHighDex = compressIds(glHigh);
    const glHash = getTagHash('pvp_gl', merged) || '#pvp-gl';

    const queries = [];
    if (glLowDex) {
      queries.push({
        id: 'pvp_gl_meta_low',
        label: 'GL Top-100 Low-Atk Candidates (≤1500 CP)',
        query: `!#&0-1attack&3-4defense&3-4hp&cp-1500&${glLowDex}`,
        actionMode: 'review',
        note: 'Uses cp-1500 (no minimum CP floor) so low-level wild catches and pre-evolutions that need powering up, evolving, or a 2nd move are included.',
      });
    }
    if (glHighDex) {
      queries.push({
        id: 'pvp_gl_meta_high',
        label: 'GL Top-100 XL / High-Atk Candidates (≤1500 CP)',
        query: `!#&2-4attack&3-4defense&3-4hp&cp-1500&${glHighDex}`,
        actionMode: 'review',
        note: 'Catches XL and egg/raid-floor GL staples (Lickitung, Medicham, Corsola, Bastiodon, Sableye, Carbink, Pachirisu, Diggersby, Florges) at any CP ≤ 1500.',
      });
    }
    queries.push({
      id: 'pvp_gl_primary',
      label: 'Built Double-Moved GL (≤1500 CP)',
      query: 'cp-1500&!@3mov&!#',
      actionMode: 'select-all',
    });
    queries.push({
      id: 'pvp_gl_needs_work',
      label: 'Tagged GL Needing 2nd Move / Evo',
      query: `${glHash}&@3mov,evolve`,
      actionMode: 'review',
      isSecondary: true,
      note: 'Audits your tagged Great League pool for Pokémon that still need their 2nd Charged Move (@3mov) or evolution.',
    });
    return queries;
  },

  pvp_ul: ({ merged, pvp }) => {
    const ulLow = Array.isArray(pvp.ul?.top100?.lowAtk) ? pvp.ul.top100.lowAtk : [];
    const ulHigh = Array.isArray(pvp.ul?.top100?.highAtk) ? pvp.ul.top100.highAtk : [];
    const ulLowDex = compressIds(ulLow);
    const ulHighDex = compressIds(ulHigh);
    const ulHash = getTagHash('pvp_ul', merged) || '#pvp-ul';

    const queries = [];
    if (ulLowDex) {
      queries.push({
        id: 'pvp_ul_meta_low',
        label: 'UL Top-100 Low-Atk Candidates (≤2500 CP)',
        query: `!#&0-1attack&3-4defense&3-4hp&cp-2500&${ulLowDex}`,
        actionMode: 'review',
        note: 'Uses cp-2500 (no minimum CP floor) so under-leveled catches, Lv20 Raid Bosses, and pre-evolutions needing power-up or 2nd move are surfaced.',
      });
    }
    if (ulHighDex) {
      queries.push({
        id: 'pvp_ul_meta_high',
        label: 'UL Top-100 XL / Hundo-Cap Candidates (≤2500 CP)',
        query: `!#&3*,4*&cp-2500&${ulHighDex}`,
        actionMode: 'review',
        note: 'Catches XL-capped UL staples (Tinkaton, Talonflame, Umbreon, Mandibuzz, Jellicent, Zygarde, Virizion) at any CP ≤ 2500.',
      });
    }
    queries.push({
      id: 'pvp_ul_primary',
      label: 'Built Double-Moved UL (1501–2500 CP)',
      query: 'cp1501-2500&!@3mov&!#',
      actionMode: 'select-all',
    });
    queries.push({
      id: 'pvp_ul_needs_work',
      label: 'Tagged UL Needing 2nd Move / Evo',
      query: `${ulHash}&@3mov,evolve`,
      actionMode: 'review',
      isSecondary: true,
      note: 'Audits your tagged Ultra League pool for Pokémon that still need their 2nd Charged Move (@3mov) or evolution.',
    });
    return queries;
  },

  pvp_ml: ({ merged, pvp }) => {
    const mlAll = Array.isArray(pvp.ml?.top100?.all) ? pvp.ml.top100.all : [];
    const mlAllDex = compressIds(mlAll);
    const mlHash = getTagHash('pvp_ml', merged) || '#pvp-ml';

    const queries = [];
    if (mlAllDex) {
      queries.push({
        id: 'pvp_ml_meta_candidates',
        label: 'ML Top-100 15-Atk Candidates (Any CP)',
        query: `!#&3*,4*&4attack&3-4defense&3-4hp&${mlAllDex}`,
        actionMode: 'review',
        note: 'No minimum CP filter — catches Level 20 Raid Bosses, hatches, and pre-evolutions that need powering up and a 2nd move.',
      });
      queries.push({
        id: 'pvp_ml_meta_hundos',
        label: 'ML Top-100 4★ Hundos (Any CP)',
        query: `!#&4*&${mlAllDex}`,
        actionMode: 'select-all',
      });
    }
    queries.push({
      id: 'pvp_ml_primary',
      label: 'Built Double-Moved ML (3000+ CP)',
      query: 'cp3000-&!@3mov&3*,4*&4attack&!#',
      actionMode: 'select-all',
    });
    queries.push({
      id: 'pvp_ml_needs_work',
      label: 'Tagged ML Needing 2nd Move / Evo',
      query: `${mlHash}&@3mov,evolve`,
      actionMode: 'review',
      isSecondary: true,
    });
    return queries;
  },

  pvp_cup: () => [
    {
      id: 'pvp_cup_primary',
      label: 'Built Little Cup (≤500 CP Double-Moved)',
      query: 'cp-500&!@3mov&!#',
      actionMode: 'select-all',
    },
    {
      id: 'pvp_cup_little_candidates',
      label: 'Little Cup Low-Atk Candidates (≤500 CP)',
      query: '0-1attack&3-4defense&3-4hp&cp-500&!#',
      actionMode: 'review',
    },
    {
      id: 'pvp_cup_limited_spice',
      label: 'Limited Cup Low-Atk Spice (≤1500 CP)',
      query: '0-1attack&3-4defense&3-4hp&cp-1500&!#',
      actionMode: 'review',
      isSecondary: true,
    },
  ],

  pve_raid: ({ pve }) => {
    const byTypeFlat = pve.byType ? Object.values(pve.byType).flat() : [];
    const allPveIds = [
      ...(Array.isArray(pve.top30Overall) ? pve.top30Overall : []),
      ...(Array.isArray(pve.topShadow) ? pve.topShadow : []),
      ...(Array.isArray(pve.topMegaEvolved) ? pve.topMegaEvolved : []),
      ...byTypeFlat,
    ];
    const allPveDex = compressIds(allPveIds);
    if (allPveDex) {
      return [
        {
          id: 'pve_raid_primary',
          label: 'Powered-Up Meta Raiders (Lv35+ / XL / Mega3)',
          query: `cp3000-,candyxl,mega3-&3*,4*,shadow&!#&${allPveDex}`,
          actionMode: 'review',
          note: 'Scoped to verified PvE raid families at CP 3000+, XL-powered, or Mega3 so unbuilt weather-boosted Lv25 raid catches (CP 2500–2950) stay free for Stage 4 PVE-WIP.',
        },
        {
          id: 'pve_raid_broad',
          label: 'Lower-CP Built Raiders (CP 2500+ Meta)',
          query: `cp2500-,candyxl,mega3-&3*,4*,shadow&!#&${allPveDex}`,
          actionMode: 'review',
          isSecondary: true,
          note: 'Use to catch built lower-CP raid specialists (e.g., Shadow Mamoswine, Lucario, Kartana, Rampardos).',
        },
      ];
    }
    return [
      {
        id: 'pve_raid_primary',
        label: 'Built Raid Attackers',
        query: 'cp3000-,candyxl,mega3-&3*,4*,shadow&!#',
        actionMode: 'review',
      },
    ];
  },

  max_atk: () => [
    {
      id: 'max_atk_primary',
      label: 'Max Attack Lv2–3 (Built Attackers)',
      query: 'maxmove2-&!maxspirit2-&!#',
      actionMode: 'select-all',
      note: 'Catches Max Attack Lv2–3 builds (including attackers that also have Max Guard unlocked) while leaving dedicated Healers for MAX-Heal.',
    },
    {
      id: 'max_atk_gmax',
      label: 'Powered-Up Gigantamax',
      query: 'gigantamax&cp2000-&!#',
      actionMode: 'review',
      isSecondary: true,
    },
  ],

  max_heal: () => [
    {
      id: 'max_heal_primary',
      label: 'Max Spirit Unlocked',
      query: 'maxmove1-&maxspirit1-&!#',
      actionMode: 'select-all',
    },
    {
      id: 'max_heal_blissey',
      label: 'Chansey / Blissey Max',
      query: '113,242&maxmove1-&!#',
      actionMode: 'review',
      isSecondary: true,
    },
  ],

  max_tank: () => [
    {
      id: 'max_tank_primary',
      label: 'Max Guard Unlocked',
      query: 'maxmove1-&maxguard1-&!#',
      actionMode: 'select-all',
    },
  ],

  pvp_wip: ({ merged, pvp }) => {
    const glLow = Array.isArray(pvp.gl?.top100?.lowAtk) ? pvp.gl.top100.lowAtk : [];
    const ulLow = Array.isArray(pvp.ul?.top100?.lowAtk) ? pvp.ul.top100.lowAtk : [];
    const rawGlHigh = Array.isArray(pvp.gl?.top100?.highAtk) ? pvp.gl.top100.highAtk : [];
    const glHigh = rawGlHigh.length > 0 ? [...rawGlHigh, ...CLASSIC_GL_XL_FLOOR_IDS] : [];
    const ulHigh = Array.isArray(pvp.ul?.top100?.highAtk) ? pvp.ul.top100.highAtk : [];
    const mlAll = Array.isArray(pvp.ml?.top100?.all) ? pvp.ml.top100.all : [];

    const glUlLowAtkDex = compressIds([...glLow, ...ulLow]);
    const glUlHighAtkDex = compressIds([...glHigh, ...ulHigh]);
    const mlAllDex = compressIds(mlAll);
    const leagueHashes = [
      getTagHash('pvp_gl', merged),
      getTagHash('pvp_ul', merged),
      getTagHash('pvp_ml', merged),
      getTagHash('pvp_cup', merged),
    ]
      .filter(Boolean)
      .join(',') || '#pvp-gl,#pvp-ul,#pvp-ml,#pvp-cup';

    const queries = [
      {
        id: 'pvp_wip_league_needs_move',
        label: 'League-Tagged Needing 2nd Move (@3mov)',
        query: `${leagueHashes}&@3mov`,
        actionMode: 'review',
        note: 'Primary dual-tag audit: finds Pokémon already tagged PVP-GL / PVP-UL / PVP-ML whose 2nd Charged Move is still locked (@3mov). Dual-tag with PVP-WIP until built.',
      },
      {
        id: 'pvp_wip_league_needs_evo',
        label: 'League-Tagged Needing Evolution',
        query: `${leagueHashes}&evolve`,
        actionMode: 'review',
      },
    ];

    if (glUlLowAtkDex) {
      queries.push({
        id: 'pvp_wip_meta',
        label: 'Untagged Meta GL/UL Low-Atk',
        query: `!#&0-1attack&3-4defense&3-4hp&cp-2500&${glUlLowAtkDex}`,
        actionMode: 'review',
        isSecondary: true,
      });
    }
    if (glUlHighAtkDex) {
      queries.push({
        id: 'pvp_wip_xl',
        label: 'Untagged Meta GL/UL XL High-Atk',
        query: `!#&2-4attack&3-4defense&3-4hp&cp-2500&${glUlHighAtkDex}`,
        actionMode: 'review',
        isSecondary: true,
        note: 'Catches XL/hundo-cap GL & UL staples (Lickitung, Medicham, Corsola, Tinkaton, Talonflame, Umbreon).',
      });
    }
    if (mlAllDex) {
      queries.push({
        id: 'pvp_wip_ml',
        label: 'Untagged Meta Master League (15-Atk)',
        query: `!#&3*,4*&4attack&${mlAllDex}`,
        actionMode: 'review',
        isSecondary: true,
      });
    }
    queries.push({
      id: 'pvp_wip_broad',
      label: glUlLowAtkDex ? 'Broad Spicy Low-Atk' : 'Low-Atk PvP IVs',
      query: '0-1attack&3-4defense&3-4hp&cp-2500&!#',
      actionMode: 'review',
      isSecondary: true,
    });
    return queries;
  },

  pve_wip: ({ pve }) => {
    const pveTop30Dex = compressIds(Array.isArray(pve.top30Overall) ? pve.top30Overall : []);
    const pveShadowDex = compressIds(Array.isArray(pve.topShadow) ? pve.topShadow : []);
    return [
      {
        id: 'pve_wip_regulars',
        label: 'Top PvE Regulars',
        query: pveTop30Dex
          ? `!#&!shadow&3*,4*&4attack&${pveTop30Dex}`
          : '!#&!shadow&3*,4*&4attack',
        actionMode: 'review',
      },
      {
        id: 'pve_wip_shadows',
        label: 'Top PvE Shadows',
        query: pveShadowDex ? `!#&shadow&${pveShadowDex}` : '!#&shadow',
        actionMode: 'review',
      },
    ];
  },

  pve_megawip: ({ pve }) => {
    const evolvedList = Array.isArray(pve.topMegaEvolved) ? pve.topMegaEvolved : [];
    const evolvedSet = new Set(evolvedList);
    const familyList = Array.isArray(pve.topMegaFamily) ? pve.topMegaFamily : [];
    const preEvoList = familyList.filter((id) => !evolvedSet.has(id));

    const pveMegaEvolvedDex = compressIds(evolvedList);
    const pveMegaPreEvoDex = compressIds(preEvoList);
    return [
      {
        id: 'pve_megawip_candidates',
        label: "Un-Mega'd Evolved Candidates",
        query: pveMegaEvolvedDex
          ? `!#&!shadow&mega0&3*,4*&4attack&${pveMegaEvolvedDex}`
          : '!#&!shadow&mega0&3*,4*&4attack',
        actionMode: 'review',
        note: 'mega0 matches fully evolved Mega-capable species that have never been Mega Evolved.',
      },
      {
        id: 'pve_megawip_preevos',
        label: 'Mega Pre-Evolutions Only',
        query: pveMegaPreEvoDex
          ? `!#&!shadow&3*,4*&4attack&${pveMegaPreEvoDex}`
          : '!#&!shadow&evolve&3*,4*&4attack',
        actionMode: 'review',
        isSecondary: true,
        note: 'Uses strict pre-evolution Dex IDs (topMegaFamily minus topMegaEvolved) so already-Mega-Evolved mega1–3 forms never leak into PVE-MegaWIP before Stage 6 OP-Mega.',
      },
    ];
  },

  max_wip: () => [
    {
      id: 'max_wip_primary',
      label: 'Unbuilt High-Value Max',
      query: 'maxmove1-&!maxmove2-&!maxguard1-&!maxspirit1-&3*,4*,gigantamax,legendary&!#',
      actionMode: 'review',
    },
  ],

  max_candy: () => [
    {
      id: 'max_candy_primary',
      label: 'Power Spot Candy Mules',
      query: 'dynamax&!maxmove2-&!maxguard1-&!maxspirit1-&0*,1*,2*&!shiny&!background&!#',
      actionMode: 'review',
    },
  ],

  tr_spec: ({ merged }) => {
    const trSpecHash = getTagHash('tr_spec', merged) || '#tr-spec';
    const trMirrorHash = getTagHash('tr_mirror', merged) || '#tr-mirror';
    const trDistHash = getTagHash('tr_dist', merged) || '#tr-dist';
    const trSpecName = merged.tr_spec?.name || 'TR-Spec';
    const op2xXferName = merged.op_2xxfer?.name || 'OP-2xXfer';
    const allTradeHashes = [trSpecHash, trMirrorHash, trDistHash].filter(Boolean).join(',');
    const tradeBase = TRADE_ELIGIBILITY_GUARDS.join('&');
    const localMythicalGuard = `!mythical,${compressIds(TRADEABLE_MYTHICAL_IDS)}`;
    const remoteBase = REMOTE_TRADE_ELIGIBILITY_GUARDS.join('&');

    return [
      {
        id: 'tr_spec_shinies_bgs',
        label: 'Spare Shinies & Backgrounds',
        query: `shiny,background&${tradeBase}&${localMythicalGuard}&!favorite&!4*&!#`,
        actionMode: 'review',
        note: `Excludes untradeable Shadows, Fusions, and Mythicals (while keeping tradeable Meltan/Melmetal #808–809). Sort by # to route spares into ${trSpecName}.`,
      },
      {
        id: 'tr_spec_legends',
        label: 'Duplicate Legendaries & UBs',
        query: `legendary,ultrabeast&count2-&${tradeBase}&!favorite&!4*&!#`,
        actionMode: 'review',
        note: `Uses count2- so 1-of-1 Legendaries stay untouched; route excess bad-IV copies to ${op2xXferName}.`,
      },
      {
        id: 'tr_spec_rares',
        label: 'Scarce Regionals, Unown & Rotom',
        query: `${tradeBase}&!favorite&!4*&!#&${SCARCE_RARE_SPECIES_RANGES}`,
        actionMode: 'review',
        isSecondary: true,
        note: 'Catches untraded Regionals, Unown (#201), Rotom (#479), and scarce 10km/12km egg tradeables.',
      },
      {
        id: 'tr_spec_costumes',
        label: 'Spare Costumes',
        query: `costume&${tradeBase}&!favorite&!4*&!#`,
        actionMode: 'review',
        isSecondary: true,
        note: `Run after KEEP-Trophy costume review so remaining untagged spares route cleanly to ${trSpecName}.`,
      },
      {
        id: 'tr_spec_guaranteed_lucky',
        label: `Guaranteed Lucky Bait (2016–${GUARANTEED_LUCKY_CUTOFF_YEAR})`,
        query: `${GUARANTEED_LUCKY_YEAR_RANGE}&${tradeBase}&${localMythicalGuard}&!favorite&!4*&!#`,
        actionMode: 'review',
        isSecondary: true,
        note: `Catches from 2016–${GUARANTEED_LUCKY_CUTOFF_YEAR} trigger Guaranteed Lucky trades (up to ${GUARANTEED_LUCKY_LIMIT} cap). Tag keepers into ${trSpecName}.`,
      },
      {
        id: 'tr_spec_remote_ready',
        label: 'Remote Trade Ready (age30-)',
        query: `${trSpecHash}&${remoteBase}`,
        actionMode: 'review',
        isSecondary: true,
        note: `Surfaces your existing ${trSpecName} Pokémon that meet the 30-day & eligibility rules for the native Remote Trade tag.`,
      },
      {
        id: 'tr_spec_dead_audit',
        label: 'Dead Trade Tag Audit (Already Traded)',
        query: `${allTradeHashes}&traded`,
        actionMode: 'select-all',
        isSecondary: true,
        note: `Pokémon can only be traded once — remove trade tags from any hits and route bad rerolls to ${op2xXferName}.`,
      },
    ];
  },

  tr_dist: () => [
    {
      id: 'tr_dist_primary',
      label: '100km+ Distance Tradeables',
      query: 'distance100-&!traded&!shadow&!fusion&!shiny&!legendary&!mythical&!ultrabeast&!background&!costume&!4*&!favorite&!#',
      actionMode: 'review',
      note: 'Excludes untradeable Shadows/Fusions plus Shinies, Legendaries, Backgrounds, and Costumes so only clean distance fodder enters TR-Dist.',
    },
  ],

  tr_mirror: ({ pvp, pve }) => {
    const mirrorIds = [
      ...SCARCE_RARE_SPECIES_IDS,
      ...ALL_COMMUNITY_DAY_PRE_EVO_IDS,
      ...(Array.isArray(pve.top30Overall) ? pve.top30Overall : []),
      ...(Array.isArray(pvp.gl?.top100?.highAtk) ? pvp.gl.top100.highAtk : []),
      ...(Array.isArray(pvp.ul?.top100?.highAtk) ? pvp.ul.top100.highAtk : []),
      ...(Array.isArray(pvp.ml?.top100?.all) ? pvp.ml.top100.all : []),
    ];
    const mirrorDex = compressIds(mirrorIds);
    return [
      {
        id: 'tr_mirror_primary',
        label: 'Meta, Pseudo & CD Mirror Spares',
        query: mirrorDex
          ? `!traded&!shadow&!fusion&!favorite&!shiny&!4*&!background&0*,1*,2*&!#&${mirrorDex}`
          : '!traded&!shadow&!fusion&!favorite&!shiny&!4*&!background&0*,1*,2*&count2-&!#',
        actionMode: 'review',
        note: 'Scoped to PvE/PvP meta, pseudo-legendaries, egg rares, and CD pre-evos so common wild fodder does not flood TR-Mirror.',
      },
      {
        id: 'tr_mirror_max',
        label: 'Untraded Low-IV Max Spares',
        query: 'maxmove1-&!traded&!shadow&!fusion&!favorite&!shiny&!4*&!background&0*,1*,2*&!#',
        actionMode: 'review',
        isSecondary: true,
      },
    ];
  },

  op_mega: () => [
    {
      id: 'op_mega_primary',
      label: 'Mega Lv1–2 Grind',
      query: 'mega1-2&!#',
      actionMode: 'select-all',
    },
    {
      id: 'op_mega_lv4',
      label: 'Lv4 Super Max Target',
      query: 'mega1-3&!#',
      actionMode: 'select-all',
      isSecondary: true,
    },
  ],

  op_xxl: () => [
    {
      id: 'op_xxl_primary',
      label: 'Untagged XXLs',
      query: 'xxl&!#',
      actionMode: 'review',
      note: 'Sort by # and tag ONLY your 1–2 largest XXL per species.',
    },
  ],

  op_tmfrust: () => [
    {
      id: 'op_tmfrust_highiv',
      label: 'High-IV Shadows',
      query: 'shadow&@frustration&3*,4*&!#',
      actionMode: 'review',
    },
    {
      id: 'op_tmfrust_pvp',
      label: 'PvP IVs',
      query: 'shadow&@frustration&0-1attack&3-4defense&3-4hp&!#',
      actionMode: 'review',
    },
  ],

  op_buddy: () => [
    {
      id: 'op_buddy_primary',
      label: 'Active Buddies (Lv1–4)',
      query: 'buddy1-4&!#',
      actionMode: 'select-all',
    },
  ],

  op_evocd: ({ merged }) => {
    const wipEvoHashes = [
      getTagHash('pvp_wip', merged),
      getTagHash('pve_wip', merged),
      getTagHash('pve_megawip', merged),
    ].filter(Boolean);
    return [
      {
        id: 'op_evocd_cd',
        label: 'High-IV & Shiny CD Pre-Evos',
        query: `evolve&!#&!favorite&3*,4*,shiny&${COMPRESSED_CD_PRE_EVO_DEX}`,
        actionMode: 'review',
        note: 'Intentionally omits !@special because Shadow Frustration and Purified Return count as @special — ensures Shadow Mudkip/Beldum/Bagon/Rhyhorn pre-evolutions surface cleanly!',
      },
      {
        id: 'op_evocd_pvp',
        label: 'PvP-IV CD Pre-Evos',
        query: `evolve&!#&!favorite&0-1attack&3-4defense&3-4hp&cp-2500&${COMPRESSED_CD_PRE_EVO_DEX}`,
        actionMode: 'review',
        isSecondary: true,
      },
      {
        id: 'op_evocd_wip',
        label: 'WIP Evolves',
        query: wipEvoHashes.length > 0 ? `${wipEvoHashes.join(',')}&evolve` : 'evolve&!#&3*,4*',
        actionMode: 'review',
      },
    ];
  },

  op_evoxp: ({ special }) => {
    const candy12Ids =
      Array.isArray(special.candy12Fodder) && special.candy12Fodder.length > 0
        ? special.candy12Fodder
        : CANDY_12_FODDER_IDS;
    const tradeEvoIds =
      Array.isArray(special.tradeEvolve) && special.tradeEvolve.length > 0
        ? special.tradeEvolve
        : TRADE_EVOLVE_IDS;
    return [
      {
        id: 'op_evoxp_candy12',
        label: '12-Candy Fodder',
        query: `evolve&!favorite&!shiny&!4*&!shadow&!maxmove1-&!#&${compressIds(candy12Ids)}`,
        actionMode: 'select-all',
      },
      {
        id: 'op_evoxp_traded',
        label: 'Already-Traded Free Evos',
        query: `traded&evolve&!favorite&!#&${compressIds(tradeEvoIds)}`,
        actionMode: 'select-all',
      },
    ];
  },

  op_powerwip: ({ merged }) => {
    const wipHashes = [
      getTagHash('pvp_wip', merged),
      getTagHash('pve_wip', merged),
      getTagHash('pve_megawip', merged),
      getTagHash('max_wip', merged),
    ].filter(Boolean);
    const opPowerWipHash = getTagHash('op_powerwip', merged);
    let primaryQuery;
    if (wipHashes.length > 0 && opPowerWipHash) {
      primaryQuery = `${wipHashes.join(',')}&!${opPowerWipHash}`;
    } else if (wipHashes.length > 0) {
      primaryQuery = wipHashes.join(',');
    } else if (opPowerWipHash) {
      primaryQuery = `3*,4*&!${opPowerWipHash}`;
    } else {
      primaryQuery = '3*,4*&!#';
    }
    return [
      {
        id: 'op_powerwip_wips',
        label: 'Tagged WIP Builds',
        query: primaryQuery,
        actionMode: 'review',
        note: 'Pick the WIP builds you are actively spending Stardust/Candy on right now; remove once they reach target CP/Lv40/Lv50.',
      },
      {
        id: 'op_powerwip_xl',
        label: 'Partially XL-Powered (Lv41–49)',
        query: opPowerWipHash ? `candyxl&3*,4*&!${opPowerWipHash}` : 'candyxl&3*,4*&!#',
        actionMode: 'review',
        isSecondary: true,
        note: 'Surfaces Pokémon you already started investing XL Candy into so half-finished projects stay tracked.',
      },
    ];
  },

  op_powerup: ({ merged }) => {
    const wipHashes = [
      getTagHash('pvp_wip', merged),
      getTagHash('pve_wip', merged),
      getTagHash('pve_megawip', merged),
      getTagHash('max_wip', merged),
      getTagHash('op_powerwip', merged),
    ].filter(Boolean);
    const opPowerupHash = getTagHash('op_powerup', merged);
    let query;
    if (wipHashes.length > 0 && opPowerupHash) {
      query = `${wipHashes.join(',')}&!${opPowerupHash}`;
    } else if (wipHashes.length > 0) {
      query = wipHashes.join(',');
    } else if (opPowerupHash) {
      query = `3*,4*&!${opPowerupHash}`;
    } else {
      query = '3*,4*&!#';
    }
    return [
      {
        id: 'op_powerup_primary',
        label: 'Tagged WIPs Not Yet Queued',
        query,
        actionMode: 'review',
        note: 'Run after Stage 4 WIP tags (and OP-PowerWIP) are populated so only genuine build projects enter your Field Research Power-Up queue.',
      },
    ];
  },

  op_2xxfer: () => [
    {
      id: 'op_2xxfer_primary',
      label: '0★–2★ Excess Legendaries & UBs',
      query: `legendary,ultrabeast&0*,1*,2*&!lucky&!shiny&!4*&!background&!favorite&!fusion&!adventureeffect&!@special&@3mov&${PVP_IV_EXCLUDE_CLAUSE}&!#`,
      actionMode: 'review',
      note: 'Protects Mythicals, 3★–4★s, Fusions, Adventure Effects, Legacy Moves, PvP-IV rerolls, and double-moved builds (@3mov).',
    },
    {
      id: 'op_2xxfer_dup3star',
      label: 'Duplicate Non-15-Atk 3★ Legendaries',
      query: 'legendary,ultrabeast&3*&0-3attack&count2-&!lucky&!shiny&!4*&!background&!favorite&!fusion&!adventureeffect&!@special&@3mov&!#',
      actionMode: 'review',
      isSecondary: true,
    },
  ],

  op_purify1k: () => [
    {
      id: 'op_purify1k_primary',
      label: '1k Stardust Expendable Shadows (0★–2★)',
      query: `shadow&candykm1&0*,1*,2*&!shiny&!4*&!favorite&${PVP_IV_EXCLUDE_CLAUSE}&!#`,
      actionMode: 'select-all',
      note: 'Excludes 3★–4★ shadows (like 13/13/13+ purify-for-hundo candidates) and 0-1atk PvP IV spreads (e.g., Shadow Golbat/Staraptor/Altaria).',
    },
  ],
};

export function buildTagHydrationQueries(tagId, tagMap = null, metaSnapshot = null, options = {}) {
  const builder = HYDRATION_BUILDERS[tagId];
  if (!builder) return [];
  const merged = tagMap ? mergeTagMap(tagMap) : createDefaultTagMap();
  const { yearNum, yearToken } = normalizeEventYearToken(options.eventYear);
  return builder({
    merged,
    pvp: metaSnapshot?.pvp || {},
    pve: metaSnapshot?.pve || {},
    special: metaSnapshot?.specialLists || {},
    yearNum,
    yearToken,
    yearSuffix: yearNum ? ` (${yearNum})` : '',
    options,
  });
}

export function getAllTagHydrationSteps(tagMap = null, metaSnapshot = null, options = {}) {
  const merged = tagMap ? mergeTagMap(tagMap) : createDefaultTagMap();
  const steps = [];
  let stepNumber = 1;

  for (const stage of HYDRATION_STAGES) {
    for (const tagId of stage.tagIds) {
      const def = TAG_DEFINITION_BY_ID[tagId];
      if (!def) continue;
      const entry = merged[tagId];
      steps.push({
        stepNumber: stepNumber++,
        stageId: stage.id,
        stageNumber: stage.stageNumber,
        stageTitle: stage.title,
        stageSubtitle: stage.subtitle,
        tagId: def.id,
        tagName: entry?.name || def.defaultName,
        defaultName: def.defaultName,
        tagHash: getTagHash(def.id, merged),
        color: def.color,
        namespace: def.namespace,
        enabled: Boolean(entry?.enabled),
        optional: Boolean(def.optional),
        purpose: def.purpose,
        queries: buildTagHydrationQueries(def.id, merged, metaSnapshot, options),
      });
    }
  }

  return steps;
}
