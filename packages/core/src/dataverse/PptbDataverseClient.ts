import type { IDataverseClient, QueryOptions, QueryResult } from './IDataverseClient.js';

/**
 * PPTB API interface for Dataverse requests
 */
interface PptbDataverseApi {
  queryData(odataQuery: string, connectionTarget?: 'primary' | 'secondary'): Promise<unknown>;
}

interface PptbApi {
  dataverse: PptbDataverseApi;
}

/**
 * Dataverse client implementation using PPTB Desktop API
 */
export class PptbDataverseClient implements IDataverseClient {
  private readonly pptbApi: PptbApi;

  constructor(pptbApi: PptbApi) {
    this.pptbApi = pptbApi;
  }

  /**
   * Query a Dataverse entity set with OData options
   */
  async query<T>(entitySet: string, options?: QueryOptions): Promise<QueryResult<T>> {
    try {
      const queryString = this.buildQueryString(options);
      const odataQuery = queryString ? `${entitySet}?${queryString}` : entitySet;

      const response = await this.pptbApi.dataverse.queryData(odataQuery, 'primary');

      return this.parseResponse<T>(response);
    } catch (error) {
      throw new Error(
        `Failed to query ${entitySet}: ${error instanceof Error ? error.message : 'Unknown error'}`
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

    if (!Array.isArray(data.value)) {
      throw new Error('Response does not contain a value array');
    }

    return {
      value: data.value as T[],
      count: typeof data['@odata.count'] === 'number' ? data['@odata.count'] : undefined,
    };
  }
}
