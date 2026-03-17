import { useCallback, useState } from 'react';
import { Text, Checkbox, makeStyles, tokens } from '@fluentui/react-components';
import { FilterBar, FilterGroup } from '../FilterBar';
import { EmptyState } from '../EmptyState';
import { EntityPipelineRow, EntityMessagePipelineRow } from '../CrossEntityAutomation';
import type { CrossEntityAnalysisResult } from '../../core';


const useStyles = makeStyles({
  pipelineList: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalS },
  entityEntryPreview: { fontSize: tokens.fontSizeBase200, color: tokens.colorNeutralForeground2 },
});

export interface PipelineTracesPanelProps {
  analysis: CrossEntityAnalysisResult;
  entityColorMap: Map<string, string>;
}

export function PipelineTracesPanel({ analysis, entityColorMap }: PipelineTracesPanelProps): JSX.Element {
  const styles = useStyles();
  const [expandedEntities, setExpandedEntities] = useState<Set<string>>(() => {
    const first = Array.from(analysis.entityViews.keys())[0];
    return first ? new Set([first]) : new Set();
  });
  const [pipelineSearch, setPipelineSearch] = useState('');
  const [showAllEntities, setShowAllEntities] = useState(false);

  const toggleEntity = useCallback((name: string) => {
    setExpandedEntities((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }, []);

  const visibleEntries = Array.from(analysis.allEntityPipelines.entries())
    .sort(([, a], [, b]) => a.entityDisplayName.localeCompare(b.entityDisplayName))
    .filter(([, p]) => showAllEntities || p.hasCrossEntityOutput || p.hasExternalInteraction)
    .filter(([logicalName, p]) => {
      if (!pipelineSearch.trim()) return true;
      const q = pipelineSearch.toLowerCase();
      return (
        p.entityDisplayName.toLowerCase().includes(q) ||
        logicalName.toLowerCase().includes(q)
      );
    });

  const filteredCount = Array.from(analysis.allEntityPipelines.entries()).filter(
    ([logicalName, p]) => {
      const visible = showAllEntities || p.hasCrossEntityOutput || p.hasExternalInteraction;
      if (!visible) return false;
      if (!pipelineSearch.trim()) return true;
      const q = pipelineSearch.toLowerCase();
      return p.entityDisplayName.toLowerCase().includes(q) || logicalName.toLowerCase().includes(q);
    }
  ).length;

  const totalCount = showAllEntities
    ? analysis.allEntityPipelines.size
    : Array.from(analysis.allEntityPipelines.values()).filter(
        (p) => p.hasCrossEntityOutput || p.hasExternalInteraction
      ).length;

  return (
    <div>
      <FilterBar
        searchValue={pipelineSearch}
        onSearchChange={setPipelineSearch}
        searchPlaceholder="Search entities..."
        filteredCount={filteredCount}
        totalCount={totalCount}
        itemLabel="entities"
      >
        <FilterGroup
          label="Show:"
          hasActiveFilters={showAllEntities}
          onClear={() => setShowAllEntities(false)}
        >
          <Checkbox
            label="Show all entities with automation"
            checked={showAllEntities}
            onChange={(_e, data) => setShowAllEntities(!!data.checked)}
          />
        </FilterGroup>
      </FilterBar>

      {!showAllEntities && (
        <Text
          className={styles.entityEntryPreview}
          style={{ display: 'block', marginTop: tokens.spacingVerticalXS }}
        >
          Default: entities with cross-entity writes or external API calls.
        </Text>
      )}

      {analysis.entityViews.size === 0 && !showAllEntities && <EmptyState type="search" />}

      {(analysis.entityViews.size > 0 || showAllEntities) && (
        <div className={styles.pipelineList}>
          {visibleEntries.map(([logicalName, pipeline]) => {
            const entityView = analysis.entityViews.get(logicalName);
            const color = entityColorMap.get(logicalName) ?? '#0078d4';
            return entityView ? (
              <EntityPipelineRow
                key={logicalName}
                logicalName={logicalName}
                view={entityView}
                pipeline={pipeline}
                color={color}
                expanded={expandedEntities.has(logicalName)}
                onToggle={() => toggleEntity(logicalName)}
                analysis={analysis}
              />
            ) : (
              <EntityMessagePipelineRow
                key={logicalName}
                pipeline={pipeline}
                color={color}
                expanded={expandedEntities.has(logicalName)}
                onToggle={() => toggleEntity(logicalName)}
                analysis={analysis}
              />
            );
          })}

          {visibleEntries.length === 0 && pipelineSearch.trim() !== '' && (
            <EmptyState type="search" />
          )}
        </div>
      )}
    </div>
  );
}
