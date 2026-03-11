/**
 * Field Security Profile Discovery
 *
 * Discovers field security profiles and their permissions for entities.
 * Field security profiles control which users can read/update/create specific fields.
 */
import type { IDataverseClient } from '../dataverse/IDataverseClient.js';
import type { FetchLogger } from '../utils/FetchLogger.js';
import { withAdaptiveBatch } from '../utils/withAdaptiveBatch.js';

/**
 * Field Security Profile
 */
export interface FieldSecurityProfile {
  fieldsecurityprofileid: string;
  name: string;
  description: string | null;
}

/**
 * Field Permission
 */
export interface FieldPermission {
  fieldpermissionid: string;
  entityname: string;
  attributelogicalname: string;
  canread: number; // 0 = Not Allowed, 1 = Allowed
  cancreate: number;
  canupdate: number;
  fieldsecurityprofileid: string;
  fieldsecurityprofilename?: string;
}

/**
 * Entity Field Security
 */
export interface EntityFieldSecurity {
  entityLogicalName: string;
  securedFields: SecuredField[];
}

/**
 * Secured Field with Profiles
 */
export interface SecuredField {
  attributeLogicalName: string;
  profiles: FieldSecurityProfilePermission[];
}

/**
 * Field Security Profile Permission
 */
export interface FieldSecurityProfilePermission {
  profileId: string;
  profileName: string;
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
}

interface RawFieldPermission {
  fieldpermissionid: string;
  entityname: string;
  attributelogicalname: string;
  canread: number;
  cancreate: number;
  canupdate: number;
  // OData lookup ID field (prefixed with _ and suffixed with _value)
  _fieldsecurityprofileid_value: string;
  // Expanded navigation property — returned under the same key used in $expand
  fieldsecurityprofileid?: { name?: string };
}

export class FieldSecurityProfileDiscovery {
  private readonly client: IDataverseClient;
  private logger?: FetchLogger;

  constructor(client: IDataverseClient, logger?: FetchLogger) {
    this.client = client;
    this.logger = logger;
  }

  /**
   * Get all field security profiles
   */
  async getFieldSecurityProfiles(): Promise<FieldSecurityProfile[]> {
    const result = await this.client.query<FieldSecurityProfile>('fieldsecurityprofiles', {
      select: ['fieldsecurityprofileid', 'name', 'description'],
      orderBy: ['name'],
    });
    return result.value;
  }

  /**
   * Get field permissions for specific entities — batched to avoid HTTP 414
   */
  async getFieldPermissions(entityLogicalNames: string[]): Promise<FieldPermission[]> {
    if (entityLogicalNames.length === 0) return [];

    const { results: allPermissions } = await withAdaptiveBatch<string, RawFieldPermission>(
      entityLogicalNames,
      async (batch) => {
        const entityFilters = batch.map(name => `entityname eq '${name}'`).join(' or ');
        const query = `fieldpermissions?$select=fieldpermissionid,entityname,attributelogicalname,canread,cancreate,canupdate,_fieldsecurityprofileid_value&$expand=fieldsecurityprofileid($select=name)&$filter=${entityFilters}`;
        const result = await this.client.query<RawFieldPermission>(query);
        return result.value;
      },
      {
        initialBatchSize: 20,
        step: 'Field Security Profile Discovery',
        entitySet: 'fieldpermissions',
        logger: this.logger,
      }
    );

    // Flatten the expanded profile name from the $expand navigation property
    return allPermissions.map((fp) => ({
      fieldpermissionid: fp.fieldpermissionid,
      entityname: fp.entityname,
      attributelogicalname: fp.attributelogicalname,
      canread: fp.canread,
      cancreate: fp.cancreate,
      canupdate: fp.canupdate,
      fieldsecurityprofileid: fp._fieldsecurityprofileid_value,
      fieldsecurityprofilename: fp.fieldsecurityprofileid?.name ?? 'Unknown Profile',
    }));
  }

  /**
   * Get field security for a specific entity
   */
  async getEntityFieldSecurity(entityLogicalName: string): Promise<EntityFieldSecurity> {
    const permissions = await this.getFieldPermissions([entityLogicalName]);

    // Group by field
    const fieldMap = new Map<string, FieldSecurityProfilePermission[]>();

    for (const permission of permissions) {
      const profiles = fieldMap.get(permission.attributelogicalname) || [];
      profiles.push({
        profileId: permission.fieldsecurityprofileid,
        profileName: permission.fieldsecurityprofilename ?? 'Unknown Profile',
        canRead: permission.canread === 1,
        canCreate: permission.cancreate === 1,
        canUpdate: permission.canupdate === 1,
      });
      fieldMap.set(permission.attributelogicalname, profiles);
    }

    // Convert to array
    const securedFields: SecuredField[] = [];
    for (const [attributeLogicalName, profiles] of fieldMap.entries()) {
      securedFields.push({
        attributeLogicalName,
        profiles,
      });
    }

    return {
      entityLogicalName,
      securedFields,
    };
  }

  /**
   * Get field security for multiple entities (batch)
   */
  async getEntitiesFieldSecurity(entityLogicalNames: string[]): Promise<Map<string, EntityFieldSecurity>> {
    const permissions = await this.getFieldPermissions(entityLogicalNames);

    // Group by entity
    const entityMap = new Map<string, FieldPermission[]>();
    for (const permission of permissions) {
      const entityPerms = entityMap.get(permission.entityname) || [];
      entityPerms.push(permission);
      entityMap.set(permission.entityname, entityPerms);
    }

    // Build result map
    const result = new Map<string, EntityFieldSecurity>();

    for (const entityName of entityLogicalNames) {
      const entityPerms = entityMap.get(entityName) || [];

      // Group by field
      const fieldMap = new Map<string, FieldSecurityProfilePermission[]>();

      for (const permission of entityPerms) {
        const profiles = fieldMap.get(permission.attributelogicalname) || [];
        profiles.push({
          profileId: permission.fieldsecurityprofileid,
          profileName: permission.fieldsecurityprofilename ?? 'Unknown Profile',
          canRead: permission.canread === 1,
          canCreate: permission.cancreate === 1,
          canUpdate: permission.canupdate === 1,
        });
        fieldMap.set(permission.attributelogicalname, profiles);
      }

      // Convert to array
      const securedFields: SecuredField[] = [];
      for (const [attributeLogicalName, profiles] of fieldMap.entries()) {
        securedFields.push({
          attributeLogicalName,
          profiles,
        });
      }

      result.set(entityName, {
        entityLogicalName: entityName,
        securedFields,
      });
    }

    return result;
  }
}
