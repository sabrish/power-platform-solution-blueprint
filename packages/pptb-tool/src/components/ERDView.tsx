import { useState, useEffect, useMemo } from 'react';
import {
  Text,
  Title3,
  Card,
  Badge,
  Button,
  SearchBox,
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
  MessageBar,
  MessageBarBody,
  Toast,
  ToastTitle,
  Toaster,
  useId,
  useToastController,
} from '@fluentui/react-components';
import {
  ArrowDownload24Regular,
  Copy24Regular,
  ZoomIn24Regular,
  ZoomOut24Regular,
  Info24Regular,
  Checkmark24Regular,
} from '@fluentui/react-icons';
import type { ERDDefinition, EntityQuickLink, BlueprintResult } from '@ppsb/core';
import { renderMermaid, initMermaid } from '../utils/mermaidRenderer';
import { generateDbDiagramCode } from '../utils/dbDiagramGenerator';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
  },
  diagramSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  diagramCard: {
    padding: tokens.spacingVerticalL,
    overflowX: 'auto',
  },
  diagramControls: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
    flexWrap: 'wrap',
  },
  diagramContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '400px',
    padding: tokens.spacingVerticalL,
  },
  legendSection: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: tokens.spacingHorizontalM,
  },
  legendCard: {
    padding: tokens.spacingVerticalM,
  },
  legendHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    marginBottom: tokens.spacingVerticalS,
  },
  legendColor: {
    width: '16px',
    height: '16px',
    borderRadius: tokens.borderRadiusSmall,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  legendEntities: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    marginTop: tokens.spacingVerticalXS,
  },
  quickLinksSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  searchBox: {
    minWidth: '300px',
  },
  tableContainer: {
    maxHeight: '500px',
    overflowY: 'auto',
  },
  complexityBadge: {
    minWidth: '60px',
  },
});

export interface ERDViewProps {
  erd: ERDDefinition;
  blueprintResult: BlueprintResult;
}

export function ERDView({ erd, blueprintResult }: ERDViewProps) {
  const styles = useStyles();
  const [svgContent, setSvgContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [zoomLevel, setZoomLevel] = useState(100);

  // Toast notifications
  const toasterId = useId('toaster');
  const { dispatchToast } = useToastController(toasterId);

  // Use the first diagram (comprehensive view with all entities)
  const currentDiagram = erd.diagrams[0];

  // Initialize Mermaid on mount
  useEffect(() => {
    initMermaid();
  }, []);

  // Render Mermaid diagram when selected diagram changes
  useEffect(() => {
    const renderDiagram = async () => {
      if (!currentDiagram) return;

      try {
        setIsLoading(true);
        setError(null);
        const svg = await renderMermaid(
          currentDiagram.mermaidDiagram,
          `erd-diagram-${currentDiagram.id}`
        );
        setSvgContent(svg);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to render ERD');
      } finally {
        setIsLoading(false);
      }
    };

    renderDiagram();
  }, [currentDiagram]);

  // Filter entity quick links
  const filteredEntities = useMemo(() => {
    if (!searchQuery) return erd.entityQuickLinks;

    const query = searchQuery.toLowerCase();
    return erd.entityQuickLinks.filter(
      (entity) =>
        entity.logicalName.toLowerCase().includes(query) ||
        entity.displayName.toLowerCase().includes(query) ||
        entity.publisherPrefix.toLowerCase().includes(query)
    );
  }, [erd.entityQuickLinks, searchQuery]);

  // Table columns
  const columns: TableColumnDefinition<EntityQuickLink>[] = [
    createTableColumn<EntityQuickLink>({
      columnId: 'displayName',
      renderHeaderCell: () => 'Entity Name',
      renderCell: (item: EntityQuickLink) => <Text weight="semibold">{item.displayName}</Text>,
      compare: (a, b) => a.displayName.localeCompare(b.displayName),
    }),
    createTableColumn<EntityQuickLink>({
      columnId: 'logicalName',
      renderHeaderCell: () => 'Logical Name',
      renderCell: (item) => (
        <Text style={{ fontFamily: 'Consolas, Monaco, monospace', fontSize: tokens.fontSizeBase200 }}>
          {item.logicalName}
        </Text>
      ),
    }),
    createTableColumn<EntityQuickLink>({
      columnId: 'publisher',
      renderHeaderCell: () => 'Publisher',
      renderCell: (item) => (
        <Badge appearance="outline" color="brand">
          {item.publisherPrefix}
        </Badge>
      ),
    }),
    createTableColumn<EntityQuickLink>({
      columnId: 'fields',
      renderHeaderCell: () => 'Fields',
      renderCell: (item) => <Text>{item.fieldCount}</Text>,
      compare: (a, b) => a.fieldCount - b.fieldCount,
    }),
    createTableColumn<EntityQuickLink>({
      columnId: 'plugins',
      renderHeaderCell: () => 'Plugins',
      renderCell: (item) => <Text>{item.pluginCount}</Text>,
      compare: (a, b) => a.pluginCount - b.pluginCount,
    }),
    createTableColumn<EntityQuickLink>({
      columnId: 'flows',
      renderHeaderCell: () => 'Flows',
      renderCell: (item) => <Text>{item.flowCount}</Text>,
      compare: (a, b) => a.flowCount - b.flowCount,
    }),
    createTableColumn<EntityQuickLink>({
      columnId: 'businessRules',
      renderHeaderCell: () => 'Business Rules',
      renderCell: (item) => <Text>{item.businessRuleCount}</Text>,
      compare: (a, b) => a.businessRuleCount - b.businessRuleCount,
    }),
    createTableColumn<EntityQuickLink>({
      columnId: 'complexity',
      renderHeaderCell: () => 'Complexity',
      renderCell: (item) => (
        <Badge
          className={styles.complexityBadge}
          appearance="filled"
          color={
            item.complexity === 'High'
              ? 'danger'
              : item.complexity === 'Medium'
              ? 'warning'
              : 'success'
          }
        >
          {item.complexity}
        </Badge>
      ),
      compare: (a, b) => {
        const order: Record<string, number> = { High: 0, Medium: 1, Low: 2 };
        return order[a.complexity] - order[b.complexity];
      },
    }),
  ];

  const handleDownloadSVG = () => {
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `entity-relationship-diagram-${currentDiagram?.id || 'diagram'}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyMermaid = () => {
    if (currentDiagram) {
      navigator.clipboard.writeText(currentDiagram.mermaidDiagram);
      dispatchToast(
        <Toast>
          <ToastTitle action={<Checkmark24Regular />}>
            Mermaid code copied to clipboard
          </ToastTitle>
        </Toast>,
        { intent: 'success', timeout: 2000 }
      );
    }
  };

  const handleCopyDbDiagram = () => {
    const dbDiagramCode = generateDbDiagramCode(blueprintResult);
    navigator.clipboard.writeText(dbDiagramCode);
    dispatchToast(
      <Toast>
        <ToastTitle action={<Checkmark24Regular />}>
          dbdiagram.io code copied! Paste it at https://dbdiagram.io/d
        </ToastTitle>
      </Toast>,
      { intent: 'success', timeout: 3000 }
    );
  };

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 10, 200));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 10, 50));
  };

  return (
    <div className={styles.container}>
      <Toaster toasterId={toasterId} />
      {/* ERD Diagram Section */}
      <div className={styles.diagramSection}>
        <Title3>Entity Relationship Diagram</Title3>
        <Text>
          {erd.totalEntities} total entities, {erd.totalRelationships} total relationships
        </Text>

        {/* Warnings */}
        {erd.warnings && erd.warnings.length > 0 && (
          <MessageBar intent="info" icon={<Info24Regular />}>
            <MessageBarBody>
              {erd.warnings.map((warning, index) => (
                <div key={index}>{warning}</div>
              ))}
            </MessageBarBody>
          </MessageBar>
        )}

        {currentDiagram && (
          <Text style={{ marginTop: tokens.spacingVerticalS, color: tokens.colorNeutralForeground3 }}>
            {currentDiagram.description}
          </Text>
        )}

        <div className={styles.diagramControls}>
          <Button
            icon={<ArrowDownload24Regular />}
            onClick={handleDownloadSVG}
            disabled={!svgContent}
          >
            Download SVG
          </Button>
          <Button icon={<Copy24Regular />} onClick={handleCopyMermaid}>
            Copy Mermaid Code
          </Button>
          <Button icon={<Copy24Regular />} onClick={handleCopyDbDiagram}>
            Copy dbdiagram.io Code
          </Button>
          <Button icon={<ZoomIn24Regular />} onClick={handleZoomIn} disabled={zoomLevel >= 200}>
            Zoom In
          </Button>
          <Button icon={<ZoomOut24Regular />} onClick={handleZoomOut} disabled={zoomLevel <= 50}>
            Zoom Out
          </Button>
          <Text>{zoomLevel}%</Text>
        </div>

        <Card className={styles.diagramCard}>
          {isLoading && <Text>Rendering diagram...</Text>}
          {error && (
            <div style={{ padding: tokens.spacingVerticalL, textAlign: 'center', color: tokens.colorNeutralForeground3 }}>
              <Text>Diagram preview unavailable. Use the export options to generate the full ERD.</Text>
            </div>
          )}
          {svgContent && !isLoading && !error && (
            <div
              className={styles.diagramContainer}
              style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
              dangerouslySetInnerHTML={{ __html: svgContent }}
            />
          )}
        </Card>
      </div>

      {/* Publisher Legend Section */}
      <div className={styles.diagramSection}>
        <Title3>Publisher Color Legend</Title3>
        <div className={styles.legendSection}>
          {erd.legend.map((pub: any) => (
            <Card key={pub.publisherPrefix} className={styles.legendCard}>
              <div className={styles.legendHeader}>
                <div className={styles.legendColor} style={{ backgroundColor: pub.color }} />
                <Text weight="semibold">{pub.publisherName}</Text>
                <Badge appearance="outline">{pub.entityCount}</Badge>
              </div>
              <div className={styles.legendEntities}>
                {pub.entities.slice(0, 5).join(', ')}
                {pub.entities.length > 5 && ` +${pub.entities.length - 5} more`}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Entity Quick Links Section */}
      <div className={styles.quickLinksSection}>
        <Title3>Entity Quick Links</Title3>
        <SearchBox
          className={styles.searchBox}
          placeholder="Search entities..."
          value={searchQuery}
          onChange={(_, data) => setSearchQuery(data.value)}
        />

        <Text>
          Showing {filteredEntities.length} of {erd.entityQuickLinks.length} entities
        </Text>

        <div className={styles.tableContainer}>
          <DataGrid items={filteredEntities} columns={columns} sortable resizableColumns>
            <DataGridHeader>
              <DataGridRow>
                {({ renderHeaderCell }) => <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>}
              </DataGridRow>
            </DataGridHeader>
            <DataGridBody<EntityQuickLink>>
              {({ item, rowId }) => (
                <DataGridRow<EntityQuickLink> key={rowId}>
                  {({ renderCell }) => <DataGridCell>{renderCell(item)}</DataGridCell>}
                </DataGridRow>
              )}
            </DataGridBody>
          </DataGrid>
        </div>
      </div>
    </div>
  );
}
