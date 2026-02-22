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
import { PlugDisconnected20Regular } from '@fluentui/react-icons';
import type { CustomConnector } from '../core';
import { formatDate } from '../utils/dateFormat';

interface CustomConnectorDetailViewProps {
  customConnector: CustomConnector;
}

export function CustomConnectorDetailView({ customConnector }: CustomConnectorDetailViewProps) {
  return (
    <div style={{ padding: '20px', maxWidth: '1200px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <PlugDisconnected20Regular style={{ fontSize: '24px', color: tokens.colorBrandForeground1 }} />
          <Title3>{customConnector.displayName}</Title3>
        </div>
        {customConnector.description && (
          <Body1 style={{ color: tokens.colorNeutralForeground3, marginBottom: '12px' }}>
            {customConnector.description}
          </Body1>
        )}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Badge appearance="filled" shape="rounded" color={customConnector.isManaged ? 'warning' : 'success'} size="large">
            {customConnector.isManaged ? '🔒 Managed' : '✓ Unmanaged'}
          </Badge>
          <Badge appearance="tint" shape="rounded" color="brand" size="large">
            {customConnector.connectorType}
          </Badge>
          {!customConnector.isCustomizable && (
            <Badge appearance="filled" shape="rounded" color="important" size="large">
              Not Customizable
            </Badge>
          )}
        </div>
      </div>

      <Divider style={{ marginBottom: '24px' }} />

      {/* Details */}
      <Card style={{ marginBottom: '24px' }}>
        <CardHeader header={<strong>Details</strong>} />
        <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>Logical Name</Caption1>
            <Body1 style={{ fontFamily: 'monospace' }}>{customConnector.name}</Body1>
          </div>
          <div>
            <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>Display Name</Caption1>
            <Body1>{customConnector.displayName}</Body1>
          </div>
          <div>
            <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>Owner</Caption1>
            <Body1>{customConnector.owner}</Body1>
          </div>
          <div>
            <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>Last Modified</Caption1>
            <Body1>
              {formatDate(customConnector.modifiedOn)} by {customConnector.modifiedBy}
            </Body1>
          </div>
        </div>
      </Card>

      {/* Capabilities */}
      {customConnector.capabilities.length > 0 && (
        <Card style={{ marginBottom: '24px' }}>
          <CardHeader
            header={
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <strong>Capabilities</strong>
                <Badge appearance="tint" shape="rounded" size="small">
                  {customConnector.capabilities.length}
                </Badge>
              </div>
            }
          />
          <div style={{ padding: '16px' }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {customConnector.capabilities.map((capability, idx) => (
                <Badge key={idx} appearance="outline" size="large">
                  {capability}
                </Badge>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Connection Parameters */}
      {customConnector.connectionParameters.length > 0 && (
        <Card style={{ marginBottom: '24px' }}>
          <CardHeader
            header={
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <strong>Connection Parameters</strong>
                <Badge appearance="tint" shape="rounded" size="small">
                  {customConnector.connectionParameters.length}
                </Badge>
              </div>
            }
          />
          <div style={{ padding: '16px' }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {customConnector.connectionParameters.map((param, idx) => (
                <Badge key={idx} appearance="tint" size="large">
                  {param}
                </Badge>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Icon */}
      {customConnector.iconUri && (
        <Card>
          <CardHeader header={<strong>Icon</strong>} />
          <div style={{ padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img
                src={customConnector.iconUri}
                alt={`${customConnector.displayName} icon`}
                style={{ width: '48px', height: '48px', objectFit: 'contain' }}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <Body1 style={{ fontFamily: 'monospace', fontSize: '12px', wordBreak: 'break-all' }}>
                {customConnector.iconUri}
              </Body1>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
