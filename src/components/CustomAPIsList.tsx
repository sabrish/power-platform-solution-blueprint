import { useState, useMemo } from 'react';
import {
  DataGrid,
  DataGridBody,
  DataGridRow,
  DataGridHeader,
  DataGridHeaderCell,
  DataGridCell,
  TableCellLayout,
  TableColumnDefinition,
  createTableColumn,
  Badge,
  Tooltip,
  SearchBox,
  Text,
  tokens,
  makeStyles,
} from '@fluentui/react-components';
import { Code20Regular, ArrowSync20Regular, ArrowRight20Regular } from '@fluentui/react-icons';
import type { CustomAPI } from '../core';
import { TruncatedText } from './TruncatedText';

const useStyles = makeStyles({
  filters: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
    alignItems: 'center',
    padding: '12px',
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
    marginBottom: '16px',
  },
  searchBox: {
    minWidth: '300px',
  },
});

interface CustomAPIsListProps {
  customAPIs: CustomAPI[];
  onSelectAPI: (api: CustomAPI) => void;
}

/**
 * List view of Custom APIs
 */
export function CustomAPIsList({ customAPIs, onSelectAPI }: CustomAPIsListProps) {
  const styles = useStyles();
  const [selectedAPI, setSelectedAPI] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Sort APIs alphabetically by unique name
  const sortedAPIs = useMemo(() => {
    return [...customAPIs].sort((a, b) => a.uniqueName.localeCompare(b.uniqueName));
  }, [customAPIs]);

  // Apply search filter before DataGrid
  const filteredAPIs = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return sortedAPIs;
    return sortedAPIs.filter((a) =>
      a.uniqueName.toLowerCase().includes(q) ||
      (a.displayName && a.displayName.toLowerCase().includes(q))
    );
  }, [sortedAPIs, searchQuery]);

  const handleRowClick = (api: CustomAPI) => {
    setSelectedAPI(api.id);
    onSelectAPI(api);
  };

  const getBindingColor = (bindingType: 'Global' | 'Entity' | 'EntityCollection'): 'brand' | 'success' | 'danger' => {
    switch (bindingType) {
      case 'Global':
        return 'brand';
      case 'Entity':
        return 'success';
      case 'EntityCollection':
        return 'danger';
    }
  };

  const columns: TableColumnDefinition<CustomAPI>[] = [
    createTableColumn<CustomAPI>({
      columnId: 'uniqueName',
      compare: (a, b) => a.uniqueName.localeCompare(b.uniqueName),
      renderHeaderCell: () => 'Unique Name',
      renderCell: (item) => (
        <TableCellLayout media={<Code20Regular />}>
          <div style={{ fontWeight: 500, fontFamily: 'monospace' }}>
            <TruncatedText text={item.uniqueName} />
          </div>
          {item.description && (
            <div style={{ fontSize: '12px', color: tokens.colorNeutralForeground3 }}>
              <TruncatedText text={item.description} />
            </div>
          )}
        </TableCellLayout>
      ),
    }),
    createTableColumn<CustomAPI>({
      columnId: 'type',
      compare: (a, b) => Number(a.isFunction) - Number(b.isFunction),
      renderHeaderCell: () => 'Type',
      renderCell: (item) => (
        <TableCellLayout>
          <Badge appearance="filled" shape="rounded" color={item.isFunction ? 'brand' : 'danger'}>
            {item.isFunction ? (
              <>
                <ArrowRight20Regular /> Function
              </>
            ) : (
              <>
                <ArrowSync20Regular /> Action
              </>
            )}
          </Badge>
        </TableCellLayout>
      ),
    }),
    createTableColumn<CustomAPI>({
      columnId: 'binding',
      compare: (a, b) => a.bindingType.localeCompare(b.bindingType),
      renderHeaderCell: () => 'Binding',
      renderCell: (item) => (
        <TableCellLayout>
          <Tooltip
            content={
              item.boundEntityLogicalName
                ? `Bound to entity: ${item.boundEntityLogicalName}`
                : 'Not bound to a specific entity'
            }
            relationship="description"
          >
            <Badge appearance="filled" shape="rounded" color={getBindingColor(item.bindingType)}>
              {item.bindingType}
            </Badge>
          </Tooltip>
        </TableCellLayout>
      ),
    }),
    createTableColumn<CustomAPI>({
      columnId: 'entity',
      renderHeaderCell: () => 'Bound Entity',
      renderCell: (item) => (
        <TableCellLayout>
          {item.boundEntityLogicalName ? (
            <span style={{ fontFamily: 'monospace', fontSize: '13px' }}>
              {item.boundEntityLogicalName}
            </span>
          ) : (
            <span style={{ color: tokens.colorNeutralForeground3 }}>-</span>
          )}
        </TableCellLayout>
      ),
    }),
    createTableColumn<CustomAPI>({
      columnId: 'params',
      compare: (a, b) => a.requestParameters.length - b.requestParameters.length,
      renderHeaderCell: () => 'Parameters',
      renderCell: (item) => (
        <TableCellLayout>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Badge appearance="tint" shape="rounded" size="small">
              {item.requestParameters.length} in
            </Badge>
            <Badge appearance="tint" shape="rounded" size="small" color="success">
              {item.responseProperties.length} out
            </Badge>
          </div>
        </TableCellLayout>
      ),
    }),
    createTableColumn<CustomAPI>({
      columnId: 'privilege',
      renderHeaderCell: () => 'Execution Privilege',
      renderCell: (item) => (
        <TableCellLayout>
          <Badge appearance="outline" shape="rounded" size="small">
            {item.executionPrivilege}
          </Badge>
        </TableCellLayout>
      ),
    }),
    createTableColumn<CustomAPI>({
      columnId: 'flags',
      renderHeaderCell: () => 'Flags',
      renderCell: (item) => (
        <TableCellLayout>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {item.isPrivate && (
              <Badge appearance="outline" shape="rounded" size="small" color="important">
                Private
              </Badge>
            )}
            {item.isManaged && (
              <Badge appearance="outline" shape="rounded" size="small" color="warning">
                Managed
              </Badge>
            )}
          </div>
        </TableCellLayout>
      ),
    }),
  ];

  if (customAPIs.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: tokens.colorNeutralForeground3 }}>
        No Custom APIs found.
      </div>
    );
  }

  return (
    <div style={{ marginTop: '16px' }}>
      <div className={styles.filters}>
        <SearchBox
          className={styles.searchBox}
          placeholder="Search custom APIs..."
          value={searchQuery}
          onChange={(_, data) => setSearchQuery(data.value || '')}
        />
        <Text style={{ marginLeft: 'auto', color: tokens.colorNeutralForeground3 }}>
          {filteredAPIs.length} of {sortedAPIs.length} APIs
        </Text>
      </div>
      <div
        style={{
          padding: '12px',
          backgroundColor: tokens.colorNeutralBackground2,
          borderRadius: '4px',
          marginBottom: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <Code20Regular />
          <strong>About Custom APIs</strong>
        </div>
        <div style={{ fontSize: '13px', color: tokens.colorNeutralForeground2 }}>
          Custom APIs extend Dataverse functionality with custom actions and functions. Functions
          are read-only (GET requests), while Actions can modify data (POST requests). They can be
          global or bound to specific entities.
        </div>
      </div>

      <DataGrid
        items={filteredAPIs}
        columns={columns}
        sortable
        selectionMode="single"
        selectedItems={selectedAPI ? [selectedAPI] : []}
        getRowId={(item) => item.id}
        focusMode="composite"
        style={{ minWidth: '100%' }}
      >
        <DataGridHeader>
          <DataGridRow>
            {({ renderHeaderCell }) => (
              <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>
            )}
          </DataGridRow>
        </DataGridHeader>
        <DataGridBody<CustomAPI>>
          {({ item, rowId }) => (
            <DataGridRow<CustomAPI>
              key={rowId}
              style={{
                cursor: 'pointer',
                backgroundColor:
                  selectedAPI === item.id ? tokens.colorNeutralBackground1Selected : undefined,
              }}
              onClick={() => handleRowClick(item)}
            >
              {({ renderCell }) => <DataGridCell>{renderCell(item)}</DataGridCell>}
            </DataGridRow>
          )}
        </DataGridBody>
      </DataGrid>
    </div>
  );
}
