import type { IDataverseClient, QueryOptions, QueryResult } from './IDataverseClient.js';
import { withRetry } from '../utils/withRetry.js';

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

      const response = await withRetry(
        () => this.dataverseApi.queryData(odataQuery, 'primary'),
        { maxAttempts: 3 }
      );

      return this.parseResponse<T>(response);
    } catch (error) {
      throw new Error(
        `Failed to query ${entitySet}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Query ALL records from a Dataverse entity set by following @odata.nextLink pages.
   *
   * Dataverse uses cursor-based paging: the first response includes @odata.nextLink when
   * there are more records. Subsequent requests follow that link until it is absent.
   * NOTE: $skip is deliberately NOT used — it is not supported by all entity types
   * (e.g. customapis returns 0x80060888 "Skip Clause is not supported in CRM").
   */
  async queryAll<T>(entitySet: string, options?: Omit<QueryOptions, 'top'>): Promise<QueryResult<T>> {
    const allResults: T[] = [];

    // First page — no $top so Dataverse uses its default page size and includes
    // @odata.nextLink when more records exist.
    let page = await this.query<T>(entitySet, options);
    allResults.push(...page.value);

    // Follow @odata.nextLink until exhausted
    while (page.nextLink) {
      const relativePath = this.extractRelativePath(page.nextLink);
      try {
        const response = await withRetry(
          () => this.dataverseApi.queryData(relativePath, 'primary'),
          { maxAttempts: 3 }
        );
        page = this.parseResponse<T>(response);
        allResults.push(...page.value);
      } catch (error) {
        throw new Error(
          `Failed to query ${entitySet} (pagination): ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    return { value: allResults };
  }

  /**
   * Query Dataverse metadata with OData options
   */
  async queryMetadata<T>(metadataPath: string, options?: QueryOptions): Promise<QueryResult<T>> {
    try {
      const queryString = this.buildQueryString(options);
      const odataQuery = queryString ? `${metadataPath}?${queryString}` : metadataPath;

      const response = await withRetry(
        () => this.dataverseApi.queryData(odataQuery, 'primary'),
        { maxAttempts: 3 }
      );

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
   * Extract the relative OData path from an absolute @odata.nextLink URL.
   *
   * Dataverse returns nextLink as a full URL:
   *   https://org.crm.dynamics.com/api/data/v9.2/customapis?$select=...&$skiptoken=...
   * queryData() expects only the relative portion:
   *   customapis?$select=...&$skiptoken=...
   */
  private extractRelativePath(nextLink: string): string {
    // Strip everything up to and including /api/data/vN.N/
    const match = nextLink.match(/\/api\/data\/v[\d.]+\/(.+)$/);
    if (match) return match[1];

    // Fallback: attempt URL parsing (handles edge cases in URL format)
    try {
      const url = new URL(nextLink);
      const relative = url.pathname.replace(/^\/api\/data\/v[\d.]+\//, '') + url.search;
      if (relative) return relative;
    } catch {
      // URL parsing failed — fall through to error
    }

    throw new Error(`Cannot extract relative path from @odata.nextLink: ${nextLink}`);
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
        nextLink: typeof data['@odata.nextLink'] === 'string' ? data['@odata.nextLink'] : undefined,
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
