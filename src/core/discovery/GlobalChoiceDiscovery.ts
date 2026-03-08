import type { IDataverseClient } from '../dataverse/IDataverseClient.js';
import type { GlobalChoice, GlobalChoiceOption } from '../types/globalChoice.js';
import type { ProgressPhase } from '../types/blueprint.js';
import type { FetchLogger } from '../utils/FetchLogger.js';
import { withAdaptiveBatch } from '../utils/withAdaptiveBatch.js';

interface RawGlobalOptionSet {
  MetadataId: string;
  Name: string;
  DisplayName?: { UserLocalizedLabel?: { Label: string } };
  Description?: { UserLocalizedLabel?: { Label: string } };
  IsManaged: boolean;
  IsCustomizable?: { Value: boolean };
  // Options can be directly on the object OR nested under OptionSet
  Options?: Array<{
    Value: number;
    Label?: { UserLocalizedLabel?: { Label: string } };
    Description?: { UserLocalizedLabel?: { Label: string } };
    Color?: string;
    ExternalValue?: string;
  }>;
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
  private logger?: FetchLogger;

  constructor(
    private client: IDataverseClient,
    private onProgress?: (phase: ProgressPhase, current: number, total: number) => void,
    logger?: FetchLogger
  ) {
    this.logger = logger;
  }

  /**
   * Discover all global option sets by their IDs.
   * The Dataverse GlobalOptionSetDefinitions metadata API does not support batch $filter —
   * each ID must be fetched individually via a direct path query.
   * withAdaptiveBatch with initialBatchSize=1 provides logging and retry for each item.
   */
  async discoverGlobalChoices(globalChoiceIds: string[]): Promise<GlobalChoice[]> {
    if (globalChoiceIds.length === 0) {
      return [];
    }

    this.onProgress?.('discovering', 0, globalChoiceIds.length);

    const { results: globalChoices } = await withAdaptiveBatch<string, GlobalChoice>(
      globalChoiceIds,
      async (batch) => {
        // Metadata API does not support batch $filter on GlobalOptionSetDefinitions —
        // each must be fetched individually. batch size is kept at 1 (see initialBatchSize below).
        const id = batch[0];
        const cleanId = id.replace(/[{}]/g, '');
        const response = await this.client.queryMetadata<RawGlobalOptionSet>(
          `GlobalOptionSetDefinitions(${cleanId})`,
          {}
        );

        if (response.value && Array.isArray(response.value) && response.value.length > 0) {
          return [this.mapToGlobalChoice(response.value[0])];
        } else if (response.value && !Array.isArray(response.value)) {
          // Handle case where API returns single object instead of array
          return [this.mapToGlobalChoice(response.value as unknown as RawGlobalOptionSet)];
        }
        return [];
      },
      {
        // The metadata API requires individual calls — fix batch size at 1
        initialBatchSize: 1,
        step: 'Global Choice Discovery',
        entitySet: 'GlobalOptionSetDefinitions',
        logger: this.logger,
        onProgress: (done, total) => this.onProgress?.('discovering', done, total),
      }
    );

    return globalChoices;
  }

  /**
   * Map raw Dataverse response to GlobalChoice
   */
  private mapToGlobalChoice(raw: RawGlobalOptionSet): GlobalChoice {
    const options: GlobalChoiceOption[] = [];

    // Options can be in two places: raw.Options OR raw.OptionSet.Options
    const optionsArray = raw.Options || raw.OptionSet?.Options;

    if (optionsArray) {
      for (const opt of optionsArray) {
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
