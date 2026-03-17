import type { IDataverseClient } from '../dataverse/IDataverseClient.js';
import type { BusinessRule } from '../types/blueprint.js';
import type { IDiscoverer } from './IDiscoverer.js';
import type { FetchLogger } from '../utils/FetchLogger.js';
import { BusinessRuleParser } from '../parsers/BusinessRuleParser.js';
import { withAdaptiveBatch } from '../utils/withAdaptiveBatch.js';
import { buildOrFilter } from '../utils/odata.js';
import { normalizeBatch } from '../utils/guid.js';

interface BusinessRuleRecord {
  workflowid: string;
  name: string;
  description: string | null;
  statecode: number;
  primaryentity: string | null;
  scope: number;
  xaml: string | null;
  clientdata: string | null;
  modifiedon: string;
  createdon: string;
  // Formatted values come automatically as OData annotations
  '_ownerid_value@OData.Community.Display.V1.FormattedValue'?: string;
  '_formid_value@OData.Community.Display.V1.FormattedValue'?: string;
  'primaryentity@OData.Community.Display.V1.FormattedValue'?: string;
}

/**
 * Discovers Business Rules (client/server-side logic)
 */
export class BusinessRuleDiscovery implements IDiscoverer<BusinessRule> {
  private readonly client: IDataverseClient;
  private onProgress?: (current: number, total: number) => void;
  private logger?: FetchLogger;

  constructor(
    client: IDataverseClient,
    onProgress?: (current: number, total: number) => void,
    logger?: FetchLogger
  ) {
    this.client = client;
    this.onProgress = onProgress;
    this.logger = logger;
  }

  /**
   * Get business rules by workflow IDs
   */
  discoverByIds(ids: string[]): Promise<BusinessRule[]> {
    return this.getBusinessRulesByIds(ids);
  }

  async getBusinessRulesByIds(brIds: string[]): Promise<BusinessRule[]> {
    if (brIds.length === 0) {
      return [];
    }

    const cleanIds = normalizeBatch(brIds);
    const invalidIndex = cleanIds.findIndex(id => !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(id));
    if (invalidIndex !== -1) {
      throw new TypeError(`Invalid workflow ID: ${brIds[invalidIndex]}`);
    }

    const { results: allResults } = await withAdaptiveBatch<string, BusinessRuleRecord>(
      cleanIds,
      async (batch) => {
        const filter = `(${buildOrFilter(batch, 'workflowid', { guids: true })}) and category eq 2`;
        const response = await this.client.query<BusinessRuleRecord>('workflows', {
          select: [
            'workflowid', 'name', 'description', 'statecode', 'primaryentity',
            'scope', 'xaml', 'clientdata', 'modifiedon', 'createdon',
          ],
          filter,
          // Note: no orderBy — workflows table does not support $orderby (silent empty result)
        });
        return response.value;
      },
      {
        initialBatchSize: 20,
        step: 'Business Rule Discovery',
        entitySet: 'workflows (business rules)',
        logger: this.logger,
        onProgress: (done, total) => this.onProgress?.(done, total),
      }
    );

    return allResults.map(record => this.mapRecordToBusinessRule(record));
  }

  /**
   * Get all business rules for a specific entity
   */
  async getBusinessRulesForEntity(logicalName: string): Promise<BusinessRule[]> {
    if (!/^[a-z][a-z0-9_]*$/.test(logicalName)) {
      throw new TypeError(`Invalid entity logical name: ${logicalName}`);
    }
    try {
      const response = await this.client.query<BusinessRuleRecord>('workflows', {
        select: [
          'workflowid', 'name', 'description', 'statecode', 'primaryentity',
          'scope', 'xaml', 'clientdata', 'modifiedon', 'createdon',
        ],
        filter: `category eq 2 and primaryentity eq '${logicalName}'`,
        // Note: no orderBy — workflows table does not support $orderby (silent empty result)
      });

      // Sort in memory after fetch
      const sorted = response.value.slice().sort((a, b) => a.name.localeCompare(b.name));
      return sorted.map(record => this.mapRecordToBusinessRule(record));
    } catch {
      return [];
    }
  }

  /**
   * Map workflow record to BusinessRule object
   */
  private mapRecordToBusinessRule(record: BusinessRuleRecord): BusinessRule {
    // Parse business rule definition — tries clientdata first, falls back to XAML
    const definition = BusinessRuleParser.parse(record.xaml ?? null, record.clientdata ?? null, record.name);

    // Determine state
    let state: BusinessRule['state'] = 'Draft';
    if (record.statecode === 1) {
      state = 'Active';
    }

    // Map scope to readable name
    let scope: BusinessRule['scope'] = 'Entity';
    let scopeName = 'Entity';
    if (record.scope === 1) {
      scope = 'AllForms';
      scopeName = 'All Forms';
    } else if (record.scope === 2) {
      scope = 'SpecificForm';
      scopeName = 'Specific Form';
    }

    return {
      id: record.workflowid,
      name: record.name,
      description: record.description,
      state,
      entity: record.primaryentity || 'unknown',
      entityDisplayName: record['primaryentity@OData.Community.Display.V1.FormattedValue'] || null,
      scope,
      scopeName,
      formId: null, // Cannot get formId without expansion
      formName: record['_formid_value@OData.Community.Display.V1.FormattedValue'] || null,
      definition,
      owner: record['_ownerid_value@OData.Community.Display.V1.FormattedValue'] || 'Unknown',
      modifiedOn: record.modifiedon,
      createdOn: record.createdon,
    };
  }
}
