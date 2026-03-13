import type { Core } from 'cytoscape';

// ─── SVG export helper ───────────────────────────────────────────────────────
export function downloadAsSVG(cy: Core): void {
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
