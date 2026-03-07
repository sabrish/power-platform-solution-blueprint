import { makeStyles, tokens, SearchBox, Text } from '@fluentui/react-components';
import type { ReactNode, CSSProperties } from 'react';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
    padding: tokens.spacingVerticalM,
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
  },
  row1: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
  },
  searchBox: {
    flex: '1',
    minWidth: '200px',
  },
  count: {
    flexShrink: 0,
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
    whiteSpace: 'nowrap',
  },
  row2: {
    display: 'flex',
    gap: tokens.spacingHorizontalXL,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  filterGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    flexWrap: 'wrap',
  },
  filterGroupLabel: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    flexShrink: 0,
  },
});

interface FilterBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filteredCount: number;
  totalCount: number;
  itemLabel: string;
  /** Pass filter groups as children — rendered in row 2 below the search box. */
  children?: ReactNode;
  /** Extra inline style for the outer container (e.g. flexShrink: 0). */
  style?: CSSProperties;
}

/**
 * Two-row filter bar used by all component browser list sections.
 * Row 1: SearchBox + item count (right-aligned).
 * Row 2 (only when children are provided): filter groups.
 */
export function FilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search...',
  filteredCount,
  totalCount,
  itemLabel,
  children,
  style,
}: FilterBarProps) {
  const styles = useStyles();
  return (
    <div className={styles.container} style={style}>
      <div className={styles.row1}>
        <SearchBox
          className={styles.searchBox}
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(_, data) => onSearchChange(data.value || '')}
        />
        <Text className={styles.count}>
          {filteredCount} of {totalCount} {itemLabel}
        </Text>
      </div>
      {children && (
        <div className={styles.row2}>
          {children}
        </div>
      )}
    </div>
  );
}

interface FilterGroupProps {
  /** Short label rendered before the filter controls (e.g. "Stage:", "State:"). */
  label: string;
  children: ReactNode;
}

/**
 * A labelled group of filter controls (ToggleButtons, Checkboxes, etc.)
 * rendered inside a FilterBar's second row.
 */
export function FilterGroup({ label, children }: FilterGroupProps) {
  const styles = useStyles();
  return (
    <div className={styles.filterGroup}>
      <Text className={styles.filterGroupLabel}>{label}</Text>
      {children}
    </div>
  );
}
