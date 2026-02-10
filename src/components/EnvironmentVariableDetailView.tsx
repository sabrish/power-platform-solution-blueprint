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
import { Settings20Regular } from '@fluentui/react-icons';
import type { EnvironmentVariable } from '../core';

interface EnvironmentVariableDetailViewProps {
  envVar: EnvironmentVariable;
}

export function EnvironmentVariableDetailView({ envVar }: EnvironmentVariableDetailViewProps) {
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'String': return tokens.colorPaletteBlueForeground2;
      case 'Number': return tokens.colorPaletteGreenForeground2;
      case 'Boolean': return tokens.colorPaletteRedForeground2;
      case 'JSON': return tokens.colorPaletteYellowForeground2;
      case 'DataSource': return tokens.colorPalettePurpleForeground2;
      default: return tokens.colorBrandForeground1;
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1000px' }}>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <Settings20Regular style={{ fontSize: '24px', color: tokens.colorBrandForeground1 }} />
          <Title3>{envVar.displayName}</Title3>
        </div>
        <Body1 style={{ fontFamily: 'monospace', color: tokens.colorNeutralForeground3, marginBottom: '12px' }}>
          {envVar.schemaName}
        </Body1>
        {envVar.description && (
          <Body1 style={{ color: tokens.colorNeutralForeground2, marginBottom: '12px' }}>
            {envVar.description}
          </Body1>
        )}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Badge appearance="filled" size="large" style={{ backgroundColor: getTypeColor(envVar.typeName) }}>
            {envVar.typeName}
          </Badge>
          {envVar.isRequired && <Badge appearance="filled" color="danger" size="large">Required</Badge>}
          {envVar.isManaged && <Badge appearance="filled" color="warning" size="large">Managed</Badge>}
        </div>
      </div>

      <Divider style={{ marginBottom: '24px' }} />

      <Card style={{ marginBottom: '24px' }}>
        <CardHeader header={<strong>Values</strong>} />
        <div style={{ padding: '16px' }}>
          <div style={{ marginBottom: '16px' }}>
            <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>Current Value</Caption1>
            <Body1 style={{ fontFamily: 'monospace', fontSize: '14px', padding: '8px', backgroundColor: tokens.colorNeutralBackground2, borderRadius: '4px', marginTop: '4px' }}>
              {envVar.currentValue || <span style={{ color: tokens.colorNeutralForeground3 }}>Not set</span>}
            </Body1>
          </div>
          <div>
            <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>Default Value</Caption1>
            <Body1 style={{ fontFamily: 'monospace', fontSize: '14px', padding: '8px', backgroundColor: tokens.colorNeutralBackground2, borderRadius: '4px', marginTop: '4px' }}>
              {envVar.defaultValue || <span style={{ color: tokens.colorNeutralForeground3 }}>None</span>}
            </Body1>
          </div>
        </div>
      </Card>

      <Card style={{ marginBottom: '24px' }}>
        <CardHeader header={<strong>Configuration</strong>} />
        <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>Type</Caption1>
            <Body1>{envVar.typeName}</Body1>
          </div>
          <div>
            <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>Required</Caption1>
            <Body1>{envVar.isRequired ? 'Yes' : 'No'}</Body1>
          </div>
          <div>
            <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>Customizable</Caption1>
            <Body1>{envVar.isCustomizable ? 'Yes' : 'No'}</Body1>
          </div>
          <div>
            <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>Owner</Caption1>
            <Body1>{envVar.owner}</Body1>
          </div>
        </div>
      </Card>

      {envVar.hint && (
        <Card>
          <CardHeader header={<strong>Hint</strong>} />
          <div style={{ padding: '16px' }}>
            <Body1>{envVar.hint}</Body1>
          </div>
        </Card>
      )}
    </div>
  );
}
