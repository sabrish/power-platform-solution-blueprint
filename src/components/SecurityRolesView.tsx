import { useMemo, memo, useState, type ReactElement } from 'react';
import {
  Title3,
  Text,
  makeStyles,
  tokens,
  Badge,
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
} from '@fluentui/react-components';
import { ChevronDown20Regular, ChevronRight20Regular } from '@fluentui/react-icons';
import { FilterBar } from './FilterBar';
import type { SecurityRoleDetail } from '../core';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  description: {
    color: tokens.colorNeutralForeground3,
    display: 'block',
  },
  // Card-row list (PATTERN-001)
  roleRow: {
    display: 'grid',
    gridTemplateColumns: '24px minmax(200px, 2fr) auto auto auto',
    gap: tokens.spacingHorizontalM,
    alignItems: 'start',
    padding: tokens.spacingVerticalM,
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
      boxShadow: tokens.shadow4,
    },
  },
  roleRowExpanded: {
    backgroundColor: tokens.colorBrandBackground2,
  },
  chevron: {
    display: 'flex',
    alignItems: 'center',
    color: tokens.colorNeutralForeground3,
  },
  nameColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    minWidth: 0,
    wordBreak: 'break-word',
  },
  codeText: {
    fontFamily: 'Consolas, Monaco, monospace',
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  badgeGroup: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  expandedDetails: {
    backgroundColor: tokens.colorNeutralBackground2,
    padding: tokens.spacingVerticalL,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderTop: 'none',
    borderRadius: `0 0 ${tokens.borderRadiusMedium} ${tokens.borderRadiusMedium}`,
    marginTop: '-4px',
  },
  emptyState: {
    padding: tokens.spacingVerticalXXXL,
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: tokens.spacingVerticalL,
    color: tokens.colorNeutralForeground3,
  },
  legend: {
    padding: tokens.spacingVerticalS,
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  entityPermissionsTable: {
    marginTop: tokens.spacingVerticalM,
  },
});

interface SecurityRolesViewProps {
  securityRoles: SecurityRoleDetail[];
}

function SecurityRolesViewComponent({ securityRoles }: SecurityRolesViewProps) {
  const styles = useStyles();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRoleId, setExpandedRoleId] = useState<string | null>(null);

  const filteredRoles = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return securityRoles;
    return securityRoles.filter((r) =>
      r.name.toLowerCase().includes(q) ||
      (r.businessunitname && r.businessunitname.toLowerCase().includes(q))
    );
  }, [securityRoles, searchQuery]);

  // Special permissions columns for the matrix
  const specialPermissions = [
    { key: 'documentGeneration', label: 'Document Generation' },
    { key: 'dynamics365ForMobile', label: 'Dynamics 365 for mobile' },
    { key: 'exportToExcel', label: 'Export to Excel' },
    { key: 'goOfflineInOutlook', label: 'Go Offline in Outlook' },
    { key: 'mailMerge', label: 'Mail Merge' },
    { key: 'print', label: 'Print' },
    { key: 'syncToOutlook', label: 'Sync to Outlook' },
    { key: 'useDynamics365AppForOutlook', label: 'Use Dynamics 365 App for Outlook' },
    { key: 'activateRealtimeProcesses', label: 'Activate Real-time Processes' },
    { key: 'executeWorkflowJob', label: 'Execute Workflow Job' },
    { key: 'runFlows', label: 'Run Flows' },
  ] as const;

  const privilegeTypes = ['Create', 'Read', 'Write', 'Delete', 'Append', 'AppendTo', 'Assign', 'Share'] as const;

  const privilegeTypeLabel = (type: string): string => type === 'AppendTo' ? 'Append To' : type;

  const depthLabelMap: Record<number, string> = {
    0: 'None',
    1: 'User',
    2: 'BU',
    4: 'P:CBU',
    8: 'Org',
  };

  const getDepthBadgeColor = (depth: number): 'danger' | 'warning' | 'informative' | 'success' | 'subtle' => {
    switch (depth) {
      case 0: return 'danger';
      case 1: return 'warning';
      case 2: return 'informative';
      case 4: return 'success';
      case 8: return 'success';
      default: return 'subtle';
    }
  };

  const getDepthBadgeAppearance = (_depth: number): 'tint' => 'tint';

  const toggleExpand = (roleId: string): void => {
    setExpandedRoleId(expandedRoleId === roleId ? null : roleId);
  };

  const renderEntityPermissionsTable = (role: SecurityRoleDetail): ReactElement => (
    <div className={styles.entityPermissionsTable}>
      <Text weight="semibold" style={{ marginBottom: tokens.spacingVerticalS, display: 'block' }}>
        Entity-Level Permissions ({role.entityPermissions.filter(ep => ep.privileges.length > 0).length} entities)
      </Text>
      <div className={styles.legend}>
        <strong>Access levels:</strong> None · User = own records only · BU = Business Unit · P:CBU = Parent &amp; Child BUs · Org = Organisation-wide
      </div>
      <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: '400px', marginTop: tokens.spacingVerticalM }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th
                style={{
                  padding: tokens.spacingVerticalS,
                  textAlign: 'left',
                  borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
                  backgroundColor: tokens.colorNeutralBackground2,
                  color: tokens.colorNeutralForeground1,
                  position: 'sticky',
                  top: 0,
                  left: 0,
                  zIndex: 3,
                  minWidth: '200px',
                }}
              >
                Entity
              </th>
              {privilegeTypes.map((type) => (
                <th
                  key={type}
                  style={{
                    padding: tokens.spacingVerticalS,
                    textAlign: 'center',
                    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
                    minWidth: '80px',
                    backgroundColor: tokens.colorNeutralBackground2,
                    color: tokens.colorNeutralForeground1,
                    position: 'sticky',
                    top: 0,
                    zIndex: 1,
                  }}
                >
                  {privilegeTypeLabel(type)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {role.entityPermissions
              .filter((entityPerm) => entityPerm.privileges.length > 0)
              .map((entityPerm) => {
                const privMap = new Map(entityPerm.privileges.map(p => [p.type, p]));
                return (
                  <tr key={entityPerm.entityLogicalName} style={{ borderBottom: `1px solid ${tokens.colorNeutralStroke2}` }}>
                    <td style={{ padding: tokens.spacingVerticalS, position: 'sticky', left: 0, zIndex: 1, backgroundColor: tokens.colorNeutralBackground1 }}>
                      <Text weight="semibold">{entityPerm.entityLogicalName}</Text>
                    </td>
                    {privilegeTypes.map((type) => {
                      const priv = privMap.get(type);
                      if (!priv) {
                        return (
                          <td
                            key={type}
                            style={{ padding: tokens.spacingVerticalS, textAlign: 'center', backgroundColor: tokens.colorNeutralBackground1 }}
                          >
                            <Text size={200}>—</Text>
                          </td>
                        );
                      }
                      const depth = priv.depthValue ?? 0;
                      const label = depthLabelMap[depth] ?? `Unknown (${depth})`;
                      return (
                        <td
                          key={type}
                          style={{ padding: tokens.spacingVerticalS, textAlign: 'center', backgroundColor: tokens.colorNeutralBackground1 }}
                        >
                          <Badge
                            appearance={getDepthBadgeAppearance(depth)}
                            color={getDepthBadgeColor(depth)}
                            shape="rounded"
                            size="small"
                          >
                            {label}
                          </Badge>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );

  if (securityRoles.length === 0) {
    return (
      <div className={styles.emptyState}>
        <Text size={500} weight="semibold">No Security Roles Found</Text>
        <Text>No security roles were found in the selected solution(s).</Text>
      </div>
    );
  }

  const rolesWithSpecialPerms = useMemo(
    () => securityRoles.filter(role =>
      specialPermissions.some(perm => role.specialPermissions?.[perm.key])
    ),
    [securityRoles]
  );

  return (
    <div className={styles.container}>
      <FilterBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search security roles..."
        filteredCount={filteredRoles.length}
        totalCount={securityRoles.length}
        itemLabel="roles"
      />

      {/* Special Permissions Matrix — collapsed by default, only roles with ≥1 permission */}
      <Accordion collapsible>
        <AccordionItem value="special-perms">
          <AccordionHeader>
            <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalXXS }}>
              <Text size={500} weight="semibold">Special Permissions Matrix</Text>
              <Text style={{ fontSize: tokens.fontSizeBase200, color: tokens.colorNeutralForeground3 }}>
                {rolesWithSpecialPerms.length} {rolesWithSpecialPerms.length === 1 ? 'role has' : 'roles have'} special permissions — click to expand
              </Text>
            </div>
          </AccordionHeader>
          <AccordionPanel>
            {rolesWithSpecialPerms.length === 0 ? (
              <Text style={{ color: tokens.colorNeutralForeground3 }}>
                No roles have special/miscellaneous permissions set.
              </Text>
            ) : (
              <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: '500px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th
                        style={{
                          padding: tokens.spacingVerticalS,
                          textAlign: 'left',
                          borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
                          minWidth: '200px',
                          position: 'sticky',
                          top: 0,
                          left: 0,
                          backgroundColor: tokens.colorNeutralBackground2,
                          color: tokens.colorNeutralForeground1,
                          zIndex: 3,
                        }}
                      >
                        Security Role
                      </th>
                      {specialPermissions.map((perm) => (
                        <th
                          key={perm.key}
                          style={{
                            padding: tokens.spacingVerticalS,
                            textAlign: 'center',
                            borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
                            minWidth: '120px',
                            fontSize: tokens.fontSizeBase100,
                            backgroundColor: tokens.colorNeutralBackground2,
                            color: tokens.colorNeutralForeground1,
                            position: 'sticky',
                            top: 0,
                            zIndex: 1,
                          }}
                        >
                          {perm.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rolesWithSpecialPerms.map((role) => (
                      <tr key={role.roleid} style={{ borderBottom: `1px solid ${tokens.colorNeutralStroke2}` }}>
                        <td
                          style={{
                            padding: tokens.spacingVerticalS,
                            position: 'sticky',
                            left: 0,
                            zIndex: 1,
                            backgroundColor: tokens.colorNeutralBackground1,
                          }}
                        >
                          <div style={{ fontWeight: tokens.fontWeightSemibold }}>{role.name}</div>
                          <div style={{ fontSize: tokens.fontSizeBase100, color: tokens.colorNeutralForeground3 }}>
                            {role.businessunitname}
                          </div>
                        </td>
                        {specialPermissions.map((perm) => {
                          const granted = role.specialPermissions?.[perm.key] === true;
                          return (
                            <td
                              key={perm.key}
                              style={{ padding: tokens.spacingVerticalS, textAlign: 'center', backgroundColor: tokens.colorNeutralBackground1 }}
                            >
                              {granted ? (
                                <Badge appearance="filled" color="success" shape="rounded" size="small">&#10003;</Badge>
                              ) : (
                                <Text size={300}>—</Text>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </AccordionPanel>
        </AccordionItem>
      </Accordion>

      {/* Role Details */}
      <div className={styles.section}>
        <Title3>Role Details</Title3>
        {filteredRoles.length === 0 && (
          <div className={styles.emptyState}>
            <Text>No roles match your search.</Text>
          </div>
        )}
        {filteredRoles.map((role) => {
          const isExpanded = expandedRoleId === role.roleid;
          const entityCount = role.entityPermissions.filter(ep => ep.privileges.length > 0).length;

          return (
            <div key={role.roleid}>
              <div
                className={`${styles.roleRow} ${isExpanded ? styles.roleRowExpanded : ''}`}
                onClick={() => toggleExpand(role.roleid)}
              >
                <div className={styles.chevron}>
                  {isExpanded ? <ChevronDown20Regular /> : <ChevronRight20Regular />}
                </div>
                <div className={styles.nameColumn}>
                  <Text weight="semibold">{role.name}</Text>
                  {role.businessunitname && (
                    <Text className={styles.codeText}>{role.businessunitname}</Text>
                  )}
                </div>
                <div className={styles.badgeGroup}>
                  {role.hasSystemAdminPrivileges && (
                    <Badge appearance="tint" shape="rounded" color="danger" size="small">
                      System Admin
                    </Badge>
                  )}
                  {role.ismanaged ? (
                    <Badge appearance="tint" shape="rounded" color="informative" size="small">
                      Managed
                    </Badge>
                  ) : (
                    <Badge appearance="tint" shape="rounded" color="success" size="small">
                      Custom
                    </Badge>
                  )}
                </div>
                <Badge appearance="outline" shape="rounded" size="small">
                  {entityCount} {entityCount === 1 ? 'entity' : 'entities'}
                </Badge>
              </div>
              {isExpanded && (
                <div className={styles.expandedDetails}>
                  {renderEntityPermissionsTable(role)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const SecurityRolesView = memo(SecurityRolesViewComponent);
