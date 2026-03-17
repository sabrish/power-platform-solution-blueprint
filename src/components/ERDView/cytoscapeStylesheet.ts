import cytoscape from 'cytoscape';

// ─── Cytoscape stylesheet ────────────────────────────────────────────────────
export function buildCytoscapeStylesheet(): cytoscape.StylesheetJson {
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
