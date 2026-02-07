import type { IDataverseClient } from '../dataverse/IDataverseClient.js';
import type { Flow } from '../types/blueprint.js';

/**
 * Discovers flows for entities
 */
export class FlowDiscovery {
  constructor(_client: IDataverseClient) {
    // Client will be used when we implement flow discovery
  }

  /**
   * Get all flows for a specific entity
   * @param _logicalName Entity logical name
   * @returns Array of flows (empty for now - will implement later)
   */
  async getFlowsForEntity(_logicalName: string): Promise<Flow[]> {
    // TODO: Implement flow discovery
    // For now, return empty array
    return [];
  }
}
