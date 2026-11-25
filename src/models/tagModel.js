/**
 * Tag System domain model facade: persistent stores, mutations, and re-exports.
 */
import { createPersistentStore } from './storage/createPersistentStore';
import {
  TAG_NAMESPACES,
  TAG_COLOR_LABELS,
  CORE_TAGS,
  OPTIONAL_TAGS,
  DEFAULT_TAGS,
  ALL_TAG_DEFINITIONS,
  TAG_DEFINITION_BY_ID,
  HYDRATION_STAGES,
} from './tags/tagDefinitions';
import {
  NATIVE_POGO_KEYWORDS,
  SHORTCUT_KEYWORDS,
  FORBIDDEN_TAG_CHAR_REGEX,
  createDefaultTagMap,
  mergeTagMap,
  resolveTagsList,
  lintTagName,
  lintTagMap,
  getTagHash,
  getNamespaceHashes,
  getNamespaceExclusions,
  getRecommendedDragOrder,
  formatTagSetupListText,
} from './tags/tagLinter';
import {
  EVENT_HYDRATION_YEARS,
  buildTagHydrationQueries,
  getAllTagHydrationSteps,
} from './tags/tagHydration';

export {
  TAG_NAMESPACES,
  TAG_COLOR_LABELS,
  CORE_TAGS,
  OPTIONAL_TAGS,
  DEFAULT_TAGS,
  ALL_TAG_DEFINITIONS,
  TAG_DEFINITION_BY_ID,
  HYDRATION_STAGES,
  NATIVE_POGO_KEYWORDS,
  SHORTCUT_KEYWORDS,
  FORBIDDEN_TAG_CHAR_REGEX,
  createDefaultTagMap,
  mergeTagMap,
  resolveTagsList,
  lintTagName,
  lintTagMap,
  getTagHash,
  getNamespaceHashes,
  getNamespaceExclusions,
  getRecommendedDragOrder,
  formatTagSetupListText,
  EVENT_HYDRATION_YEARS,
  buildTagHydrationQueries,
  getAllTagHydrationSteps,
};

// Persistent Stores for Custom Tags & 6-Stage Hydration Checklist
export const tagStore = createPersistentStore({
  key: 'pokedex_custom_tags',
  schemaVersion: 1,
  getDefaultValue: createDefaultTagMap,
  deserialize: (raw) => mergeTagMap(JSON.parse(raw)),
  migrate: (oldData) => mergeTagMap(oldData),
});

export const hydrationProgressStore = createPersistentStore({
  key: 'pogo_tag_hydration_checked_v1',
  getDefaultValue: () => ({}),
  deserialize: (raw) => {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  },
});

export function updateTagName(tagId, newName) {
  tagStore.setState((prev) => {
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
}

export function toggleTagEnabled(tagId) {
  tagStore.setState((prev) => {
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
}

export function resetAllTags() {
  tagStore.setState(createDefaultTagMap());
}

export function toggleHydrationChecked(tagId) {
  hydrationProgressStore.setState((prev) => ({
    ...prev,
    [tagId]: !prev[tagId],
  }));
}

export function resetHydrationProgress() {
  hydrationProgressStore.setState({});
}
