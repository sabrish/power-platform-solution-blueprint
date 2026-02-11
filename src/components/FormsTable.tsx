import { useState } from 'react';
import {
  Badge,
  Button,
  Text,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import {
  ChevronDown24Regular,
  ChevronRight24Regular,
} from '@fluentui/react-icons';
import type { FormDefinition } from '../core';

const useStyles = makeStyles({
  table: {
    display: 'flex',
    flexDirection: 'column',
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
    overflow: 'hidden',
  },
  tableHeader: {
    display: 'grid',
    gridTemplateColumns: '40px 1fr auto auto',
    gap: tokens.spacingHorizontalS,
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    backgroundColor: tokens.colorNeutralBackground2,
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
    fontWeight: tokens.fontWeightSemibold,
  },
  tableRow: {
    display: 'grid',
    gridTemplateColumns: '40px 1fr auto auto',
    gap: tokens.spacingHorizontalS,
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
    ':last-child': {
      borderBottom: 'none',
    },
  },
  tableRowExpanded: {
    backgroundColor: tokens.colorNeutralBackground1Pressed,
  },
  cellContent: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  expandedContent: {
    padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalM}`,
    paddingLeft: '56px', // Indent to align with content
    backgroundColor: tokens.colorNeutralBackground2,
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  eventHandlerSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
  },
  eventHandlerRow: {
    display: 'grid',
    gridTemplateColumns: '120px 200px 1fr auto',
    gap: tokens.spacingHorizontalM,
    padding: `${tokens.spacingVerticalXXS} 0`,
    fontSize: tokens.fontSizeBase200,
  },
  eventHandlerLabel: {
    color: tokens.colorNeutralForeground3,
    fontWeight: tokens.fontWeightSemibold,
  },
  monospace: {
    fontFamily: 'Consolas, Monaco, monospace',
  },
});

export interface FormsTableProps {
  forms: FormDefinition[];
}

export function FormsTable({ forms }: FormsTableProps) {
  const styles = useStyles();
  const [expandedFormId, setExpandedFormId] = useState<string | null>(null);

  const toggleExpand = (formId: string) => {
    setExpandedFormId(expandedFormId === formId ? null : formId);
  };

  if (forms.length === 0) {
    return (
      <div style={{ padding: tokens.spacingVerticalXXXL, textAlign: 'center', color: tokens.colorNeutralForeground3 }}>
        <Text size={500} weight="semibold">No Forms in Solution</Text>
      </div>
    );
  }

  const renderExpandedDetails = (form: FormDefinition) => (
    <div className={styles.expandedContent}>
      {/* Web Resources Section */}
      {form.libraries.length > 0 && (
        <div>
          <Text weight="semibold" size={300} style={{ marginBottom: tokens.spacingVerticalXS }}>
            Web Resources ({form.libraries.length})
          </Text>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: tokens.spacingHorizontalS, marginTop: tokens.spacingVerticalXS }}>
            {form.libraries.map((lib, idx) => (
              <Badge key={idx} appearance="outline" color="important" size="small" className={styles.monospace}>
                {lib}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Event Handlers Section */}
      {form.eventHandlers.length > 0 && (
        <div className={styles.eventHandlerSection}>
          <Text weight="semibold" size={300}>
            Event Handlers ({form.eventHandlers.length})
          </Text>

          {/* Header Row */}
          <div className={styles.eventHandlerRow} style={{ fontWeight: tokens.fontWeightSemibold, borderBottom: `1px solid ${tokens.colorNeutralStroke1}`, paddingBottom: tokens.spacingVerticalXS }}>
            <Text size={200} className={styles.eventHandlerLabel}>Event</Text>
            <Text size={200} className={styles.eventHandlerLabel}>Library</Text>
            <Text size={200} className={styles.eventHandlerLabel}>Function</Text>
            <Text size={200} className={styles.eventHandlerLabel}>Status</Text>
          </div>

          {/* Event Handler Rows */}
          {form.eventHandlers.map((handler, idx) => (
            <div key={idx} className={styles.eventHandlerRow}>
              <Text size={200}>
                {handler.event}
                {handler.attribute && <Text size={100} style={{ color: tokens.colorNeutralForeground3 }}> ({handler.attribute})</Text>}
              </Text>
              <Text size={200} className={styles.monospace} style={{ color: tokens.colorBrandForeground1 }}>
                {handler.libraryName}
              </Text>
              <Text size={200} className={styles.monospace}>
                {handler.functionName}
                {handler.parameters && (
                  <Text size={100} style={{ color: tokens.colorNeutralForeground3 }}>
                    ({handler.parameters})
                  </Text>
                )}
              </Text>
              <Badge
                appearance={handler.enabled ? 'tint' : 'outline'}
                color={handler.enabled ? 'success' : 'warning'}
                size="small"
              >
                {handler.enabled ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {form.libraries.length === 0 && form.eventHandlers.length === 0 && (
        <Text size={200} style={{ color: tokens.colorNeutralForeground3, fontStyle: 'italic' }}>
          No web resources or event handlers registered on this form
        </Text>
      )}
    </div>
  );

  return (
    <div className={styles.table}>
      {/* Table Header */}
      <div className={styles.tableHeader}>
        <div></div> {/* Spacer for chevron */}
        <div className={styles.cellContent}>
          <Text weight="semibold">Form Name</Text>
        </div>
        <div className={styles.cellContent}>
          <Text weight="semibold">Type</Text>
        </div>
        <div className={styles.cellContent}>
          <Text weight="semibold">Web Resources</Text>
        </div>
      </div>

      {/* Table Rows */}
      {forms.map((form) => {
        const isExpanded = expandedFormId === form.id;
        return (
          <div key={form.id}>
            <div
              className={`${styles.tableRow} ${isExpanded ? styles.tableRowExpanded : ''}`}
              onClick={() => toggleExpand(form.id)}
            >
              {/* Chevron */}
              <div className={styles.cellContent}>
                <Button
                  appearance="transparent"
                  size="small"
                  icon={isExpanded ? <ChevronDown24Regular /> : <ChevronRight24Regular />}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpand(form.id);
                  }}
                />
              </div>

              {/* Form Name */}
              <div className={styles.cellContent}>
                <Text weight="semibold">{form.name}</Text>
              </div>

              {/* Form Type */}
              <div className={styles.cellContent}>
                <Badge appearance="tint" color="brand" size="small">
                  {form.typeName}
                </Badge>
              </div>

              {/* Web Resources Count */}
              <div className={styles.cellContent}>
                <Badge
                  appearance={form.libraries.length > 0 ? 'filled' : 'outline'}
                  color={form.libraries.length > 0 ? 'important' : 'subtle'}
                  size="small"
                >
                  {form.libraries.length} library(s)
                </Badge>
              </div>
            </div>

            {/* Expanded Details */}
            {isExpanded && renderExpandedDetails(form)}
          </div>
        );
      })}
    </div>
  );
}
