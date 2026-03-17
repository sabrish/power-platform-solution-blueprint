import { useState, useCallback } from 'react';

/**
 * Shared expand/collapse state for card-row list components.
 * Use this instead of repeating useState + toggleExpand in every list.
 */
export function useExpandable() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const toggleExpand = useCallback((id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  }, []);
  return { expandedId, toggleExpand };
}
