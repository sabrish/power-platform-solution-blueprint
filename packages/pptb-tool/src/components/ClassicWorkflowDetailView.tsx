import {
  Card,
  CardHeader,
  Badge,
  Button,
  tokens,
  Title3,
  Body1,
  Caption1,
  Divider,
} from '@fluentui/react-components';
import {
  Warning20Regular,
  FlashFlow20Regular,
  Cloud20Regular,
  Clock20Regular,
  DocumentBulletList20Regular,
  Open20Regular,
} from '@fluentui/react-icons';
import type { ClassicWorkflow, MigrationFeature } from '@ppsb/core';
import { formatDate } from '../utils/dateFormat';

interface ClassicWorkflowDetailViewProps {
  workflow: ClassicWorkflow;
}

/**
 * Detailed view of a classic workflow with migration recommendations
 */
export function ClassicWorkflowDetailView({ workflow }: ClassicWorkflowDetailViewProps) {
  const recommendation = workflow.migrationRecommendation;

  const getMigrationComplexityColor = (
    complexity: 'Low' | 'Medium' | 'High' | 'Critical' | undefined
  ): string => {
    switch (complexity) {
      case 'Critical':
        return tokens.colorPaletteRedBackground3;
      case 'High':
        return tokens.colorPaletteDarkOrangeBackground3;
      case 'Medium':
        return tokens.colorPaletteYellowBackground3;
      case 'Low':
      default:
        return tokens.colorPaletteGreenBackground3;
    }
  };

  const getMigrationComplexityBorder = (
    complexity: 'Low' | 'Medium' | 'High' | 'Critical' | undefined
  ): string => {
    switch (complexity) {
      case 'Critical':
        return tokens.colorPaletteRedBorder2;
      case 'High':
        return tokens.colorPaletteDarkOrangeBorder2;
      case 'Medium':
        return tokens.colorPaletteYellowBorder2;
      case 'Low':
      default:
        return tokens.colorPaletteGreenBorder2;
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1000px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <Warning20Regular style={{ fontSize: '24px', color: tokens.colorPaletteRedForeground1 }} />
          <Title3>{workflow.name}</Title3>
        </div>
        {workflow.description && (
          <Body1 style={{ color: tokens.colorNeutralForeground3, marginBottom: '12px' }}>
            {workflow.description}
          </Body1>
        )}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Badge
            appearance="filled"
            color={workflow.state === 'Active' ? 'success' : workflow.state === 'Draft' ? 'warning' : 'danger'}
          >
            {workflow.state}
          </Badge>
          <Badge appearance="filled" color={workflow.mode === 1 ? 'warning' : 'informative'}>
            {workflow.mode === 1 ? (
              <>
                <FlashFlow20Regular /> RealTime
              </>
            ) : (
              <>
                <Cloud20Regular /> Background
              </>
            )}
          </Badge>
          <Badge appearance="outline">{workflow.scopeName}</Badge>
          <Badge appearance="outline">{workflow.entityDisplayName || workflow.entity}</Badge>
        </div>
      </div>

      <Divider style={{ marginBottom: '24px' }} />

      {/* Migration Complexity Alert */}
      {recommendation && (
        <Card
          style={{
            marginBottom: '24px',
            backgroundColor: getMigrationComplexityColor(recommendation.complexity),
            borderLeft: `4px solid ${getMigrationComplexityBorder(recommendation.complexity)}`,
          }}
        >
          <CardHeader
            header={
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Warning20Regular />
                <strong>Migration Complexity: {recommendation.complexity}</strong>
              </div>
            }
            description={
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <Clock20Regular />
                <span>Estimated Effort: {recommendation.effort}</span>
              </div>
            }
          />
        </Card>
      )}

      {/* Workflow Details */}
      <Card style={{ marginBottom: '24px' }}>
        <CardHeader header={<strong>Workflow Configuration</strong>} />
        <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>Type</Caption1>
            <Body1>{workflow.typeName}</Body1>
          </div>
          <div>
            <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>Mode</Caption1>
            <Body1>{workflow.modeName}</Body1>
          </div>
          <div>
            <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>Triggers</Caption1>
            <Body1>
              {[
                workflow.triggerOnCreate && 'Create',
                workflow.triggerOnUpdate && 'Update',
                workflow.triggerOnDelete && 'Delete',
                workflow.onDemand && 'On-Demand',
              ]
                .filter(Boolean)
                .join(', ') || 'None'}
            </Body1>
          </div>
          <div>
            <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>Scope</Caption1>
            <Body1>{workflow.scopeName}</Body1>
          </div>
          <div>
            <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>Owner</Caption1>
            <Body1>{workflow.owner}</Body1>
          </div>
          <div>
            <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>Last Modified</Caption1>
            <Body1>
              {formatDate(workflow.modifiedOn)} by {workflow.modifiedBy}
            </Body1>
          </div>
        </div>
      </Card>

      {/* Migration Approach */}
      {recommendation && (
        <>
          <Card style={{ marginBottom: '24px' }}>
            <CardHeader
              header={
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <DocumentBulletList20Regular />
                  <strong>Migration Approach</strong>
                </div>
              }
            />
            <div style={{ padding: '16px' }}>
              <Body1 style={{ whiteSpace: 'pre-line', fontFamily: 'monospace', fontSize: '13px' }}>
                {recommendation.approach}
              </Body1>
            </div>
          </Card>

          {/* Detected Features */}
          <Card style={{ marginBottom: '24px' }}>
            <CardHeader header={<strong>Detected Features & Migration Path</strong>} />
            <div style={{ padding: '16px' }}>
              {recommendation.features.map((feature: MigrationFeature, index: number) => (
                <div
                  key={index}
                  style={{
                    marginBottom: '16px',
                    paddingBottom: '16px',
                    borderBottom:
                      index < recommendation.features.length - 1
                        ? `1px solid ${tokens.colorNeutralStroke2}`
                        : undefined,
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: '4px' }}>{feature.feature}</div>
                  <div style={{ fontSize: '13px', color: tokens.colorNeutralForeground2, marginBottom: '4px' }}>
                    <strong>Recommendation:</strong> {feature.recommendation}
                  </div>
                  <div style={{ fontSize: '13px', color: tokens.colorNeutralForeground3 }}>
                    <strong>Migration Path:</strong> {feature.migrationPath}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Challenges */}
          {recommendation.challenges.length > 0 && (
            <Card style={{ marginBottom: '24px' }}>
              <CardHeader
                header={
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Warning20Regular />
                    <strong>Migration Challenges</strong>
                  </div>
                }
              />
              <div style={{ padding: '16px' }}>
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                  {recommendation.challenges.map((challenge: string, index: number) => (
                    <li key={index} style={{ marginBottom: '8px' }}>
                      <Body1>{challenge}</Body1>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          )}

          {/* Documentation Link */}
          <Card>
            <CardHeader header={<strong>Migration Resources</strong>} />
            <div style={{ padding: '16px' }}>
              <Body1 style={{ marginBottom: '12px' }}>
                For detailed guidance on migrating from classic workflows to Power Automate cloud flows:
              </Body1>
              <Button
                appearance="primary"
                icon={<Open20Regular />}
                iconPosition="after"
                onClick={() => window.open(recommendation.documentationLink, '_blank')}
              >
                View Migration Documentation
              </Button>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
