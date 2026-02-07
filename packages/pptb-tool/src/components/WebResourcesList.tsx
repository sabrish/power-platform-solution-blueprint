import { useMemo, useState } from 'react';
import {
  Text,
  Badge,
  makeStyles,
  tokens,
  Card,
  Title3,
  SearchBox,
  Checkbox,
  Dropdown,
  Option,
} from '@fluentui/react-components';
import { ChevronDown20Regular, ChevronRight20Regular } from '@fluentui/react-icons';
import type { WebResource } from '@ppsb/core';
import { CodeViewer } from './CodeViewer';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
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
  listContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  emptyState: {
    padding: tokens.spacingVerticalXXXL,
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: tokens.spacingVerticalL,
    color: tokens.colorNeutralForeground3,
  },
  resourceRow: {
    display: 'grid',
    gridTemplateColumns: '24px minmax(200px, 2fr) minmax(100px, 1fr) auto auto auto auto',
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
  resourceRowExpanded: {
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
  wrapText: {
    wordBreak: 'break-word',
    overflowWrap: 'break-word',
    hyphens: 'auto',
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
    flexWrap: 'wrap',
  },
  expandedDetails: {
    backgroundColor: tokens.colorNeutralBackground2,
    padding: tokens.spacingVerticalL,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderTop: 'none',
    borderRadius: `0 0 ${tokens.borderRadiusMedium} ${tokens.borderRadiusMedium}`,
    marginTop: '-4px',
  },
  detailsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: tokens.spacingHorizontalM,
  },
  detailItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXXS,
  },
  detailLabel: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  detailValue: {
    fontWeight: tokens.fontWeightSemibold,
  },
  section: {
    marginTop: tokens.spacingVerticalM,
  },
  warningBox: {
    padding: tokens.spacingVerticalM,
    backgroundColor: tokens.colorPaletteYellowBackground2,
    borderRadius: tokens.borderRadiusMedium,
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
  },
  externalCallItem: {
    padding: tokens.spacingVerticalS,
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusMedium,
    marginBottom: tokens.spacingVerticalS,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXXS,
  },
});

export interface WebResourcesListProps {
  webResources: WebResource[];
}

export function WebResourcesList({ webResources }: WebResourcesListProps) {
  const styles = useStyles();
  const [expandedResourceId, setExpandedResourceId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [showExternalOnly, setShowExternalOnly] = useState(false);
  const [showDeprecatedOnly, setShowDeprecatedOnly] = useState(false);

  // Get unique types
  const availableTypes = useMemo(() => {
    const types = new Set(webResources.map((r) => r.typeName));
    return ['All', ...Array.from(types).sort()];
  }, [webResources]);

  // Filter and search web resources
  const filteredResources = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    let filtered = webResources;

    // Type filter
    if (typeFilter !== 'All') {
      filtered = filtered.filter((r) => r.typeName === typeFilter);
    }

    // External calls filter
    if (showExternalOnly) {
      filtered = filtered.filter((r) => r.hasExternalCalls);
    }

    // Deprecated filter
    if (showDeprecatedOnly) {
      filtered = filtered.filter((r) => r.isDeprecated);
    }

    // Search
    if (query) {
      filtered = filtered.filter((r) => {
        return (
          r.name.toLowerCase().includes(query) ||
          r.displayName.toLowerCase().includes(query) ||
          (r.description && r.description.toLowerCase().includes(query))
        );
      });
    }

    // Sort by type, then name
    return filtered.sort((a, b) => {
      if (a.typeName !== b.typeName) return a.typeName.localeCompare(b.typeName);
      return a.name.localeCompare(b.name);
    });
  }, [webResources, searchQuery, typeFilter, showExternalOnly, showDeprecatedOnly]);

  const toggleExpand = (resourceId: string) => {
    setExpandedResourceId(expandedResourceId === resourceId ? null : resourceId);
  };

  const getTypeBadgeColor = (type: string): 'brand' | 'success' | 'warning' | 'important' => {
    if (type === 'JavaScript') return 'brand';
    if (type === 'HTML') return 'success';
    if (type === 'CSS') return 'warning';
    return 'important';
  };

  const getComplexityBadgeColor = (complexity: string): 'success' | 'warning' | 'danger' => {
    if (complexity === 'Low') return 'success';
    if (complexity === 'Medium') return 'warning';
    return 'danger';
  };

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const renderResourceDetails = (resource: WebResource) => (
    <div className={styles.expandedDetails}>
      <Card>
        <Title3>{resource.displayName}</Title3>

        <div className={styles.detailsGrid}>
          <div className={styles.detailItem}>
            <Text className={styles.detailLabel}>Unique Name</Text>
            <Text className={`${styles.detailValue} ${styles.codeText}`}>{resource.name}</Text>
          </div>
          <div className={styles.detailItem}>
            <Text className={styles.detailLabel}>Type</Text>
            <Badge appearance="tint" color={getTypeBadgeColor(resource.typeName)}>
              {resource.typeName}
            </Badge>
          </div>
          <div className={styles.detailItem}>
            <Text className={styles.detailLabel}>Size</Text>
            <Text className={styles.detailValue}>{formatSize(resource.contentSize)}</Text>
          </div>
          <div className={styles.detailItem}>
            <Text className={styles.detailLabel}>Last Modified</Text>
            <Text className={styles.detailValue}>
              {new Date(resource.modifiedOn).toLocaleString()}
            </Text>
          </div>
          <div className={styles.detailItem}>
            <Text className={styles.detailLabel}>Modified By</Text>
            <Text className={styles.detailValue}>{resource.modifiedBy}</Text>
          </div>
        </div>

        {resource.description && (
          <div className={styles.section}>
            <Text className={styles.detailLabel}>Description</Text>
            <Text>{resource.description}</Text>
          </div>
        )}

        {/* JavaScript Analysis */}
        {resource.analysis && (
          <>
            <div className={styles.section}>
              <Title3>JavaScript Analysis</Title3>
              <div className={styles.detailsGrid}>
                <div className={styles.detailItem}>
                  <Text className={styles.detailLabel}>Lines of Code</Text>
                  <Text className={styles.detailValue}>{resource.analysis.linesOfCode}</Text>
                </div>
                <div className={styles.detailItem}>
                  <Text className={styles.detailLabel}>Complexity</Text>
                  <Badge appearance="filled" color={getComplexityBadgeColor(resource.analysis.complexity)}>
                    {resource.analysis.complexity}
                  </Badge>
                </div>
                <div className={styles.detailItem}>
                  <Text className={styles.detailLabel}>Uses Xrm API</Text>
                  <Text className={styles.detailValue}>{resource.analysis.usesXrm ? 'Yes' : 'No'}</Text>
                </div>
              </div>

              {resource.analysis.frameworks.length > 0 && (
                <div style={{ marginTop: tokens.spacingVerticalM }}>
                  <Text className={styles.detailLabel}>Frameworks Used</Text>
                  <div className={styles.badgeGroup} style={{ marginTop: tokens.spacingVerticalXS }}>
                    {resource.analysis.frameworks.map((fw: string, idx: number) => (
                      <Badge key={idx} appearance="tint" color="brand">
                        {fw}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {resource.isDeprecated && (
              <div className={styles.section}>
                <div className={styles.warningBox}>
                  <Text style={{ fontSize: '24px' }}>⚠️</Text>
                  <div>
                    <Text weight="semibold">Deprecated Code Detected</Text>
                    <Text>This script uses deprecated Xrm.Page API. Should migrate to formContext.</Text>
                  </div>
                </div>
              </div>
            )}

            {resource.analysis.externalCalls.length > 0 && (
              <div className={styles.section}>
                <Title3>External API Calls ({resource.analysis.externalCalls.length})</Title3>
                <div className={styles.warningBox} style={{ marginBottom: tokens.spacingVerticalM }}>
                  <Text style={{ fontSize: '24px' }}>🌐</Text>
                  <Text weight="semibold">This script calls external endpoints</Text>
                </div>
                {resource.analysis.externalCalls.map((call: any, idx: number) => (
                  <div key={idx} className={styles.externalCallItem}>
                    <div style={{ display: 'flex', gap: tokens.spacingHorizontalS, alignItems: 'center', flexWrap: 'wrap' }}>
                      <Text weight="semibold">{call.actionName}</Text>
                      {call.method && (
                        <Badge appearance="outline" size="small">
                          {call.method}
                        </Badge>
                      )}
                      <Badge
                        appearance="tint"
                        color={call.confidence === 'High' ? 'success' : call.confidence === 'Medium' ? 'warning' : 'subtle'}
                        size="small"
                      >
                        {call.confidence}
                      </Badge>
                    </div>
                    <Text className={styles.codeText} style={{ wordBreak: 'break-all' }}>{call.url}</Text>
                    <Text style={{ fontSize: tokens.fontSizeBase200, color: tokens.colorNeutralForeground3 }}>
                      Domain: {call.domain}
                    </Text>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Content Preview */}
        {resource.content && (
          <div className={styles.section}>
            <Title3>Content Preview</Title3>
            <CodeViewer content={resource.content} language={resource.typeName.toLowerCase()} />
          </div>
        )}
      </Card>
    </div>
  );

  // Empty state
  if (webResources.length === 0) {
    return (
      <div className={styles.emptyState}>
        <Text style={{ fontSize: '48px' }}>📦</Text>
        <Text size={500} weight="semibold">
          No Web Resources Found
        </Text>
        <Text>No web resources were found in the selected solution(s).</Text>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Filters */}
      <div className={styles.filters}>
        <SearchBox
          className={styles.searchBox}
          placeholder="Search web resources..."
          value={searchQuery}
          onChange={(_, data) => setSearchQuery(data.value || '')}
        />
        <Dropdown
          placeholder="Filter by type"
          value={typeFilter}
          onOptionSelect={(_, data) => setTypeFilter(data.optionValue || 'All')}
        >
          {availableTypes.map((type) => (
            <Option key={type} value={type}>
              {type}
            </Option>
          ))}
        </Dropdown>
        <Checkbox
          label="External calls only"
          checked={showExternalOnly}
          onChange={(_, data) => setShowExternalOnly(data.checked === true)}
        />
        <Checkbox
          label="Deprecated code only"
          checked={showDeprecatedOnly}
          onChange={(_, data) => setShowDeprecatedOnly(data.checked === true)}
        />
        <Text style={{ marginLeft: 'auto', color: tokens.colorNeutralForeground3 }}>
          {filteredResources.length} of {webResources.length} resources
        </Text>
      </div>

      {/* Resources List */}
      <div className={styles.listContainer}>
        {filteredResources.length === 0 ? (
          <div className={styles.emptyState}>
            <Text>No web resources match your filters.</Text>
          </div>
        ) : (
          filteredResources.map((resource) => {
            const isExpanded = expandedResourceId === resource.id;

            return (
              <div key={resource.id}>
                <div
                  className={`${styles.resourceRow} ${isExpanded ? styles.resourceRowExpanded : ''}`}
                  onClick={() => toggleExpand(resource.id)}
                >
                  <div className={styles.chevron}>
                    {isExpanded ? <ChevronDown20Regular /> : <ChevronRight20Regular />}
                  </div>
                  <div className={styles.nameColumn}>
                    <Text weight="semibold" className={styles.wrapText}>
                      {resource.displayName}
                    </Text>
                    <Text className={`${styles.wrapText} ${styles.codeText}`}>
                      {resource.name}
                    </Text>
                  </div>
                  <Badge appearance="tint" color={getTypeBadgeColor(resource.typeName)} size="small">
                    {resource.typeName}
                  </Badge>
                  <Text style={{ fontSize: tokens.fontSizeBase200, color: tokens.colorNeutralForeground3 }}>
                    {formatSize(resource.contentSize)}
                  </Text>
                  {resource.hasExternalCalls && (
                    <Text style={{ fontSize: '18px' }} title="Has external calls">
                      🌐
                    </Text>
                  )}
                  {resource.isDeprecated && (
                    <Text style={{ fontSize: '18px' }} title="Uses deprecated Xrm.Page">
                      ⚠️
                    </Text>
                  )}
                  {resource.analysis && (
                    <Badge appearance="filled" color={getComplexityBadgeColor(resource.analysis.complexity)} size="small">
                      {resource.analysis.complexity}
                    </Badge>
                  )}
                </div>
                {isExpanded && renderResourceDetails(resource)}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
