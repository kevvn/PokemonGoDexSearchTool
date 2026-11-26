import { useCallback, useMemo, useState } from 'react';
import {
  COSTUME_PIKACHU_REGISTRY,
  buildCostumeEntrySearchString,
  filterCostumePikachuCatalog,
  getPikachuYearSlices,
} from '../models/costumePikachuModel';

export function useCostumePikachuCatalogController({ yearSlice = '', includeFamily = false } = {}) {
  const [search, setSearch] = useState('');
  const [rarity, setRarity] = useState('all');
  const [trait, setTrait] = useState('all');
  const [catalogOpen, setCatalogOpen] = useState(true);

  const toggleCatalogOpen = useCallback(() => {
    setCatalogOpen((v) => !v);
  }, []);

  const resetCatalogFilters = useCallback(() => {
    setSearch('');
    setRarity('all');
    setTrait('all');
  }, []);

  const yearSlices = useMemo(() => getPikachuYearSlices(COSTUME_PIKACHU_REGISTRY), []);

  const filteredEntries = useMemo(() => {
    const matched = filterCostumePikachuCatalog(COSTUME_PIKACHU_REGISTRY, {
      search,
      rarity,
      yearSlice,
      trait,
    });
    return matched.map((entry) => ({
      ...entry,
      searchQuery: buildCostumeEntrySearchString(entry, { includeFamily }),
    }));
  }, [search, rarity, yearSlice, trait, includeFamily]);

  const hasActiveFilters = Boolean(search.trim()) || rarity !== 'all' || trait !== 'all';

  return useMemo(
    () => ({
      search,
      setSearch,
      rarity,
      setRarity,
      trait,
      setTrait,
      catalogOpen,
      toggleCatalogOpen,
      resetCatalogFilters,
      yearSlices,
      filteredEntries,
      totalEntries: COSTUME_PIKACHU_REGISTRY.length,
      hasActiveFilters,
    }),
    [
      search,
      rarity,
      trait,
      catalogOpen,
      toggleCatalogOpen,
      resetCatalogFilters,
      yearSlices,
      filteredEntries,
      hasActiveFilters,
    ]
  );
}
