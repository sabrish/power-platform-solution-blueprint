import type { IDataverseClient } from '../dataverse/IDataverseClient.js';
import type { EnvironmentVariable, EnvironmentVariableValue } from '../types/environmentVariable.js';

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
  ownerid?: {
    fullname: string;
    ownerid: string;
  };
  modifiedby?: {
    fullname: string;
  };
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
  ownerid?: {
    fullname: string;
    ownerid: string;
  };
  modifiedby?: {
    fullname: string;
  };
}

/**
 * Discovers Environment Variables
 */
export class EnvironmentVariableDiscovery {
  private readonly client: IDataverseClient;

  constructor(client: IDataverseClient) {
    this.client = client;
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
      // Build filter for multiple IDs
      const filterClauses = envVarIds.map((id) => {
        const cleanGuid = id.replace(/[{}]/g, '');
        return `environmentvariabledefinitionid eq ${cleanGuid}`;
      });
      const filter = filterClauses.join(' or ');

      console.log('🌍 Querying Environment Variables:', envVarIds.length);

      // Query environment variable definitions
      const result = await this.client.query<RawEnvironmentVariableDefinition>(
        'environmentvariabledefinitions',
        {
          select: [
            'environmentvariabledefinitionid',
            'schemaname',
            'displayname',
            'description',
            'type',
            'defaultvalue',
            'ismanaged',
            'isrequired',
            'iscustomizable',
            'hint',
            'createdon',
            'modifiedon',
          ],
          filter,
          expand: 'ownerid($select=fullname,ownerid),modifiedby($select=fullname)',
          orderBy: ['schemaname asc'],
        }
      );

      console.log(`🌍 Retrieved ${result.value.length} Environment Variable definitions`);

      // For each definition, fetch its values
      const environmentVariables: EnvironmentVariable[] = [];
      for (const rawDef of result.value) {
        const values = await this.getValuesForDefinition(rawDef.environmentvariabledefinitionid);

        // Find current value (there should typically be only one active value per environment)
        const currentValue = values.length > 0 ? values[0] : null;

        environmentVariables.push(
          this.mapToEnvironmentVariable(rawDef, values, currentValue)
        );
      }

      return environmentVariables;
    } catch (error) {
      throw new Error(
        `Failed to retrieve Environment Variables: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get values for an Environment Variable Definition
   */
  private async getValuesForDefinition(definitionId: string): Promise<EnvironmentVariableValue[]> {
    try {
      const result = await this.client.query<RawEnvironmentVariableValue>(
        'environmentvariablevalues',
        {
          select: [
            'environmentvariablevalueid',
            'schemaname',
            'value',
            '_environmentvariabledefinitionid_value',
            'createdon',
            'modifiedon',
          ],
          filter: `_environmentvariabledefinitionid_value eq ${definitionId.replace(/[{}]/g, '')}`,
          expand: 'ownerid($select=fullname,ownerid),modifiedby($select=fullname)',
          orderBy: ['createdon desc'],
        }
      );

      return result.value.map((raw) => this.mapToEnvironmentVariableValue(raw));
    } catch (error) {
      console.error(`Error fetching values for ${definitionId}:`, error);
      return [];
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
      owner: raw.ownerid?.fullname || 'Unknown',
      ownerId: raw.ownerid?.ownerid || '',
      modifiedBy: raw.modifiedby?.fullname || 'Unknown',
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
      owner: raw.ownerid?.fullname || 'Unknown',
      ownerId: raw.ownerid?.ownerid || '',
      modifiedBy: raw.modifiedby?.fullname || 'Unknown',
      modifiedOn: raw.modifiedon,
      createdOn: raw.createdon,
    };
  }

  /**
   * Get environment variable type
   */
  private getType(type: number): 'String' | 'Number' | 'Boolean' | 'JSON' | 'DataSource' {
    switch (type) {
      case 100000000:
        return 'String';
      case 100000001:
        return 'Number';
      case 100000002:
        return 'Boolean';
      case 100000003:
        return 'JSON';
      case 100000004:
        return 'DataSource';
      default:
        return 'String';
    }
  }

  /**
   * Get environment variable type name
   */
  private getTypeName(type: number): string {
    return this.getType(type);
  }
}
