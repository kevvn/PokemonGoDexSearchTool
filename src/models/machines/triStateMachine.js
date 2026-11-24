/**
 * Pure Tri-State Filter Machine:
 * - `null` / `undefined` -> off (neutral)
 * - `true` -> include / require
 * - `false` -> exclude / negate
 */

export function cycleTriState(current) {
  if (current === null || current === undefined) return true;
  if (current === true) return false;
  return null;
}

export function toggleTriStateTarget(current, target) {
  const normalizedCurrent = current === true || current === false ? current : null;
  if (target !== true && target !== false) return null;
  return normalizedCurrent === target ? null : target;
}

export function toTriStateLabel(value) {
  if (value === true) return 'include';
  if (value === false) return 'exclude';
  return 'off';
}
