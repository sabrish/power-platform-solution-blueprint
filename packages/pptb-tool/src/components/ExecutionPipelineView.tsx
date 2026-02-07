import { useState, useMemo } from 'react';
import {
  Text,
  makeStyles,
  tokens,
  Select,
  Spinner,
} from '@fluentui/react-components';
import type { EntityBlueprint } from '@ppsb/core';
import { ExecutionOrderCalculator, PerformanceAnalyzer } from '@ppsb/core';
import type { ExecutionPipeline } from '@ppsb/core';
import { ExecutionTimeline } from './ExecutionTimeline';
import { PerformanceRisksPanel } from './PerformanceRisksPanel';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
    padding: tokens.spacingVerticalL,
  },
  header: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  eventSelector: {
    minWidth: '200px',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: tokens.spacingVerticalXXXL,
    color: tokens.colorNeutralForeground3,
    gap: tokens.spacingVerticalM,
  },
});

export interface ExecutionPipelineViewProps {
  blueprint: EntityBlueprint;
}

export function ExecutionPipelineView({ blueprint }: ExecutionPipelineViewProps) {
  const styles = useStyles();
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);

  // Get available events for this entity
  const availableEvents = useMemo(() => {
    const calculator = new ExecutionOrderCalculator();
    return calculator.getEntityEvents(
      blueprint.entity.LogicalName,
      blueprint.plugins,
      blueprint.flows,
      blueprint.businessRules
    );
  }, [blueprint]);

  // Set default event on mount
  useMemo(() => {
    if (availableEvents.length > 0 && !selectedEvent) {
      setSelectedEvent(availableEvents[0]);
    }
  }, [availableEvents, selectedEvent]);

  // Calculate execution pipeline for selected event
  const pipeline = useMemo<ExecutionPipeline | null>(() => {
    if (!selectedEvent) return null;

    const calculator = new ExecutionOrderCalculator();
    const basePipeline = calculator.calculatePipeline(
      blueprint.entity.LogicalName,
      selectedEvent,
      blueprint.plugins,
      blueprint.flows,
      blueprint.businessRules
    );

    // Analyze performance risks
    const analyzer = new PerformanceAnalyzer();
    basePipeline.performanceRisks = analyzer.analyzePerformanceRisks(basePipeline);

    return basePipeline;
  }, [selectedEvent, blueprint]);

  if (availableEvents.length === 0) {
    return (
      <div className={styles.emptyState}>
        <Text size={500}>No automation detected</Text>
        <Text>This entity has no plugins, flows, or business rules configured.</Text>
      </div>
    );
  }

  if (!pipeline) {
    return (
      <div className={styles.emptyState}>
        <Spinner size="large" label="Calculating execution pipeline..." />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Text weight="semibold" size={400}>Event:</Text>
        <Select
          className={styles.eventSelector}
          value={selectedEvent || ''}
          onChange={(_, data) => setSelectedEvent(data.value)}
        >
          {availableEvents.map((event) => (
            <option key={event} value={event}>
              {event}
            </option>
          ))}
        </Select>

        <Text style={{ marginLeft: 'auto', color: tokens.colorNeutralForeground3 }}>
          {pipeline.totalSteps} total steps
          {pipeline.hasExternalCalls && ' • External calls detected'}
        </Text>
      </div>

      <div className={styles.content}>
        {pipeline.performanceRisks.length > 0 && (
          <PerformanceRisksPanel risks={pipeline.performanceRisks} />
        )}

        <ExecutionTimeline pipeline={pipeline} />
      </div>
    </div>
  );
}
