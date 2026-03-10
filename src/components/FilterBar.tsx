import { makeStyles, tokens, SearchBox, Text, Button } from '@fluentui/react-components';
import { DismissCircle16Regular } from '@fluentui/react-icons';
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
  filterGroupLabelActive: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorBrandForeground1,
    fontWeight: tokens.fontWeightSemibold,
    flexShrink: 0,
  },
  filterGroupLabelContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
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
          size="medium"
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
  /** Whether this group currently has active filters — highlights the label. */
  hasActiveFilters?: boolean;
  /** Callback to clear this group's filters — renders a dismiss icon button next to the label. */
  onClear?: () => void;
}

/**
 * A labelled group of filter controls (ToggleButtons, Checkboxes, etc.)
 * rendered inside a FilterBar's second row.
 *
 * When `hasActiveFilters` is true and `onClear` is provided, the label renders
 * in brand colour with semibold weight, and a dismiss icon button appears beside it.
 */
export function FilterGroup({ label, children, hasActiveFilters, onClear }: FilterGroupProps) {
  const styles = useStyles();
  const isActive = hasActiveFilters === true && onClear !== undefined;

  // Strip trailing colon from label for the button title
  const labelText = label.endsWith(':') ? label.slice(0, -1) : label;

  return (
    <div className={styles.filterGroup}>
      <div className={styles.filterGroupLabelContainer}>
        <Text className={isActive ? styles.filterGroupLabelActive : styles.filterGroupLabel}>
          {label}
        </Text>
        {isActive && (
          <Button
            appearance="subtle"
            size="small"
            icon={<DismissCircle16Regular style={{ color: tokens.colorBrandForeground1 }} />}
            title={`Clear ${labelText} filter`}
            onClick={onClear}
          />
        )}
      </div>
      {children}
    </div>
  );
}
