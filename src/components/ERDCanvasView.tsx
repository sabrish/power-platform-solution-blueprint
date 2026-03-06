import { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import * as dagre from 'dagre';
import { tokens, makeStyles } from '@fluentui/react-components';
import type { ERDGraphData } from '../core';

const NODE_W = 180;
const NODE_H = 52;
const PADDING = 60;

const useStyles = makeStyles({
  container: {
    width: '100%',
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    userSelect: 'none',
  },
  hint: {
    position: 'absolute',
    bottom: '8px',
    right: '12px',
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground3,
    pointerEvents: 'none',
  },
});

interface LayoutNode {
  id: string;
  label: string;
  color: string;
  strokeColor: string;
  textColor: string;
  x: number;
  y: number;
}

interface LayoutEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  type: '1-N' | 'N-N';
  points: { x: number; y: number }[];
}

export interface ERDCanvasViewProps {
  graphData: ERDGraphData;
  height?: number;
  svgRef?: React.RefObject<SVGSVGElement | null> | React.RefObject<SVGSVGElement>;
}

export function ERDCanvasView({ graphData, height = 600, svgRef }: ERDCanvasViewProps) {
  const styles = useStyles();
  const containerRef = useRef<HTMLDivElement>(null);
  const internalSvgRef = useRef<SVGSVGElement>(null);
  // Cast to the narrower type that React's JSX expects for svg ref
  const activeSvgRef = (svgRef ?? internalSvgRef) as React.RefObject<SVGSVGElement>;
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0, tx: 0, ty: 0 });

  const { layoutNodes, layoutEdges, graphWidth, graphHeight } = useMemo(() => {
    const g = new dagre.graphlib.Graph();
    g.setGraph({ rankdir: 'TB', nodesep: 60, ranksep: 80, marginx: PADDING, marginy: PADDING });
    g.setDefaultEdgeLabel(() => ({}));

    for (const node of graphData.nodes) {
      g.setNode(node.id, { width: NODE_W, height: NODE_H });
    }
    for (const edge of graphData.edges) {
      g.setEdge(edge.source, edge.target, { id: edge.id });
    }
    dagre.layout(g);

    const lNodes: LayoutNode[] = graphData.nodes.map(node => {
      const pos = g.node(node.id);
      return { ...node, x: pos?.x ?? 0, y: pos?.y ?? 0 };
    });

    const lEdges: LayoutEdge[] = graphData.edges.map(edge => {
      const e = g.edge(edge.source, edge.target);
      return { ...edge, points: e?.points ?? [] };
    });

    const info = g.graph();
    return {
      layoutNodes: lNodes,
      layoutEdges: lEdges,
      graphWidth: (info.width ?? 800) + PADDING * 2,
      graphHeight: (info.height ?? 600) + PADDING * 2,
    };
  }, [graphData]);

  // Fit to container on layout change
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const cw = el.clientWidth || 800;
    const ch = height;
    const sc = Math.min(cw / graphWidth, ch / graphHeight, 1);
    setTransform({
      x: (cw - graphWidth * sc) / 2,
      y: (ch - graphHeight * sc) / 2,
      scale: sc,
    });
  }, [graphWidth, graphHeight, height]);

  // Wheel zoom (non-passive to allow preventDefault)
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 1.1 : 0.9;
    setTransform(prev => ({ ...prev, scale: Math.max(0.1, Math.min(5, prev.scale * delta)) }));
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  const onMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    isDragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY, tx: transform.x, ty: transform.y };
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    setTransform(prev => ({
      ...prev,
      x: dragStart.current.tx + (e.clientX - dragStart.current.x),
      y: dragStart.current.ty + (e.clientY - dragStart.current.y),
    }));
  };

  const onMouseUp = () => { isDragging.current = false; };

  const connectedIds = useMemo(() => {
    if (!selectedId) return null;
    const nodeIds = new Set<string>([selectedId]);
    const edgeIds = new Set<string>();
    for (const edge of layoutEdges) {
      if (edge.source === selectedId || edge.target === selectedId) {
        edgeIds.add(edge.id);
        nodeIds.add(edge.source);
        nodeIds.add(edge.target);
      }
    }
    return { nodeIds, edgeIds };
  }, [selectedId, layoutEdges]);

  const nodeVisible = (id: string) => !connectedIds || connectedIds.nodeIds.has(id);
  const edgeVisible = (id: string) => !connectedIds || connectedIds.edgeIds.has(id);

  const buildPathD = (points: { x: number; y: number }[]): string => {
    if (points.length < 2) return '';
    return `M ${points.map(p => `${p.x} ${p.y}`).join(' L ')}`;
  };

  return (
    <div
      ref={containerRef}
      className={styles.container}
      style={{ height, cursor: isDragging.current ? 'grabbing' : 'grab' }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    >
      <svg
        ref={activeSvgRef}
        width="100%"
        height="100%"
        onClick={() => setSelectedId(null)}
      >
        <defs>
          <marker id="erd-arr" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#888" />
          </marker>
          <marker id="erd-arr-hl" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#0078D4" />
          </marker>
        </defs>
        <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}>
          {layoutEdges.map(edge => {
            const visible = edgeVisible(edge.id);
            const highlighted = !!(connectedIds && visible);
            const midPt = edge.points[Math.floor(edge.points.length / 2)];
            return (
              <g key={edge.id} opacity={visible ? 1 : 0.12}>
                <path
                  d={buildPathD(edge.points)}
                  fill="none"
                  stroke={highlighted ? '#0078D4' : '#999'}
                  strokeWidth={highlighted ? 2 : 1}
                  markerEnd={highlighted ? 'url(#erd-arr-hl)' : 'url(#erd-arr)'}
                />
                {edge.label && midPt && (
                  <text
                    x={midPt.x}
                    y={midPt.y - 5}
                    textAnchor="middle"
                    fontSize="10"
                    fill={highlighted ? '#0078D4' : '#888'}
                    fontFamily="Consolas, monospace"
                  >
                    {edge.label}
                  </text>
                )}
              </g>
            );
          })}
          {layoutNodes.map(node => {
            const visible = nodeVisible(node.id);
            const isSelected = node.id === selectedId;
            return (
              <g
                key={node.id}
                transform={`translate(${node.x - NODE_W / 2}, ${node.y - NODE_H / 2})`}
                opacity={visible ? 1 : 0.12}
                style={{ cursor: 'pointer' }}
                onClick={e => {
                  e.stopPropagation();
                  setSelectedId(prev => prev === node.id ? null : node.id);
                }}
              >
                <rect
                  width={NODE_W}
                  height={NODE_H}
                  rx={6}
                  fill={node.color}
                  stroke={isSelected ? '#ffffff' : node.strokeColor}
                  strokeWidth={isSelected ? 3 : 1.5}
                />
                <text
                  x={NODE_W / 2}
                  y={NODE_H / 2 + 5}
                  textAnchor="middle"
                  fontSize="13"
                  fill={node.textColor}
                  fontFamily="Segoe UI, system-ui, sans-serif"
                  fontWeight={isSelected ? 'bold' : 'normal'}
                >
                  {node.label}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
      <div className={styles.hint}>Scroll to zoom · Drag to pan · Click node to highlight</div>
    </div>
  );
}
