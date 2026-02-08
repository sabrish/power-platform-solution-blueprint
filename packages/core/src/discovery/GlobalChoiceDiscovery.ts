import type { IDataverseClient } from '../dataverse/IDataverseClient.js';
import type { GlobalChoice, GlobalChoiceOption } from '../types/globalChoice.js';
import type { ProgressPhase } from '../types/blueprint.js';

interface RawGlobalOptionSet {
  MetadataId: string;
  Name: string;
  DisplayName?: { UserLocalizedLabel?: { Label: string } };
  Description?: { UserLocalizedLabel?: { Label: string } };
  IsManaged: boolean;
  IsCustomizable?: { Value: boolean };
  OptionSet?: {
    Options?: Array<{
      Value: number;
      Label?: { UserLocalizedLabel?: { Label: string } };
      Description?: { UserLocalizedLabel?: { Label: string } };
      Color?: string;
      ExternalValue?: string;
    }>;
  };
  ModifiedOn?: string;
  ModifiedBy?: string;
}

/**
 * Discovery service for Global Choices (Option Sets)
 */
export class GlobalChoiceDiscovery {
  constructor(
    private client: IDataverseClient,
    private onProgress?: (phase: ProgressPhase, current: number, total: number) => void
  ) {}

  /**
   * Discover all global option sets by their IDs
   */
  async discoverGlobalChoices(globalChoiceIds: string[]): Promise<GlobalChoice[]> {
    if (globalChoiceIds.length === 0) {
      return [];
    }

    this.onProgress?.('discovering', 0, globalChoiceIds.length);

    const globalChoices: GlobalChoice[] = [];

    // Fetch global option sets in batches to avoid URL length limits
    const batchSize = 20;
    for (let i = 0; i < globalChoiceIds.length; i += batchSize) {
      const batch = globalChoiceIds.slice(i, i + batchSize);
      const batchResults = await this.fetchGlobalChoicesBatch(batch);
      globalChoices.push(...batchResults);
      this.onProgress?.('discovering', i + batch.length, globalChoiceIds.length);
    }

    return globalChoices;
  }

  /**
   * Fetch a batch of global option sets
   */
  private async fetchGlobalChoicesBatch(ids: string[]): Promise<GlobalChoice[]> {
    try {
      const globalChoices: GlobalChoice[] = [];

      // Fetch each global option set individually from metadata API
      for (const id of ids) {
        try {
          // Query metadata for this specific global option set
          const filter = `MetadataId eq ${id}`;
          const response = await this.client.queryMetadata<RawGlobalOptionSet>('GlobalOptionSetDefinitions', {
            filter,
          });

          if (response.value && response.value.length > 0) {
            globalChoices.push(this.mapToGlobalChoice(response.value[0]));
          }
        } catch (error) {
          console.warn(`Failed to fetch global choice ${id}:`, error);
          // Continue with other global choices even if one fails
        }
      }

      return globalChoices;
    } catch (error) {
      console.error('Error fetching global choices batch:', error);
      return [];
    }
  }

  /**
   * Map raw Dataverse response to GlobalChoice
   */
  private mapToGlobalChoice(raw: RawGlobalOptionSet): GlobalChoice {
    const options: GlobalChoiceOption[] = [];

    if (raw.OptionSet?.Options) {
      for (const opt of raw.OptionSet.Options) {
        options.push({
          value: opt.Value,
          label: opt.Label?.UserLocalizedLabel?.Label || `Option ${opt.Value}`,
          description: opt.Description?.UserLocalizedLabel?.Label,
          color: opt.Color,
          externalValue: opt.ExternalValue,
        });
      }
    }

    // Sort options by value
    options.sort((a, b) => a.value - b.value);

    return {
      id: raw.MetadataId,
      name: raw.Name,
      displayName: raw.DisplayName?.UserLocalizedLabel?.Label || raw.Name,
      description: raw.Description?.UserLocalizedLabel?.Label,
      isManaged: raw.IsManaged,
      isCustomizable: raw.IsCustomizable?.Value ?? true,
      options,
      totalOptions: options.length,
      owner: 'System', // Global option sets don't have individual owners
      modifiedOn: raw.ModifiedOn || new Date().toISOString(),
      modifiedBy: raw.ModifiedBy || 'Unknown',
    };
  }
}
