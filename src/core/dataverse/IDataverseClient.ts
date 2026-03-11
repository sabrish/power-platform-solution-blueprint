/**
 * Options for querying Dataverse
 */
export interface QueryOptions {
  select?: string[];
  filter?: string;
  expand?: string;
  orderBy?: string[];
  top?: number;
  // NOTE: $skip is NOT supported by all Dataverse entity types (e.g. customapis returns
  // 0x80060888 "Skip Clause is not supported in CRM"). Use queryAll() for pagination instead.
}

/**
 * Result from a Dataverse query
 */
export interface QueryResult<T> {
  value: T[];
  count?: number;
  /** Raw @odata.nextLink URL for the next page, if present */
  nextLink?: string;
}

/**
 * Interface for Dataverse client operations
 */
export interface IDataverseClient {
  /**
   * Query a single page from a Dataverse entity set.
   * Does NOT follow pagination automatically.
   * Use `queryAll` when you need all records across all pages.
   */
  query<T>(entitySet: string, options?: QueryOptions): Promise<QueryResult<T>>;

  /**
   * Query ALL records from a Dataverse entity set, following @odata.nextLink pagination.
   * Do not pass `top` in options — pagination is handled internally.
   * NOTE: $skip is NOT used internally; Dataverse cursor-based paging (@odata.nextLink /
   * $skiptoken) is the correct mechanism and works across all entity types.
   */
  queryAll<T>(entitySet: string, options?: Omit<QueryOptions, 'top'>): Promise<QueryResult<T>>;

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
