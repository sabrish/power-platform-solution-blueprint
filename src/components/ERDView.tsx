import { useState, useEffect, useRef, useCallback } from 'react';
import cytoscape from 'cytoscape';
import type { Core, NodeSingular } from 'cytoscape';
import {
  Text,
  Title3,
  Card,
  Badge,
  Button,
  Input,
  makeStyles,
  tokens,
  Tooltip,
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
  ZoomFit24Regular,
  Search24Regular,
  Dismiss24Regular,
  Checkmark24Regular,
} from '@fluentui/react-icons';
import type { ERDDefinition, BlueprintResult } from '../core';
import { generateDbDiagramCode } from '../utils/dbDiagramGenerator';

// ─── Layout names ────────────────────────────────────────────────────────────
type LayoutName = 'cose' | 'breadthfirst' | 'grid';

const LAYOUT_LABELS: Record<LayoutName, string> = {
  cose: 'Smart',
  breadthfirst: 'Hierarchical',
  grid: 'Grid',
};

// ─── Styles ──────────────────────────────────────────────────────────────────
const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
  },
  toolbar: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  layoutGroup: {
    display: 'flex',
    gap: tokens.spacingHorizontalXS,
    alignItems: 'center',
  },
  layoutLabel: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    marginRight: tokens.spacingHorizontalXS,
  },
  layoutButton: {
    minWidth: 'unset',
  },
  layoutButtonActive: {
    backgroundColor: tokens.colorBrandBackground,
    color: tokens.colorNeutralForegroundOnBrand,
    ':hover': {
      backgroundColor: tokens.colorBrandBackgroundHover,
    },
  },
  divider: {
    width: '1px',
    height: '24px',
    backgroundColor: tokens.colorNeutralStroke1,
    margin: `0 ${tokens.spacingHorizontalXS}`,
    alignSelf: 'center',
  },
  searchBox: {
    width: '180px',
  },
  graphCard: {
    padding: 0,
    overflow: 'hidden',
    position: 'relative',
  },
  graphContainer: {
    width: '100%',
    height: '600px',
    backgroundColor: tokens.colorNeutralBackground2,
  },
  loadingOverlay: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colorNeutralBackground2,
    zIndex: 10,
  },
  infoPanel: {
    position: 'absolute',
    top: tokens.spacingVerticalM,
    right: tokens.spacingHorizontalM,
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingVerticalS,
    maxWidth: '220px',
    zIndex: 5,
    boxShadow: tokens.shadow4,
  },
  infoPanelClose: {
    position: 'absolute',
    top: '4px',
    right: '4px',
  },
  infoPanelTitle: {
    fontWeight: tokens.fontWeightSemibold,
    wordBreak: 'break-all',
    marginBottom: tokens.spacingVerticalXS,
    paddingRight: '24px',
  },
  infoPanelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalS,
    fontSize: tokens.fontSizeBase200,
    marginBottom: '2px',
  },
  infoPanelLabel: {
    color: tokens.colorNeutralForeground3,
  },
  legendSection: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: tokens.spacingHorizontalM,
  },
  legendCard: {
    padding: tokens.spacingVerticalM,
  },
  legendHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  legendColor: {
    width: '14px',
    height: '14px',
    borderRadius: tokens.borderRadiusSmall,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    flexShrink: 0,
  },
  isolatedBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalM}`,
    backgroundColor: tokens.colorBrandBackground2,
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
    fontSize: tokens.fontSizeBase200,
  },
});

// ─── Helper: build Cytoscape style array from graph data ─────────────────────
function buildCytoscapeStylesheet(): cytoscape.StylesheetJson {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return [
    {
      selector: 'node',
      style: {
        'background-color': 'data(color)',
        'border-color': 'data(strokeColor)',
        'border-width': 2,
        'color': 'data(textColor)',
        'label': 'data(label)',
        'text-valign': 'center' as const,
        'text-halign': 'center' as const,
        'font-size': '10px',
        'font-weight': 'bold',
        'width': '120px',
        'height': '36px',
        'shape': 'round-rectangle' as const,
        'text-wrap': 'ellipsis' as const,
        'text-max-width': '110px',
      },
    },
    {
      selector: 'node.highlighted',
      style: {
        'border-width': 3,
        'border-color': '#0078d4',
        'z-index': 10,
      },
    },
    {
      selector: 'node.faded',
      style: {
        opacity: 0.2,
      },
    },
    {
      selector: 'node.isolated-hidden',
      style: {
        display: 'none' as const,
      },
    },
    {
      selector: 'edge',
      style: {
        'width': 1.5,
        'line-color': '#999',
        'target-arrow-color': '#999',
        'target-arrow-shape': 'triangle' as const,
        'curve-style': 'bezier' as const,
        'label': 'data(label)',
        'font-size': '8px',
        'color': '#666',
        'text-background-color': '#fff',
        'text-background-opacity': 0.8,
        'text-background-padding': '2px',
        'text-max-width': '80px',
        'text-wrap': 'ellipsis' as const,
      },
    },
    {
      selector: 'edge[type = "N-N"]',
      style: {
        'line-style': 'dashed' as const,
        'source-arrow-shape': 'triangle' as const,
        'source-arrow-color': '#999',
      },
    },
    {
      selector: 'edge.faded',
      style: {
        opacity: 0.1,
      },
    },
    {
      selector: 'edge.isolated-hidden',
      style: {
        display: 'none' as const,
      },
    },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ] as any;
}

// ─── Selected node info type ──────────────────────────────────────────────────
interface NodeInfo {
  id: string;
  label: string;
  publisherPrefix: string;
  connectedCount: number;
}

// ─── Props ────────────────────────────────────────────────────────────────────
export interface ERDViewProps {
  erd: ERDDefinition;
  blueprintResult: BlueprintResult;
}

// ─── Component ────────────────────────────────────────────────────────────────
export function ERDView({ erd, blueprintResult }: ERDViewProps) {
  const styles = useStyles();
  const graphRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);

  const [isInitializing, setIsInitializing] = useState(true);
  const [activeLayout, setActiveLayout] = useState<LayoutName>('cose');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNode, setSelectedNode] = useState<NodeInfo | null>(null);
  const [isIsolated, setIsIsolated] = useState(false);

  const toasterId = useId('toaster');
  const { dispatchToast } = useToastController(toasterId);

  const graphData = erd.graphData;
  const hasGraph = !!(graphData && graphData.nodes.length > 0);

  // ── Initialize Cytoscape ────────────────────────────────────────────────
  useEffect(() => {
    if (!hasGraph || !graphRef.current) return;

    const nodes = graphData.nodes.map((n) => ({
      data: {
        id: n.id,
        label: n.label,
        publisherPrefix: n.publisherPrefix,
        color: n.color,
        strokeColor: n.strokeColor,
        textColor: n.textColor,
      },
    }));

    const edges = graphData.edges.map((e) => ({
      data: {
        id: e.id,
        source: e.source,
        target: e.target,
        label: e.label,
        type: e.type,
      },
    }));

    const cy = cytoscape({
      container: graphRef.current,
      elements: { nodes, edges },
      style: buildCytoscapeStylesheet(),
      layout: { name: 'cose', animate: false },
      minZoom: 0.1,
      maxZoom: 4,
      wheelSensitivity: 0.3,
    });

    // Node click — show info + isolate
    cy.on('tap', 'node', (evt) => {
      const node = evt.target as NodeSingular;
      const nodeData = node.data();
      const connected = node.neighborhood('node');
      setSelectedNode({
        id: nodeData.id as string,
        label: nodeData.label as string,
        publisherPrefix: nodeData.publisherPrefix as string,
        connectedCount: connected.length,
      });
    });

    // Background click — clear selection
    cy.on('tap', (evt) => {
      if (evt.target === cy) {
        setSelectedNode(null);
        clearIsolation(cy);
        setIsIsolated(false);
      }
    });

    cyRef.current = cy;
    setIsInitializing(false);

    return () => {
      cy.destroy();
      cyRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasGraph]);

  // ── Run layout ───────────────────────────────────────────────────────────
  const runLayout = useCallback((name: LayoutName) => {
    const cy = cyRef.current;
    if (!cy) return;

    // Remove isolation before re-layout
    cy.elements().removeClass('isolated-hidden');
    setIsIsolated(false);
    setSelectedNode(null);

    const layoutOptions: Record<LayoutName, cytoscape.LayoutOptions> = {
      cose: { name: 'cose', animate: false, nodeRepulsion: () => 400000, idealEdgeLength: () => 100 },
      breadthfirst: { name: 'breadthfirst', animate: false, directed: true, padding: 30 },
      grid: { name: 'grid', animate: false, padding: 30 },
    };

    cy.layout(layoutOptions[name]).run();
  }, []);

  const handleLayoutChange = (name: LayoutName) => {
    setActiveLayout(name);
    runLayout(name);
  };

  // ── Search / highlight ───────────────────────────────────────────────────
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;

    cy.nodes().removeClass('highlighted faded');

    const q = searchQuery.trim().toLowerCase();
    if (!q) return;

    cy.nodes().forEach((node) => {
      const label = (node.data('label') as string).toLowerCase();
      const id = (node.data('id') as string).toLowerCase();
      if (label.includes(q) || id.includes(q)) {
        node.addClass('highlighted');
      } else {
        node.addClass('faded');
      }
    });
  }, [searchQuery]);

  // ── Isolate node ─────────────────────────────────────────────────────────
  const isolateNode = useCallback(() => {
    const cy = cyRef.current;
    if (!cy || !selectedNode) return;

    const node = cy.getElementById(selectedNode.id);
    if (!node || node.empty()) return;

    const neighborhood = node.closedNeighborhood();
    cy.elements().addClass('isolated-hidden');
    neighborhood.removeClass('isolated-hidden');
    setIsIsolated(true);

    cy.fit(neighborhood, 60);
  }, [selectedNode]);

  const clearIsolation = (cy: Core) => {
    cy.elements().removeClass('isolated-hidden');
  };

  const handleClearIsolation = () => {
    const cy = cyRef.current;
    if (!cy) return;
    clearIsolation(cy);
    setIsIsolated(false);
    cy.fit(undefined, 30);
  };

  // ── Zoom controls ────────────────────────────────────────────────────────
  const handleZoomIn = () => {
    const cy = cyRef.current;
    if (!cy) return;
    cy.zoom({ level: cy.zoom() * 1.2, renderedPosition: { x: cy.width() / 2, y: cy.height() / 2 } });
  };

  const handleZoomOut = () => {
    const cy = cyRef.current;
    if (!cy) return;
    cy.zoom({ level: cy.zoom() / 1.2, renderedPosition: { x: cy.width() / 2, y: cy.height() / 2 } });
  };

  const handleFit = () => {
    const cy = cyRef.current;
    if (!cy) return;
    cy.fit(undefined, 30);
  };

  // ── Download PNG ─────────────────────────────────────────────────────────
  const handleDownloadPNG = () => {
    const cy = cyRef.current;
    if (!cy) return;
    const dataUrl = cy.png({ full: true, scale: 2, bg: '#f5f5f5' });
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = 'entity-relationship-diagram.png';
    a.click();
  };

  // ── Copy Mermaid ─────────────────────────────────────────────────────────
  const handleCopyMermaid = () => {
    const diagram = erd.diagrams[0];
    if (diagram) {
      navigator.clipboard.writeText(diagram.mermaidDiagram);
      dispatchToast(
        <Toast><ToastTitle action={<Checkmark24Regular />}>Mermaid code copied to clipboard</ToastTitle></Toast>,
        { intent: 'success', timeout: 2000 }
      );
    }
  };

  // ── Copy dbdiagram.io ─────────────────────────────────────────────────────
  const handleCopyDbDiagram = () => {
    const code = generateDbDiagramCode(blueprintResult);
    navigator.clipboard.writeText(code);
    dispatchToast(
      <Toast><ToastTitle action={<Checkmark24Regular />}>dbdiagram.io code copied! Paste at https://dbdiagram.io/d</ToastTitle></Toast>,
      { intent: 'success', timeout: 3000 }
    );
  };

  return (
    <div className={styles.container}>
      <Toaster toasterId={toasterId} />

      {/* Header */}
      <div>
        <Title3>Entity Relationship Diagram</Title3>
        <Text style={{ color: tokens.colorNeutralForeground3 }}>
          {erd.totalEntities} entities · {erd.totalRelationships} relationships
          {hasGraph && ` · ${graphData.edges.length} shown`}
        </Text>
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        {/* Layout selector */}
        {hasGraph && (
          <div className={styles.layoutGroup}>
            <Text className={styles.layoutLabel}>Layout:</Text>
            {(Object.keys(LAYOUT_LABELS) as LayoutName[]).map((name) => (
              <Button
                key={name}
                size="small"
                appearance={activeLayout === name ? 'primary' : 'secondary'}
                className={styles.layoutButton}
                onClick={() => handleLayoutChange(name)}
              >
                {LAYOUT_LABELS[name]}
              </Button>
            ))}
          </div>
        )}

        {hasGraph && <div className={styles.divider} />}

        {/* Zoom controls */}
        {hasGraph && (
          <>
            <Tooltip content="Zoom in" relationship="label">
              <Button size="small" appearance="subtle" icon={<ZoomIn24Regular />} onClick={handleZoomIn} />
            </Tooltip>
            <Tooltip content="Zoom out" relationship="label">
              <Button size="small" appearance="subtle" icon={<ZoomOut24Regular />} onClick={handleZoomOut} />
            </Tooltip>
            <Tooltip content="Fit to screen" relationship="label">
              <Button size="small" appearance="subtle" icon={<ZoomFit24Regular />} onClick={handleFit} />
            </Tooltip>
          </>
        )}

        {hasGraph && <div className={styles.divider} />}

        {/* Search */}
        {hasGraph && (
          <Input
            className={styles.searchBox}
            size="small"
            placeholder="Search entities..."
            contentBefore={<Search24Regular style={{ fontSize: '14px' }} />}
            value={searchQuery}
            onChange={(_, d) => setSearchQuery(d.value)}
            contentAfter={
              searchQuery
                ? <Dismiss24Regular
                    style={{ fontSize: '14px', cursor: 'pointer' }}
                    onClick={() => setSearchQuery('')}
                  />
                : undefined
            }
          />
        )}

        {hasGraph && <div className={styles.divider} />}

        {/* Export / copy */}
        {hasGraph && (
          <Tooltip content="Download as PNG" relationship="label">
            <Button size="small" appearance="subtle" icon={<ArrowDownload24Regular />} onClick={handleDownloadPNG}>
              PNG
            </Button>
          </Tooltip>
        )}
        <Tooltip content="Copy Mermaid code for external tools (e.g. mermaid.live)" relationship="label">
          <Button size="small" appearance="subtle" icon={<Copy24Regular />} onClick={handleCopyMermaid}>
            Mermaid
          </Button>
        </Tooltip>
        <Tooltip content="Copy dbdiagram.io code" relationship="label">
          <Button size="small" appearance="subtle" icon={<Copy24Regular />} onClick={handleCopyDbDiagram}>
            dbdiagram.io
          </Button>
        </Tooltip>
      </div>

      {/* Graph Card */}
      {hasGraph ? (
        <Card className={styles.graphCard}>
          {/* Isolation banner */}
          {isIsolated && (
            <div className={styles.isolatedBanner}>
              <Text>Showing neighbors of <strong>{selectedNode?.label}</strong></Text>
              <Button size="small" appearance="subtle" icon={<Dismiss24Regular />} onClick={handleClearIsolation}>
                Show all
              </Button>
            </div>
          )}

          {/* Cytoscape canvas */}
          <div style={{ position: 'relative' }}>
            <div ref={graphRef} className={styles.graphContainer} />

            {isInitializing && (
              <div className={styles.loadingOverlay}>
                <Text>Building graph…</Text>
              </div>
            )}

            {/* Node info panel */}
            {selectedNode && (
              <div className={styles.infoPanel}>
                <Button
                  className={styles.infoPanelClose}
                  size="small"
                  appearance="subtle"
                  icon={<Dismiss24Regular />}
                  onClick={() => { setSelectedNode(null); clearIsolation(cyRef.current!); setIsIsolated(false); }}
                />
                <Text block className={styles.infoPanelTitle}>{selectedNode.label}</Text>
                <div className={styles.infoPanelRow}>
                  <Text className={styles.infoPanelLabel}>Logical name</Text>
                  <Text>{selectedNode.id}</Text>
                </div>
                {selectedNode.publisherPrefix && (
                  <div className={styles.infoPanelRow}>
                    <Text className={styles.infoPanelLabel}>Publisher</Text>
                    <Text>{selectedNode.publisherPrefix}</Text>
                  </div>
                )}
                <div className={styles.infoPanelRow}>
                  <Text className={styles.infoPanelLabel}>Relationships</Text>
                  <Text>{selectedNode.connectedCount}</Text>
                </div>
                <Button
                  size="small"
                  style={{ marginTop: tokens.spacingVerticalS, width: '100%' }}
                  onClick={isolateNode}
                  disabled={isIsolated}
                >
                  Isolate
                </Button>
              </div>
            )}
          </div>

          {/* Usage hint */}
          <div style={{ padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalM}`, borderTop: `1px solid ${tokens.colorNeutralStroke1}` }}>
            <Text style={{ fontSize: tokens.fontSizeBase100, color: tokens.colorNeutralForeground3 }}>
              Click a node to inspect · Scroll or pinch to zoom · Drag canvas to pan · Solid arrow = 1:N · Dashed = N:N
            </Text>
          </div>
        </Card>
      ) : (
        <Card>
          <div style={{ padding: tokens.spacingVerticalXL, textAlign: 'center', color: tokens.colorNeutralForeground3 }}>
            <Text>No relationship data available for interactive graph.</Text>
          </div>
        </Card>
      )}

      {/* Publisher Legend */}
      <div>
        <Title3 style={{ marginBottom: tokens.spacingVerticalM }}>Publisher Color Legend</Title3>
        <div className={styles.legendSection}>
          {erd.legend.map((pub) => (
            <Card key={pub.publisherPrefix} className={styles.legendCard}>
              <div className={styles.legendHeader}>
                <div className={styles.legendColor} style={{ backgroundColor: pub.color }} />
                <Text weight="semibold">{pub.publisherName}</Text>
                <Badge appearance="outline" shape="rounded">{pub.entityCount}</Badge>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
