/**
 * Virtual Table Data Source (entitydatasource) types
 */

/**
 * A Virtual Table Data Source that provides external data to virtual entities.
 * Component type code: 166 — Strategy A discovery via solutioncomponents.
 *
 * SECURITY: connectionDefinition is always null in output — never passes raw credentials through.
 */
export interface VirtualTableDataSource {
  id: string;
  name: string;
  description: string | null;
  dataSourceTypeId: string | null;
  /** Always null — connectionDefinition is redacted at processor level (may contain credentials). */
  connectionDefinition: null;
  isManaged: boolean;
  createdOn: string;
  modifiedOn: string;
}
