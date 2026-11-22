import { useMemo, useCallback } from 'react';
import useLocalStorage from './useLocalStorage';
import {
  ALL_TAG_DEFINITIONS,
  createDefaultTagMap,
  mergeTagMap,
  lintTagMap,
  getTagHash as resolveTagHash,
} from '../utils/tagSystem';

const STORAGE_KEY = 'pokedex_custom_tags';
const SCHEMA_VERSION = 1;

const storageOptions = {
  schemaVersion: SCHEMA_VERSION,
  deserialize: (raw) => mergeTagMap(JSON.parse(raw)),
  migrate: (oldData) => mergeTagMap(oldData),
};

/**
 * Manages user-customizable tag names & enabled toggles with versioned localStorage persistence
 * and live Pokémon GO keyword / prefix collision linting.
 */
function useCustomTags() {
  const [tagMap, setTagMap] = useLocalStorage(
    STORAGE_KEY,
    createDefaultTagMap,
    storageOptions
  );

  const resolvedTags = useMemo(
    () =>
      ALL_TAG_DEFINITIONS.map((def) => ({
        ...def,
        name: tagMap[def.id]?.name ?? def.defaultName,
        enabled: tagMap[def.id]?.enabled ?? !def.optional,
      })),
    [tagMap]
  );

  const lintResults = useMemo(() => lintTagMap(tagMap), [tagMap]);

  const updateTagName = useCallback(
    (tagId, newName) => {
      setTagMap((prev) => {
        const merged = mergeTagMap(prev);
        if (!merged[tagId]) return merged;
        return {
          ...merged,
          [tagId]: {
            ...merged[tagId],
            name: newName,
          },
        };
      });
    },
    [setTagMap]
  );

  const toggleTag = useCallback(
    (tagId) => {
      setTagMap((prev) => {
        const merged = mergeTagMap(prev);
        if (!merged[tagId]) return merged;
        return {
          ...merged,
          [tagId]: {
            ...merged[tagId],
            enabled: !merged[tagId].enabled,
          },
        };
      });
    },
    [setTagMap]
  );

  const resetTags = useCallback(() => {
    setTagMap(createDefaultTagMap());
  }, [setTagMap]);

  const getTagHash = useCallback(
    (tagId) => resolveTagHash(tagId, tagMap),
    [tagMap]
  );

  return {
    tagMap,
    resolvedTags,
    lintResults,
    updateTagName,
    toggleTag,
    resetTags,
    getTagHash,
  };
}

export default useCustomTags;
