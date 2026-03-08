/**
 * Security Role Discovery
 *
 * Discovers security roles and their privileges (entity permissions).
 * Uses an optimised 2-pass approach for large environments:
 *   Pass 1: batch-query roleprivilegescollection (5 roles/request) for all roles at once
 *   Pass 2: batch-query privileges table once for all unique privilege IDs
 * This reduces requests from O(roles × privileges/10) to O(roles/5 + uniquePrivileges/10).
 */
import type { IDataverseClient } from '../dataverse/IDataverseClient.js';
import type { FetchLogger } from '../utils/FetchLogger.js';
import { withAdaptiveBatch } from '../utils/withAdaptiveBatch.js';

export interface SecurityRole {
  roleid: string;
  name: string;
  businessunitid: string;
  businessunitname?: string;
  description: string | null;
  iscustomizable: boolean;
  ismanaged: boolean;
  componentstate: number;
}

export interface RolePrivilege {
  privilegeid: string;
  privilegename: string;
  accessright: number;
  privilegedepthmask: number;
  entitylogicalname?: string;
}

export interface PrivilegeDetail {
  type: 'Create' | 'Read' | 'Write' | 'Delete' | 'Append' | 'AppendTo' | 'Assign' | 'Share';
  depth: 'None' | 'Basic' | 'Local' | 'Deep' | 'Global';
  depthValue: number;
}

export interface EntityPermission {
  entityLogicalName: string;
  privileges: PrivilegeDetail[];
}

export interface SpecialPermissions {
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

export interface SecurityRoleDetail extends SecurityRole {
  entityPermissions: EntityPermission[];
  totalEntities: number;
  hasSystemAdminPrivileges: boolean;
  specialPermissions: SpecialPermissions;
}

export interface EntitySecurityAccess {
  roleName: string;
  roleId: string;
  businessUnit: string;
  isManaged: boolean;
  hasSystemAdminPrivileges: boolean;
  permissions: PrivilegeDetail[];
}

const SPECIAL_PRIVILEGE_NAMES: Record<keyof SpecialPermissions, string> = {
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

interface RawRolePrivRow {
  roleid: string;
  privilegeid: string;
  privilegedepthmask: number;
}

interface RawPrivilege {
  privilegeid: string;
  name: string;
  accessright: number;
}

export class SecurityRoleDiscovery {
  constructor(
    private client: IDataverseClient,
    private onProgress?: (current: number, total: number) => void,
    private logger?: FetchLogger
  ) {}

  /**
   * Batch-fetch security roles by ID using withAdaptiveBatch.
   * Uses `roleid eq <guid>` OData filters — same pattern as FlowDiscovery and ClassicWorkflowDiscovery.
   */
  async getSecurityRoles(roleIds: string[]): Promise<SecurityRole[]> {
    if (roleIds.length === 0) return [];
    const cleanIds = roleIds.map(id => id.replace(/[{}]/g, ''));

    const { results } = await withAdaptiveBatch<string, any>(
      cleanIds,
      async (batch) => {
        const filter = batch.map(id => `roleid eq ${id}`).join(' or ');
        const result = await this.client.query<any>('roles', {
          select: ['roleid', 'name', 'businessunitid', 'description', 'iscustomizable', 'ismanaged', 'componentstate'],
          expand: 'businessunitid($select=name)',
          filter,
        });
        return result.value;
      },
      {
        initialBatchSize: 20,
        step: 'Security Roles',
        entitySet: 'roles',
        logger: this.logger,
        onProgress: (done, total) => this.onProgress?.(Math.floor(done / 2), total),
      }
    );
    return results.map((role: any) => this.mapRole(role));
  }

  private mapRole(role: any): SecurityRole {
    return {
      roleid: role.roleid,
      name: role.name,
      businessunitid: role.businessunitid,
      businessunitname: role.businessunitid?.name || 'Unknown',
      description: role.description,
      iscustomizable: role.iscustomizable?.Value ?? true,
      ismanaged: role.ismanaged ?? false,
      componentstate: role.componentstate ?? 0,
    };
  }

  /**
   * Optimised 2-pass bulk privilege fetch across all roles at once.
   * Use this instead of calling getSecurityRoleDetail() in a loop.
   */
  async getRoleDetailsForRoles(roles: SecurityRole[]): Promise<SecurityRoleDetail[]> {
    if (roles.length === 0) return [];

    // Pass 1 — batch roleprivilegescollection queries (5 roles per batch)
    // Including roleid in the response so we can group by role
    const roleIds = roles.map(r => r.roleid.replace(/[{}]/g, ''));
    const roleIdToName = new Map(roles.map(r => [r.roleid.replace(/[{}]/g, '').toLowerCase(), r.name]));
    const rolePrivRows: RawRolePrivRow[] = [];

    const { results: privRows } = await withAdaptiveBatch<string, RawRolePrivRow>(
      roleIds,
      async (batch) => {
        const filter = batch.map(id => `roleid eq ${id}`).join(' or ');
        const result = await this.client.query<RawRolePrivRow>(
          `roleprivilegescollection`,
          { select: ['roleid', 'privilegeid', 'privilegedepthmask'], filter }
        );
        return result.value;
      },
      {
        initialBatchSize: 5,
        step: 'Security Roles',
        entitySet: 'roleprivilegescollection',
        logger: this.logger,
        onProgress: (done, total) => this.onProgress?.(Math.floor(done / 2), total),
        getBatchLabel: (batch) => batch.map(id => roleIdToName.get(id.toLowerCase()) ?? id).join(', '),
      }
    );
    rolePrivRows.push(...privRows);

    // Group by roleid
    const rolePrivMap = new Map<string, Array<{ privilegeId: string; depthMask: number }>>();
    for (const row of rolePrivRows) {
      const key = row.roleid.toLowerCase();
      if (!rolePrivMap.has(key)) rolePrivMap.set(key, []);
      rolePrivMap.get(key)!.push({ privilegeId: row.privilegeid, depthMask: row.privilegedepthmask ?? 0 });
    }

    // Collect ALL unique privilege IDs across all roles
    const uniquePrivilegeIds = [...new Set(rolePrivRows.map(r => r.privilegeid.replace(/[{}]/g, '')))];

    // Pass 2 — query privileges table ONCE for all unique IDs
    const privilegeNameMap = new Map<string, { name: string; accessright: number }>();

    const { results: privDetails } = await withAdaptiveBatch<string, RawPrivilege>(
      uniquePrivilegeIds,
      async (batch) => {
        const filter = batch.map(id => `privilegeid eq ${id}`).join(' or ');
        const result = await this.client.query<RawPrivilege>('privileges', {
          select: ['privilegeid', 'name', 'accessright'],
          filter,
        });
        return result.value;
      },
      {
        initialBatchSize: 10,
        step: 'Security Roles',
        entitySet: 'privileges',
        logger: this.logger,
        onProgress: (done, total) => this.onProgress?.(
          Math.floor(roles.length / 2) + Math.floor(done / total * (roles.length / 2)),
          roles.length
        ),
      }
    );

    for (const p of privDetails) {
      privilegeNameMap.set(p.privilegeid.toLowerCase(), { name: p.name, accessright: p.accessright });
    }

    // Build role details from the maps
    return roles.map((role, i) => {
      const key = role.roleid.toLowerCase().replace(/[{}]/g, '');
      const assignments = rolePrivMap.get(key) ?? [];
      const privileges: RolePrivilege[] = assignments.map(a => {
        const meta = privilegeNameMap.get(a.privilegeId.toLowerCase().replace(/[{}]/g, ''));
        return {
          privilegeid: a.privilegeId,
          privilegename: meta?.name ?? '',
          accessright: meta?.accessright ?? 0,
          privilegedepthmask: a.depthMask,
        };
      });

      this.onProgress?.(i + 1, roles.length);
      return this.buildRoleDetail(role, privileges);
    });
  }

  /** Single-role fallback — preserved for backwards compat */
  async getSecurityRoleDetail(role: SecurityRole): Promise<SecurityRoleDetail> {
    const details = await this.getRoleDetailsForRoles([role]);
    return details[0];
  }

  private buildRoleDetail(role: SecurityRole, privileges: RolePrivilege[]): SecurityRoleDetail {
    const entityPrivilegesMap = new Map<string, PrivilegeDetail[]>();
    let hasSystemAdminPrivileges = false;
    const specialPermissions = this.parseSpecialPermissions(privileges);

    for (const priv of privileges) {
      const match = priv.privilegename.match(
        /^prv(Create|Read|Write|Delete|AppendTo|Append|Assign|Share)(.+)$/
      );
      if (!match) continue;

      const privilegeType = match[1] as PrivilegeDetail['type'];
      const entityName = match[2].toLowerCase();
      const details = this.parsePrivilegeDetails(priv.accessright, priv.privilegedepthmask, privilegeType);

      for (const detail of details) {
        if (detail.depth === 'Global' &&
          (privilegeType === 'Create' || privilegeType === 'Write' || privilegeType === 'Delete')) {
          hasSystemAdminPrivileges = true;
        }
      }

      const entityPrivs = entityPrivilegesMap.get(entityName) || [];
      entityPrivs.push(...details);
      entityPrivilegesMap.set(entityName, entityPrivs);
    }

    const entityPermissions: EntityPermission[] = [];
    for (const [entityLogicalName, privs] of entityPrivilegesMap.entries()) {
      entityPermissions.push({
        entityLogicalName,
        privileges: this.deduplicatePrivileges(privs),
      });
    }
    entityPermissions.sort((a, b) => a.entityLogicalName.localeCompare(b.entityLogicalName));

    return {
      ...role,
      entityPermissions,
      totalEntities: entityPermissions.length,
      hasSystemAdminPrivileges,
      specialPermissions,
    };
  }

  private parseSpecialPermissions(privileges: RolePrivilege[]): SpecialPermissions {
    const privilegeNames = new Set(privileges.map(p => p.privilegename));
    const special = Object.fromEntries(
      Object.keys(SPECIAL_PRIVILEGE_NAMES).map(k => [k, false])
    ) as unknown as SpecialPermissions;
    for (const [key, privName] of Object.entries(SPECIAL_PRIVILEGE_NAMES)) {
      special[key as keyof SpecialPermissions] = privilegeNames.has(privName);
    }
    return special;
  }

  private parsePrivilegeDetails(
    _accessRight: number,
    depthMask: number,
    privilegeType: PrivilegeDetail['type']
  ): PrivilegeDetail[] {
    let depth: PrivilegeDetail['depth'] = 'None';
    let depthValue = 0;
    if (depthMask & 8) { depth = 'Global'; depthValue = 8; }
    else if (depthMask & 4) { depth = 'Deep'; depthValue = 4; }
    else if (depthMask & 2) { depth = 'Local'; depthValue = 2; }
    else if (depthMask & 1) { depth = 'Basic'; depthValue = 1; }
    return [{ type: privilegeType, depth, depthValue }];
  }

  private deduplicatePrivileges(privileges: PrivilegeDetail[]): PrivilegeDetail[] {
    const map = new Map<string, PrivilegeDetail>();
    for (const priv of privileges) {
      const existing = map.get(priv.type);
      if (!existing || priv.depthValue > existing.depthValue) map.set(priv.type, priv);
    }
    const order = ['Create', 'Read', 'Write', 'Delete', 'Append', 'AppendTo', 'Assign', 'Share'];
    return Array.from(map.values()).sort((a, b) => order.indexOf(a.type) - order.indexOf(b.type));
  }

  static getEntitySecurityAccess(
    entityLogicalName: string,
    allRoles: SecurityRoleDetail[]
  ): EntitySecurityAccess[] {
    return allRoles
      .map(role => {
        const entityPerm = role.entityPermissions.find(
          ep => ep.entityLogicalName.toLowerCase() === entityLogicalName.toLowerCase()
        );
        if (!entityPerm || entityPerm.privileges.length === 0) return null;
        return {
          roleName: role.name,
          roleId: role.roleid,
          businessUnit: role.businessunitname || 'Unknown',
          isManaged: role.ismanaged,
          hasSystemAdminPrivileges: role.hasSystemAdminPrivileges,
          permissions: entityPerm.privileges,
        } as EntitySecurityAccess;
      })
      .filter((x): x is EntitySecurityAccess => x !== null)
      .sort((a, b) => a.roleName.localeCompare(b.roleName));
  }
}
