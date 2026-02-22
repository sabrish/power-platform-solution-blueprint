import { useState, useMemo } from 'react';
import {
  Card,
  Title2,
  Text,
  Badge,
  Tab,
  TabList,
  makeStyles,
  tokens,
  SelectTabData,
  SelectTabEvent,
} from '@fluentui/react-components';
import { Database24Regular } from '@fluentui/react-icons';
import type { DetailedEntityMetadata, EntityBlueprint, ClassicWorkflow } from '../core';
import { FieldsTable } from './FieldsTable';
import { FormsTable } from './FormsTable';
import { RelationshipsView } from './RelationshipsView';
import { AlternateKeysView } from './AlternateKeysView';
import { ExecutionPipelineView } from './ExecutionPipelineView';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXL,
    padding: tokens.spacingVerticalL,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
  },
  icon: {
    fontSize: '48px',
    color: tokens.colorBrandForeground1,
  },
  headerContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
  },
  logicalName: {
    color: tokens.colorNeutralForeground3,
  },
  metadataGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: tokens.spacingHorizontalM,
    marginTop: tokens.spacingVerticalM,
  },
  metadataItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXXS,
  },
  metadataLabel: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  metadataValue: {
    fontWeight: tokens.fontWeightSemibold,
  },
  badges: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    flexWrap: 'wrap',
    marginTop: tokens.spacingVerticalM,
  },
  tabContent: {
    marginTop: tokens.spacingVerticalL,
  },
});

export interface SchemaViewProps {
  schema?: DetailedEntityMetadata;
  blueprint?: EntityBlueprint;
  classicWorkflows?: ClassicWorkflow[];
  entitiesInScope?: string[]; // Logical names of entities in current selection
}

export function SchemaView({ schema: schemaProp, blueprint, classicWorkflows = [], entitiesInScope }: SchemaViewProps) {
  const styles = useStyles();
  const [selectedTab, setSelectedTab] = useState<string>('fields');

  // Use schema from blueprint if available, otherwise use direct schema prop
  const schema = blueprint?.entity || schemaProp!;

  // Normalize entity names in scope for case-insensitive comparison
  const entitiesInScopeSet = useMemo(() => {
    if (!entitiesInScope) return null;
    return new Set(entitiesInScope.map(name => name.toLowerCase()));
  }, [entitiesInScope]);

  const displayName = schema.DisplayName?.UserLocalizedLabel?.Label || schema.LogicalName;
  const description = schema.Description?.UserLocalizedLabel?.Label;

  const attributeCount = schema.Attributes?.length || 0;
  const keysCount = schema.Keys?.length || 0;
  const formsCount = blueprint?.forms.length || 0;

  // Helper function to check if a relationship is a system relationship
  const isSystemRelationship = (
    schemaName: string,
    referencingAttribute?: string,
    referencedEntity?: string,
    referencingEntity?: string
  ): boolean => {
    const lowerSchemaName = schemaName.toLowerCase();
    const lowerAttribute = referencingAttribute?.toLowerCase() || '';
    const lowerReferencedEntity = referencedEntity?.toLowerCase() || '';
    const lowerReferencingEntity = referencingEntity?.toLowerCase() || '';

    // Common system entities to filter
    const systemEntities = [
      'systemuser',
      'team',
      'businessunit',
      'organization',
      'transactioncurrency',
      'owner', // polymorphic owner field
    ];

    // Filter if relationship involves a system entity
    if (systemEntities.some(entity =>
      lowerReferencedEntity === entity || lowerReferencingEntity === entity
    )) {
      return true;
    }

    // Common system relationship patterns
    const systemPatterns = [
      'createdby',
      'modifiedby',
      'createdonbehalfby',
      'modifiedonbehalfby',
      'ownerid',
      'owninguser',
      'owningteam',
      'owningbusinessunit',
      'transactioncurrencyid',
      'transactioncurrency',
      '_transactioncurrency',
    ];

    // Check if schema name or attribute matches any system pattern
    return systemPatterns.some(pattern =>
      lowerSchemaName.includes(pattern) || lowerAttribute.includes(pattern)
    );
  };

  // Filter out system relationships and relationships to entities not in scope
  const filteredOneToMany = useMemo(() => {
    return (schema.OneToManyRelationships || []).filter(rel => {
      // Filter system relationships
      if (isSystemRelationship(
        rel.SchemaName,
        rel.ReferencingAttribute,
        rel.ReferencedEntity,
        rel.ReferencingEntity
      )) {
        return false;
      }

      // If scope is provided, only include relationships to entities in scope
      if (entitiesInScopeSet) {
        const referencingEntity = rel.ReferencingEntity?.toLowerCase();
        return referencingEntity && entitiesInScopeSet.has(referencingEntity);
      }

      return true;
    });
  }, [schema.OneToManyRelationships, entitiesInScopeSet]);

  const filteredManyToOne = useMemo(() => {
    return (schema.ManyToOneRelationships || []).filter(rel => {
      // Filter system relationships
      if (isSystemRelationship(
        rel.SchemaName,
        rel.ReferencingAttribute,
        rel.ReferencedEntity,
        rel.ReferencingEntity
      )) {
        return false;
      }

      // If scope is provided, only include relationships to entities in scope
      if (entitiesInScopeSet) {
        const referencedEntity = rel.ReferencedEntity?.toLowerCase();
        return referencedEntity && entitiesInScopeSet.has(referencedEntity);
      }

      return true;
    });
  }, [schema.ManyToOneRelationships, entitiesInScopeSet]);

  const filteredManyToMany = useMemo(() => {
    return (schema.ManyToManyRelationships || []).filter(rel => {
      // Filter system relationships
      if (isSystemRelationship(
        rel.SchemaName,
        undefined,
        rel.Entity1LogicalName,
        rel.Entity2LogicalName
      )) {
        return false;
      }

      // If scope is provided, only include relationships where the other entity is in scope
      if (entitiesInScopeSet) {
        const currentEntityName = schema.LogicalName.toLowerCase();
        const entity1 = rel.Entity1LogicalName?.toLowerCase();
        const entity2 = rel.Entity2LogicalName?.toLowerCase();

        // Determine which entity is the "other" entity
        const otherEntity = entity1 === currentEntityName ? entity2 : entity1;
        return otherEntity && entitiesInScopeSet.has(otherEntity);
      }

      return true;
    });
  }, [schema.ManyToManyRelationships, schema.LogicalName, entitiesInScopeSet]);

  // Counts using filtered relationships
  const oneToManyCount = filteredOneToMany.length;
  const manyToOneCount = filteredManyToOne.length;
  const manyToManyCount = filteredManyToMany.length;

  // Count automation (plugins, flows, business rules)
  const pluginCount = blueprint?.plugins.length || 0;
  const flowCount = blueprint?.flows.length || 0;
  const businessRuleCount = blueprint?.businessRules.length || 0;
  const totalAutomation = pluginCount + flowCount + businessRuleCount;

  return (
    <div className={styles.container}>
      {/* Entity Header */}
      <Card>
        <div className={styles.header}>
          <Database24Regular className={styles.icon} />
          <div className={styles.headerContent}>
            <Title2>{displayName}</Title2>
            <Text className={styles.logicalName}>
              Logical Name: {schema.LogicalName} | Schema: {schema.SchemaName}
            </Text>
            {description && (
              <Text style={{ marginTop: tokens.spacingVerticalS }}>{description}</Text>
            )}
          </div>
        </div>

        {/* Metadata Grid */}
        <div className={styles.metadataGrid}>
          <div className={styles.metadataItem}>
            <Text className={styles.metadataLabel}>Entity Set Name</Text>
            <Text className={styles.metadataValue}>{schema.EntitySetName || 'N/A'}</Text>
          </div>
          <div className={styles.metadataItem}>
            <Text className={styles.metadataLabel}>Primary ID Attribute</Text>
            <Text className={styles.metadataValue}>{schema.PrimaryIdAttribute || 'N/A'}</Text>
          </div>
          <div className={styles.metadataItem}>
            <Text className={styles.metadataLabel}>Primary Name Attribute</Text>
            <Text className={styles.metadataValue}>{schema.PrimaryNameAttribute || 'N/A'}</Text>
          </div>
          <div className={styles.metadataItem}>
            <Text className={styles.metadataLabel}>Ownership Type</Text>
            <Text className={styles.metadataValue}>{schema.OwnershipTypeName || 'Unknown'}</Text>
          </div>
          <div className={styles.metadataItem}>
            <Text className={styles.metadataLabel}>Object Type Code</Text>
            <Text className={styles.metadataValue}>{schema.ObjectTypeCode || 'N/A'}</Text>
          </div>
          <div className={styles.metadataItem}>
            <Text className={styles.metadataLabel}>Total Attributes</Text>
            <Text className={styles.metadataValue}>{attributeCount}</Text>
          </div>
        </div>

        {/* Badges */}
        <div className={styles.badges}>
          {schema.IsCustomEntity && (
            <Badge appearance="filled" shape="rounded" color="brand">
              ✨ Custom Entity
            </Badge>
          )}
          {schema.IsManaged && (
            <Badge appearance="filled" shape="rounded" color="warning">
              🔒 Managed
            </Badge>
          )}
          {schema.IsActivity && (
            <Badge appearance="tint" shape="rounded" color="important">
              Activity
            </Badge>
          )}
          {schema.IsAuditEnabled?.Value && (
            <Badge appearance="tint" shape="rounded" color="success">
              Audit Enabled
            </Badge>
          )}
          {schema.ChangeTrackingEnabled && (
            <Badge appearance="tint" shape="rounded" color="brand">
              Change Tracking
            </Badge>
          )}
          {schema.IsCustomizable?.Value === false && (
            <Badge appearance="outline" shape="rounded" color="subtle">
              Not Customizable
            </Badge>
          )}
        </div>
      </Card>

      {/* Tabbed Content */}
      <Card>
        <TabList
          selectedValue={selectedTab}
          onTabSelect={(_event: SelectTabEvent, data: SelectTabData) => {
            setSelectedTab(data.value as string);
          }}
        >
          <Tab value="fields">
            Fields ({attributeCount})
          </Tab>
          <Tab value="relationships">
            Relationships ({oneToManyCount + manyToOneCount + manyToManyCount})
          </Tab>
          <Tab value="keys">
            Keys ({keysCount + 1})
          </Tab>
          {blueprint && formsCount > 0 && (
            <Tab value="forms">
              Forms & Web Resources ({formsCount})
            </Tab>
          )}
          {blueprint && totalAutomation > 0 && (
            <Tab value="execution-pipeline">
              Execution Pipeline ({totalAutomation})
            </Tab>
          )}
        </TabList>

        <div className={styles.tabContent}>
          {selectedTab === 'fields' && schema.Attributes && (
            <FieldsTable attributes={schema.Attributes} />
          )}

          {selectedTab === 'relationships' && (
            <RelationshipsView
              oneToMany={filteredOneToMany}
              manyToOne={filteredManyToOne}
              manyToMany={filteredManyToMany}
              currentEntityName={schema.LogicalName}
            />
          )}

          {selectedTab === 'keys' && (
            <AlternateKeysView
              keys={schema.Keys || []}
              primaryIdAttribute={schema.PrimaryIdAttribute}
            />
          )}

          {selectedTab === 'forms' && blueprint && (
            <FormsTable forms={blueprint.forms} />
          )}

          {selectedTab === 'execution-pipeline' && blueprint && (
            <ExecutionPipelineView blueprint={blueprint} classicWorkflows={classicWorkflows} />
          )}
        </div>
      </Card>
    </div>
  );
}
