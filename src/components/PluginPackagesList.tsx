import { useMemo, useState, useCallback } from 'react';
import {
  Text,
  Badge,
  makeStyles,
  tokens,
  Checkbox,
} from '@fluentui/react-components';
import { FilterBar, FilterGroup } from './FilterBar';
import { ChevronDown20Regular, ChevronRight20Regular } from '@fluentui/react-icons';
import { EmptyState } from './EmptyState';
import type { PluginStep } from '../core';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  row: {
    display: 'grid',
    gridTemplateColumns: `${tokens.spacingHorizontalXXL} minmax(200px, 2fr) auto auto`,
    gap: tokens.spacingHorizontalM,
    alignItems: 'start',
    padding: tokens.spacingVerticalM,
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
      boxShadow: tokens.shadow4,
    },
  },
  rowExpanded: {
    backgroundColor: tokens.colorBrandBackground2,
  },
  chevron: {
    display: 'flex',
    alignItems: 'center',
    color: tokens.colorNeutralForeground3,
  },
  nameColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    minWidth: 0,
    wordBreak: 'break-word',
  },
  codeText: {
    fontFamily: 'Consolas, Monaco, monospace',
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  badgeGroup: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    alignItems: 'center',
  },
  expandedDetails: {
    backgroundColor: tokens.colorNeutralBackground2,
    padding: tokens.spacingVerticalL,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderTop: 'none',
    borderRadius: `0 0 ${tokens.borderRadiusMedium} ${tokens.borderRadiusMedium}`,
    marginTop: '-4px',
  },
  stepTable: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
  },
  stepHeader: {
    display: 'grid',
    gridTemplateColumns: 'minmax(200px, 2fr) minmax(100px, 1fr) auto auto auto auto',
    gap: tokens.spacingHorizontalM,
    padding: `${tokens.spacingVerticalXS} ${tokens.spacingVerticalS}`,
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  stepHeaderText: {
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground3,
  },
  stepRow: {
    display: 'grid',
    gridTemplateColumns: 'minmax(200px, 2fr) minmax(100px, 1fr) auto auto auto auto',
    gap: tokens.spacingHorizontalM,
    padding: `${tokens.spacingVerticalXS} ${tokens.spacingVerticalS}`,
    borderRadius: tokens.borderRadiusMedium,
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
    alignItems: 'center',
  },
  stepName: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    minWidth: 0,
    wordBreak: 'break-word',
  },
});

interface PluginPackage {
  assemblyName: string;
  steps: PluginStep[];
  enabledCount: number;
  disabledCount: number;
}

export interface PluginPackagesListProps {
  plugins: PluginStep[];
}

export function PluginPackagesList({ plugins }: PluginPackagesListProps): JSX.Element {
  const styles = useStyles();
  const [expandedPackage, setExpandedPackage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDisabledOnly, setShowDisabledOnly] = useState(false);

  // Group plugins by assemblyName
  const packages = useMemo<PluginPackage[]>(() => {
    const map = new Map<string, PluginStep[]>();
    for (const step of plugins) {
      const key = step.assemblyName;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(step);
    }
    const result: PluginPackage[] = [];
    map.forEach((steps, assemblyName) => {
      result.push({
        assemblyName,
        steps: [...steps].sort((a, b) => {
          if (a.entity !== b.entity) return a.entity.localeCompare(b.entity);
          if (a.message !== b.message) return a.message.localeCompare(b.message);
          if (a.stage !== b.stage) return a.stage - b.stage;
          return a.rank - b.rank;
        }),
        enabledCount: steps.filter(s => s.state === 'Enabled').length,
        disabledCount: steps.filter(s => s.state === 'Disabled').length,
      });
    });
    return result.sort((a, b) => a.assemblyName.localeCompare(b.assemblyName));
  }, [plugins]);

  // Apply search and checkbox filters
  const filteredPackages = useMemo<PluginPackage[]>(() => {
    let filtered = packages;
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      filtered = filtered.filter(pkg =>
        pkg.assemblyName.toLowerCase().includes(q) ||
        pkg.steps.some(s =>
          s.name.toLowerCase().includes(q) ||
          s.typeName.toLowerCase().includes(q) ||
          s.entity.toLowerCase().includes(q)
        )
      );
    }
    if (showDisabledOnly) {
      filtered = filtered.filter(pkg => pkg.disabledCount > 0);
    }
    return filtered;
  }, [packages, searchQuery, showDisabledOnly]);

  const toggleExpand = useCallback((assemblyName: string) => {
    setExpandedPackage((prev) => (prev === assemblyName ? null : assemblyName));
  }, []);

  if (plugins.length === 0) {
    return (
      <EmptyState
        type="plugins"
        title="No Plugin Packages Found"
        message="No plugins were found in the selected solution(s)."
      />
    );
  }

  return (
    <div className={styles.container}>
      <FilterBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search plugin packages..."
        filteredCount={filteredPackages.length}
        totalCount={packages.length}
        itemLabel={packages.length !== 1 ? 'packages' : 'package'}
      >
        <FilterGroup label="Show:">
          <Checkbox
            label="Show only packages with disabled steps"
            checked={showDisabledOnly}
            onChange={(_, data) => setShowDisabledOnly(data.checked === true)}
          />
        </FilterGroup>
      </FilterBar>

      {filteredPackages.length === 0 && packages.length > 0 ? (
        <EmptyState type="search" />
      ) : null}

      {filteredPackages.map(pkg => {
        const isExpanded = expandedPackage === pkg.assemblyName;
        return (
          <div key={pkg.assemblyName}>
            <div
              className={`${styles.row} ${isExpanded ? styles.rowExpanded : ''}`}
              role="button"
              tabIndex={0}
              aria-expanded={isExpanded}
              onClick={() => toggleExpand(pkg.assemblyName)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleExpand(pkg.assemblyName); } }}
            >
              <div className={styles.chevron}>
                {isExpanded ? <ChevronDown20Regular /> : <ChevronRight20Regular />}
              </div>
              <div className={styles.nameColumn}>
                <Text weight="semibold">{pkg.assemblyName}</Text>
                <Text className={styles.codeText}>
                  {pkg.steps.length} step{pkg.steps.length !== 1 ? 's' : ''}
                </Text>
              </div>
              <div className={styles.badgeGroup}>
                {pkg.enabledCount > 0 && (
                  <Badge appearance="filled" color="success" size="medium" shape="rounded">
                    {pkg.enabledCount} Enabled
                  </Badge>
                )}
                {pkg.disabledCount > 0 && (
                  <Badge appearance="filled" color="important" size="medium" shape="rounded">
                    {pkg.disabledCount} Disabled
                  </Badge>
                )}
              </div>
            </div>
            {isExpanded && (
              <div className={styles.expandedDetails}>
                <div className={styles.stepTable}>
                  <div className={styles.stepHeader}>
                    <Text className={styles.stepHeaderText}>Step Name / Type</Text>
                    <Text className={styles.stepHeaderText}>Entity</Text>
                    <Text className={styles.stepHeaderText}>Message</Text>
                    <Text className={styles.stepHeaderText}>Stage</Text>
                    <Text className={styles.stepHeaderText}>Mode</Text>
                    <Text className={styles.stepHeaderText}>State</Text>
                  </div>
                  {pkg.steps.map(step => (
                    <div key={step.id} className={styles.stepRow}>
                      <div className={styles.stepName}>
                        <Text weight="semibold" size={200}>{step.name}</Text>
                        <Text className={styles.codeText}>{step.typeName}</Text>
                      </div>
                      <Text className={styles.codeText}>{step.entity || '—'}</Text>
                      <Badge appearance="outline" shape="rounded" size="small">
                        {step.message}
                      </Badge>
                      <Badge appearance="tint" color="brand" shape="rounded" size="small">
                        {step.stageName}
                      </Badge>
                      <Badge
                        appearance="tint"
                        color={step.mode === 0 ? 'brand' : 'warning'}
                        shape="rounded"
                        size="small"
                      >
                        {step.modeName}
                      </Badge>
                      <Badge
                        appearance="filled"
                        color={step.state === 'Enabled' ? 'success' : 'important'}
                        shape="rounded"
                        size="small"
                      >
                        {step.state}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
