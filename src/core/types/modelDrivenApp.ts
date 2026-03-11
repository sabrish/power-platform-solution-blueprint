/**
 * Model-Driven App component type
 */
export interface ModelDrivenApp {
  id: string;
  name: string;           // uniquename
  displayName: string;    // name (friendly)
  description?: string;
  isManaged: boolean;
  modifiedOn?: string;
}
