import type { IDataverseClient } from '../dataverse/IDataverseClient.js';
import type { EnvironmentVariable, EnvironmentVariableValue } from '../types/environmentVariable.js';
import type { IDiscoverer } from './IDiscoverer.js';
import type { FetchLogger } from '../utils/FetchLogger.js';
import { withAdaptiveBatch } from '../utils/withAdaptiveBatch.js';
import { buildOrFilter } from '../utils/odata.js';
import { normalizeGuid } from '../utils/guid.js';

/**
 * Raw Environment Variable Definition from Dataverse
 */
interface RawEnvironmentVariableDefinition {
  environmentvariabledefinitionid: string;
  schemaname: string;
  displayname: string | null;
  description: string | null;
  type: number;
  defaultvalue: string | null;
  ismanaged: boolean;
  isrequired: boolean;
  iscustomizable: { Value: boolean };
  hint: string | null;
  createdon: string;
  modifiedon: string;
  _ownerid_value?: string;
  '_ownerid_value@OData.Community.Display.V1.FormattedValue'?: string;
  '_modifiedby_value@OData.Community.Display.V1.FormattedValue'?: string;
}

/**
 * Raw Environment Variable Value from Dataverse
 */
interface RawEnvironmentVariableValue {
  environmentvariablevalueid: string;
  schemaname: string;
  value: string;
  _environmentvariabledefinitionid_value: string;
  createdon: string;
  modifiedon: string;
  _ownerid_value?: string;
  '_ownerid_value@OData.Community.Display.V1.FormattedValue'?: string;
  '_modifiedby_value@OData.Community.Display.V1.FormattedValue'?: string;
}

/**
 * Discovers Environment Variables
 */
export class EnvironmentVariableDiscovery implements IDiscoverer<EnvironmentVariable> {
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
   * Get all Environment Variables in the solution
   * @param envVarIds Array of environment variable definition IDs from solution components
   * @returns Array of Environment Variables with their values
   */
  discoverByIds(ids: string[]): Promise<EnvironmentVariable[]> {
    return this.getEnvironmentVariablesByIds(ids);
  }

  async getEnvironmentVariablesByIds(envVarIds: string[]): Promise<EnvironmentVariable[]> {
    if (envVarIds.length === 0) {
      return [];
    }

    try {
      // Pass 1 — fetch all definitions
      const { results: allDefs } = await withAdaptiveBatch<string, RawEnvironmentVariableDefinition>(
        envVarIds,
        async (batch) => {
          const filter = buildOrFilter(batch.map(normalizeGuid), 'environmentvariabledefinitionid', { guids: true });
          const result = await this.client.query<RawEnvironmentVariableDefinition>(
            'environmentvariabledefinitions',
            {
              select: [
                'environmentvariabledefinitionid', 'schemaname', 'displayname', 'description',
                'type', 'defaultvalue', 'ismanaged', 'isrequired', 'iscustomizable',
                'hint', 'createdon', 'modifiedon', '_ownerid_value',
              ],
              filter,
              orderBy: ['schemaname'],
            }
          );
          return result.value;
        },
        {
          initialBatchSize: 20,
          step: 'Environment Variable Discovery',
          entitySet: 'environmentvariabledefinitions',
          logger: this.logger,
          // Use envVarIds.length as the stable total for both passes
          onProgress: (done) => this.onProgress?.(Math.floor(done / 2), envVarIds.length),
        }
      );

      if (allDefs.length === 0) return [];

      // Pass 2 — batch-fetch all values for all definitions, then group in memory
      const defIds = allDefs.map(d => d.environmentvariabledefinitionid);
      const idToName = new Map(allDefs.map(d => [normalizeGuid(d.environmentvariabledefinitionid), d.schemaname]));

      const { results: allValues } = await withAdaptiveBatch<string, RawEnvironmentVariableValue>(
        defIds,
        async (batch) => {
          const filter = buildOrFilter(batch.map(normalizeGuid), '_environmentvariabledefinitionid_value', { guids: true });
          const result = await this.client.query<RawEnvironmentVariableValue>(
            'environmentvariablevalues',
            {
              select: [
                'environmentvariablevalueid', 'schemaname', 'value',
                '_environmentvariabledefinitionid_value', 'createdon', 'modifiedon', '_ownerid_value',
              ],
              filter,
              orderBy: ['createdon desc'],
            }
          );
          return result.value;
        },
        {
          initialBatchSize: 20,
          step: 'Environment Variable Discovery',
          entitySet: 'environmentvariablevalues',
          logger: this.logger,
          // Pass 2 is silent — no onProgress; snap to 100% after completion using stable total
          getBatchLabel: (batch) => batch.map(id => idToName.get(normalizeGuid(id)) ?? id).join(', '),
        }
      );

      // Group values by definition ID (normalized)
      const valuesByDefId = new Map<string, RawEnvironmentVariableValue[]>();
      for (const val of allValues) {
        const defId = normalizeGuid(val._environmentvariabledefinitionid_value);
        if (!valuesByDefId.has(defId)) valuesByDefId.set(defId, []);
        valuesByDefId.get(defId)!.push(val);
      }

      // Snap to 100% after Pass 2 completes, using the stable total from Pass 1
      this.onProgress?.(envVarIds.length, envVarIds.length);

      return allDefs.map(rawDef => {
        const defId = normalizeGuid(rawDef.environmentvariabledefinitionid);
        const rawValues = valuesByDefId.get(defId) ?? [];
        const values = rawValues.map(v => this.mapToEnvironmentVariableValue(v));
        // Sort by createdon desc (already ordered from query but ensure consistency)
        values.sort((a, b) => b.createdOn.localeCompare(a.createdOn));
        const currentValue = values.length > 0 ? values[0] : null;
        return this.mapToEnvironmentVariable(rawDef, values, currentValue);
      });

    } catch (error) {
      throw new Error(
        `Failed to retrieve Environment Variables: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Map raw data to EnvironmentVariable
   */
  private mapToEnvironmentVariable(
    raw: RawEnvironmentVariableDefinition,
    values: EnvironmentVariableValue[],
    currentValue: EnvironmentVariableValue | null
  ): EnvironmentVariable {
    return {
      id: raw.environmentvariabledefinitionid,
      schemaName: raw.schemaname,
      displayName: raw.displayname || raw.schemaname,
      description: raw.description,
      type: this.getType(raw.type),
      typeName: this.getTypeName(raw.type),
      defaultValue: raw.defaultvalue,
      currentValue: currentValue?.value || null,
      currentValueId: currentValue?.id || null,
      isManaged: raw.ismanaged,
      isRequired: raw.isrequired,
      isCustomizable: raw.iscustomizable?.Value ?? true,
      hint: raw.hint,
      values,
      owner: raw['_ownerid_value@OData.Community.Display.V1.FormattedValue'] || 'Unknown',
      ownerId: raw._ownerid_value || '',
      modifiedBy: raw['_modifiedby_value@OData.Community.Display.V1.FormattedValue'] || 'Unknown',
      modifiedOn: raw.modifiedon,
      createdOn: raw.createdon,
    };
  }

  /**
   * Map raw value to EnvironmentVariableValue
   */
  private mapToEnvironmentVariableValue(
    raw: RawEnvironmentVariableValue
  ): EnvironmentVariableValue {
    return {
      id: raw.environmentvariablevalueid,
      definitionId: raw._environmentvariabledefinitionid_value,
      schemaName: raw.schemaname,
      value: raw.value,
      owner: raw['_ownerid_value@OData.Community.Display.V1.FormattedValue'] || 'Unknown',
      ownerId: raw._ownerid_value || '',
      modifiedBy: raw['_modifiedby_value@OData.Community.Display.V1.FormattedValue'] || 'Unknown',
      modifiedOn: raw.modifiedon,
      createdOn: raw.createdon,
    };
  }

  /**
   * Get environment variable type
   */
  private getType(type: number): 'String' | 'Number' | 'Boolean' | 'JSON' | 'DataSource' {
    switch (type) {
      case 100000000: return 'String';
      case 100000001: return 'Number';
      case 100000002: return 'Boolean';
      case 100000003: return 'JSON';
      case 100000004: return 'DataSource';
      default: return 'String';
    }
  }

  /**
   * Get environment variable type name
   */
  private getTypeName(type: number): string {
    return this.getType(type);
  }
}
