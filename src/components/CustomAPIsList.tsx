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
  tokens,
  makeStyles,
  ToggleButton,
  Button,
} from '@fluentui/react-components';
import { FilterBar, FilterGroup } from './FilterBar';
import { Code20Regular, ArrowSync20Regular, ArrowRight20Regular } from '@fluentui/react-icons';
import type { CustomAPI } from '../core';
import { TruncatedText } from './TruncatedText';

const API_TYPE_VALUES = ['Action', 'Function'];
const API_BINDING_VALUES = ['Global', 'Entity', 'EntityCollection'];

const useStyles = makeStyles({
  filterButton: {
    minWidth: 'unset',
    paddingLeft: tokens.spacingHorizontalS,
    paddingRight: tokens.spacingHorizontalS,
    height: '22px',
    fontSize: tokens.fontSizeBase100,
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
  const [activeTypeFilters, setActiveTypeFilters] = useState<Set<string>>(new Set());
  const [activeBindingFilters, setActiveBindingFilters] = useState<Set<string>>(new Set());

  // Sort APIs alphabetically by unique name
  const sortedAPIs = useMemo(() => {
    return [...customAPIs].sort((a, b) => a.uniqueName.localeCompare(b.uniqueName));
  }, [customAPIs]);

  const typeCounts = useMemo(() => {
    const counts = Object.fromEntries(API_TYPE_VALUES.map((t) => [t, 0]));
    for (const a of sortedAPIs) {
      const key = a.isFunction ? 'Function' : 'Action';
      counts[key] = (counts[key] ?? 0) + 1;
    }
    return counts;
  }, [sortedAPIs]);

  const bindingCounts = useMemo(() => {
    const counts = Object.fromEntries(API_BINDING_VALUES.map((b) => [b, 0]));
    for (const a of sortedAPIs) counts[a.bindingType] = (counts[a.bindingType] ?? 0) + 1;
    return counts;
  }, [sortedAPIs]);

  const toggleTypeFilter = (type: string) => {
    setActiveTypeFilters((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  const toggleBindingFilter = (binding: string) => {
    setActiveBindingFilters((prev) => {
      const next = new Set(prev);
      if (next.has(binding)) {
        next.delete(binding);
      } else {
        next.add(binding);
      }
      return next;
    });
  };

  // Apply search and ToggleButton filters before DataGrid
  const filteredAPIs = useMemo(() => {
    let filtered = sortedAPIs;
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      filtered = filtered.filter((a) =>
        a.uniqueName.toLowerCase().includes(q) ||
        (a.displayName && a.displayName.toLowerCase().includes(q))
      );
    }
    if (activeTypeFilters.size > 0) {
      filtered = filtered.filter((a) =>
        activeTypeFilters.has(a.isFunction ? 'Function' : 'Action')
      );
    }
    if (activeBindingFilters.size > 0) {
      filtered = filtered.filter((a) => activeBindingFilters.has(a.bindingType));
    }
    return filtered;
  }, [sortedAPIs, searchQuery, activeTypeFilters, activeBindingFilters]);

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
      <FilterBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search custom APIs..."
        filteredCount={filteredAPIs.length}
        totalCount={sortedAPIs.length}
        itemLabel="APIs"
        style={{ marginBottom: '16px' }}
      >
        <FilterGroup label="Type:">
          {API_TYPE_VALUES.map((type) => (
            <ToggleButton
              key={type}
              className={styles.filterButton}
              size="small"
              checked={activeTypeFilters.has(type)}
              disabled={typeCounts[type] === 0}
              onClick={() => toggleTypeFilter(type)}
            >
              {type}
            </ToggleButton>
          ))}
          {activeTypeFilters.size > 0 && (
            <Button appearance="transparent" size="small" onClick={() => setActiveTypeFilters(new Set())}>
              Clear
            </Button>
          )}
        </FilterGroup>
        <FilterGroup label="Binding:">
          {API_BINDING_VALUES.map((binding) => (
            <ToggleButton
              key={binding}
              className={styles.filterButton}
              size="small"
              checked={activeBindingFilters.has(binding)}
              disabled={bindingCounts[binding] === 0}
              onClick={() => toggleBindingFilter(binding)}
            >
              {binding}
            </ToggleButton>
          ))}
          {activeBindingFilters.size > 0 && (
            <Button appearance="transparent" size="small" onClick={() => setActiveBindingFilters(new Set())}>
              Clear
            </Button>
          )}
        </FilterGroup>
      </FilterBar>
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
