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
  makeStyles,
} from '@fluentui/react-components';
import {
  Code20Regular,
  ArrowSync20Regular,
  ArrowRight20Regular,
  LockClosed20Regular,
} from '@fluentui/react-icons';
import type { CustomAPI, CustomAPIParameter } from '../core';
import { formatDate } from '../utils/dateFormat';

const useStyles = makeStyles({
  root: {
    maxWidth: '1400px',
    padding: tokens.spacingVerticalXL,
  },
  header: {
    marginBottom: tokens.spacingVerticalXL,
  },
  headerTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    marginBottom: tokens.spacingVerticalS,
  },
  description: {
    color: tokens.colorNeutralForeground3,
    marginBottom: tokens.spacingVerticalS,
  },
  badgeRow: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    flexWrap: 'wrap',
  },
  divider: {
    marginBottom: tokens.spacingVerticalXL,
  },
  card: {
    marginBottom: tokens.spacingVerticalXL,
  },
  cardBody: {
    padding: tokens.spacingVerticalM,
  },
  configGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: tokens.spacingVerticalM,
    padding: tokens.spacingVerticalM,
  },
  cardHeaderRow: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  monoName: {
    fontFamily: 'monospace',
    fontWeight: '500' as const,
  },
  monoSmall: {
    fontFamily: 'monospace',
    fontSize: tokens.fontSizeBase200,
  },
  monoBody: {
    fontFamily: 'monospace',
    fontSize: tokens.fontSizeBase200,
  },
  subtle: {
    color: tokens.colorNeutralForeground3,
  },
  emptyCell: {
    padding: tokens.spacingVerticalM,
    textAlign: 'center' as const,
    color: tokens.colorNeutralForeground3,
  },
  codeBlock: {
    display: 'block',
    padding: tokens.spacingVerticalS,
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
    fontFamily: 'monospace',
    fontSize: tokens.fontSizeBase200,
  },
  usageLabel: {
    display: 'block',
    marginBottom: tokens.spacingVerticalXS,
    fontWeight: tokens.fontWeightSemibold,
  },
  usageEndpoint: {
    marginBottom: tokens.spacingVerticalM,
  },
  usageType: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
  },
  captionLabel: {
    color: tokens.colorNeutralForeground3,
  },
});

interface CustomAPIDetailViewProps {
  api: CustomAPI;
}

/**
 * Detailed view of a Custom API with request/response parameters
 */
export function CustomAPIDetailView({ api }: CustomAPIDetailViewProps) {
  const styles = useStyles();

  const renderParameterTable = (parameters: CustomAPIParameter[], title: string, emptyMessage: string) => {
    if (parameters.length === 0) {
      return <div className={styles.emptyCell}>{emptyMessage}</div>;
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
                  <span className={styles.monoName}>{param.uniqueName}</span>
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
                    <span className={styles.monoSmall}>{param.logicalEntityName}</span>
                  ) : (
                    <span className={styles.subtle}>-</span>
                  )}
                </TableCellLayout>
              </TableCell>
              <TableCell>
                <TableCellLayout>
                  {param.description || <span className={styles.subtle}>No description</span>}
                </TableCellLayout>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <div className={styles.root}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <Code20Regular style={{ color: tokens.colorBrandForeground1 }} />
          <Title3 className={styles.monoName}>{api.uniqueName}</Title3>
        </div>
        {api.description && (
          <Body1 className={styles.description}>{api.description}</Body1>
        )}
        <div className={styles.badgeRow}>
          <Badge appearance="filled" shape="rounded" color={api.isFunction ? 'brand' : 'danger'} size="large">
            {api.isFunction ? (
              <><ArrowRight20Regular /> Function (Read-Only)</>
            ) : (
              <><ArrowSync20Regular /> Action (Can Modify Data)</>
            )}
          </Badge>
          <Badge
            appearance="filled"
            shape="rounded"
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

      <Divider className={styles.divider} />

      {/* API Configuration */}
      <Card className={styles.card}>
        <CardHeader header={<strong>Configuration</strong>} />
        <div className={styles.configGrid}>
          <div>
            <Caption1 className={styles.captionLabel}>Unique Name</Caption1>
            <Body1 className={styles.monoBody}>{api.uniqueName}</Body1>
          </div>
          <div>
            <Caption1 className={styles.captionLabel}>Display Name</Caption1>
            <Body1>{api.displayName}</Body1>
          </div>
          <div>
            <Caption1 className={styles.captionLabel}>Binding Type</Caption1>
            <Body1>{api.bindingType}</Body1>
          </div>
          <div>
            <Caption1 className={styles.captionLabel}>Bound Entity</Caption1>
            <Body1>
              {api.boundEntityLogicalName ? (
                <span className={styles.monoSmall}>{api.boundEntityLogicalName}</span>
              ) : (
                <span className={styles.subtle}>None</span>
              )}
            </Body1>
          </div>
          <div>
            <Caption1 className={styles.captionLabel}>Execution Privilege</Caption1>
            <Body1>{api.executionPrivilege}</Body1>
          </div>
          <div>
            <Caption1 className={styles.captionLabel}>Plugin Step Type</Caption1>
            <Body1>{api.allowedCustomProcessingStepType}</Body1>
          </div>
          <div>
            <Caption1 className={styles.captionLabel}>Owner</Caption1>
            <Body1>{api.owner}</Body1>
          </div>
          <div>
            <Caption1 className={styles.captionLabel}>Last Modified</Caption1>
            <Body1>
              {formatDate(api.modifiedOn)} by {api.modifiedBy}
            </Body1>
          </div>
        </div>
      </Card>

      {/* Request Parameters (Input) */}
      <Card className={styles.card}>
        <CardHeader
          header={
            <div className={styles.cardHeaderRow}>
              <strong>Request Parameters (Input)</strong>
              <Badge appearance="tint" shape="circular" size="small">
                {api.requestParameters.length}
              </Badge>
            </div>
          }
        />
        <div className={styles.cardBody}>
          {renderParameterTable(api.requestParameters, 'Request Parameters', 'No input parameters defined')}
        </div>
      </Card>

      {/* Response Properties (Output) */}
      <Card className={styles.card}>
        <CardHeader
          header={
            <div className={styles.cardHeaderRow}>
              <strong>Response Properties (Output)</strong>
              <Badge appearance="tint" shape="circular" size="small" color="success">
                {api.responseProperties.length}
              </Badge>
            </div>
          }
        />
        <div className={styles.cardBody}>
          {renderParameterTable(api.responseProperties, 'Response Properties', 'No output properties defined')}
        </div>
      </Card>

      {/* Usage Information */}
      <Card>
        <CardHeader header={<strong>Usage Information</strong>} />
        <div className={styles.cardBody}>
          <div className={styles.usageEndpoint}>
            <strong className={styles.usageLabel}>Endpoint Pattern:</strong>
            <code className={styles.codeBlock}>
              {api.isFunction ? 'GET ' : 'POST '}
              {api.bindingType === 'Global'
                ? `/api/data/v9.2/${api.uniqueName}`
                : api.bindingType === 'Entity'
                  ? `/api/data/v9.2/${api.boundEntityLogicalName}(id)/${api.uniqueName}`
                  : `/api/data/v9.2/${api.boundEntityLogicalName}/${api.uniqueName}`}
            </code>
          </div>
          <div className={styles.usageType}>
            <strong>Type: </strong>
            {api.isFunction ? (
              <>This is a <strong>Function</strong> (read-only operation). Use GET requests to invoke it. Functions cannot modify data.</>
            ) : (
              <>This is an <strong>Action</strong> (can modify data). Use POST requests to invoke it. Actions can create, update, or delete data.</>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
