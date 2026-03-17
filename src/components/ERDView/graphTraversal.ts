import type { Core } from 'cytoscape';
import cytoscape from 'cytoscape';

export type IsolateHops = 1 | 2 | 3;

// ─── N-hop neighborhood ───────────────────────────────────────────────────────
export function getNHopCollection(cy: Core, nodeId: string, hops: IsolateHops) {
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
