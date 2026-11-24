/**
 * 6-Stage Box Hydration query registry (data-driven map replacing the 546-line switch).
 */
import {
  compressIds,
  SCARCE_RARE_SPECIES_IDS,
  PVP_IV_EXCLUDE_CLAUSE,
} from '../searchEngine';
import { ALL_COMMUNITY_DAY_PRE_EVO_IDS } from '../communityDayModel';
import {
  CANDY_12_FODDER_IDS,
  CLASSIC_GL_XL_FLOOR_IDS,
  TRADE_EVOLVE_IDS,
} from '../../data/speciesConstants';
import { HYDRATION_STAGES, TAG_DEFINITION_BY_ID } from './tagDefinitions';
import { createDefaultTagMap, mergeTagMap, getTagHash } from './tagLinter';

const COMPRESSED_CD_PRE_EVO_DEX = compressIds(ALL_COMMUNITY_DAY_PRE_EVO_IDS);

const HYDRATION_BUILDERS = {
  ev_shbg: () => [
    {
      id: 'ev_shbg_primary',
      label: 'Shiny + Background',
      query: 'shiny&background&!#',
      note: 'Dual-lock every hit with Favorite (★) + tag.',
    },
  ],

  ev_locbg: () => [
    {
      id: 'ev_locbg_primary',
      label: 'Location Backgrounds',
      query: 'locationbackground&!#',
    },
  ],

  ev_global: () => [
    {
      id: 'ev_global_primary',
      label: 'Special Backgrounds',
      query: 'specialbackground&!#',
    },
    {
      id: 'ev_global_profile',
      label: 'Profile Backgrounds',
      query: 'profilebackground&!#',
      isSecondary: true,
    },
  ],

  ev_inperson: () => [
    {
      id: 'ev_inperson_primary',
      label: 'Travel & Live Event Souvenirs (100km+)',
      query: 'distance100-&shiny,costume,201,479&!traded&!#',
      note: 'Surfaces untraded travel/venue shinies, costumes, Unowns (#201), and Rotoms (#479) caught 100km+ from home. For local live events, copy the exact ageX-Y window from Events & Trips.',
    },
    {
      id: 'ev_inperson_unown_rotom',
      label: 'Untraded Unown & Rotom',
      query: '201,479&!traded&!#',
      isSecondary: true,
    },
  ],

  keep_trophy: () => [
    {
      id: 'keep_trophy_nundos',
      label: 'Nundos (0%)',
      query: '0attack&0defense&0hp&!#',
    },
    {
      id: 'keep_trophy_singletons',
      label: 'True 1-of-1 Non-Built Singletons',
      query: 'count1&@3mov&!candyxl&!maxmove1-&!#',
      note: 'Excludes double-moved, XL-powered, and Max Battle Pokémon so combat 1-of-1s (e.g., Zygarde, Eternatus, Mythical ML builds) stay untagged for Stage 3.',
    },
    {
      id: 'keep_trophy_legacy',
      label: 'Singleton True Legacy Moves',
      query: '@special&!@frustration&!@return&!shadow&!purified&count1&!#',
      note: 'Excludes Shadow Frustration and Purified Return (which PoGO counts as @special) so combat shadows and raid squads stay free for Stages 3–6.',
    },
    {
      id: 'keep_trophy_vintage',
      label: 'Vintage 2016–2019 Catches',
      query: 'year2016-2019&!#',
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
        note: 'Uses cp-1500 (no minimum CP floor) so low-level wild catches and pre-evolutions that need powering up, evolving, or a 2nd move are included.',
      });
    }
    if (glHighDex) {
      queries.push({
        id: 'pvp_gl_meta_high',
        label: 'GL Top-100 XL / High-Atk Candidates (≤1500 CP)',
        query: `!#&2-4attack&3-4defense&3-4hp&cp-1500&${glHighDex}`,
        note: 'Catches XL and egg/raid-floor GL staples (Lickitung, Medicham, Corsola, Bastiodon, Sableye, Carbink, Pachirisu, Diggersby, Florges) at any CP ≤ 1500.',
      });
    }
    queries.push({
      id: 'pvp_gl_primary',
      label: 'Built Double-Moved GL (≤1500 CP)',
      query: 'cp-1500&!@3mov&!#',
    });
    queries.push({
      id: 'pvp_gl_needs_work',
      label: 'Tagged GL Needing 2nd Move / Evo',
      query: `${glHash}&@3mov,evolve`,
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
        note: 'Uses cp-2500 (no minimum CP floor) so under-leveled catches, Lv20 Raid Bosses, and pre-evolutions needing power-up or 2nd move are surfaced.',
      });
    }
    if (ulHighDex) {
      queries.push({
        id: 'pvp_ul_meta_high',
        label: 'UL Top-100 XL / Hundo-Cap Candidates (≤2500 CP)',
        query: `!#&3*,4*&cp-2500&${ulHighDex}`,
        note: 'Catches XL-capped UL staples (Tinkaton, Talonflame, Umbreon, Mandibuzz, Jellicent, Zygarde, Virizion) at any CP ≤ 2500.',
      });
    }
    queries.push({
      id: 'pvp_ul_primary',
      label: 'Built Double-Moved UL (1501–2500 CP)',
      query: 'cp1501-2500&!@3mov&!#',
    });
    queries.push({
      id: 'pvp_ul_needs_work',
      label: 'Tagged UL Needing 2nd Move / Evo',
      query: `${ulHash}&@3mov,evolve`,
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
        note: 'No minimum CP filter — catches Level 20 Raid Bosses, hatches, and pre-evolutions that need powering up and a 2nd move.',
      });
      queries.push({
        id: 'pvp_ml_meta_hundos',
        label: 'ML Top-100 4★ Hundos (Any CP)',
        query: `!#&4*&${mlAllDex}`,
      });
    }
    queries.push({
      id: 'pvp_ml_primary',
      label: 'Built Double-Moved ML (3000+ CP)',
      query: 'cp3000-&!@3mov&3*,4*&4attack&!#',
    });
    queries.push({
      id: 'pvp_ml_needs_work',
      label: 'Tagged ML Needing 2nd Move / Evo',
      query: `${mlHash}&@3mov,evolve`,
      isSecondary: true,
    });
    return queries;
  },

  pvp_cup: () => [
    {
      id: 'pvp_cup_primary',
      label: 'Built Little Cup (≤500 CP Double-Moved)',
      query: 'cp-500&!@3mov&!#',
    },
    {
      id: 'pvp_cup_little_candidates',
      label: 'Little Cup Low-Atk Candidates (≤500 CP)',
      query: '0-1attack&3-4defense&3-4hp&cp-500&!#',
    },
    {
      id: 'pvp_cup_limited_spice',
      label: 'Limited Cup Low-Atk Spice (≤1500 CP)',
      query: '0-1attack&3-4defense&3-4hp&cp-1500&!#',
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
          note: 'Scoped to verified PvE raid families at CP 3000+, XL-powered, or Mega3 so unbuilt weather-boosted Lv25 raid catches (CP 2500–2950) stay free for Stage 4 PVE-WIP.',
        },
        {
          id: 'pve_raid_broad',
          label: 'Lower-CP Built Raiders (CP 2500+ Meta)',
          query: `cp2500-,candyxl,mega3-&3*,4*,shadow&!#&${allPveDex}`,
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
      },
    ];
  },

  max_atk: () => [
    {
      id: 'max_atk_primary',
      label: 'Max Attack Lv2–3 (Built Attackers)',
      query: 'maxmove2-&!maxspirit2-&!#',
      note: 'Catches Max Attack Lv2–3 builds (including attackers that also have Max Guard unlocked) while leaving dedicated Healers for MAX-Heal.',
    },
    {
      id: 'max_atk_gmax',
      label: 'Powered-Up Gigantamax',
      query: 'gigantamax&cp2000-&!#',
      isSecondary: true,
    },
  ],

  max_heal: () => [
    {
      id: 'max_heal_primary',
      label: 'Max Spirit Unlocked',
      query: 'maxmove1-&maxspirit1-&!#',
    },
    {
      id: 'max_heal_blissey',
      label: 'Chansey / Blissey Max',
      query: '113,242&maxmove1-&!#',
      isSecondary: true,
    },
  ],

  max_tank: () => [
    {
      id: 'max_tank_primary',
      label: 'Max Guard Unlocked',
      query: 'maxmove1-&maxguard1-&!#',
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
    const queries = [];

    if (glUlLowAtkDex) {
      queries.push({
        id: 'pvp_wip_meta',
        label: 'Meta GL/UL Low-Atk',
        query: `!#&0-1attack&3-4defense&3-4hp&cp-2500&${glUlLowAtkDex}`,
      });
    }
    if (glUlHighAtkDex) {
      queries.push({
        id: 'pvp_wip_xl',
        label: 'Meta GL/UL XL High-Atk',
        query: `!#&2-4attack&3-4defense&3-4hp&cp-2500&${glUlHighAtkDex}`,
        note: 'Catches XL/hundo-cap GL & UL staples (Lickitung, Medicham, Corsola, Tinkaton, Talonflame, Umbreon).',
      });
    }
    queries.push({
      id: 'pvp_wip_league_needs_move',
      label: 'League-Tagged Needing 2nd Move (@3mov)',
      query: `${leagueHashes}&@3mov`,
      note: 'Finds Pokémon already tagged PVP-GL / PVP-UL / PVP-ML whose 2nd Charged Move is still locked (@3mov). Dual-tag with PVP-WIP until built.',
    });
    queries.push({
      id: 'pvp_wip_league_needs_evo',
      label: 'League-Tagged Needing Evolution',
      query: `${leagueHashes}&evolve`,
      isSecondary: true,
    });
    if (mlAllDex) {
      queries.push({
        id: 'pvp_wip_ml',
        label: 'Meta Master League (15-Atk)',
        query: `!#&3*,4*&4attack&${mlAllDex}`,
        isSecondary: true,
      });
    }
    queries.push({
      id: 'pvp_wip_broad',
      label: glUlLowAtkDex ? 'Broad Spicy Low-Atk' : 'Low-Atk PvP IVs',
      query: '0-1attack&3-4defense&3-4hp&cp-2500&!#',
      isSecondary: Boolean(glUlLowAtkDex),
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
      },
      {
        id: 'pve_wip_shadows',
        label: 'Top PvE Shadows',
        query: pveShadowDex ? `!#&shadow&${pveShadowDex}` : '!#&shadow',
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
        note: 'mega0 matches fully evolved Mega-capable species that have never been Mega Evolved.',
      },
      {
        id: 'pve_megawip_preevos',
        label: 'Mega Pre-Evolutions Only',
        query: pveMegaPreEvoDex
          ? `!#&!shadow&3*,4*&4attack&${pveMegaPreEvoDex}`
          : '!#&!shadow&evolve&3*,4*&4attack',
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
    },
  ],

  max_candy: () => [
    {
      id: 'max_candy_primary',
      label: 'Power Spot Candy Mules',
      query: 'dynamax&!maxmove2-&!maxguard1-&!maxspirit1-&0*,1*,2*&!shiny&!background&!#',
    },
  ],

  tr_spec: () => [
    {
      id: 'tr_spec_primary',
      label: 'Special / Lucky Tradeables',
      query: 'shiny,legendary,ultrabeast,costume,background&!traded&!shadow&!fusion&!mythical&!favorite&!4*&!#',
      note: 'Excludes Shadows, Fusions, and Mythicals (which cannot be traded in Pokémon GO; Meltan/Melmetal can be tagged manually if desired).',
    },
  ],

  tr_dist: () => [
    {
      id: 'tr_dist_primary',
      label: '100km+ Distance Tradeables',
      query: 'distance100-&!traded&!shadow&!fusion&!shiny&!legendary&!mythical&!ultrabeast&!4*&!favorite&!#',
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
        note: 'Scoped to PvE/PvP meta, pseudo-legendaries, egg rares, and CD pre-evos so common wild fodder does not flood TR-Mirror.',
      },
      {
        id: 'tr_mirror_max',
        label: 'Untraded Low-IV Max Spares',
        query: 'maxmove1-&!traded&!shadow&!fusion&!favorite&!shiny&!4*&!background&0*,1*,2*&!#',
        isSecondary: true,
      },
    ];
  },

  op_mega: () => [
    {
      id: 'op_mega_primary',
      label: 'Mega Lv1–2 Grind',
      query: 'mega1-2&!#',
    },
    {
      id: 'op_mega_lv4',
      label: 'Lv4 Super Max Target',
      query: 'mega1-3&!#',
      isSecondary: true,
    },
  ],

  op_xxl: () => [
    {
      id: 'op_xxl_primary',
      label: 'Untagged XXLs',
      query: 'xxl&!#',
    },
  ],

  op_tmfrust: () => [
    {
      id: 'op_tmfrust_highiv',
      label: 'High-IV Shadows',
      query: 'shadow&@frustration&3*,4*&!#',
    },
    {
      id: 'op_tmfrust_pvp',
      label: 'PvP IVs',
      query: 'shadow&@frustration&0-1attack&3-4defense&3-4hp&!#',
    },
  ],

  op_buddy: () => [
    {
      id: 'op_buddy_primary',
      label: 'Active Buddies (Lv1–4)',
      query: 'buddy1-4&!#',
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
        note: 'Intentionally omits !@special because Shadow Frustration and Purified Return count as @special — ensures Shadow Mudkip/Beldum/Bagon/Rhyhorn pre-evolutions surface cleanly!',
      },
      {
        id: 'op_evocd_pvp',
        label: 'PvP-IV CD Pre-Evos',
        query: `evolve&!#&!favorite&0-1attack&3-4defense&3-4hp&cp-2500&${COMPRESSED_CD_PRE_EVO_DEX}`,
        isSecondary: true,
      },
      {
        id: 'op_evocd_wip',
        label: 'WIP Evolves',
        query: wipEvoHashes.length > 0 ? `${wipEvoHashes.join(',')}&evolve` : 'evolve&!#&3*,4*',
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
      },
      {
        id: 'op_evoxp_traded',
        label: 'Already-Traded Free Evos',
        query: `traded&evolve&!favorite&!#&${compressIds(tradeEvoIds)}`,
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
        note: 'Pick the WIP builds you are actively spending Stardust/Candy on right now; remove once they reach target CP/Lv40/Lv50.',
      },
      {
        id: 'op_powerwip_xl',
        label: 'Partially XL-Powered (Lv41–49)',
        query: opPowerWipHash ? `candyxl&3*,4*&!${opPowerWipHash}` : 'candyxl&3*,4*&!#',
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
        note: 'Run after Stage 4 WIP tags (and OP-PowerWIP) are populated so only genuine build projects enter your Field Research Power-Up queue.',
      },
    ];
  },

  op_2xxfer: () => [
    {
      id: 'op_2xxfer_primary',
      label: '0★–2★ Excess Legendaries & UBs',
      query: `legendary,ultrabeast&0*,1*,2*&!lucky&!shiny&!4*&!background&!favorite&!fusion&!adventureeffect&!@special&@3mov&${PVP_IV_EXCLUDE_CLAUSE}&!#`,
      note: 'Protects Mythicals, 3★–4★s, Fusions, Adventure Effects, Legacy Moves, PvP-IV rerolls, and double-moved builds (@3mov).',
    },
    {
      id: 'op_2xxfer_dup3star',
      label: 'Duplicate Non-15-Atk 3★ Legendaries',
      query: 'legendary,ultrabeast&3*&0-3attack&count2-&!lucky&!shiny&!4*&!background&!favorite&!fusion&!adventureeffect&!@special&@3mov&!#',
      isSecondary: true,
    },
  ],

  op_purify1k: () => [
    {
      id: 'op_purify1k_primary',
      label: '1k Stardust Expendable Shadows (0★–2★)',
      query: `shadow&candykm1&0*,1*,2*&!shiny&!4*&!favorite&${PVP_IV_EXCLUDE_CLAUSE}&!#`,
      note: 'Excludes 3★–4★ shadows (like 13/13/13+ purify-for-hundo candidates) and 0-1atk PvP IV spreads (e.g., Shadow Golbat/Staraptor/Altaria).',
    },
  ],
};

export function buildTagHydrationQueries(tagId, tagMap = null, metaSnapshot = null) {
  const builder = HYDRATION_BUILDERS[tagId];
  if (!builder) return [];
  const merged = tagMap ? mergeTagMap(tagMap) : createDefaultTagMap();
  return builder({
    merged,
    pvp: metaSnapshot?.pvp || {},
    pve: metaSnapshot?.pve || {},
    special: metaSnapshot?.specialLists || {},
  });
}

export function getAllTagHydrationSteps(tagMap = null, metaSnapshot = null) {
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
        queries: buildTagHydrationQueries(def.id, merged, metaSnapshot),
      });
    }
  }

  return steps;
}
