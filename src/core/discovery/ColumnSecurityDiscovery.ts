import type { IDataverseClient } from '../dataverse/IDataverseClient.js';

/**
 * Raw API response from attributemaskingrules
 * Schema: https://learn.microsoft.com/en-us/power-apps/developer/data-platform/reference/entities/attributemaskingrule
 */
interface RawAttributeMaskingRule {
  attributemaskingruleid: string;
  entityname: string;           // 'Name of the Entity for attribute'
  attributelogicalname: string; // 'Logical name of the column'
  uniquename: string;           // 'The unique name of the masking rule for attribute'
  ismanaged: boolean;
  _maskingruleid_value?: string;
  '_maskingruleid_value@OData.Community.Display.V1.FormattedValue'?: string; // maskingrule.name
}

/**
 * Attribute Masking Rule (Secured Masking Column)
 * Schema: https://learn.microsoft.com/en-us/power-apps/developer/data-platform/reference/entities/attributemaskingrule
 * Note: maskingtype does not exist on this entity. The masking definition lives on the
 * referenced maskingrule record (name/displayname/regularexpression).
 */
export interface AttributeMaskingRule {
  attributemaskingruleid: string;
  entityname: string;           // Entity the masked column belongs to
  entitylogicalname: string;    // Alias for entityname (kept for consumer compatibility)
  attributelogicalname: string; // Column being masked
  uniquename: string;           // Unique name of this assignment
  maskingRuleName: string;      // Name of the referenced maskingrule record
  ismanaged: boolean;
}

/**
 * Column Level Security Profile (Security Masking Rule)
 */
export interface ColumnSecurityProfile {
  columnsecurityprofileid: string;
  name: string;
  description?: string;
  ismanaged: boolean;
  organizationid: string;
}

/**
 * Column Permission (which columns this profile can access)
 */
export interface ColumnPermission {
  columnpermissionid: string;
  columnsecurityprofileid: string;
  entitylogicalname: string;
  attributelogicalname: string;
  cancreate: boolean;
  canread: boolean;
  canupdate: boolean;
}

/**
 * Discovery class for column-level security components
 */
export class ColumnSecurityDiscovery {
  constructor(
    private client: IDataverseClient
  ) {}

  /**
   * Get all attribute masking rules
   * Fields per official schema: attributemaskingruleid, entityname, attributelogicalname,
   * uniquename, maskingruleid (lookup → maskingrule), ismanaged
   */
  async getAttributeMaskingRules(): Promise<AttributeMaskingRule[]> {
    try {
      const result = await this.client.query<RawAttributeMaskingRule>('attributemaskingrules', {
        select: [
          'attributemaskingruleid',
          'attributelogicalname',
          'entityname',
          'uniquename',
          'ismanaged',
          '_maskingruleid_value', // OData will also return the FormattedValue annotation
        ],
        orderBy: ['entityname', 'attributelogicalname'],
      });

      return result.value.map((raw) => ({
        attributemaskingruleid: raw.attributemaskingruleid,
        entityname: raw.entityname || '',
        entitylogicalname: raw.entityname || '', // alias for consumer compatibility
        attributelogicalname: raw.attributelogicalname,
        uniquename: raw.uniquename || '',
        maskingRuleName:
          raw['_maskingruleid_value@OData.Community.Display.V1.FormattedValue'] ||
          raw._maskingruleid_value ||
          'Unknown',
        ismanaged: raw.ismanaged,
      }));
    } catch {
      return [];
    }
  }

  /**
   * Get column security profiles
   * Note: columnsecurityprofiles table may not exist in all Dataverse environments
   */
  async getColumnSecurityProfiles(): Promise<ColumnSecurityProfile[]> {
    try {
      const result = await this.client.query<ColumnSecurityProfile>('columnsecurityprofiles', {
        select: [
          'columnsecurityprofileid',
          'name',
          'description',
          'ismanaged',
          'organizationid',
        ],
        orderBy: ['name'],
      });

      return result.value;
    } catch {
      return [];
    }
  }

  /**
   * Get column permissions for a specific profile
   */
  async getColumnPermissions(profileId: string): Promise<ColumnPermission[]> {
    const cleanId = profileId.replace(/[{}]/g, '');

    const result = await this.client.query<ColumnPermission>('columnpermissions', {
      select: [
        'columnpermissionid',
        'columnsecurityprofileid',
        'entitylogicalname',
        'attributelogicalname',
        'cancreate',
        'canread',
        'canupdate',
      ],
      filter: `columnsecurityprofileid eq ${cleanId}`,
      orderBy: ['entitylogicalname', 'attributelogicalname'],
    });

    return result.value;
  }
}
