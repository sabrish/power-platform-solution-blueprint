// ─── Tooltip sizing constants ─────────────────────────────────────────────────
// Named constants used in makeStyles — raw pixels are required for these
// layout-constraint values since no equivalent spacing tokens exist.
export const EDGE_TOOLTIP_MAX_WIDTH = '300px';   // edge hover: wider to show full attribute path
export const NODE_TOOLTIP_MAX_WIDTH = '240px';   // node hover: narrower; content is shorter
// Fluent UI v9 does not expose zIndex tokens. 1000 is below browser popups (1100+)
// but above the Cytoscape canvas (z-index ~auto) and the graph overlays (z-index 5–10).
export const TOOLTIP_Z_INDEX = 1000;

// ─── Layout names ────────────────────────────────────────────────────────────
export type LayoutName = 'cose' | 'breadthfirst';

export const LAYOUT_LABELS: Record<LayoutName, string> = {
  cose: 'Smart',
  breadthfirst: 'Hierarchical',
};
