import { useMemo, memo } from 'react';
import {
  Title3,
  Text,
  makeStyles,
  tokens,
  DataGrid,
  DataGridHeader,
  DataGridRow,
  DataGridHeaderCell,
  DataGridBody,
  DataGridCell,
  TableColumnDefinition,
  createTableColumn,
  Badge,
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
} from '@fluentui/react-components';
import type { SecurityRoleDetail } from '@ppsb/core';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  description: {
    color: tokens.colorNeutralForeground3,
    display: 'block',
  },
  permissionsTable: {
    overflowX: 'auto',
  },
  badge: {
    marginLeft: tokens.spacingHorizontalXS,
  },
  legend: {
    padding: tokens.spacingVerticalS,
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
    fontSize: '12px',
    color: tokens.colorNeutralForeground3,
  },
  entityPermissionsTable: {
    marginTop: tokens.spacingVerticalM,
    maxHeight: '400px',
    overflowY: 'auto',
  },
});

interface SecurityRolesViewProps {
  securityRoles: SecurityRoleDetail[];
}

function SecurityRolesViewComponent({ securityRoles }: SecurityRolesViewProps) {
  const styles = useStyles();

  // Special permissions columns for the matrix (in the order specified by user)
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
  ];

  const rolesColumns = useMemo<TableColumnDefinition<SecurityRoleDetail>[]>(() => [
    createTableColumn<SecurityRoleDetail>({
      columnId: 'name',
      renderHeaderCell: () => 'Role Name',
      renderCell: (role) => role.name,
    }),
    createTableColumn<SecurityRoleDetail>({
      columnId: 'businessUnit',
      renderHeaderCell: () => 'Business Unit',
      renderCell: (role) => role.businessunitname || 'N/A',
    }),
    createTableColumn<SecurityRoleDetail>({
      columnId: 'entities',
      renderHeaderCell: () => 'Entity Permissions',
      renderCell: (role) => role.entityPermissions.length,
    }),
  ], []);

  // Render entity permissions table for a role
  const renderEntityPermissionsTable = (role: SecurityRoleDetail) => {
    const privilegeTypes = ['Create', 'Read', 'Write', 'Delete', 'Append', 'AppendTo', 'Assign', 'Share'];

    const depthLabelMap: Record<number, string> = {
      0: 'None',
      1: 'Basic',
      2: 'Local',
      4: 'Deep',
      8: 'Global',
    };

    const getDepthColor = (depth: number): string => {
      switch (depth) {
        case 0:
          return tokens.colorPaletteRedBackground3;
        case 1:
          return tokens.colorPaletteYellowBackground3;
        case 2:
          return tokens.colorPaletteLightGreenBackground3;
        case 4:
          return tokens.colorPaletteGreenBackground3;
        case 8:
          return tokens.colorPaletteDarkGreenBackground2;
        default:
          return tokens.colorNeutralBackground3;
      }
    };

    return (
      <div className={styles.entityPermissionsTable}>
        <Text weight="semibold" style={{ marginBottom: tokens.spacingVerticalS }}>
          Entity-Level Permissions ({role.entityPermissions.filter(ep => ep.privileges.length > 0).length} entities)
        </Text>
        <div className={styles.legend}>
          <strong>Legend:</strong> None (0) | Basic (1) = User | Local (2) = Business Unit | Deep (4) = Parent+Child BUs | Global (8) = Organization
        </div>
        <table style={{ width: '100%', marginTop: tokens.spacingVerticalM, borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: tokens.colorNeutralBackground2 }}>
              <th style={{ padding: tokens.spacingVerticalS, textAlign: 'left', borderBottom: `1px solid ${tokens.colorNeutralStroke2}` }}>
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
                  }}
                >
                  {type}
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
                    <td style={{ padding: tokens.spacingVerticalS }}>
                      <Text weight="semibold">{entityPerm.entityLogicalName}</Text>
                    </td>
                    {privilegeTypes.map((type) => {
                      const priv = privMap.get(type as any);

                      // If privilege doesn't exist at all, show empty cell
                      if (!priv) {
                        return (
                          <td
                            key={type}
                            style={{
                              padding: tokens.spacingVerticalS,
                              textAlign: 'center',
                              backgroundColor: tokens.colorNeutralBackground3,
                            }}
                          >
                            <Text size={200}>—</Text>
                          </td>
                        );
                      }

                      // Use depthValue directly (it's already a number: 0, 1, 2, 4, or 8)
                      const depth = priv.depthValue ?? 0;
                      const backgroundColor = getDepthColor(depth);
                      const label = depthLabelMap[depth] || `Unknown (${depth})`;

                      return (
                        <td
                          key={type}
                          style={{
                            padding: tokens.spacingVerticalS,
                            textAlign: 'center',
                            backgroundColor,
                          }}
                        >
                          <Text size={200}>{label}</Text>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      {securityRoles.length === 0 ? (
        <div style={{ textAlign: 'center', padding: tokens.spacingVerticalXXL }}>
          <Text>No security roles found in the selected solution(s).</Text>
        </div>
      ) : (
        <>
          <div className={styles.section}>
            <DataGrid
              items={securityRoles}
              columns={rolesColumns}
              sortable
              style={{ minWidth: '500px' }}
            >
              <DataGridHeader>
                <DataGridRow>
                  {({ renderHeaderCell }) => (
                    <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>
                  )}
                </DataGridRow>
              </DataGridHeader>
              <DataGridBody<SecurityRoleDetail>>
                {({ item, rowId }) => (
                  <DataGridRow<SecurityRoleDetail> key={rowId}>
                    {({ renderCell }) => (
                      <DataGridCell>{renderCell(item)}</DataGridCell>
                    )}
                  </DataGridRow>
                )}
              </DataGridBody>
            </DataGrid>
          </div>

          {/* Special Permission Matrix */}
          <div className={styles.section}>
            <div style={{ marginBottom: tokens.spacingVerticalS }}>
              <Title3 style={{ marginBottom: tokens.spacingVerticalXS }}>Special Permission Matrix</Title3>
              <Text className={styles.description}>
                Matrix showing which roles have which special permissions.
              </Text>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: tokens.colorNeutralBackground2 }}>
                    <th
                      style={{
                        padding: tokens.spacingVerticalS,
                        textAlign: 'left',
                        borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
                        minWidth: '200px',
                        position: 'sticky',
                        left: 0,
                        backgroundColor: tokens.colorNeutralBackground2,
                        zIndex: 1,
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
                        }}
                      >
                        {perm.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {securityRoles.map((role) => (
                    <tr key={role.roleid} style={{ borderBottom: `1px solid ${tokens.colorNeutralStroke2}` }}>
                      <td
                        style={{
                          padding: tokens.spacingVerticalS,
                          position: 'sticky',
                          left: 0,
                          backgroundColor: tokens.colorNeutralBackground1,
                        }}
                      >
                        <div style={{ fontWeight: tokens.fontWeightSemibold }}>{role.name}</div>
                        <div style={{ fontSize: tokens.fontSizeBase100, color: tokens.colorNeutralForeground3 }}>
                          {role.businessunitname}
                        </div>
                      </td>
                      {specialPermissions.map((perm) => {
                        const value = role.specialPermissions?.[perm.key as keyof typeof role.specialPermissions];
                        const granted = value === true;
                        return (
                          <td
                            key={perm.key}
                            style={{
                              padding: tokens.spacingVerticalS,
                              textAlign: 'center',
                              backgroundColor: granted
                                ? tokens.colorPaletteGreenBackground3
                                : tokens.colorNeutralBackground3,
                            }}
                          >
                            <Text size={300} weight="semibold">
                              {granted ? '✓' : '—'}
                            </Text>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className={styles.section}>
            <div style={{ marginBottom: tokens.spacingVerticalS }}>
              <Title3 style={{ marginBottom: tokens.spacingVerticalXS }}>Role Details</Title3>
              <Text className={styles.description}>
                Expand each role to view detailed entity-level permissions.
              </Text>
            </div>

            <Accordion multiple collapsible>
              {securityRoles.map((role) => (
                <AccordionItem key={role.roleid} value={role.roleid}>
                  <AccordionHeader>
                    {role.name}
                    <Badge appearance="filled" className={styles.badge}>
                      {role.businessunitname}
                    </Badge>
                  </AccordionHeader>
                  <AccordionPanel>
                    {renderEntityPermissionsTable(role)}
                  </AccordionPanel>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </>
      )}
    </div>
  );
}

export const SecurityRolesView = memo(SecurityRolesViewComponent);
