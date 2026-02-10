import type { IDataverseClient, QueryOptions, QueryResult } from './IDataverseClient.js';

/**
 * PPTB Dataverse API interface (matches official @pptb/types DataverseAPI.API)
 * Using minimal interface to avoid importing full types in core package
 */
interface DataverseApi {
  queryData(odataQuery: string, connectionTarget?: 'primary' | 'secondary'): Promise<{ value: Record<string, unknown>[] }>;
}

/**
 * Dataverse client implementation using PPTB Desktop API
 */
export class PptbDataverseClient implements IDataverseClient {
  private readonly dataverseApi: DataverseApi;
  private readonly environmentUrl: string;

  constructor(dataverseApi: DataverseApi, environmentUrl?: string) {
    this.dataverseApi = dataverseApi;
    this.environmentUrl = environmentUrl || 'Unknown Environment';
  }

  /**
   * Get the Dataverse environment URL
   */
  getEnvironmentUrl(): string {
    return this.environmentUrl;
  }

  /**
   * Query a Dataverse entity set with OData options
   */
  async query<T>(entitySet: string, options?: QueryOptions): Promise<QueryResult<T>> {
    try {
      const queryString = this.buildQueryString(options);
      const odataQuery = queryString ? `${entitySet}?${queryString}` : entitySet;

      const response = await this.dataverseApi.queryData(odataQuery, 'primary');

      return this.parseResponse<T>(response);
    } catch (error) {
      throw new Error(
        `Failed to query ${entitySet}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Query Dataverse metadata with OData options
   */
  async queryMetadata<T>(metadataPath: string, options?: QueryOptions): Promise<QueryResult<T>> {
    try {
      const queryString = this.buildQueryString(options);
      const odataQuery = queryString ? `${metadataPath}?${queryString}` : metadataPath;

      const response = await this.dataverseApi.queryData(odataQuery, 'primary');

      return this.parseResponse<T>(response);
    } catch (error) {
      throw new Error(
        `Failed to query metadata ${metadataPath}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Build OData query string from options
   */
  private buildQueryString(options?: QueryOptions): string {
    if (!options) {
      return '';
    }

    const params: string[] = [];

    if (options.select && options.select.length > 0) {
      params.push(`$select=${options.select.join(',')}`);
    }

    if (options.filter) {
      params.push(`$filter=${options.filter}`);
    }

    if (options.expand) {
      params.push(`$expand=${options.expand}`);
    }

    if (options.orderBy && options.orderBy.length > 0) {
      params.push(`$orderby=${options.orderBy.join(',')}`);
    }

    if (options.top !== undefined) {
      params.push(`$top=${options.top}`);
    }

    return params.join('&');
  }

  /**
   * Parse response from PPTB API
   */
  private parseResponse<T>(response: unknown): QueryResult<T> {
    if (!response || typeof response !== 'object') {
      throw new Error('Invalid response from Dataverse');
    }

    const data = response as Record<string, unknown>;

    // Handle collection queries (e.g., entity sets)
    if (Array.isArray(data.value)) {
      return {
        value: data.value as T[],
        count: typeof data['@odata.count'] === 'number' ? data['@odata.count'] : undefined,
      };
    }

    // Handle single item queries (e.g., EntitySet(id))
    // When querying by ID, OData returns the object directly without a 'value' wrapper
    if (!Array.isArray(data.value) && data['@odata.context']) {
      // This is a single item response - wrap it in an array
      return {
        value: [data as T],
        count: 1,
      };
    }

    throw new Error('Response does not contain a value array or single item');
  }
}
