import { useState } from 'react';
import {
  Text,
  Badge,
  Card,
  Title3,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { ChevronDown20Regular, ChevronRight20Regular } from '@fluentui/react-icons';
import type { OneToManyRelationship, ManyToOneRelationship, ManyToManyRelationship } from '@ppsb/core';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  relationshipList: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  relationshipRow: {
    display: 'grid',
    gridTemplateColumns: '24px minmax(200px, 2fr) minmax(150px, 1fr) minmax(150px, 1fr) auto auto',
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
  relationshipRowExpanded: {
    backgroundColor: tokens.colorBrandBackground2,
  },
  chevron: {
    display: 'flex',
    alignItems: 'center',
    color: tokens.colorNeutralForeground3,
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
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
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
  codeText: {
    fontFamily: 'Consolas, Monaco, monospace',
    fontSize: tokens.fontSizeBase200,
  },
  emptyState: {
    padding: tokens.spacingVerticalXXL,
    textAlign: 'center',
    color: tokens.colorNeutralForeground3,
  },
  wrapText: {
    wordBreak: 'break-word',
    overflowWrap: 'break-word',
  },
});

export interface RelationshipsViewProps {
  oneToMany: OneToManyRelationship[];
  manyToOne: ManyToOneRelationship[];
  manyToMany: ManyToManyRelationship[];
  currentEntityName: string;
}

export function RelationshipsView({ oneToMany, manyToOne, manyToMany, currentEntityName }: RelationshipsViewProps) {
  const styles = useStyles();
  const [expandedRelationshipId, setExpandedRelationshipId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedRelationshipId(expandedRelationshipId === id ? null : id);
  };

  const getCascadeBadge = (value?: string) => {
    switch (value) {
      case 'Cascade':
        return <Badge appearance="filled" color="danger">Cascade</Badge>;
      case 'Active':
        return <Badge appearance="filled" color="warning">Active</Badge>;
      case 'UserOwned':
        return <Badge appearance="filled" color="important">User Owned</Badge>;
      case 'RemoveLink':
        return <Badge appearance="filled" color="warning">Remove Link</Badge>;
      case 'Restrict':
        return <Badge appearance="filled" color="danger">Restrict</Badge>;
      case 'NoCascade':
        return <Badge appearance="outline">No Cascade</Badge>;
      default:
        return <Badge appearance="outline">{value || 'None'}</Badge>;
    }
  };

  const getCascadeExplanation = (action: string, value?: string): string => {
    if (!value) return '';

    const explanations: Record<string, Record<string, string>> = {
      Delete: {
        'Cascade': 'Related records also deleted',
        'Active': 'Active related records deleted',
        'UserOwned': 'User-owned records deleted',
        'RemoveLink': 'Relationship removed but record kept',
        'Restrict': 'Cannot delete if related records exist',
        'NoCascade': 'No automatic action on related records',
      },
      Merge: {
        'Cascade': 'Related records also merged',
        'Active': 'Active related records merged',
        'NoCascade': 'No automatic merge action',
      },
      Assign: {
        'Cascade': 'Related records also assigned',
        'NoCascade': 'No automatic assignment',
      },
      Share: {
        'Cascade': 'Related records also shared',
        'NoCascade': 'No automatic sharing',
      },
      Reparent: {
        'Cascade': 'Related records also reparented',
        'NoCascade': 'No automatic reparenting',
      },
    };

    return explanations[action]?.[value] || value;
  };

  const renderOneToManyDetails = (rel: OneToManyRelationship) => (
    <div className={styles.expandedDetails}>
      <Card>
        <Title3>Cascade Configuration</Title3>
        <div className={styles.detailsGrid}>
          <div className={styles.detailItem}>
            <Text className={styles.detailLabel}>Delete</Text>
            <div>{getCascadeBadge(rel.CascadeConfiguration?.Delete)}</div>
            <Text style={{ fontSize: tokens.fontSizeBase200, color: tokens.colorNeutralForeground3, marginTop: tokens.spacingVerticalXXS }}>
              {getCascadeExplanation('Delete', rel.CascadeConfiguration?.Delete)}
            </Text>
          </div>
          <div className={styles.detailItem}>
            <Text className={styles.detailLabel}>Merge</Text>
            <div>{getCascadeBadge(rel.CascadeConfiguration?.Merge)}</div>
            <Text style={{ fontSize: tokens.fontSizeBase200, color: tokens.colorNeutralForeground3, marginTop: tokens.spacingVerticalXXS }}>
              {getCascadeExplanation('Merge', rel.CascadeConfiguration?.Merge)}
            </Text>
          </div>
          <div className={styles.detailItem}>
            <Text className={styles.detailLabel}>Assign</Text>
            <div>{getCascadeBadge(rel.CascadeConfiguration?.Assign)}</div>
            <Text style={{ fontSize: tokens.fontSizeBase200, color: tokens.colorNeutralForeground3, marginTop: tokens.spacingVerticalXXS }}>
              {getCascadeExplanation('Assign', rel.CascadeConfiguration?.Assign)}
            </Text>
          </div>
          <div className={styles.detailItem}>
            <Text className={styles.detailLabel}>Share</Text>
            <div>{getCascadeBadge(rel.CascadeConfiguration?.Share)}</div>
            <Text style={{ fontSize: tokens.fontSizeBase200, color: tokens.colorNeutralForeground3, marginTop: tokens.spacingVerticalXXS }}>
              {getCascadeExplanation('Share', rel.CascadeConfiguration?.Share)}
            </Text>
          </div>
          <div className={styles.detailItem}>
            <Text className={styles.detailLabel}>Reparent</Text>
            <div>{getCascadeBadge(rel.CascadeConfiguration?.Reparent)}</div>
            <Text style={{ fontSize: tokens.fontSizeBase200, color: tokens.colorNeutralForeground3, marginTop: tokens.spacingVerticalXXS }}>
              {getCascadeExplanation('Reparent', rel.CascadeConfiguration?.Reparent)}
            </Text>
          </div>
          <div className={styles.detailItem}>
            <Text className={styles.detailLabel}>Unshare</Text>
            <div>{getCascadeBadge(rel.CascadeConfiguration?.Unshare)}</div>
          </div>
        </div>
      </Card>
    </div>
  );

  return (
    <div className={styles.container}>
      {/* 1:N Relationships */}
      <div className={styles.section}>
        <Title3>1:N Relationships (This entity is parent) ({oneToMany.length})</Title3>
        {oneToMany.length === 0 ? (
          <div className={styles.emptyState}>
            <Text>No 1:N relationships found.</Text>
          </div>
        ) : (
          <div className={styles.relationshipList}>
            {oneToMany.map((rel) => {
              const id = rel.MetadataId || rel.SchemaName;
              const isExpanded = expandedRelationshipId === id;

              return (
                <div key={id}>
                  <div
                    className={`${styles.relationshipRow} ${isExpanded ? styles.relationshipRowExpanded : ''}`}
                    onClick={() => toggleExpand(id)}
                  >
                    <div className={styles.chevron}>
                      {isExpanded ? <ChevronDown20Regular /> : <ChevronRight20Regular />}
                    </div>
                    <Text weight="semibold" className={styles.wrapText}>{rel.SchemaName}</Text>
                    <Text className={`${styles.codeText} ${styles.wrapText}`}>{rel.ReferencingEntity}</Text>
                    <Text className={`${styles.codeText} ${styles.wrapText}`}>{rel.ReferencingAttribute}</Text>
                    {getCascadeBadge(rel.CascadeConfiguration?.Delete)}
                    {rel.IsCustomRelationship && <Badge appearance="tint" color="brand" size="small">Custom</Badge>}
                  </div>
                  {isExpanded && renderOneToManyDetails(rel)}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* N:1 Relationships */}
      <div className={styles.section}>
        <Title3>N:1 Relationships (This entity is child) ({manyToOne.length})</Title3>
        {manyToOne.length === 0 ? (
          <div className={styles.emptyState}>
            <Text>No N:1 relationships found.</Text>
          </div>
        ) : (
          <div className={styles.relationshipList}>
            {manyToOne.map((rel) => {
              const id = rel.MetadataId || rel.SchemaName;
              const isExpanded = expandedRelationshipId === id;

              return (
                <div key={id}>
                  <div
                    className={`${styles.relationshipRow} ${isExpanded ? styles.relationshipRowExpanded : ''}`}
                    onClick={() => toggleExpand(id)}
                  >
                    <div className={styles.chevron}>
                      {isExpanded ? <ChevronDown20Regular /> : <ChevronRight20Regular />}
                    </div>
                    <Text weight="semibold" className={styles.wrapText}>{rel.SchemaName}</Text>
                    <Text className={`${styles.codeText} ${styles.wrapText}`}>{rel.ReferencedEntity}</Text>
                    <Text className={`${styles.codeText} ${styles.wrapText}`}>{rel.ReferencingAttribute}</Text>
                    {getCascadeBadge(rel.CascadeConfiguration?.Delete)}
                    {rel.IsCustomRelationship && <Badge appearance="tint" color="brand" size="small">Custom</Badge>}
                  </div>
                  {isExpanded && renderOneToManyDetails(rel)}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* N:N Relationships */}
      <div className={styles.section}>
        <Title3>N:N Relationships ({manyToMany.length})</Title3>
        {manyToMany.length === 0 ? (
          <div className={styles.emptyState}>
            <Text>No N:N relationships found.</Text>
          </div>
        ) : (
          <div className={styles.relationshipList}>
            {manyToMany.map((rel) => {
              const id = rel.MetadataId || rel.SchemaName;
              const relatedEntity = rel.Entity1LogicalName === currentEntityName ? rel.Entity2LogicalName : rel.Entity1LogicalName;

              return (
                <div key={id}>
                  <div className={styles.relationshipRow} style={{ gridTemplateColumns: 'minmax(200px, 2fr) minmax(150px, 1fr) minmax(150px, 1fr) auto' }}>
                    <Text weight="semibold" className={styles.wrapText}>{rel.SchemaName}</Text>
                    <Text className={`${styles.codeText} ${styles.wrapText}`}>{relatedEntity}</Text>
                    <Text className={`${styles.codeText} ${styles.wrapText}`}>{rel.IntersectEntityName}</Text>
                    {rel.IsCustomRelationship && <Badge appearance="tint" color="brand" size="small">Custom</Badge>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
