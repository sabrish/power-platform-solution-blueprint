import { useState, useMemo } from 'react';
import {
  Text,
  Title3,
  Card,
  Badge,
  SearchBox,
  Dropdown,
  Option,
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
} from '@fluentui/react-components';
import { ArrowRight24Regular, Warning24Regular } from '@fluentui/react-icons';
import type { CrossEntityLink } from '../core';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
  },
  controls: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  searchBox: {
    minWidth: '300px',
  },
  dropdown: {
    minWidth: '200px',
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
});

export interface CrossEntityMapViewProps {
  links: CrossEntityLink[];
}

export function CrossEntityMapView({ links }: CrossEntityMapViewProps) {
  const styles = useStyles();
  const [searchQuery, setSearchQuery] = useState('');
  const [automationTypeFilter, setAutomationTypeFilter] = useState<string>('all');
  const [operationFilter, setOperationFilter] = useState<string>('all');
  const [modeFilter, setModeFilter] = useState<string>('all');

  // Calculate statistics
  const stats = useMemo(() => {
    const syncLinks = links.filter((l) => !l.isAsynchronous);
    const asyncLinks = links.filter((l) => l.isAsynchronous);
    const uniqueSourceEntities = new Set(links.map((l) => l.sourceEntity)).size;
    const uniqueTargetEntities = new Set(links.map((l) => l.targetEntity)).size;
    const byAutomationType = links.reduce((acc, l) => {
      acc[l.automationType] = (acc[l.automationType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: links.length,
      synchronous: syncLinks.length,
      asynchronous: asyncLinks.length,
      uniqueSourceEntities,
      uniqueTargetEntities,
      byAutomationType,
    };
  }, [links]);

  // Filter links
  const filteredLinks = useMemo(() => {
    return links.filter((link) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          link.sourceEntity.toLowerCase().includes(query) ||
          link.sourceEntityDisplayName.toLowerCase().includes(query) ||
          link.targetEntity.toLowerCase().includes(query) ||
          link.targetEntityDisplayName.toLowerCase().includes(query) ||
          link.automationName.toLowerCase().includes(query);

        if (!matchesSearch) return false;
      }

      // Automation type filter
      if (automationTypeFilter !== 'all' && link.automationType !== automationTypeFilter) {
        return false;
      }

      // Operation filter
      if (operationFilter !== 'all' && link.operation !== operationFilter) {
        return false;
      }

      // Mode filter
      if (modeFilter === 'sync' && link.isAsynchronous) return false;
      if (modeFilter === 'async' && !link.isAsynchronous) return false;

      return true;
    });
  }, [links, searchQuery, automationTypeFilter, operationFilter, modeFilter]);

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
      {/* Statistics Section */}
      <div className={styles.statsGrid}>
        <Card className={styles.statsCard}>
          <Text weight="semibold">Total Cross-Entity Links</Text>
          <Text style={{ fontSize: tokens.fontSizeHero700 }}>{stats.total}</Text>
        </Card>
        <Card className={styles.statsCard}>
          <Text weight="semibold">Synchronous Operations</Text>
          <Text style={{ fontSize: tokens.fontSizeHero700, color: tokens.colorPaletteRedForeground1 }}>
            {stats.synchronous}
          </Text>
          <Text style={{ fontSize: tokens.fontSizeBase200, color: tokens.colorNeutralForeground3 }}>
            May impact performance
          </Text>
        </Card>
        <Card className={styles.statsCard}>
          <Text weight="semibold">Asynchronous Operations</Text>
          <Text style={{ fontSize: tokens.fontSizeHero700, color: tokens.colorPaletteGreenForeground1 }}>
            {stats.asynchronous}
          </Text>
        </Card>
        <Card className={styles.statsCard}>
          <Text weight="semibold">Entities Affected</Text>
          <Text style={{ fontSize: tokens.fontSizeHero700 }}>
            {stats.uniqueSourceEntities} → {stats.uniqueTargetEntities}
          </Text>
          <Text style={{ fontSize: tokens.fontSizeBase200, color: tokens.colorNeutralForeground3 }}>
            Source → Target
          </Text>
        </Card>
      </div>

      {/* Controls Section */}
      <Title3>Cross-Entity Automation Links</Title3>
      <div className={styles.controls}>
        <SearchBox
          className={styles.searchBox}
          placeholder="Search entities or automation..."
          value={searchQuery}
          onChange={(_, data) => setSearchQuery(data.value)}
        />

        <Dropdown
          className={styles.dropdown}
          placeholder="Automation Type"
          value={automationTypeFilter === 'all' ? 'All Types' : automationTypeFilter}
          onOptionSelect={(_, data) => setAutomationTypeFilter(data.optionValue || 'all')}
        >
          <Option value="all">All Types</Option>
          <Option value="Flow">Flow</Option>
          <Option value="Plugin">Plugin</Option>
          <Option value="BusinessRule">Business Rule</Option>
          <Option value="ClassicWorkflow">Classic Workflow</Option>
        </Dropdown>

        <Dropdown
          className={styles.dropdown}
          placeholder="Operation"
          value={operationFilter === 'all' ? 'All Operations' : operationFilter}
          onOptionSelect={(_, data) => setOperationFilter(data.optionValue || 'all')}
        >
          <Option value="all">All Operations</Option>
          <Option value="Create">Create</Option>
          <Option value="Update">Update</Option>
          <Option value="Delete">Delete</Option>
          <Option value="Read">Read</Option>
        </Dropdown>

        <Dropdown
          className={styles.dropdown}
          placeholder="Mode"
          value={modeFilter === 'all' ? 'All Modes' : modeFilter === 'sync' ? 'Synchronous' : 'Asynchronous'}
          onOptionSelect={(_, data) => setModeFilter(data.optionValue || 'all')}
        >
          <Option value="all">All Modes</Option>
          <Option value="sync">Synchronous</Option>
          <Option value="async">Asynchronous</Option>
        </Dropdown>
      </div>

      <Text>
        Showing {filteredLinks.length} of {links.length} cross-entity links
      </Text>

      {/* Table Section */}
      <div className={styles.tableContainer}>
        <DataGrid items={filteredLinks} columns={columns} sortable resizableColumns>
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
