import {
  Card,
  CardHeader,
  Badge,
  tokens,
  Title3,
  Body1,
  Caption1,
  Divider,
  Table,
  TableHeader,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  TableCellLayout,
} from '@fluentui/react-components';
import { Options20Regular } from '@fluentui/react-icons';
import type { GlobalChoice, GlobalChoiceOption } from '@ppsb/core';
import { formatDate } from '../utils/dateFormat';

interface GlobalChoiceDetailViewProps {
  globalChoice: GlobalChoice;
}

export function GlobalChoiceDetailView({ globalChoice }: GlobalChoiceDetailViewProps) {
  return (
    <div style={{ padding: '20px', maxWidth: '1200px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <Options20Regular style={{ fontSize: '24px', color: tokens.colorBrandForeground1 }} />
          <Title3>{globalChoice.displayName}</Title3>
        </div>
        {globalChoice.description && (
          <Body1 style={{ color: tokens.colorNeutralForeground3, marginBottom: '12px' }}>
            {globalChoice.description}
          </Body1>
        )}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Badge appearance="filled" color={globalChoice.isManaged ? 'warning' : 'success'} size="large">
            {globalChoice.isManaged ? '🔒 Managed' : '✓ Unmanaged'}
          </Badge>
          {!globalChoice.isCustomizable && (
            <Badge appearance="filled" color="danger" size="large">
              Not Customizable
            </Badge>
          )}
          <Badge appearance="tint" size="large">
            {globalChoice.totalOptions} Options
          </Badge>
        </div>
      </div>

      <Divider style={{ marginBottom: '24px' }} />

      {/* Details */}
      <Card style={{ marginBottom: '24px' }}>
        <CardHeader header={<strong>Details</strong>} />
        <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>Logical Name</Caption1>
            <Body1 style={{ fontFamily: 'monospace' }}>{globalChoice.name}</Body1>
          </div>
          <div>
            <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>Display Name</Caption1>
            <Body1>{globalChoice.displayName}</Body1>
          </div>
          <div>
            <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>Owner</Caption1>
            <Body1>{globalChoice.owner}</Body1>
          </div>
          <div>
            <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>Last Modified</Caption1>
            <Body1>
              {formatDate(globalChoice.modifiedOn)} by {globalChoice.modifiedBy}
            </Body1>
          </div>
        </div>
      </Card>

      {/* Options Table */}
      <Card>
        <CardHeader
          header={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <strong>Options</strong>
              <Badge appearance="tint" size="small">
                {globalChoice.options.length}
              </Badge>
            </div>
          }
        />
        <div style={{ padding: '16px' }}>
          {globalChoice.options.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: tokens.colorNeutralForeground3 }}>
              No options defined
            </div>
          ) : (
            <Table aria-label="Global Choice Options" size="small">
              <TableHeader>
                <TableRow>
                  <TableHeaderCell>Value</TableHeaderCell>
                  <TableHeaderCell>Label</TableHeaderCell>
                  <TableHeaderCell>Description</TableHeaderCell>
                  <TableHeaderCell>Color</TableHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {globalChoice.options.map((option: GlobalChoiceOption) => (
                  <TableRow key={option.value}>
                    <TableCell>
                      <TableCellLayout>
                        <Badge appearance="tint" size="small">
                          {option.value}
                        </Badge>
                      </TableCellLayout>
                    </TableCell>
                    <TableCell>
                      <TableCellLayout>
                        <span style={{ fontWeight: 500 }}>{option.label}</span>
                      </TableCellLayout>
                    </TableCell>
                    <TableCell>
                      <TableCellLayout>
                        {option.description || (
                          <span style={{ color: tokens.colorNeutralForeground3 }}>-</span>
                        )}
                      </TableCellLayout>
                    </TableCell>
                    <TableCell>
                      <TableCellLayout>
                        {option.color ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div
                              style={{
                                width: '16px',
                                height: '16px',
                                backgroundColor: option.color,
                                border: '1px solid ' + tokens.colorNeutralStroke1,
                                borderRadius: '4px',
                              }}
                            />
                            <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                              {option.color}
                            </span>
                          </div>
                        ) : (
                          <span style={{ color: tokens.colorNeutralForeground3 }}>-</span>
                        )}
                      </TableCellLayout>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </Card>
    </div>
  );
}
