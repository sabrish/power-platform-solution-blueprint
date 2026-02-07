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
}
