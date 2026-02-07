import type { IDataverseClient } from '../dataverse/IDataverseClient.js';
import type { PluginStep } from '../types/blueprint.js';

/**
 * Discovers plugins for entities
 */
export class PluginDiscovery {
  constructor(_client: IDataverseClient) {
    // Client will be used when we implement plugin discovery
  }

  /**
   * Get all plugin steps for a specific entity
   * @param _logicalName Entity logical name
   * @returns Array of plugin steps (empty for now - will implement later)
   */
  async getPluginsForEntity(_logicalName: string): Promise<PluginStep[]> {
    // TODO: Implement plugin discovery
    // For now, return empty array
    return [];
  }
}
