import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import cytoscape from 'cytoscape';
import type { Core, NodeSingular } from 'cytoscape';
import {
  Text,
  Card,
  Button,
  ToggleButton,
  SearchBox,
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
  Dismiss24Regular,
  Checkmark24Regular,
} from '@fluentui/react-icons';
import type { ERDDefinition, BlueprintResult } from '../core';
import { generateDbDiagramCode } from '../utils/dbDiagramGenerator';

// ─── Layout names ────────────────────────────────────────────────────────────
type LayoutName = 'cose' | 'breadthfirst';
type IsolateHops = 1 | 2 | 3;

const LAYOUT_LABELS: Record<LayoutName, string> = {
  cose: 'Smart',
  breadthfirst: 'Hierarchical',
};

// ─── Styles ──────────────────────────────────────────────────────────────────
const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  toolbar: {
    display: 'flex',
    gap: tokens.spacingHorizontalXS,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  toolbarLabel: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    flexShrink: 0,
  },
  divider: {
    width: '1px',
    height: '24px',
    backgroundColor: tokens.colorNeutralStroke1,
    margin: `0 ${tokens.spacingHorizontalXS}`,
    alignSelf: 'center',
    flexShrink: 0,
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
    height: '720px',
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
  isolatedBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalM}`,
    backgroundColor: tokens.colorBrandBackground2,
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
    fontSize: tokens.fontSizeBase200,
  },
  // Hint text + export buttons bar at top of graph card
  hintBar: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalS,
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
    minHeight: '40px',
  },
  hintActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '2px',
    flexShrink: 0,
  },
  // Zoom controls overlay on the graph canvas
  zoomOverlay: {
    position: 'absolute',
    top: tokens.spacingVerticalM,
    right: tokens.spacingHorizontalM,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    zIndex: 5,
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: '2px',
    boxShadow: tokens.shadow4,
    opacity: 0.75,
    transition: 'opacity 0.15s ease',
    ':hover': {
      opacity: 1,
    },
  },
});

// ─── Cytoscape stylesheet ────────────────────────────────────────────────────
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
      style: { opacity: 0.2 },
    },
    {
      selector: 'node.isolated-hidden',
      style: { display: 'none' as const },
    },
    {
      selector: 'node.pub-hidden',
      style: { display: 'none' as const },
    },
    {
      selector: 'edge',
      style: {
        'width': 1.5,
        'line-color': '#aaa',
        'target-arrow-color': '#aaa',
        'target-arrow-shape': 'triangle' as const,
        'curve-style': 'bezier' as const,
        'label': 'data(label)',
        'font-size': '8px',
        'color': '#666',
        'text-background-color': '#fff',
        'text-background-opacity': 0.85,
        'text-background-padding': '2px',
        'text-max-width': '80px',
        'text-wrap': 'ellipsis' as const,
      },
    },
    {
      selector: 'edge.label-hidden',
      style: { 'label': '' },
    },
    {
      selector: 'edge[type = "N-N"]',
      style: {
        'line-style': 'dashed' as const,
        'source-arrow-shape': 'triangle' as const,
        'source-arrow-color': '#aaa',
      },
    },
    {
      selector: 'edge.hovered',
      style: {
        'width': 3,
        'line-color': '#0078d4',
        'target-arrow-color': '#0078d4',
        'source-arrow-color': '#0078d4',
        'z-index': 10,
      },
    },
    {
      selector: 'edge.faded',
      style: { opacity: 0.08 },
    },
    {
      selector: 'edge.isolated-hidden',
      style: { display: 'none' as const },
    },
    {
      selector: 'edge.pub-hidden',
      style: { display: 'none' as const },
    },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ] as any;
}

// ─── SVG export helper ───────────────────────────────────────────────────────
function downloadAsSVG(cy: Core): void {
  const ext = cy.elements(':visible').boundingBox({ includeLabels: false });
  if (!ext || !isFinite(ext.x1)) return;

  const pad = 50;
  const W = Math.ceil(ext.x2 - ext.x1 + pad * 2);
  const H = Math.ceil(ext.y2 - ext.y1 + pad * 2);
  const ox = -ext.x1 + pad;
  const oy = -ext.y1 + pad;

  const escXml = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // Edges first (nodes render on top)
  const edgeParts: string[] = [];
  cy.edges(':visible').forEach((e) => {
    const src = cy.getElementById(e.data('source') as string);
    const tgt = cy.getElementById(e.data('target') as string);
    if (src.empty() || tgt.empty()) return;
    const sx = (src.position().x + ox).toFixed(1);
    const sy = (src.position().y + oy).toFixed(1);
    const tx = (tgt.position().x + ox).toFixed(1);
    const ty = (tgt.position().y + oy).toFixed(1);
    const dash = e.data('type') === 'N-N' ? ' stroke-dasharray="6,3"' : '';
    edgeParts.push(
      `<line x1="${sx}" y1="${sy}" x2="${tx}" y2="${ty}" stroke="#aaa" stroke-width="1.5" marker-end="url(#arr)"${dash}/>`
    );
  });

  // Nodes
  const nodeParts: string[] = [];
  cy.nodes(':visible').forEach((n) => {
    const pos = n.position();
    const w = n.width();
    const h = n.height();
    const x = (pos.x + ox - w / 2).toFixed(1);
    const y = (pos.y + oy - h / 2).toFixed(1);
    const cx = (pos.x + ox).toFixed(1);
    const cy2 = (pos.y + oy + 4).toFixed(1);
    const fill = n.data('color') as string;
    const stroke = n.data('strokeColor') as string;
    const tc = n.data('textColor') as string;
    const lbl = escXml(n.data('label') as string);
    nodeParts.push(
      `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="5" fill="${fill}" stroke="${stroke}" stroke-width="2"/>` +
      `<text x="${cx}" y="${cy2}" text-anchor="middle" fill="${tc}" font-size="10" font-weight="bold" font-family="system-ui,sans-serif">${lbl}</text>`
    );
  });

  const svg = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`,
    `<defs><marker id="arr" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0,8 3,0 6" fill="#aaa"/></marker></defs>`,
    `<rect width="${W}" height="${H}" fill="#fafafa"/>`,
    ...edgeParts,
    ...nodeParts,
    `</svg>`,
  ].join('\n');

  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'entity-relationship-diagram.svg';
  a.click();
  URL.revokeObjectURL(url);
}

// ─── N-hop neighborhood ───────────────────────────────────────────────────────
function getNHopCollection(cy: Core, nodeId: string, hops: IsolateHops) {
  const start = cy.getElementById(nodeId);
  let collected: cytoscape.CollectionReturnValue = start;
  let frontier: cytoscape.CollectionReturnValue = start;
  for (let i = 0; i < hops; i++) {
    const next = frontier.neighborhood();
    collected = collected.union(next);
    frontier = next;
  }
  return collected;
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface NodeInfo {
  id: string;
  label: string;
  publisherPrefix: string;
  connectedCount: number;
}

interface EdgeHoverInfo {
  id: string;
  type: '1-N' | 'N-N';
  source: string;
  target: string;
  label: string;
  referencedAttribute?: string;
  intersectEntityName?: string;
}

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
  const [isolateHops, setIsolateHops] = useState<IsolateHops>(1);
  const [showEdgeLabels, setShowEdgeLabels] = useState(false);
  const [hiddenPublishers, setHiddenPublishers] = useState<Set<string>>(new Set());
  const [hoveredEdge, setHoveredEdge] = useState<EdgeHoverInfo | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [hoveredNode, setHoveredNode] = useState<NodeInfo | null>(null);
  const [nodeTooltipPos, setNodeTooltipPos] = useState<{ x: number; y: number } | null>(null);

  const toasterId = useId('toaster');
  const { dispatchToast } = useToastController(toasterId);

  const graphData = erd.graphData;

  // Filter out nodes that have no edges (not involved in any relationship).
  // Memoised on graphData edges/nodes so it only recomputes when the graph changes,
  // not on every search/selection state update.
  const { filteredNodes, isolatedEntityCount } = useMemo(() => {
    const ids = new Set<string>();
    graphData?.edges.forEach((e) => { ids.add(e.source); ids.add(e.target); });
    const filtered = graphData?.nodes.filter((n) => ids.has(n.id)) ?? [];
    return { filteredNodes: filtered, isolatedEntityCount: (graphData?.nodes.length ?? 0) - filtered.length };
  }, [graphData?.edges, graphData?.nodes]);

  const hasGraph = filteredNodes.length > 0;

  // ── Initialize Cytoscape ────────────────────────────────────────────────
  useEffect(() => {
    if (!hasGraph || !graphRef.current || !graphData) return;

    const nodes = filteredNodes.map((n) => ({
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
        referencedAttribute: e.referencedAttribute ?? '',
        intersectEntityName: e.intersectEntityName ?? '',
      },
    }));

    const cy = cytoscape({
      container: graphRef.current,
      elements: { nodes, edges },
      style: buildCytoscapeStylesheet(),
      layout: {
        name: 'cose',
        animate: false,
        nodeRepulsion: () => 8000000,
        idealEdgeLength: () => 180,
        nodeOverlap: 60,
        gravity: 0.15,
        numIter: 1000,
      },
      minZoom: 0.05,
      maxZoom: 4,
      wheelSensitivity: 0.3,
    });

    // Hide edge labels by default
    cy.edges().addClass('label-hidden');

    // Node click — select for isolation
    cy.on('tap', 'node', (evt) => {
      const node = evt.target as NodeSingular;
      const d = node.data();
      const connected = node.neighborhood('node');
      setSelectedNode({
        id: d.id as string,
        label: d.label as string,
        publisherPrefix: d.publisherPrefix as string,
        connectedCount: connected.length,
      });
    });

    // Node hover — tooltip
    cy.on('mouseover', 'node', (evt) => {
      const node = evt.target as NodeSingular;
      const d = node.data();
      const connected = node.neighborhood('node');
      const me = evt.originalEvent as MouseEvent;
      setHoveredNode({
        id: d.id as string,
        label: d.label as string,
        publisherPrefix: d.publisherPrefix as string,
        connectedCount: connected.length,
      });
      setNodeTooltipPos({ x: me.clientX + 14, y: me.clientY + 14 });
    });

    cy.on('mousemove', 'node', (evt) => {
      const me = evt.originalEvent as MouseEvent;
      setNodeTooltipPos({ x: me.clientX + 14, y: me.clientY + 14 });
    });

    cy.on('mouseout', 'node', () => {
      setHoveredNode(null);
      setNodeTooltipPos(null);
    });

    // Background tap — clear selection
    cy.on('tap', (evt) => {
      if (evt.target === cy) {
        setSelectedNode(null);
        clearIsolationOn(cy);
        setIsIsolated(false);
      }
    });

    // Edge hover — tooltip
    cy.on('mouseover', 'edge', (evt) => {
      const e = evt.target;
      e.addClass('hovered');
      const me = evt.originalEvent as MouseEvent;
      setHoveredEdge({
        id: e.data('id') as string,
        type: e.data('type') as '1-N' | 'N-N',
        source: e.data('source') as string,
        target: e.data('target') as string,
        label: e.data('label') as string,
        referencedAttribute: (e.data('referencedAttribute') as string) || undefined,
        intersectEntityName: (e.data('intersectEntityName') as string) || undefined,
      });
      setTooltipPos({ x: me.clientX + 14, y: me.clientY + 14 });
    });

    cy.on('mousemove', 'edge', (evt) => {
      const me = evt.originalEvent as MouseEvent;
      setTooltipPos({ x: me.clientX + 14, y: me.clientY + 14 });
    });

    cy.on('mouseout', 'edge', (evt) => {
      evt.target.removeClass('hovered');
      setHoveredEdge(null);
      setTooltipPos(null);
    });

    cyRef.current = cy;
    setIsInitializing(false);

    return () => {
      cy.destroy();
      cyRef.current = null;
    };
  }, [graphData, filteredNodes]);

  // ── Run layout ───────────────────────────────────────────────────────────
  const runLayout = useCallback((name: LayoutName) => {
    const cy = cyRef.current;
    if (!cy) return;

    clearIsolationOn(cy);
    setIsIsolated(false);
    setSelectedNode(null);

    const opts: Record<LayoutName, cytoscape.LayoutOptions> = {
      cose: {
        name: 'cose',
        animate: false,
        nodeRepulsion: () => 8000000,
        idealEdgeLength: () => 180,
        nodeOverlap: 60,
        gravity: 0.15,
        numIter: 1000,
      },
      breadthfirst: {
        name: 'breadthfirst',
        animate: false,
        directed: true,
        padding: 60,
        spacingFactor: 2.0,
      },
    };

    const layout = cy.layout(opts[name]);
    layout.on('layoutstop', () => cy.fit(undefined, 40));
    layout.run();
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
      const lbl = (node.data('label') as string).toLowerCase();
      const id = (node.data('id') as string).toLowerCase();
      node.addClass(lbl.includes(q) || id.includes(q) ? 'highlighted' : 'faded');
    });
  }, [searchQuery]);

  // ── Edge label toggle ────────────────────────────────────────────────────
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    if (showEdgeLabels) {
      cy.edges().removeClass('label-hidden');
    } else {
      cy.edges().addClass('label-hidden');
    }
  }, [showEdgeLabels]);

  // ── Publisher filter ─────────────────────────────────────────────────────
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;

    cy.nodes().forEach((node) => {
      const prefix = node.data('publisherPrefix') as string;
      if (hiddenPublishers.has(prefix)) {
        node.addClass('pub-hidden');
      } else {
        node.removeClass('pub-hidden');
      }
    });

    cy.edges().forEach((edge) => {
      const srcHidden = hiddenPublishers.has(
        cy.getElementById(edge.data('source') as string).data('publisherPrefix') as string
      );
      const tgtHidden = hiddenPublishers.has(
        cy.getElementById(edge.data('target') as string).data('publisherPrefix') as string
      );
      if (srcHidden || tgtHidden) {
        edge.addClass('pub-hidden');
      } else {
        edge.removeClass('pub-hidden');
      }
    });

  }, [hiddenPublishers]);

  // ── Isolate ──────────────────────────────────────────────────────────────
  const isolateNode = useCallback(() => {
    const cy = cyRef.current;
    if (!cy || !selectedNode) return;

    const collected = getNHopCollection(cy, selectedNode.id, isolateHops);
    cy.elements().addClass('isolated-hidden');
    collected.removeClass('isolated-hidden');
    setIsIsolated(true);
    cy.fit(collected, 60);
  }, [selectedNode, isolateHops]);

  function clearIsolationOn(cy: Core) {
    cy.elements().removeClass('isolated-hidden');
  }

  const handleClearIsolation = () => {
    const cy = cyRef.current;
    if (!cy) return;
    clearIsolationOn(cy);
    setIsIsolated(false);
    cy.fit(undefined, 40);
  };

  // ── Clear all filters ────────────────────────────────────────────────────
  const hasActiveFilters = searchQuery.trim() !== '' || hiddenPublishers.size > 0;

  const handleClearAllFilters = () => {
    setSearchQuery('');
    setHiddenPublishers(new Set());
    if (isIsolated) handleClearIsolation();
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
  const handleFit = () => { cyRef.current?.fit(undefined, 40); };

  // ── PNG download ─────────────────────────────────────────────────────────
  const handleDownloadPNG = () => {
    const cy = cyRef.current;
    if (!cy) return;
    const url = cy.png({ full: true, scale: 2, bg: '#fafafa' });
    const a = document.createElement('a');
    a.href = url;
    a.download = 'entity-relationship-diagram.png';
    a.click();
  };

  // ── SVG download ─────────────────────────────────────────────────────────
  const handleDownloadSVG = () => {
    const cy = cyRef.current;
    if (cy) downloadAsSVG(cy);
  };

  // ── Copy Mermaid ─────────────────────────────────────────────────────────
  const handleCopyMermaid = () => {
    const diagram = erd.diagrams[0];
    if (diagram) {
      navigator.clipboard.writeText(diagram.mermaidDiagram);
      dispatchToast(
        <Toast><ToastTitle action={<Checkmark24Regular />}>Mermaid code copied</ToastTitle></Toast>,
        { intent: 'success', timeout: 2000 }
      );
    }
  };

  // ── Copy dbdiagram.io ─────────────────────────────────────────────────────
  const handleCopyDbDiagram = () => {
    navigator.clipboard.writeText(generateDbDiagramCode(blueprintResult));
    dispatchToast(
      <Toast><ToastTitle action={<Checkmark24Regular />}>dbdiagram.io code copied! Paste at https://dbdiagram.io/d</ToastTitle></Toast>,
      { intent: 'success', timeout: 3000 }
    );
  };

  return (
    <div className={styles.container}>
      <Toaster toasterId={toasterId} />

      {/* ── Edge hover tooltip (fixed, portal-like) ── */}
      {hoveredEdge && tooltipPos && (
        <div style={{
          position: 'fixed',
          left: tooltipPos.x,
          top: tooltipPos.y,
          backgroundColor: tokens.colorNeutralBackground1,
          border: `1px solid ${tokens.colorNeutralStroke1}`,
          borderRadius: tokens.borderRadiusMedium,
          padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
          boxShadow: tokens.shadow8,
          zIndex: 9999,
          maxWidth: '300px',
          pointerEvents: 'none',
        }}>
          <Text weight="semibold" block style={{ marginBottom: '2px', wordBreak: 'break-all' }}>
            {hoveredEdge.id}
          </Text>
          <Text block style={{ fontSize: tokens.fontSizeBase100, color: tokens.colorNeutralForeground3, marginBottom: tokens.spacingVerticalXS }}>
            {hoveredEdge.type === '1-N' ? '1:N relationship' : 'N:N relationship'}
          </Text>
          {hoveredEdge.type === '1-N' && (
            <Text block style={{ fontSize: tokens.fontSizeBase200, wordBreak: 'break-all' }}>
              {hoveredEdge.source}.{hoveredEdge.referencedAttribute} → {hoveredEdge.target}.{hoveredEdge.label}
            </Text>
          )}
          {hoveredEdge.type === 'N-N' && hoveredEdge.intersectEntityName && (
            <Text block style={{ fontSize: tokens.fontSizeBase200 }}>
              <span style={{ color: tokens.colorNeutralForeground3 }}>Via: </span>
              {hoveredEdge.intersectEntityName}
            </Text>
          )}
        </div>
      )}

      {/* ── Header ── */}
      <div>
        <Text size={500} weight="semibold" block>Entity Relationship Diagram</Text>
        <Text style={{ color: tokens.colorNeutralForeground3 }}>
          {filteredNodes.length} entities · {graphData?.edges.length ?? 0} relationships in scope
          {isolatedEntityCount > 0 && ` · ${isolatedEntityCount} entity${isolatedEntityCount > 1 ? 'ies' : ''} with no relationships hidden`}
        </Text>
      </div>

      {hasGraph && (
        <>
          {/* ── Toolbar row 1: Layout | Zoom | Search + Isolate ── */}
          <div className={styles.toolbar}>
            {/* Layout */}
            <Text className={styles.toolbarLabel}>Layout:</Text>
            {(Object.keys(LAYOUT_LABELS) as LayoutName[]).map((name) => (
              <Button
                key={name}
                size="small"
                appearance={activeLayout === name ? 'primary' : 'secondary'}
                style={{ minWidth: 'unset' }}
                onClick={() => handleLayoutChange(name)}
              >
                {LAYOUT_LABELS[name]}
              </Button>
            ))}

            <div className={styles.divider} />

            {/* Search */}
            <SearchBox
              className={styles.searchBox}
              size="medium"
              placeholder="Search entities..."
              value={searchQuery}
              onChange={(_, d) => setSearchQuery(d.value)}
            />

            {/* Hops selector + Isolate (next to search) */}
            <Text className={styles.toolbarLabel} style={{ marginLeft: tokens.spacingHorizontalXS }}>Hops:</Text>
            {([1, 2, 3] as IsolateHops[]).map((h) => (
              <Button
                key={h}
                size="small"
                appearance={isolateHops === h ? 'primary' : 'secondary'}
                style={{ minWidth: '28px', padding: '0 6px' }}
                onClick={() => setIsolateHops(h)}
              >
                {h}
              </Button>
            ))}
            <Tooltip content={selectedNode ? `Isolate "${selectedNode.label}" and its ${isolateHops}-hop neighbors` : 'Click a node first'} relationship="label">
              <Button
                size="small"
                appearance="secondary"
                style={{ minWidth: 'unset' }}
                disabled={!selectedNode || isIsolated}
                onClick={isolateNode}
              >
                Isolate
              </Button>
            </Tooltip>
          </div>

          {/* ── Toolbar row 2: Publisher filter | Labels | Clear all ── */}
          <div className={styles.toolbar}>
            <Text className={styles.toolbarLabel}>Publishers:</Text>
            {erd.legend.map((pub) => {
              const isHidden = hiddenPublishers.has(pub.publisherPrefix);
              return (
                <ToggleButton
                  key={pub.publisherPrefix}
                  appearance="outline"
                  size="small"
                  checked={!isHidden}
                  style={{
                    minWidth: 'unset',
                    paddingLeft: tokens.spacingHorizontalS,
                    paddingRight: tokens.spacingHorizontalS,
                    borderLeft: `3px solid ${pub.color}`,
                  }}
                  onClick={() =>
                    setHiddenPublishers((prev) => {
                      const next = new Set(prev);
                      if (next.has(pub.publisherPrefix)) next.delete(pub.publisherPrefix);
                      else next.add(pub.publisherPrefix);
                      return next;
                    })
                  }
                >
                  {pub.publisherName} ({pub.entityCount})
                </ToggleButton>
              );
            })}

            <div className={styles.divider} />

            <ToggleButton
              appearance="outline"
              size="small"
              checked={showEdgeLabels}
              onClick={() => setShowEdgeLabels((v) => !v)}
              style={{ minWidth: 'unset' }}
            >
              Labels
            </ToggleButton>

            {hasActiveFilters && (
              <Button size="small" appearance="subtle" onClick={handleClearAllFilters}>
                Clear filters
              </Button>
            )}
          </div>

        </>
      )}

      {/* ── Graph card ── */}
      {hasGraph ? (
        <Card className={styles.graphCard}>
          {/* Isolation banner */}
          {isIsolated && (
            <div className={styles.isolatedBanner}>
              <Text>
                Showing {isolateHops}-hop neighborhood of <strong>{selectedNode?.label}</strong>
              </Text>
              <Button size="small" appearance="subtle" icon={<Dismiss24Regular />} onClick={handleClearIsolation}>
                Show all
              </Button>
            </div>
          )}

          {/* Usage hint + export buttons bar */}
          <div className={styles.hintBar}>
            <Text style={{ fontSize: tokens.fontSizeBase100, color: tokens.colorNeutralForeground3 }}>
              Click node to select · Hover edge for details · Scroll to zoom · Drag to pan · Solid = 1:N · Dashed = N:N
            </Text>
            <div className={styles.hintActions}>
              <Tooltip content="Download PNG" relationship="label">
                <Button size="small" appearance="subtle" icon={<ArrowDownload24Regular />} onClick={handleDownloadPNG}>
                  PNG
                </Button>
              </Tooltip>
              <Tooltip content="Download SVG" relationship="label">
                <Button size="small" appearance="subtle" icon={<ArrowDownload24Regular />} onClick={handleDownloadSVG}>
                  SVG
                </Button>
              </Tooltip>
              <div className={styles.divider} />
              <Tooltip content="Copy Mermaid code (for mermaid.live etc.)" relationship="label">
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
          </div>

          {/* Canvas */}
          <div style={{ position: 'relative' }}>
            <div ref={graphRef} className={styles.graphContainer} />

            {/* Zoom overlay — top-right of canvas */}
            {!isInitializing && (
              <div className={styles.zoomOverlay}>
                <Tooltip content="Zoom in" relationship="label">
                  <Button size="small" appearance="subtle" aria-label="Zoom in" icon={<ZoomIn24Regular />} onClick={handleZoomIn} />
                </Tooltip>
                <Tooltip content="Zoom out" relationship="label">
                  <Button size="small" appearance="subtle" aria-label="Zoom out" icon={<ZoomOut24Regular />} onClick={handleZoomOut} />
                </Tooltip>
                <Tooltip content="Fit to screen" relationship="label">
                  <Button size="small" appearance="subtle" aria-label="Fit to screen" icon={<ZoomFit24Regular />} onClick={handleFit} />
                </Tooltip>
              </div>
            )}

            {isInitializing && (
              <div className={styles.loadingOverlay}>
                <Text>Building graph…</Text>
              </div>
            )}

            {/* Node hover tooltip */}
            {hoveredNode && nodeTooltipPos && (
              <div style={{
                position: 'fixed',
                left: nodeTooltipPos.x,
                top: nodeTooltipPos.y,
                backgroundColor: tokens.colorNeutralBackground1,
                border: `1px solid ${tokens.colorNeutralStroke1}`,
                borderRadius: tokens.borderRadiusMedium,
                padding: tokens.spacingVerticalS,
                maxWidth: '240px',
                zIndex: 9999,
                boxShadow: tokens.shadow4,
                pointerEvents: 'none',
              }}>
                <Text block style={{ fontWeight: tokens.fontWeightSemibold, wordBreak: 'break-all', marginBottom: tokens.spacingVerticalXS }}>{hoveredNode.label}</Text>
                <div className={styles.infoPanelRow}>
                  <Text className={styles.infoPanelLabel}>Logical name</Text>
                  <Text style={{ wordBreak: 'break-all', fontSize: tokens.fontSizeBase200 }}>{hoveredNode.id}</Text>
                </div>
                {hoveredNode.publisherPrefix && (
                  <div className={styles.infoPanelRow}>
                    <Text className={styles.infoPanelLabel}>Publisher</Text>
                    <Text style={{ fontSize: tokens.fontSizeBase200 }}>{hoveredNode.publisherPrefix}</Text>
                  </div>
                )}
                <div className={styles.infoPanelRow}>
                  <Text className={styles.infoPanelLabel}>Relationships</Text>
                  <Text style={{ fontSize: tokens.fontSizeBase200 }}>{hoveredNode.connectedCount}</Text>
                </div>
              </div>
            )}
          </div>

        </Card>
      ) : (
        <Card>
          <div style={{ padding: tokens.spacingVerticalXL, textAlign: 'center', color: tokens.colorNeutralForeground3 }}>
            <Text>No relationship data available.</Text>
          </div>
        </Card>
      )}

    </div>
  );
}
