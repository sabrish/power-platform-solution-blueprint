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
import type { DetailedEntityMetadata, EntityBlueprint, ClassicWorkflow } from '../core';
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
  const formsCount = blueprint?.forms.length || 0;

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
          {blueprint && (
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

          {selectedTab === 'forms' && blueprint && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalM }}>
              {blueprint.forms.length === 0 ? (
                <div style={{ padding: tokens.spacingVerticalXXXL, textAlign: 'center', color: tokens.colorNeutralForeground3 }}>
                  <Text size={500} weight="semibold">No Forms Found</Text>
                  <Text style={{ marginTop: tokens.spacingVerticalS }}>
                    No forms were discovered for this entity. This could mean:
                  </Text>
                  <ul style={{ marginTop: tokens.spacingVerticalS, textAlign: 'left', display: 'inline-block' }}>
                    <li>The entity has no custom forms</li>
                    <li>Forms are not included in the selected solution(s)</li>
                    <li>Form discovery encountered an error (check console)</li>
                  </ul>
                </div>
              ) : (
                blueprint.forms.map((form) => (
                <Card key={form.id} style={{ padding: tokens.spacingVerticalM }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalS }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalM }}>
                      <Text weight="semibold" size={400}>{form.name}</Text>
                      <Badge appearance="tint" color="brand" size="small">{form.typeName}</Badge>
                    </div>

                    {form.libraries.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalXS, marginTop: tokens.spacingVerticalS }}>
                        <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                          Web Resources ({form.libraries.length}):
                        </Text>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: tokens.spacingHorizontalS }}>
                          {form.libraries.map((lib, idx) => (
                            <Badge key={idx} appearance="outline" color="important" size="small" style={{ fontFamily: 'Consolas, Monaco, monospace' }}>
                              {lib}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {form.eventHandlers.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalXS, marginTop: tokens.spacingVerticalS }}>
                        <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                          Event Handlers ({form.eventHandlers.length}):
                        </Text>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalXXS }}>
                          {form.eventHandlers.slice(0, 5).map((handler, idx) => (
                            <Text key={idx} size={200} style={{ fontFamily: 'Consolas, Monaco, monospace', color: tokens.colorNeutralForeground2 }}>
                              {handler.event}: {handler.libraryName}.{handler.functionName}
                              {handler.attribute && ` (${handler.attribute})`}
                            </Text>
                          ))}
                          {form.eventHandlers.length > 5 && (
                            <Text size={200} style={{ color: tokens.colorNeutralForeground3, fontStyle: 'italic' }}>
                              ... and {form.eventHandlers.length - 5} more handlers
                            </Text>
                          )}
                        </div>
                      </div>
                    )}

                    {form.libraries.length === 0 && form.eventHandlers.length === 0 && (
                      <Text size={200} style={{ color: tokens.colorNeutralForeground3, fontStyle: 'italic' }}>
                        No web resources registered
                      </Text>
                    )}
                  </div>
                </Card>
              )))
              }
            </div>
          )}

          {selectedTab === 'execution-pipeline' && blueprint && (
            <ExecutionPipelineView blueprint={blueprint} classicWorkflows={classicWorkflows} />
          )}
        </div>
      </Card>
    </div>
  );
}
