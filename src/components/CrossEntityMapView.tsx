import {
  Text,
  Title3,
  Card,
  Badge,
  makeStyles,
  tokens,
  DataGrid,
  DataGridHeader,
  DataGridRow,
  DataGridHeaderCell,
  DataGridBody,
  DataGridCell,
  TableColumnDefinition,
  createTableColumn,
  Link,
} from '@fluentui/react-components';
import { ArrowRight24Regular, Warning24Regular, Lightbulb24Regular } from '@fluentui/react-icons';
import type { CrossEntityLink } from '../core';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
  },
  comingSoonBanner: {
    padding: tokens.spacingVerticalL,
    backgroundColor: tokens.colorBrandBackground2,
    borderLeft: `4px solid ${tokens.colorBrandForeground1}`,
    borderRadius: tokens.borderRadiusMedium,
  },
  bannerHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    marginBottom: tokens.spacingVerticalS,
  },
  bannerIcon: {
    color: tokens.colorBrandForeground1,
    fontSize: '32px',
  },
  tableContainer: {
  },
  entityCell: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXXS,
  },
  entityName: {
    fontWeight: tokens.fontWeightSemibold,
  },
  entityLogical: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    fontFamily: 'Consolas, Monaco, monospace',
  },
  descriptionCell: {
    maxWidth: '400px',
    wordBreak: 'break-word',
  },
  warningIcon: {
    color: tokens.colorPaletteRedForeground1,
  },
  statsCard: {
    padding: tokens.spacingVerticalM,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: tokens.spacingHorizontalM,
    marginBottom: tokens.spacingVerticalL,
  },
  sampleDataNote: {
    padding: tokens.spacingVerticalM,
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusMedium,
    fontStyle: 'italic',
    marginBottom: tokens.spacingVerticalM,
  },
});

export interface CrossEntityMapViewProps {
  links: CrossEntityLink[];
}

export function CrossEntityMapView({ links: _links }: CrossEntityMapViewProps) {
  const styles = useStyles();

  // Sample data to demonstrate the feature
  const sampleLinks: CrossEntityLink[] = [
    {
      automationId: 'sample-flow-1',
      sourceEntity: 'contact',
      sourceEntityDisplayName: 'Contact',
      targetEntity: 'account',
      targetEntityDisplayName: 'Account',
      automationType: 'Flow',
      automationName: 'Update Account when Contact Changes',
      operation: 'Update',
      isAsynchronous: true,
      description: 'When a contact is updated, automatically update related account information',
    },
    {
      automationId: 'sample-plugin-1',
      sourceEntity: 'opportunity',
      sourceEntityDisplayName: 'Opportunity',
      targetEntity: 'quote',
      targetEntityDisplayName: 'Quote',
      automationType: 'Plugin',
      automationName: 'Generate Quote from Opportunity',
      operation: 'Create',
      isAsynchronous: false,
      description: 'Synchronously create a quote when opportunity reaches certain stage',
    },
    {
      automationId: 'sample-flow-2',
      sourceEntity: 'case',
      sourceEntityDisplayName: 'Case',
      targetEntity: 'email',
      targetEntityDisplayName: 'Email',
      automationType: 'Flow',
      automationName: 'Send Email on Case Resolution',
      operation: 'Create',
      isAsynchronous: true,
      description: 'Create and send email activity when case is resolved',
    },
  ];

  // Sample statistics
  const sampleStats = {
    total: 3,
    synchronous: 1,
    asynchronous: 2,
    uniqueSourceEntities: 3,
    uniqueTargetEntities: 3,
  };

  // Table columns
  const columns: TableColumnDefinition<CrossEntityLink>[] = [
    createTableColumn<CrossEntityLink>({
      columnId: 'source',
      renderHeaderCell: () => 'Source Entity',
      renderCell: (item) => (
        <div className={styles.entityCell}>
          <Text className={styles.entityName}>{item.sourceEntityDisplayName}</Text>
          <Text className={styles.entityLogical}>{item.sourceEntity}</Text>
        </div>
      ),
      compare: (a, b) => a.sourceEntity.localeCompare(b.sourceEntity),
    }),
    createTableColumn<CrossEntityLink>({
      columnId: 'arrow',
      renderHeaderCell: () => '',
      renderCell: () => <ArrowRight24Regular />,
    }),
    createTableColumn<CrossEntityLink>({
      columnId: 'target',
      renderHeaderCell: () => 'Target Entity',
      renderCell: (item) => (
        <div className={styles.entityCell}>
          <Text className={styles.entityName}>{item.targetEntityDisplayName}</Text>
          <Text className={styles.entityLogical}>{item.targetEntity}</Text>
        </div>
      ),
      compare: (a, b) => a.targetEntity.localeCompare(b.targetEntity),
    }),
    createTableColumn<CrossEntityLink>({
      columnId: 'automationType',
      renderHeaderCell: () => 'Type',
      renderCell: (item) => (
        <Badge
          appearance="outline"
          color={
            item.automationType === 'Plugin'
              ? 'brand'
              : item.automationType === 'Flow'
              ? 'success'
              : 'important'
          }
        >
          {item.automationType}
        </Badge>
      ),
    }),
    createTableColumn<CrossEntityLink>({
      columnId: 'automationName',
      renderHeaderCell: () => 'Automation Name',
      renderCell: (item) => <Text weight="semibold">{item.automationName}</Text>,
    }),
    createTableColumn<CrossEntityLink>({
      columnId: 'operation',
      renderHeaderCell: () => 'Operation',
      renderCell: (item) => (
        <Badge
          appearance="filled"
          color={
            item.operation === 'Create'
              ? 'success'
              : item.operation === 'Update'
              ? 'warning'
              : item.operation === 'Delete'
              ? 'danger'
              : 'informative'
          }
        >
          {item.operation}
        </Badge>
      ),
    }),
    createTableColumn<CrossEntityLink>({
      columnId: 'mode',
      renderHeaderCell: () => 'Mode',
      renderCell: (item) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalXS }}>
          <Badge appearance="tint" shape="rounded" color={item.isAsynchronous ? 'success' : 'warning'}>
            {item.isAsynchronous ? 'Async' : 'Sync'}
          </Badge>
          {!item.isAsynchronous && (
            <Warning24Regular className={styles.warningIcon} title="Synchronous cross-entity operation may impact performance" />
          )}
        </div>
      ),
    }),
    createTableColumn<CrossEntityLink>({
      columnId: 'description',
      renderHeaderCell: () => 'Description',
      renderCell: (item) => (
        <Text className={styles.descriptionCell}>{item.description}</Text>
      ),
    }),
  ];

  return (
    <div className={styles.container}>
      {/* Coming Soon Banner */}
      <div className={styles.comingSoonBanner}>
        <div className={styles.bannerHeader}>
          <Lightbulb24Regular className={styles.bannerIcon} />
          <Title3>Coming Soon: Advanced Cross-Entity Automation Analysis</Title3>
        </div>
        <Text>
          We're building a comprehensive cross-entity automation analyzer that will:
        </Text>
        <ul style={{ marginTop: tokens.spacingVerticalS, marginBottom: tokens.spacingVerticalS }}>
          <li>Analyze plugins using assembly decompilation (ILSpy integration)</li>
          <li>Parse classic workflow XAML for cross-entity operations</li>
          <li>Deep-dive into business rule conditions and actions</li>
          <li>Identify synchronous operations that may impact performance</li>
          <li>Map data flow between entities in your solution</li>
        </ul>
        <Text>
          This feature requires deep code analysis and is currently in development. Check{' '}
          <Link href="https://github.com/sabrish/power-platform-solution-blueprint" target="_blank" rel="noopener noreferrer">
            our GitHub repository
          </Link>{' '}
          for updates.
        </Text>
      </div>

      {/* Sample Data Section */}
      <div className={styles.sampleDataNote}>
        <Text weight="semibold">💡 Sample Data Below</Text>
        <Text> - This demonstrates what the feature will look like when completed</Text>
      </div>

      {/* Sample Statistics Section */}
      <div className={styles.statsGrid}>
        <Card className={styles.statsCard}>
          <Text weight="semibold">Total Cross-Entity Links</Text>
          <Text style={{ fontSize: tokens.fontSizeHero700 }}>{sampleStats.total}</Text>
        </Card>
        <Card className={styles.statsCard}>
          <Text weight="semibold">Synchronous Operations</Text>
          <Text style={{ fontSize: tokens.fontSizeHero700, color: tokens.colorPaletteRedForeground1 }}>
            {sampleStats.synchronous}
          </Text>
          <Text style={{ fontSize: tokens.fontSizeBase200, color: tokens.colorNeutralForeground3 }}>
            May impact performance
          </Text>
        </Card>
        <Card className={styles.statsCard}>
          <Text weight="semibold">Asynchronous Operations</Text>
          <Text style={{ fontSize: tokens.fontSizeHero700, color: tokens.colorPaletteGreenForeground1 }}>
            {sampleStats.asynchronous}
          </Text>
        </Card>
        <Card className={styles.statsCard}>
          <Text weight="semibold">Entities Affected</Text>
          <Text style={{ fontSize: tokens.fontSizeHero700 }}>
            {sampleStats.uniqueSourceEntities} → {sampleStats.uniqueTargetEntities}
          </Text>
          <Text style={{ fontSize: tokens.fontSizeBase200, color: tokens.colorNeutralForeground3 }}>
            Source → Target
          </Text>
        </Card>
      </div>

      {/* Sample Table Section */}
      <Title3>Sample Cross-Entity Automation Links</Title3>
      <div className={styles.tableContainer}>
        <DataGrid items={sampleLinks} columns={columns} sortable resizableColumns>
          <DataGridHeader>
            <DataGridRow>
              {({ renderHeaderCell }) => <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>}
            </DataGridRow>
          </DataGridHeader>
          <DataGridBody<CrossEntityLink>>
            {({ item, rowId }) => (
              <DataGridRow<CrossEntityLink> key={rowId}>
                {({ renderCell }) => <DataGridCell>{renderCell(item)}</DataGridCell>}
              </DataGridRow>
            )}
          </DataGridBody>
        </DataGrid>
      </div>
    </div>
  );
}
