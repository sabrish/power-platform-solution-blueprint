/**
 * Custom Page component type
 */
export interface CustomPage {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  isManaged: boolean;
}
