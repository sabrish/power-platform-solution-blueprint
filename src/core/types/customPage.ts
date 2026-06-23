/**
 * Custom Page component type
 */
export interface CustomPage {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  isManaged: boolean;
  /** Solution unique names that include this component (populated post-discovery for solution-scoped runs) */
  referencingSolutions?: string[];
}
