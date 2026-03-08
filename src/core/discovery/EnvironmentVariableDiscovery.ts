import type { IDataverseClient } from '../dataverse/IDataverseClient.js';
import type { EnvironmentVariable, EnvironmentVariableValue } from '../types/environmentVariable.js';
import type { FetchLogger } from '../utils/FetchLogger.js';
import { withAdaptiveBatch } from '../utils/withAdaptiveBatch.js';

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
export class EnvironmentVariableDiscovery {
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
  async getEnvironmentVariablesByIds(envVarIds: string[]): Promise<EnvironmentVariable[]> {
    if (envVarIds.length === 0) {
      return [];
    }

    try {
      // Pass 1 — fetch all definitions
      const { results: allDefs } = await withAdaptiveBatch<string, RawEnvironmentVariableDefinition>(
        envVarIds,
        async (batch) => {
          const filter = batch
            .map(id => `environmentvariabledefinitionid eq ${id.replace(/[{}]/g, '')}`)
            .join(' or ');
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
          onProgress: (done, total) => this.onProgress?.(Math.floor(done / 2), total),
        }
      );

      if (allDefs.length === 0) return [];

      // Pass 2 — batch-fetch all values for all definitions, then group in memory
      const defIds = allDefs.map(d => d.environmentvariabledefinitionid);
      const idToName = new Map(allDefs.map(d => [d.environmentvariabledefinitionid.toLowerCase().replace(/[{}]/g, ''), d.schemaname]));

      const { results: allValues } = await withAdaptiveBatch<string, RawEnvironmentVariableValue>(
        defIds,
        async (batch) => {
          const filter = batch
            .map(id => `_environmentvariabledefinitionid_value eq ${id.replace(/[{}]/g, '')}`)
            .join(' or ');
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
          onProgress: (done, total) => this.onProgress?.(
            Math.floor(allDefs.length / 2) + Math.floor(done / 2),
            total
          ),
          getBatchLabel: (batch) => batch.map(id => idToName.get(id.toLowerCase().replace(/[{}]/g, '')) ?? id).join(', '),
        }
      );

      // Group values by definition ID (normalized)
      const valuesByDefId = new Map<string, RawEnvironmentVariableValue[]>();
      for (const val of allValues) {
        const defId = val._environmentvariabledefinitionid_value.toLowerCase().replace(/[{}]/g, '');
        if (!valuesByDefId.has(defId)) valuesByDefId.set(defId, []);
        valuesByDefId.get(defId)!.push(val);
      }

      this.onProgress?.(allDefs.length, allDefs.length);

      return allDefs.map(rawDef => {
        const defId = rawDef.environmentvariabledefinitionid.toLowerCase().replace(/[{}]/g, '');
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
