/**
 * Canvas App component type
 */
export interface CanvasApp {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  isManaged: boolean;
  /** Solution unique names that include this component (populated post-discovery for solution-scoped runs) */
  referencingSolutions?: string[];
}
