import type { IDataverseClient } from '../dataverse/IDataverseClient.js';
import type { BusinessRule } from '../types/blueprint.js';
import { BusinessRuleParser } from '../parsers/BusinessRuleParser.js';

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
export class BusinessRuleDiscovery {
  private readonly client: IDataverseClient;

  constructor(client: IDataverseClient) {
    this.client = client;
  }

  /**
   * Get business rules by workflow IDs
   */
  async getBusinessRulesByIds(brIds: string[]): Promise<BusinessRule[]> {
    if (brIds.length === 0) {
      return [];
    }

    console.log(`📋 Fetching ${brIds.length} business rule(s)...`);

    try {
      const batchSize = 20;
      const allResults: BusinessRuleRecord[] = [];

      console.log(`📋 Querying ${brIds.length} Business Rules in batches of ${batchSize}...`);

      for (let i = 0; i < brIds.length; i += batchSize) {
        const batch = brIds.slice(i, i + batchSize);
        const filterClauses = batch.map((id) => `workflowid eq ${id}`);
        const filter = `(${filterClauses.join(' or ')}) and category eq 2`;

        console.log(`📋 Batch ${Math.floor(i / batchSize) + 1}: Querying ${batch.length} Business Rules...`);

        const response = await this.client.query<BusinessRuleRecord>('workflows', {
          select: [
            'workflowid',
            'name',
            'description',
            'statecode',
            'primaryentity',
            'scope',
            'xaml',
            'clientdata',
            'modifiedon',
            'createdon',
          ],
          filter,
          orderBy: ['primaryentity', 'name'],
        });

        allResults.push(...response.value);
      }

      console.log(`📋 Total Business Rules retrieved: ${allResults.length}`);

      // Map to BusinessRule objects
      const businessRules = allResults.map((record) => this.mapRecordToBusinessRule(record));

      return businessRules;
    } catch (error) {
      console.error('📋 ERROR fetching business rules:', error);
      throw error;
    }
  }

  /**
   * Get all business rules for a specific entity
   */
  async getBusinessRulesForEntity(logicalName: string): Promise<BusinessRule[]> {
    try {
      const response = await this.client.query<BusinessRuleRecord>('workflows', {
        select: [
          'workflowid',
          'name',
          'description',
          'statecode',
          'primaryentity',
          'scope',
          'xaml',
          'clientdata',
          'modifiedon',
          'createdon',
        ],
        filter: `category eq 2 and primaryentity eq '${logicalName}'`,
        orderBy: ['name'],
      });

      const records = response.value;

      return records.map((record) => this.mapRecordToBusinessRule(record));
    } catch (error) {
      console.error(`📋 ERROR fetching business rules for entity ${logicalName}:`, error);
      return [];
    }
  }

  /**
   * Map workflow record to BusinessRule object
   */
  private mapRecordToBusinessRule(record: BusinessRuleRecord): BusinessRule {
    // Parse business rule definition from XAML
    const definition = BusinessRuleParser.parse(record.xaml || '');

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
