/**
 * Type definitions for PPTB Desktop API
 */

type ConnectionTarget = 'primary' | 'secondary';

interface DataverseAPI {
  /**
   * Query Dataverse using OData syntax
   */
  queryData(odataQuery: string, connectionTarget?: ConnectionTarget): Promise<unknown>;

  /**
   * Execute FetchXML queries
   */
  fetchXmlQuery(fetchXml: string, connectionTarget?: ConnectionTarget): Promise<unknown>;

  /**
   * Create a record
   */
  create(entityName: string, record: unknown, connectionTarget?: ConnectionTarget): Promise<unknown>;

  /**
   * Retrieve a record
   */
  retrieve(
    entityLogicalName: string,
    id: string,
    columns?: string[],
    connectionTarget?: ConnectionTarget
  ): Promise<unknown>;

  /**
   * Update a record
   */
  update(
    entityLogicalName: string,
    id: string,
    record: unknown,
    connectionTarget?: ConnectionTarget
  ): Promise<unknown>;

  /**
   * Delete a record
   */
  delete(entityLogicalName: string, id: string, connectionTarget?: ConnectionTarget): Promise<unknown>;

  /**
   * Get entity metadata
   */
  getEntityMetadata(
    entityLogicalName: string,
    searchByLogicalName?: boolean,
    selectColumns?: string[],
    connectionTarget?: ConnectionTarget
  ): Promise<unknown>;

  /**
   * Get all entities metadata
   */
  getAllEntitiesMetadata(selectColumns?: string[], connectionTarget?: ConnectionTarget): Promise<unknown>;

  /**
   * Get solutions
   */
  getSolutions(selectColumns?: string[], connectionTarget?: ConnectionTarget): Promise<unknown>;

  /**
   * Publish customizations
   */
  publishCustomizations(tableLogicalName?: string, connectionTarget?: ConnectionTarget): Promise<unknown>;

  /**
   * Build a label object for metadata operations
   */
  buildLabel(text: string, languageCode?: number): unknown;
}

interface ConnectionsAPI {
  // Add connection methods as needed
}

interface UtilsAPI {
  // Add utility methods as needed
}

interface FileSystemAPI {
  // Add file system methods as needed
}

interface TerminalAPI {
  // Add terminal methods as needed
}

interface EventsAPI {
  // Add event methods as needed
}

interface SettingsAPI {
  // Add settings methods as needed
}

interface ToolboxAPI {
  getToolContext(): unknown;
  connections: ConnectionsAPI;
  dataverse: DataverseAPI;
  utils: UtilsAPI;
  fileSystem: FileSystemAPI;
  terminal: TerminalAPI;
  events: EventsAPI;
  settings: SettingsAPI;
}

interface Window {
  toolboxAPI: ToolboxAPI;
}
