import {
  Card,
  CardHeader,
  Badge,
  tokens,
  Title3,
  Body1,
  Caption1,
  Divider,
} from '@fluentui/react-components';
import {
  Flowchart20Regular,
  Layer20Regular,
  ArrowRight20Regular,
} from '@fluentui/react-icons';
import type { BusinessProcessFlow, BPFStage } from '@ppsb/core';
import { formatDate } from '../utils/dateFormat';

interface BusinessProcessFlowDetailViewProps {
  bpf: BusinessProcessFlow;
}

/**
 * Detailed view of a Business Process Flow
 */
export function BusinessProcessFlowDetailView({ bpf }: BusinessProcessFlowDetailViewProps) {
  return (
    <div style={{ padding: '20px', maxWidth: '1200px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <Flowchart20Regular style={{ fontSize: '24px', color: tokens.colorBrandForeground1 }} />
          <Title3>{bpf.name}</Title3>
        </div>
        {bpf.description && (
          <Body1 style={{ color: tokens.colorNeutralForeground3, marginBottom: '12px' }}>
            {bpf.description}
          </Body1>
        )}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Badge
            appearance="filled"
            color={bpf.state === 'Active' ? 'success' : 'warning'}
          >
            {bpf.state}
          </Badge>
          {bpf.isManaged && (
            <Badge appearance="filled" color="warning">
              🔒 Managed
            </Badge>
          )}
          {bpf.definition.crossEntityFlow && (
            <Badge appearance="filled" color="important">
              Cross-Entity Flow
            </Badge>
          )}
          <Badge appearance="outline">{bpf.primaryEntityDisplayName || bpf.primaryEntity}</Badge>
        </div>
      </div>

      <Divider style={{ marginBottom: '24px' }} />

      {/* BPF Summary */}
      <Card style={{ marginBottom: '24px' }}>
        <CardHeader header={<strong>Process Summary</strong>} />
        <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>Primary Entity</Caption1>
            <Body1>{bpf.primaryEntityDisplayName || bpf.primaryEntity}</Body1>
          </div>
          <div>
            <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>Unique Name</Caption1>
            <Body1 style={{ fontFamily: 'monospace', fontSize: '13px' }}>{bpf.uniqueName}</Body1>
          </div>
          <div>
            <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>Total Stages</Caption1>
            <Body1>{bpf.definition.stages.length}</Body1>
          </div>
          <div>
            <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>Total Steps</Caption1>
            <Body1>{bpf.definition.totalSteps}</Body1>
          </div>
          <div>
            <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>Owner</Caption1>
            <Body1>{bpf.owner}</Body1>
          </div>
          <div>
            <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>Last Modified</Caption1>
            <Body1>
              {formatDate(bpf.modifiedOn)} by {bpf.modifiedBy}
            </Body1>
          </div>
        </div>
      </Card>

      {/* Entities Involved */}
      {bpf.definition.entities.length > 0 && (
        <Card style={{ marginBottom: '24px' }}>
          <CardHeader header={<strong>Entities Involved</strong>} />
          <div style={{ padding: '16px' }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {bpf.definition.entities.map((entity) => (
                <Badge key={entity} appearance="outline" size="large">
                  {entity}
                </Badge>
              ))}
            </div>
            {bpf.definition.crossEntityFlow && (
              <div
                style={{
                  marginTop: '12px',
                  padding: '8px',
                  backgroundColor: tokens.colorPaletteYellowBackground1,
                  borderRadius: '4px',
                  fontSize: '13px',
                }}
              >
                This is a <strong>cross-entity Business Process Flow</strong> that spans multiple
                entities. Users will move between different entity forms as they progress through
                stages.
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Stages */}
      {bpf.definition.stages.length > 0 && (
        <Card style={{ marginBottom: '24px' }}>
          <CardHeader
            header={
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layer20Regular />
                <strong>Process Stages</strong>
              </div>
            }
          />
          <div style={{ padding: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {bpf.definition.stages.map((stage: BPFStage, index: number) => (
                <div key={stage.id}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '16px',
                      backgroundColor: tokens.colorNeutralBackground2,
                      borderRadius: '8px',
                      border: `2px solid ${tokens.colorBrandBackground}`,
                    }}
                  >
                    <div
                      style={{
                        minWidth: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        backgroundColor: tokens.colorBrandBackground,
                        color: tokens.colorNeutralForegroundOnBrand,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 600,
                        fontSize: '16px',
                      }}
                    >
                      {stage.order + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, marginBottom: '4px' }}>{stage.name}</div>
                      <div style={{ fontSize: '13px', color: tokens.colorNeutralForeground3 }}>
                        Entity: <strong>{stage.entity}</strong>
                        {stage.steps.length > 0 && <> • {stage.steps.length} steps</>}
                      </div>
                    </div>
                  </div>

                  {/* Arrow between stages */}
                  {index < bpf.definition.stages.length - 1 && (
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'center',
                        padding: '8px 0',
                      }}
                    >
                      <ArrowRight20Regular
                        style={{
                          transform: 'rotate(90deg)',
                          color: tokens.colorNeutralForeground3,
                        }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Parse Error */}
      {bpf.definition.parseError && (
        <Card style={{ marginBottom: '24px', borderColor: tokens.colorPaletteRedBorder1 }}>
          <CardHeader header={<strong>Parse Warning</strong>} />
          <div style={{ padding: '16px' }}>
            <Body1 style={{ color: tokens.colorPaletteRedForeground1 }}>
              Unable to fully parse BPF definition: {bpf.definition.parseError}
            </Body1>
          </div>
        </Card>
      )}

      {/* Empty State */}
      {bpf.definition.stages.length === 0 && !bpf.definition.parseError && (
        <Card style={{ marginBottom: '24px' }}>
          <div style={{ padding: '40px', textAlign: 'center', color: tokens.colorNeutralForeground3 }}>
            <Layer20Regular style={{ fontSize: '48px', marginBottom: '16px' }} />
            <Body1>No stages defined for this Business Process Flow</Body1>
          </div>
        </Card>
      )}
    </div>
  );
}
