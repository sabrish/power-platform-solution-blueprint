/**
 * Security Role Discovery
 *
 * Discovers security roles and their privileges (entity permissions).
 * Security roles control what users can do with entities (Create, Read, Write, Delete, etc.)
 */
import type { IDataverseClient } from '../dataverse/IDataverseClient.js';

/**
 * Security Role
 */
export interface SecurityRole {
  roleid: string;
  name: string;
  businessunitid: string;
  businessunitname?: string;
  description: string | null;
  iscustomizable: boolean;
  ismanaged: boolean;
  componentstate: number; // 0 = Published, 1 = Unpublished, 2 = Deleted, 3 = Deleted Unpublished
}

/**
 * Role Privilege (entity permission)
 */
export interface RolePrivilege {
  privilegeid: string;
  privilegename: string;
  accessright: number; // Bitmask of privileges
  privilegedepthmask: number; // Depth: 0=None, 1=Basic(User), 2=Local(BU), 4=Deep(Parent+Child BU), 8=Global(Org)
  entitylogicalname?: string;
}

/**
 * Privilege Type with depth
 */
export interface PrivilegeDetail {
  type: 'Create' | 'Read' | 'Write' | 'Delete' | 'Append' | 'AppendTo' | 'Assign' | 'Share';
  depth: 'None' | 'Basic' | 'Local' | 'Deep' | 'Global';
  depthValue: number;
}

/**
 * Entity Permission for a Security Role
 */
export interface EntityPermission {
  entityLogicalName: string;
  privileges: PrivilegeDetail[];
}

/**
 * Special/Miscellaneous Permissions (non-entity specific)
 */
export interface SpecialPermissions {
  // Core permissions shown in UI
  documentGeneration: boolean;
  dynamics365ForMobile: boolean;
  exportToExcel: boolean;
  goOfflineInOutlook: boolean;
  mailMerge: boolean;
  print: boolean;
  syncToOutlook: boolean;
  useDynamics365AppForOutlook: boolean;
  activateRealtimeProcesses: boolean;
  executeWorkflowJob: boolean;
  runFlows: boolean;

  // Additional permissions (not shown in default matrix)
  bulkDelete: boolean;
  bulkEdit: boolean;
  writeRollupFields: boolean;
  overrideCreatedOnModifiedOn: boolean;
  activateBusinessRules: boolean;
  publishCustomizations: boolean;
  publishReports: boolean;
  useInternetMarketing: boolean;
  actOnBehalfOfAnotherUser: boolean;
  approveKnowledgeArticles: boolean;
  configureYammer: boolean;
  delegateAccess: boolean;
  mergeRecords: boolean;
  turnOnTracing: boolean;
  viewAuditHistory: boolean;
  viewAuditSummary: boolean;
}

/**
 * Security Role with detailed permissions
 */
export interface SecurityRoleDetail extends SecurityRole {
  entityPermissions: EntityPermission[];
  totalEntities: number;
  hasSystemAdminPrivileges: boolean;
  specialPermissions: SpecialPermissions;
}

/**
 * Security role access to a specific entity (reverse lookup)
 * Used to show which roles grant access to an entity
 */
export interface EntitySecurityAccess {
  roleName: string;
  roleId: string;
  businessUnit: string;
  isManaged: boolean;
  hasSystemAdminPrivileges: boolean;
  permissions: PrivilegeDetail[];
}

/**
 * Privilege type bitmask values
 */
const PRIVILEGE_TYPES = {
  None: 0,
  Create: 1,
  Read: 2,
  Write: 4,
  Delete: 8,
  Append: 16,
  AppendTo: 32,
  Assign: 64,
  Share: 128,
};

/**
 * Special privilege names (miscellaneous/non-entity permissions)
 */
const SPECIAL_PRIVILEGE_NAMES: Record<keyof SpecialPermissions, string> = {
  // Core permissions (displayed in matrix)
  documentGeneration: 'prvDocumentGeneration',
  dynamics365ForMobile: 'prvMobileOfflineSync',
  exportToExcel: 'prvExportToExcel',
  goOfflineInOutlook: 'prvGoOffline',
  mailMerge: 'prvMailMerge',
  print: 'prvPrint',
  syncToOutlook: 'prvSyncToOutlook',
  useDynamics365AppForOutlook: 'prvUseTabletApp',
  activateRealtimeProcesses: 'prvActivateBusinessProcessFlow',
  executeWorkflowJob: 'prvWorkflowExecution',
  runFlows: 'prvRunFlows',

  // Additional permissions
  bulkDelete: 'prvBulkDelete',
  bulkEdit: 'prvBulkEdit',
  writeRollupFields: 'prvWriteRollupField',
  overrideCreatedOnModifiedOn: 'prvOverrideCreatedOnCreatedBy',
  activateBusinessRules: 'prvActivateBusinessRule',
  publishCustomizations: 'prvPublishCustomization',
  publishReports: 'prvPublishReport',
  useInternetMarketing: 'prvUseInternetMarketing',
  actOnBehalfOfAnotherUser: 'prvActOnBehalfOfAnotherUser',
  approveKnowledgeArticles: 'prvApproveKnowledgeArticle',
  configureYammer: 'prvConfigureYammer',
  delegateAccess: 'prvDelegateAccess',
  mergeRecords: 'prvMerge',
  turnOnTracing: 'prvTurnOnTracing',
  viewAuditHistory: 'prvReadAuditHistory',
  viewAuditSummary: 'prvReadAuditSummary',
};

export class SecurityRoleDiscovery {
  constructor(
    private client: IDataverseClient,
    private onProgress?: (current: number, total: number) => void
  ) {}

  /**
   * Get all security roles
   */
  async getSecurityRoles(): Promise<SecurityRole[]> {
    const query = `roles?$select=roleid,name,businessunitid,description,iscustomizable,ismanaged,componentstate&$expand=businessunitid($select=name)&$orderby=name`;
    const result = await this.client.query<any>(query);

    return result.value.map((role: any) => ({
      roleid: role.roleid,
      name: role.name,
      businessunitid: role.businessunitid,
      businessunitname: role.businessunitid?.name || 'Unknown',
      description: role.description,
      iscustomizable: role.iscustomizable?.Value ?? true,
      ismanaged: role.ismanaged ?? false,
      componentstate: role.componentstate ?? 0,
    }));
  }

  /**
   * Get privileges for a specific security role
   */
  async getRolePrivileges(roleId: string): Promise<RolePrivilege[]> {
    // Clean GUID
    const cleanId = roleId.replace(/[{}]/g, '');

    // Step 1: Query roleprivilegescollection to get privilegeid and privilegedepthmask
    const rolePrivsQuery = `roleprivilegescollection?$filter=roleid eq ${cleanId}&$select=privilegeid,privilegedepthmask`;
    const rolePrivsResult = await this.client.query<any>(rolePrivsQuery);

    if (!rolePrivsResult.value || rolePrivsResult.value.length === 0) {
      return [];
    }

    // Step 2: Query privileges entity in batches to avoid HTTP 400/414 (Request/URL too long) errors
    // Security roles can have hundreds of privileges, which would exceed URL limits
    const privilegeIds = rolePrivsResult.value.map((rp: any) => rp.privilegeid);
    const batchSize = 10; // Very conservative to avoid header/URL length issues
    const allPrivileges: any[] = [];

    for (let i = 0; i < privilegeIds.length; i += batchSize) {
      const batch = privilegeIds.slice(i, i + batchSize);
      // Clean GUIDs: remove braces if present
      const privilegeFilter = batch.map(id => {
        const cleanId = String(id).replace(/[{}]/g, '');
        return `privilegeid eq ${cleanId}`;
      }).join(' or ');
      const privilegesQuery = `privileges?$filter=${privilegeFilter}&$select=privilegeid,name,accessright`;
      const privilegesResult = await this.client.query<any>(privilegesQuery);
      allPrivileges.push(...privilegesResult.value);
    }

    // Create a map of privilegeid -> privilege details for fast lookup
    const privilegeMap = new Map<string, any>();
    for (const priv of allPrivileges) {
      privilegeMap.set(priv.privilegeid.toLowerCase(), priv);
    }

    // Combine the data
    return rolePrivsResult.value.map((rp: any) => {
      const privId = rp.privilegeid.toLowerCase();
      const privilege = privilegeMap.get(privId);

      return {
        privilegeid: rp.privilegeid,
        privilegename: privilege?.name || '',
        accessright: privilege?.accessright ?? 0,
        privilegedepthmask: rp.privilegedepthmask ?? 0,
      };
    });
  }

  /**
   * Get detailed permissions for a security role
   */
  async getSecurityRoleDetail(role: SecurityRole): Promise<SecurityRoleDetail> {
    const privileges = await this.getRolePrivileges(role.roleid);

    // Group privileges by entity
    const entityPrivilegesMap = new Map<string, PrivilegeDetail[]>();
    let hasSystemAdminPrivileges = false;

    // Track special permissions
    const specialPermissions = this.parseSpecialPermissions(privileges);

    for (const priv of privileges) {
      // Extract entity name from privilege name (format: prvCreateAccount, prvReadContact, etc.)
      const match = priv.privilegename.match(/^prv(Create|Read|Write|Delete|Append|AppendTo|Assign|Share)(.+)$/);

      if (match) {
        const privilegeType = match[1] as PrivilegeDetail['type'];
        const entityName = match[2].toLowerCase();

        // Parse privilege details
        const details = this.parsePrivilegeDetails(priv.accessright, priv.privilegedepthmask, privilegeType);

        // Check for org-level admin privileges
        for (const detail of details) {
          if (detail.depth === 'Global' && (privilegeType === 'Create' || privilegeType === 'Write' || privilegeType === 'Delete')) {
            hasSystemAdminPrivileges = true;
            break;
          }
        }

        // Add to entity map
        const entityPrivs = entityPrivilegesMap.get(entityName) || [];
        entityPrivs.push(...details);
        entityPrivilegesMap.set(entityName, entityPrivs);
      }
    }

    // Convert map to array
    const entityPermissions: EntityPermission[] = [];
    for (const [entityLogicalName, privileges] of entityPrivilegesMap.entries()) {
      // Remove duplicates and sort
      const uniquePrivileges = this.deduplicatePrivileges(privileges);
      entityPermissions.push({
        entityLogicalName,
        privileges: uniquePrivileges,
      });
    }

    // Sort by entity name
    entityPermissions.sort((a, b) => a.entityLogicalName.localeCompare(b.entityLogicalName));

    return {
      ...role,
      entityPermissions,
      totalEntities: entityPermissions.length,
      hasSystemAdminPrivileges,
      specialPermissions,
    };
  }

  /**
   * Parse special/miscellaneous permissions from privileges
   */
  private parseSpecialPermissions(privileges: RolePrivilege[]): SpecialPermissions {
    const privilegeNames = new Set(privileges.map(p => p.privilegename));

    const special: SpecialPermissions = {
      // Core permissions
      documentGeneration: false,
      dynamics365ForMobile: false,
      exportToExcel: false,
      goOfflineInOutlook: false,
      mailMerge: false,
      print: false,
      syncToOutlook: false,
      useDynamics365AppForOutlook: false,
      activateRealtimeProcesses: false,
      executeWorkflowJob: false,
      runFlows: false,

      // Additional permissions
      bulkDelete: false,
      bulkEdit: false,
      writeRollupFields: false,
      overrideCreatedOnModifiedOn: false,
      activateBusinessRules: false,
      publishCustomizations: false,
      publishReports: false,
      useInternetMarketing: false,
      actOnBehalfOfAnotherUser: false,
      approveKnowledgeArticles: false,
      configureYammer: false,
      delegateAccess: false,
      mergeRecords: false,
      turnOnTracing: false,
      viewAuditHistory: false,
      viewAuditSummary: false,
    };

    // Check each special privilege
    for (const [key, privName] of Object.entries(SPECIAL_PRIVILEGE_NAMES)) {
      special[key as keyof SpecialPermissions] = privilegeNames.has(privName);
    }

    return special;
  }

  /**
   * Get detailed permissions for all security roles
   */
  async getAllSecurityRoleDetails(): Promise<SecurityRoleDetail[]> {
    const roles = await this.getSecurityRoles();
    const details: SecurityRoleDetail[] = [];

    for (let i = 0; i < roles.length; i++) {
      if (this.onProgress) {
        this.onProgress(i + 1, roles.length);
      }

      const detail = await this.getSecurityRoleDetail(roles[i]);
      details.push(detail);
    }

    return details;
  }

  /**
   * Parse privilege details from bitmask
   */
  private parsePrivilegeDetails(
    accessRight: number,
    depthMask: number,
    privilegeType: PrivilegeDetail['type']
  ): PrivilegeDetail[] {
    const details: PrivilegeDetail[] = [];

    // Get the privilege type value
    const typeValue = PRIVILEGE_TYPES[privilegeType];
    if (!typeValue) return details;

    // Check if this privilege type is enabled
    if (accessRight & typeValue) {
      // Determine depth
      let depth: PrivilegeDetail['depth'] = 'None';
      let depthValue = 0;

      if (depthMask & 8) {
        depth = 'Global';
        depthValue = 8;
      } else if (depthMask & 4) {
        depth = 'Deep';
        depthValue = 4;
      } else if (depthMask & 2) {
        depth = 'Local';
        depthValue = 2;
      } else if (depthMask & 1) {
        depth = 'Basic';
        depthValue = 1;
      }

      details.push({
        type: privilegeType,
        depth,
        depthValue,
      });
    }

    return details;
  }

  /**
   * Deduplicate privileges (keep highest depth for each type)
   */
  private deduplicatePrivileges(privileges: PrivilegeDetail[]): PrivilegeDetail[] {
    const map = new Map<string, PrivilegeDetail>();

    for (const priv of privileges) {
      const existing = map.get(priv.type);
      if (!existing || priv.depthValue > existing.depthValue) {
        map.set(priv.type, priv);
      }
    }

    return Array.from(map.values()).sort((a, b) => {
      // Sort order: Create, Read, Write, Delete, Append, AppendTo, Assign, Share
      const order = ['Create', 'Read', 'Write', 'Delete', 'Append', 'AppendTo', 'Assign', 'Share'];
      return order.indexOf(a.type) - order.indexOf(b.type);
    });
  }

  /**
   * Get which security roles provide access to a specific entity
   * @param entityLogicalName Logical name of the entity
   * @param allRoles All security role details
   * @returns Array of roles that grant access to this entity
   */
  static getEntitySecurityAccess(
    entityLogicalName: string,
    allRoles: SecurityRoleDetail[]
  ): EntitySecurityAccess[] {
    const access: EntitySecurityAccess[] = [];

    for (const role of allRoles) {
      // Find permissions for this entity
      const entityPerm = role.entityPermissions.find(
        ep => ep.entityLogicalName.toLowerCase() === entityLogicalName.toLowerCase()
      );

      if (entityPerm && entityPerm.privileges.length > 0) {
        access.push({
          roleName: role.name,
          roleId: role.roleid,
          businessUnit: role.businessunitname || 'Unknown',
          isManaged: role.ismanaged,
          hasSystemAdminPrivileges: role.hasSystemAdminPrivileges,
          permissions: entityPerm.privileges,
        });
      }
    }

    // Sort by role name
    return access.sort((a, b) => a.roleName.localeCompare(b.roleName));
  }
}
