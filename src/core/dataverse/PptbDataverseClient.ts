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
  private static readonly MAX_PRIMARY_ATTEMPTS = 3;
  private static readonly RETRY_BASE_DELAY_MS = 600;
  private static readonly MAX_RETRY_DELAY_MS = 5000;

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

      const response = await this.queryDataWithRetry(odataQuery);

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

      const response = await this.queryDataWithRetry(odataQuery);

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

  private async queryDataWithRetry(odataQuery: string): Promise<{ value: Record<string, unknown>[] }> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= PptbDataverseClient.MAX_PRIMARY_ATTEMPTS; attempt++) {
      try {
        return await this.dataverseApi.queryData(odataQuery, 'primary');
      } catch (error) {
        lastError = error;
        if (!this.isRetryableError(error) || attempt === PptbDataverseClient.MAX_PRIMARY_ATTEMPTS) {
          break;
        }
        await this.delay(this.getBackoffDelayMs(attempt));
      }
    }

    if (this.isRetryableError(lastError)) {
      try {
        return await this.dataverseApi.queryData(odataQuery, 'secondary');
      } catch (error) {
        lastError = error;
      }
    }

    if (lastError instanceof Error) {
      throw lastError;
    }

    const unknownErrorMessage = this.getErrorMessage(lastError);
    if (unknownErrorMessage) {
      throw new Error(unknownErrorMessage);
    }

    throw new Error('Dataverse query failed');
  }

  private isRetryableError(error: unknown): boolean {
    const errorMessage = this.getErrorMessage(error);
    if (!errorMessage) {
      return false;
    }

    const message = errorMessage.toLowerCase();
    const retryableIndicators = [
      'etimedout',
      'timeout',
      'econnreset',
      'econnrefused',
      'enotfound',
      'eai_again',
      'socket hang up',
      'network error',
      'temporarily unavailable',
      'too many requests',
      ' 429',
      ' 502',
      ' 503',
      ' 504',
    ];

    return retryableIndicators.some(indicator => message.includes(indicator));
  }

  private getErrorMessage(error: unknown): string | undefined {
    if (error instanceof Error) {
      return error.message;
    }

    if (typeof error === 'string') {
      return error;
    }

    if (error && typeof error === 'object' && 'message' in error) {
      const message = (error as Record<string, unknown>).message;
      if (typeof message === 'string') {
        return message;
      }
    }

    return undefined;
  }

  private getBackoffDelayMs(attempt: number): number {
    const exponentialDelay = PptbDataverseClient.RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1);
    return Math.min(exponentialDelay, PptbDataverseClient.MAX_RETRY_DELAY_MS);
  }

  private async delay(ms: number): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, ms));
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
