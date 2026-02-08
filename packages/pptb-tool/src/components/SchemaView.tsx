import { useState } from 'react';
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
import type { DetailedEntityMetadata, EntityBlueprint, ClassicWorkflow } from '@ppsb/core';
import { FieldsTable } from './FieldsTable';
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
}

export function SchemaView({ schema: schemaProp, blueprint, classicWorkflows = [] }: SchemaViewProps) {
  const styles = useStyles();
  const [selectedTab, setSelectedTab] = useState<string>('fields');

  // Use schema from blueprint if available, otherwise use direct schema prop
  const schema = blueprint?.entity || schemaProp!;

  const displayName = schema.DisplayName?.UserLocalizedLabel?.Label || schema.LogicalName;
  const description = schema.Description?.UserLocalizedLabel?.Label;

  const attributeCount = schema.Attributes?.length || 0;
  const oneToManyCount = schema.OneToManyRelationships?.length || 0;
  const manyToOneCount = schema.ManyToOneRelationships?.length || 0;
  const manyToManyCount = schema.ManyToManyRelationships?.length || 0;
  const keysCount = schema.Keys?.length || 0;

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
            <Badge appearance="filled" color="brand">
              ✨ Custom Entity
            </Badge>
          )}
          {schema.IsManaged && (
            <Badge appearance="filled" color="warning">
              🔒 Managed
            </Badge>
          )}
          {schema.IsActivity && (
            <Badge appearance="tint" color="important">
              Activity
            </Badge>
          )}
          {schema.IsAuditEnabled?.Value && (
            <Badge appearance="tint" color="success">
              Audit Enabled
            </Badge>
          )}
          {schema.ChangeTrackingEnabled && (
            <Badge appearance="tint" color="brand">
              Change Tracking
            </Badge>
          )}
          {schema.IsCustomizable?.Value === false && (
            <Badge appearance="outline" color="subtle">
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
              oneToMany={schema.OneToManyRelationships || []}
              manyToOne={schema.ManyToOneRelationships || []}
              manyToMany={schema.ManyToManyRelationships || []}
              currentEntityName={schema.LogicalName}
            />
          )}

          {selectedTab === 'keys' && (
            <AlternateKeysView
              keys={schema.Keys || []}
              primaryIdAttribute={schema.PrimaryIdAttribute}
            />
          )}

          {selectedTab === 'execution-pipeline' && blueprint && (
            <ExecutionPipelineView blueprint={blueprint} classicWorkflows={classicWorkflows} />
          )}
        </div>
      </Card>
    </div>
  );
}
