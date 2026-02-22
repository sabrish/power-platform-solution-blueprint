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
import {
  Code20Regular,
  ArrowSync20Regular,
  ArrowRight20Regular,
  LockClosed20Regular,
} from '@fluentui/react-icons';
import type { CustomAPI, CustomAPIParameter } from '../core';
import { formatDate } from '../utils/dateFormat';

interface CustomAPIDetailViewProps {
  api: CustomAPI;
}

/**
 * Detailed view of a Custom API with request/response parameters
 */
export function CustomAPIDetailView({ api }: CustomAPIDetailViewProps) {
  const renderParameterTable = (parameters: CustomAPIParameter[], title: string, emptyMessage: string) => {
    if (parameters.length === 0) {
      return (
        <div style={{ padding: '20px', textAlign: 'center', color: tokens.colorNeutralForeground3 }}>
          {emptyMessage}
        </div>
      );
    }

    return (
      <Table aria-label={title} size="small">
        <TableHeader>
          <TableRow>
            <TableHeaderCell>Name</TableHeaderCell>
            <TableHeaderCell>Type</TableHeaderCell>
            <TableHeaderCell>Required</TableHeaderCell>
            <TableHeaderCell>Entity</TableHeaderCell>
            <TableHeaderCell>Description</TableHeaderCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {parameters.map((param: CustomAPIParameter) => (
            <TableRow key={param.id}>
              <TableCell>
                <TableCellLayout>
                  <span style={{ fontFamily: 'monospace', fontWeight: 500 }}>{param.uniqueName}</span>
                </TableCellLayout>
              </TableCell>
              <TableCell>
                <TableCellLayout>
                  <Badge appearance="tint" shape="rounded" size="small">
                    {param.typeName}
                  </Badge>
                </TableCellLayout>
              </TableCell>
              <TableCell>
                <TableCellLayout>
                  {param.isOptional ? (
                    <Badge appearance="outline" shape="rounded" size="small" color="subtle">
                      Optional
                    </Badge>
                  ) : (
                    <Badge appearance="filled" shape="rounded" size="small" color="important">
                      Required
                    </Badge>
                  )}
                </TableCellLayout>
              </TableCell>
              <TableCell>
                <TableCellLayout>
                  {param.logicalEntityName ? (
                    <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                      {param.logicalEntityName}
                    </span>
                  ) : (
                    <span style={{ color: tokens.colorNeutralForeground3 }}>-</span>
                  )}
                </TableCellLayout>
              </TableCell>
              <TableCell>
                <TableCellLayout>
                  {param.description || (
                    <span style={{ color: tokens.colorNeutralForeground3 }}>No description</span>
                  )}
                </TableCellLayout>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1400px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <Code20Regular style={{ fontSize: '24px', color: tokens.colorBrandForeground1 }} />
          <Title3 style={{ fontFamily: 'monospace' }}>{api.uniqueName}</Title3>
        </div>
        {api.description && (
          <Body1 style={{ color: tokens.colorNeutralForeground3, marginBottom: '12px' }}>
            {api.description}
          </Body1>
        )}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Badge appearance="filled" shape="rounded" color={api.isFunction ? 'brand' : 'danger'} size="large">
            {api.isFunction ? (
              <>
                <ArrowRight20Regular /> Function (Read-Only)
              </>
            ) : (
              <>
                <ArrowSync20Regular /> Action (Can Modify Data)
              </>
            )}
          </Badge>
          <Badge
            appearance="filled"
            color={api.bindingType === 'Global' ? 'brand' : 'success'}
            size="large"
          >
            {api.bindingType} Binding
          </Badge>
          {api.isPrivate && (
            <Badge appearance="filled" shape="rounded" color="important" size="large">
              <LockClosed20Regular /> Private
            </Badge>
          )}
          {api.isManaged && (
            <Badge appearance="filled" shape="rounded" color="warning" size="large">
              🔒 Managed
            </Badge>
          )}
        </div>
      </div>

      <Divider style={{ marginBottom: '24px' }} />

      {/* API Configuration */}
      <Card style={{ marginBottom: '24px' }}>
        <CardHeader header={<strong>Configuration</strong>} />
        <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>Unique Name</Caption1>
            <Body1 style={{ fontFamily: 'monospace', fontSize: '13px' }}>{api.uniqueName}</Body1>
          </div>
          <div>
            <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>Display Name</Caption1>
            <Body1>{api.displayName}</Body1>
          </div>
          <div>
            <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>Binding Type</Caption1>
            <Body1>{api.bindingType}</Body1>
          </div>
          <div>
            <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>Bound Entity</Caption1>
            <Body1>
              {api.boundEntityLogicalName ? (
                <span style={{ fontFamily: 'monospace' }}>{api.boundEntityLogicalName}</span>
              ) : (
                <span style={{ color: tokens.colorNeutralForeground3 }}>None</span>
              )}
            </Body1>
          </div>
          <div>
            <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>Execution Privilege</Caption1>
            <Body1>{api.executionPrivilege}</Body1>
          </div>
          <div>
            <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>Plugin Step Type</Caption1>
            <Body1>{api.allowedCustomProcessingStepType}</Body1>
          </div>
          <div>
            <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>Owner</Caption1>
            <Body1>{api.owner}</Body1>
          </div>
          <div>
            <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>Last Modified</Caption1>
            <Body1>
              {formatDate(api.modifiedOn)} by {api.modifiedBy}
            </Body1>
          </div>
        </div>
      </Card>

      {/* Request Parameters (Input) */}
      <Card style={{ marginBottom: '24px' }}>
        <CardHeader
          header={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <strong>Request Parameters (Input)</strong>
              <Badge appearance="tint" shape="rounded" size="small">
                {api.requestParameters.length}
              </Badge>
            </div>
          }
        />
        <div style={{ padding: '16px' }}>
          {renderParameterTable(
            api.requestParameters,
            'Request Parameters',
            'No input parameters defined'
          )}
        </div>
      </Card>

      {/* Response Properties (Output) */}
      <Card style={{ marginBottom: '24px' }}>
        <CardHeader
          header={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <strong>Response Properties (Output)</strong>
              <Badge appearance="tint" shape="rounded" size="small" color="success">
                {api.responseProperties.length}
              </Badge>
            </div>
          }
        />
        <div style={{ padding: '16px' }}>
          {renderParameterTable(
            api.responseProperties,
            'Response Properties',
            'No output properties defined'
          )}
        </div>
      </Card>

      {/* Usage Information */}
      <Card>
        <CardHeader header={<strong>Usage Information</strong>} />
        <div style={{ padding: '16px' }}>
          <div style={{ marginBottom: '16px' }}>
            <strong style={{ display: 'block', marginBottom: '8px' }}>Endpoint Pattern:</strong>
            <code
              style={{
                display: 'block',
                padding: '12px',
                backgroundColor: tokens.colorNeutralBackground2,
                borderRadius: '4px',
                fontFamily: 'monospace',
                fontSize: '13px',
              }}
            >
              {api.isFunction ? 'GET ' : 'POST '}
              {api.bindingType === 'Global'
                ? `/api/data/v9.2/${api.uniqueName}`
                : api.bindingType === 'Entity'
                  ? `/api/data/v9.2/${api.boundEntityLogicalName}(id)/${api.uniqueName}`
                  : `/api/data/v9.2/${api.boundEntityLogicalName}/${api.uniqueName}`}
            </code>
          </div>

          <div style={{ fontSize: '13px', color: tokens.colorNeutralForeground2 }}>
            <strong>Type: </strong>
            {api.isFunction ? (
              <>
                This is a <strong>Function</strong> (read-only operation). Use GET requests to invoke
                it. Functions cannot modify data.
              </>
            ) : (
              <>
                This is an <strong>Action</strong> (can modify data). Use POST requests to invoke it.
                Actions can create, update, or delete data.
              </>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
