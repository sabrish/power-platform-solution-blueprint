import { useMemo, useState } from 'react';
import {
  Text,
  Badge,
  SearchBox,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { ChevronDown20Regular, ChevronRight20Regular, Box20Regular } from '@fluentui/react-icons';
import type { PluginStep } from '../core';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  filters: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
    flexWrap: 'wrap',
    alignItems: 'center',
    padding: tokens.spacingVerticalM,
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
  },
  searchBox: {
    minWidth: '300px',
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '24px minmax(200px, 2fr) auto auto',
    gap: tokens.spacingHorizontalM,
    alignItems: 'start',
    padding: tokens.spacingVerticalM,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    border: `1px solid rgba(255, 255, 255, 0.08)`,
    borderRadius: tokens.borderRadiusMedium,
    cursor: 'pointer',
    transitionDuration: '0.2s',
    transitionTimingFunction: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
    ':hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
    },
  },
  rowExpanded: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderBottomColor: tokens.colorBrandForeground1,
    borderTopColor: tokens.colorBrandForeground1,
    borderLeftColor: tokens.colorBrandForeground1,
    borderRightColor: tokens.colorBrandForeground1,
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
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    padding: tokens.spacingVerticalL,
    border: `1px solid rgba(255, 255, 255, 0.08)`,
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
  emptyState: {
    padding: tokens.spacingVerticalXXXL,
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.spacingVerticalL,
    color: tokens.colorNeutralForeground3,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: tokens.borderRadiusLarge,
    border: `1px dashed rgba(255, 255, 255, 0.1)`,
    minHeight: '200px',
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

  // Apply search filter
  const filteredPackages = useMemo<PluginPackage[]>(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return packages;
    return packages.filter(pkg =>
      pkg.assemblyName.toLowerCase().includes(q) ||
      pkg.steps.some(s =>
        s.name.toLowerCase().includes(q) ||
        s.typeName.toLowerCase().includes(q) ||
        s.entity.toLowerCase().includes(q)
      )
    );
  }, [packages, searchQuery]);

  const toggleExpand = (assemblyName: string) => {
    setExpandedPackage(expandedPackage === assemblyName ? null : assemblyName);
  };

  if (plugins.length === 0) {
    return (
      <div className={styles.emptyState}>
        <Box20Regular />
        <Text size={500} weight="semibold">No Plugin Packages Found</Text>
        <Text>No plugins were found in the selected solution(s).</Text>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.filters}>
        <SearchBox
          className={styles.searchBox}
          placeholder="Search plugin packages..."
          value={searchQuery}
          onChange={(_, data) => setSearchQuery(data.value || '')}
        />
        <Text style={{ marginLeft: 'auto', color: tokens.colorNeutralForeground3 }}>
          {filteredPackages.length} of {packages.length} package{packages.length !== 1 ? 's' : ''}
        </Text>
      </div>

      {filteredPackages.length === 0 && packages.length > 0 ? (
        <div className={styles.emptyState}>
          <Text>No packages match your search.</Text>
        </div>
      ) : null}

      {filteredPackages.map(pkg => {
        const isExpanded = expandedPackage === pkg.assemblyName;
        return (
          <div key={pkg.assemblyName}>
            <div
              className={`${styles.row} ${isExpanded ? styles.rowExpanded : ''}`}
              onClick={() => toggleExpand(pkg.assemblyName)}
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
