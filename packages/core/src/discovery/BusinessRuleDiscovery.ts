import type { IDataverseClient } from '../dataverse/IDataverseClient.js';
import type { BusinessRule } from '../types/blueprint.js';

/**
 * Discovers business rules for entities
 */
export class BusinessRuleDiscovery {
  constructor(_client: IDataverseClient) {
    // Client will be used when we implement business rule discovery
  }

  /**
   * Get all business rules for a specific entity
   * @param _logicalName Entity logical name
   * @returns Array of business rules (empty for now - will implement later)
   */
  async getBusinessRulesForEntity(_logicalName: string): Promise<BusinessRule[]> {
    // TODO: Implement business rule discovery
    // For now, return empty array
    return [];
  }
}
