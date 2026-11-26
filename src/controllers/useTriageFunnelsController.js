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
  const [pikachuKeepCap, setPikachuKeepCap] = useState(6);
  const [pikachuYearSlice, setPikachuYearSlice] = useState('');
  const [pikachuGender, setPikachuGender] = useState('');
  const [pikachuIncludeFamily, setPikachuIncludeFamily] = useState(false);

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

  const togglePikachuIncludeFamily = useCallback(() => {
    setPikachuIncludeFamily((v) => !v);
  }, []);

  const enabledShieldCount = useMemo(
    () => SAFETY_SHIELD_DEFINITIONS.filter((d) => safetyShields[d.id]).length,
    [safetyShields]
  );

  const customResolvedTags = customTags?.resolvedTags;
  const resolvedTags = useMemo(
    () => (effectiveTagMap ? resolveTagsList(effectiveTagMap) : customResolvedTags || []),
    [effectiveTagMap, customResolvedTags]
  );

  const customLintResults = customTags?.lintResults;
  const tagErrorCount = useMemo(() => {
    if (customLintResults) return customLintResults.errorCount || 0;
    return effectiveTagMap ? lintTagMap(effectiveTagMap).errorCount : 0;
  }, [effectiveTagMap, customLintResults]);

  const missingCoreLock = !safetyShields.untagged || !safetyShields.favorite;

  const funnels = useMemo(
    () =>
      buildTriageFunnels(metaSnapshot, effectiveTagMap, {
        ageScope,
        safetyShields,
        pveType,
        pikachuKeepCap,
        pikachuYearSlice,
        pikachuGender,
        pikachuIncludeFamily,
      }),
    [
      metaSnapshot,
      effectiveTagMap,
      ageScope,
      safetyShields,
      pveType,
      pikachuKeepCap,
      pikachuYearSlice,
      pikachuGender,
      pikachuIncludeFamily,
    ]
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
      pikachuKeepCap,
      setPikachuKeepCap,
      pikachuYearSlice,
      setPikachuYearSlice,
      pikachuGender,
      setPikachuGender,
      pikachuIncludeFamily,
      togglePikachuIncludeFamily,
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
      pikachuKeepCap,
      pikachuYearSlice,
      pikachuGender,
      pikachuIncludeFamily,
      togglePikachuIncludeFamily,
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
