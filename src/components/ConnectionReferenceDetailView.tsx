import { Card, CardHeader, Badge, tokens, Title3, Body1, Caption1, Divider } from '@fluentui/react-components';
import { PlugConnected20Regular } from '@fluentui/react-icons';
import type { ConnectionReference } from '../core';

interface ConnectionReferenceDetailViewProps {
  connectionRef: ConnectionReference;
}

export function ConnectionReferenceDetailView({ connectionRef }: ConnectionReferenceDetailViewProps) {
  return (
    <div style={{ padding: '20px', maxWidth: '1000px' }}>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <PlugConnected20Regular style={{ fontSize: '24px', color: tokens.colorBrandForeground1 }} />
          <Title3>{connectionRef.displayName}</Title3>
        </div>
        {connectionRef.description && <Body1 style={{ color: tokens.colorNeutralForeground2, marginBottom: '12px' }}>{connectionRef.description}</Body1>}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Badge appearance="filled" shape="rounded" color={connectionRef.connectionId ? 'success' : 'danger'} size="large">
            {connectionRef.connectionId ? '✓ Connected' : '✗ Not Connected'}
          </Badge>
          {connectionRef.isManaged && <Badge appearance="filled" shape="rounded" color="warning" size="large">Managed</Badge>}
        </div>
      </div>

      <Divider style={{ marginBottom: '24px' }} />

      <Card>
        <CardHeader header={<strong>Details</strong>} />
        <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div><Caption1 style={{ color: tokens.colorNeutralForeground3 }}>Logical Name</Caption1>
            <Body1 style={{ fontFamily: 'monospace' }}>{connectionRef.name}</Body1></div>
          <div><Caption1 style={{ color: tokens.colorNeutralForeground3 }}>Connector</Caption1>
            <Body1>{connectionRef.connectorDisplayName || 'Unknown'}</Body1></div>
          <div><Caption1 style={{ color: tokens.colorNeutralForeground3 }}>Connection ID</Caption1>
            <Body1 style={{ fontFamily: 'monospace', fontSize: '12px', wordBreak: 'break-all' }}>
              {connectionRef.connectionId || <span style={{ color: tokens.colorNeutralForeground3 }}>Not set</span>}
            </Body1></div>
          <div><Caption1 style={{ color: tokens.colorNeutralForeground3 }}>Owner</Caption1>
            <Body1>{connectionRef.owner}</Body1></div>
        </div>
      </Card>
    </div>
  );
}
