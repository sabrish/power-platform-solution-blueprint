/**
 * Options for querying Dataverse
 */
export interface QueryOptions {
  select?: string[];
  filter?: string;
  expand?: string;
  orderBy?: string[];
  top?: number;
}

/**
 * Result from a Dataverse query
 */
export interface QueryResult<T> {
  value: T[];
  count?: number;
}

/**
 * Interface for Dataverse client operations
 */
export interface IDataverseClient {
  /**
   * Query a Dataverse entity set
   * @param entitySet The entity set name (e.g., 'publishers', 'solutions')
   * @param options Query options (select, filter, expand, orderBy)
   * @returns Query result with array of entities
   */
  query<T>(entitySet: string, options?: QueryOptions): Promise<QueryResult<T>>;

  /**
   * Query Dataverse metadata (e.g., EntityDefinitions)
   * @param metadataPath The metadata path (e.g., 'EntityDefinitions')
   * @param options Query options (select, filter, expand, orderBy)
   * @returns Query result with array of metadata objects
   */
  queryMetadata<T>(metadataPath: string, options?: QueryOptions): Promise<QueryResult<T>>;

  /**
   * Get the Dataverse environment URL
   * @returns The environment URL or a default string if not available
   */
  getEnvironmentUrl(): string;
}
