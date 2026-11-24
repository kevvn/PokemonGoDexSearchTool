import { useCallback, useMemo, useState } from 'react';
import { lintTagMap, resolveTagsList } from '../models/tagModel';
import {
  SAFETY_SHIELD_DEFINITIONS,
  buildTriageFunnels,
  createDefaultSafetyShields,
} from '../models/triageFunnelModel';

export function useTriageFunnelsController({ metaSnapshot, customTagMap, customTags }) {
  const effectiveTagMap = customTagMap ?? customTags?.tagMap ?? null;

  const [activeMode, setActiveMode] = useState('modeA');
  const [ageScope, setAgeScope] = useState('age0');
  const [pveType, setPveType] = useState('fire');
  const [safetyShields, setSafetyShields] = useState(createDefaultSafetyShields);
  const [shieldsOpen, setShieldsOpen] = useState(false);
  const [emergencyOpen, setEmergencyOpen] = useState(true);

  const toggleShield = useCallback((shieldId) => {
    setSafetyShields((prev) => ({
      ...prev,
      [shieldId]: !prev[shieldId],
    }));
  }, []);

  const resetShields = useCallback(() => {
    setSafetyShields(createDefaultSafetyShields());
  }, []);

  const toggleShieldsPanel = useCallback(() => {
    setShieldsOpen((v) => !v);
  }, []);

  const toggleEmergencyPanel = useCallback(() => {
    setEmergencyOpen((v) => !v);
  }, []);

  const enabledShieldCount = useMemo(
    () => SAFETY_SHIELD_DEFINITIONS.filter((d) => safetyShields[d.id]).length,
    [safetyShields]
  );

  const resolvedTags = useMemo(
    () => (effectiveTagMap ? resolveTagsList(effectiveTagMap) : customTags?.resolvedTags || []),
    [effectiveTagMap, customTags?.resolvedTags]
  );

  const tagErrorCount = useMemo(() => {
    if (customTags?.lintResults) return customTags.lintResults.errorCount || 0;
    return effectiveTagMap ? lintTagMap(effectiveTagMap).errorCount : 0;
  }, [effectiveTagMap, customTags?.lintResults]);

  const missingCoreLock = !safetyShields.untagged || !safetyShields.favorite;

  const funnels = useMemo(
    () =>
      buildTriageFunnels(metaSnapshot, effectiveTagMap, {
        ageScope,
        safetyShields,
        pveType,
      }),
    [metaSnapshot, effectiveTagMap, ageScope, safetyShields, pveType]
  );

  return useMemo(
    () => ({
      activeMode,
      setActiveMode,
      ageScope,
      setAgeScope,
      pveType,
      setPveType,
      safetyShields,
      shieldsOpen,
      emergencyOpen,
      enabledShieldCount,
      missingCoreLock,
      resolvedTags,
      tagErrorCount,
      funnels,
      toggleShield,
      resetShields,
      toggleShieldsPanel,
      toggleEmergencyPanel,
    }),
    [
      activeMode,
      ageScope,
      pveType,
      safetyShields,
      shieldsOpen,
      emergencyOpen,
      enabledShieldCount,
      missingCoreLock,
      resolvedTags,
      tagErrorCount,
      funnels,
      toggleShield,
      resetShields,
      toggleShieldsPanel,
      toggleEmergencyPanel,
    ]
  );
}
