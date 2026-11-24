/**
 * Verified Filter Panel one-tap query recipes (extracted from FilterPanel.jsx for MVC separation).
 */
import { buildSafeTrashQuery } from './triageFunnelModel';

export const VERIFIED_FILTER_PRESETS = [
  {
    id: 'ultra_safe_trash',
    label: 'Safe Trash 0–2★',
    title: 'Ultra-safe mass-transfer string with all rarity, investment, buddy, XL & De Morgan IV shields',
    buildQuery: () => buildSafeTrashQuery({ ageScope: 'age0' }),
    accentClass: 'bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-200',
  },
  {
    id: 'pvp_gl_ul',
    label: 'PvP IVs (GL/UL)',
    title: 'Low Attack + High Def/HP spreads under 2500 CP',
    buildQuery: () => '!#&0-1attack&3-4defense&3-4hp&cp-2500',
    accentClass: 'bg-sky-50 hover:bg-sky-100 text-[#0b698e] border-sky-200',
  },
  {
    id: 'raid_15atk',
    label: '15-Atk Raid 3–4★',
    title: 'High-Attack 3★ & 4★ raid attacker candidates',
    buildQuery: () => '!#&3*,4*&4attack&3-4defense&3-4hp',
    accentClass: 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200',
  },
  {
    id: 'nundos',
    label: '0% Nundos',
    title: 'Find 0/0/0 collector Nundos',
    buildQuery: () => '0attack&0defense&0hp',
    accentClass: 'bg-purple-50 hover:bg-purple-100 text-purple-900 border-purple-200',
  },
  {
    id: 'max_battles',
    label: 'Max Battles',
    title: 'All Dynamax, Gigantamax & Crowned Max-eligible Pokémon',
    buildQuery: () => '!#&maxmove1-',
    accentClass: 'bg-pink-50 hover:bg-pink-100 text-pink-900 border-pink-200',
  },
  {
    id: 'legacy_moves',
    label: 'True Legacy',
    title: 'Legacy/Elite moves excluding Shadow Frustration and Purified Return',
    buildQuery: () => '@special&!@frustration&!@return',
    accentClass: 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-200',
  },
];

export function getVerifiedFilterPresetQuery(presetId) {
  const preset = VERIFIED_FILTER_PRESETS.find((p) => p.id === presetId);
  return preset ? preset.buildQuery() : '';
}
