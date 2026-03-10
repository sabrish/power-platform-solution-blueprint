import { useMemo, useState } from 'react';
import {
  Text,
  Badge,
  makeStyles,
  tokens,
  Card,
  Title3,
  Checkbox,
  ToggleButton,
} from '@fluentui/react-components';
import { ChevronDown20Regular, ChevronRight20Regular, Warning20Regular, Globe20Regular } from '@fluentui/react-icons';
import type { WebResource, ExternalCall } from '../core';
import { CodeViewer } from './CodeViewer';
import { TruncatedText } from './TruncatedText';
import { EmptyState } from './EmptyState';
import { FilterBar, FilterGroup } from './FilterBar';
import { useCardRowStyles } from '../hooks/useCardRowStyles';

const useStyles = makeStyles({
  listContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  resourceRow: {
    display: 'grid',
    gridTemplateColumns: '24px minmax(200px, 2fr) auto auto auto auto auto',
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
  const shared = useCardRowStyles();
  const [expandedResourceId, setExpandedResourceId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTypeFilters, setActiveTypeFilters] = useState<Set<string>>(new Set());
  const [showExternalOnly, setShowExternalOnly] = useState(false);
  const [showDeprecatedOnly, setShowDeprecatedOnly] = useState(false);

  // Get unique types sorted
  const availableTypes = useMemo(() => {
    const types = new Set(webResources.map((r) => r.typeName));
    return Array.from(types).sort();
  }, [webResources]);

  // Count per type (for disabling empty filter buttons)
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of webResources) counts[r.typeName] = (counts[r.typeName] ?? 0) + 1;
    return counts;
  }, [webResources]);

  // Filter and search web resources
  const filteredResources = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    let filtered = webResources;

    // Type filter (OR logic)
    if (activeTypeFilters.size > 0) {
      filtered = filtered.filter((r) => activeTypeFilters.has(r.typeName));
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
  }, [webResources, searchQuery, activeTypeFilters, showExternalOnly, showDeprecatedOnly]);

  const toggleTypeFilter = (type: string) => {
    setActiveTypeFilters((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type); else next.add(type);
      return next;
    });
  };

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
    <div className={shared.expandedDetails}>
      <Card>
        <Title3>{resource.displayName}</Title3>

        <div className={shared.detailsGrid}>
          <div className={shared.detailItem}>
            <Text className={shared.detailLabel}>Unique Name</Text>
            <Text className={`${shared.detailValue} ${shared.codeText}`}>{resource.name}</Text>
          </div>
          <div className={shared.detailItem}>
            <Text className={shared.detailLabel}>Type</Text>
            <Badge appearance="tint" shape="rounded" color={getTypeBadgeColor(resource.typeName)}>
              {resource.typeName}
            </Badge>
          </div>
          <div className={shared.detailItem}>
            <Text className={shared.detailLabel}>Size</Text>
            <Text className={shared.detailValue}>{formatSize(resource.contentSize)}</Text>
          </div>
          <div className={shared.detailItem}>
            <Text className={shared.detailLabel}>Last Modified</Text>
            <Text className={shared.detailValue}>
              {new Date(resource.modifiedOn).toLocaleString()}
            </Text>
          </div>
          <div className={shared.detailItem}>
            <Text className={shared.detailLabel}>Modified By</Text>
            <Text className={shared.detailValue}>{resource.modifiedBy}</Text>
          </div>
        </div>

        {resource.description && (
          <div className={shared.section}>
            <Text className={shared.detailLabel}>Description</Text>
            <Text>
              <TruncatedText text={resource.description} />
            </Text>
          </div>
        )}

        {/* JavaScript Analysis */}
        {resource.analysis && (
          <>
            <div className={shared.section}>
              <Title3>JavaScript Analysis</Title3>
              <div className={shared.detailsGrid}>
                <div className={shared.detailItem}>
                  <Text className={shared.detailLabel}>Lines of Code</Text>
                  <Text className={shared.detailValue}>{resource.analysis.linesOfCode}</Text>
                </div>
                <div className={shared.detailItem}>
                  <Text className={shared.detailLabel}>Complexity</Text>
                  <Badge appearance="filled" shape="rounded" color={getComplexityBadgeColor(resource.analysis.complexity)}>
                    {resource.analysis.complexity}
                  </Badge>
                </div>
                <div className={shared.detailItem}>
                  <Text className={shared.detailLabel}>Uses Xrm API</Text>
                  <Text className={shared.detailValue}>{resource.analysis.usesXrm ? 'Yes' : 'No'}</Text>
                </div>
              </div>

              {resource.analysis.frameworks.length > 0 && (
                <div style={{ marginTop: tokens.spacingVerticalM }}>
                  <Text className={shared.detailLabel}>Frameworks Used</Text>
                  <div className={shared.badgeGroup} style={{ marginTop: tokens.spacingVerticalXS }}>
                    {resource.analysis.frameworks.map((fw: string, idx: number) => (
                      <Badge key={idx} appearance="tint" shape="rounded" color="brand">
                        {fw}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {resource.isDeprecated && (
              <div className={shared.section}>
                <div className={styles.warningBox}>
                  <Warning20Regular style={{ color: tokens.colorStatusWarningForeground1, flexShrink: 0 }} />
                  <div>
                    <Text weight="semibold">Deprecated Code Detected</Text>
                    <Text>This script uses deprecated Xrm.Page API. Should migrate to formContext.</Text>
                  </div>
                </div>
              </div>
            )}

            {resource.analysis.externalCalls.length > 0 && (
              <div className={shared.section}>
                <Title3>External API Calls ({resource.analysis.externalCalls.length})</Title3>
                <div className={styles.warningBox} style={{ marginBottom: tokens.spacingVerticalM }}>
                  <Globe20Regular style={{ color: tokens.colorBrandForeground1, flexShrink: 0 }} />
                  <Text weight="semibold">This script calls external endpoints</Text>
                </div>
                {resource.analysis.externalCalls.map((call: ExternalCall, idx: number) => (
                  <div key={idx} className={styles.externalCallItem}>
                    <div style={{ display: 'flex', gap: tokens.spacingHorizontalS, alignItems: 'center', flexWrap: 'wrap' }}>
                      <Text weight="semibold">{call.actionName}</Text>
                      {call.method && (
                        <Badge appearance="outline" shape="rounded" size="small">
                          {call.method}
                        </Badge>
                      )}
                      <Badge
                        appearance="tint"
                        shape="rounded"
                        color={call.confidence === 'High' ? 'success' : call.confidence === 'Medium' ? 'warning' : 'subtle'}
                        size="small"
                      >
                        {call.confidence}
                      </Badge>
                    </div>
                    <Text className={shared.codeText}>
                      <TruncatedText text={call.url} />
                    </Text>
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
          <div className={shared.section}>
            <Title3>Content Preview</Title3>
            <CodeViewer content={resource.content} language={resource.typeName.toLowerCase()} />
          </div>
        )}
      </Card>
    </div>
  );

  // Empty state
  if (webResources.length === 0) {
    return <EmptyState type="webresources" />;
  }

  return (
    <div className={shared.container}>
      <FilterBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search web resources..."
        filteredCount={filteredResources.length}
        totalCount={webResources.length}
        itemLabel="web resources"
      >
        <FilterGroup
          label="Type:"
          hasActiveFilters={activeTypeFilters.size > 0}
          onClear={() => setActiveTypeFilters(new Set())}
        >
          {availableTypes.map((type) => (
            <ToggleButton
              key={type}
              appearance="outline"
              className={shared.filterButton}
              size="small"
              checked={activeTypeFilters.has(type)}
              disabled={typeCounts[type] === 0}
              onClick={() => toggleTypeFilter(type)}
            >
              {type}
            </ToggleButton>
          ))}
        </FilterGroup>
        <FilterGroup label="Show:">
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
        </FilterGroup>
      </FilterBar>

      {/* Resources List */}
      <div className={styles.listContainer}>
        {filteredResources.length === 0 ? (
          <EmptyState type="search" />
        ) : (
          filteredResources.map((resource) => {
            const isExpanded = expandedResourceId === resource.id;

            return (
              <div key={resource.id}>
                <div
                  className={`${shared.cardRow} ${styles.resourceRow} ${isExpanded ? shared.cardRowExpanded : ''}`}
                  onClick={() => toggleExpand(resource.id)}
                >
                  <div className={shared.chevron}>
                    {isExpanded ? <ChevronDown20Regular /> : <ChevronRight20Regular />}
                  </div>
                  <div className={shared.nameColumn}>
                    <Text weight="semibold">
                      <TruncatedText text={resource.displayName} />
                    </Text>
                    <Text className={shared.codeText}>
                      <TruncatedText text={resource.name} />
                    </Text>
                  </div>
                  <Badge appearance="tint" shape="rounded" color={getTypeBadgeColor(resource.typeName)} size="small">
                    {resource.typeName}
                  </Badge>
                  <Text style={{ fontSize: tokens.fontSizeBase200, color: tokens.colorNeutralForeground3 }}>
                    {formatSize(resource.contentSize)}
                  </Text>
                  {resource.hasExternalCalls && (
                    <Globe20Regular style={{ color: tokens.colorBrandForeground1 }} title="Has external calls" />
                  )}
                  {resource.isDeprecated && (
                    <Warning20Regular style={{ color: tokens.colorStatusWarningForeground1 }} title="Uses deprecated Xrm.Page" />
                  )}
                  {resource.analysis && (
                    <Badge appearance="filled" shape="rounded" color={getComplexityBadgeColor(resource.analysis.complexity)} size="small">
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
