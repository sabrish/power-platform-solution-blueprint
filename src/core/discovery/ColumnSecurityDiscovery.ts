import type { IDataverseClient } from '../dataverse/IDataverseClient.js';

/**
 * Attribute Masking Rule
 */
export interface AttributeMaskingRule {
  attributemaskingruleid: string;
  name?: string; // Optional - may not exist in all Dataverse versions
  entitylogicalname: string;
  attributelogicalname: string;
  maskingtype: number; // 1 = Full, 2 = Partial, 3 = Email, 4 = Custom
  maskingformat?: string;
  description?: string;
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
   */
  async getAttributeMaskingRules(): Promise<AttributeMaskingRule[]> {
    try {
      const result = await this.client.query<AttributeMaskingRule>('attributemaskingrules', {
        select: [
          'attributemaskingruleid',
          // 'entitylogicalname', // Property not available in attributemaskingrules table
          'attributelogicalname',
          'maskingtype',
          'maskingformat',
          'description',
          'ismanaged',
        ],
        // orderBy removed due to missing entitylogicalname property
      });

      // Set entitylogicalname to empty string for compatibility
      return result.value.map(rule => ({
        ...rule,
        entitylogicalname: '', // Property not available from API
      }));
    } catch (error) {
      console.warn('Failed to query attribute masking rules:', error instanceof Error ? error.message : 'Unknown error');
      return []; // Return empty array if query fails
    }
  }

  /**
   * Get column security profiles (security masking rules)
   */
  async getColumnSecurityProfiles(): Promise<ColumnSecurityProfile[]> {
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

  /**
   * Get masking type display name
   */
  getMaskingTypeDisplayName(maskingType: number): string {
    switch (maskingType) {
      case 1:
        return 'Full';
      case 2:
        return 'Partial';
      case 3:
        return 'Email';
      case 4:
        return 'Custom';
      default:
        return 'Unknown';
    }
  }
}
