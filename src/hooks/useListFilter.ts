import { useState, useMemo, useCallback } from 'react';

/**
 * A single Set-based filter dimension.
 * `getKey` extracts the filterable string from an item.
 * When `activeKeys` is empty the filter is inactive (all items pass).
 */
export interface FilterDimension<T> {
  activeKeys: Set<string>;
  getKey: (item: T) => string;
}

/**
 * Return value of useListFilter.
 *
 * `filteredItems`  — items after all active filters and search have been applied
 * `searchQuery`    — current search input value
 * `setSearchQuery` — update the search input
 * `toggleKey`      — toggle a value in/out of a named filter set
 * `clearFilter`    — clear all active keys for a named filter set
 * `activeFilters`  — map of filter-set name → Set<string>
 */
export interface UseListFilterResult<T> {
  filteredItems: T[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  toggleKey: (filterName: string, key: string) => void;
  clearFilter: (filterName: string) => void;
  activeFilters: Record<string, Set<string>>;
}

/**
 * Configuration for a single named filter dimension.
 * `name`   — unique key used to reference this filter via `toggleKey` / `clearFilter`
 * `getKey` — extracts the filterable string from an item
 */
export interface FilterSpec<T> {
  name: string;
  getKey: (item: T) => string;
}

/**
 * Generic list filter hook.
 *
 * Manages search-query state and an arbitrary number of named Set-based filter
 * dimensions. The caller provides:
 *   - `items`           — the full pre-sorted item array
 *   - `searchPredicate` — returns true if the item matches the search query
 *   - `filterSpecs`     — array of { name, getKey } for each toggle-filter dimension
 *
 * All filter dimensions are AND-ed together; within each dimension active keys
 * are OR-ed (i.e. an item passes a dimension if its key is in the active set,
 * or if the active set is empty).
 *
 * Stability note: `filterSpecs` must be defined outside the component render
 * (module-level constant) or memoised — it is used as a useMemo dependency via
 * its individual elements.
 *
 * @example
 * ```typescript
 * const FILTER_SPECS = [
 *   { name: 'type',  getKey: (f: Flow) => f.definition.triggerType },
 *   { name: 'state', getKey: (f: Flow) => f.state },
 * ] satisfies FilterSpec<Flow>[];
 *
 * const { filteredItems, searchQuery, setSearchQuery, toggleKey, clearFilter, activeFilters } =
 *   useListFilter(sortedFlows, (f, q) =>
 *     f.name.toLowerCase().includes(q) ||
 *     (f.entity?.toLowerCase().includes(q) ?? false),
 *   FILTER_SPECS);
 * ```
 */
export function useListFilter<T>(
  items: T[],
  searchPredicate: (item: T, lowerQuery: string) => boolean,
  filterSpecs: readonly FilterSpec<T>[],
): UseListFilterResult<T> {
  const [searchQuery, setSearchQuery] = useState('');

  // Initialise one Set per spec, keyed by name
  const [activeFilters, setActiveFilters] = useState<Record<string, Set<string>>>(() =>
    Object.fromEntries(filterSpecs.map((spec) => [spec.name, new Set<string>()]))
  );

  const toggleKey = useCallback((filterName: string, key: string) => {
    setActiveFilters((prev) => {
      const current = prev[filterName] ?? new Set<string>();
      const next = new Set(current);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return { ...prev, [filterName]: next };
    });
  }, []);

  const clearFilter = useCallback((filterName: string) => {
    setActiveFilters((prev) => ({ ...prev, [filterName]: new Set<string>() }));
  }, []);

  const filteredItems = useMemo(() => {
    let result = items;

    // Apply each Set-based filter dimension
    for (const spec of filterSpecs) {
      const active = activeFilters[spec.name];
      if (active && active.size > 0) {
        result = result.filter((item) => active.has(spec.getKey(item)));
      }
    }

    // Apply search
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      result = result.filter((item) => searchPredicate(item, q));
    }

    return result;
  }, [items, filterSpecs, activeFilters, searchQuery, searchPredicate]);

  return {
    filteredItems,
    searchQuery,
    setSearchQuery,
    toggleKey,
    clearFilter,
    activeFilters,
  };
}
