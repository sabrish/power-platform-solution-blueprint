import { useState, useMemo, memo } from 'react';
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
  Tab,
  TabList,
  SelectTabData,
  SelectTabEvent,
} from '@fluentui/react-components';
import type {
  SecurityRoleDetail,
  FieldSecurityProfile,
  AttributeMaskingRule,
  ColumnSecurityProfile,
} from '@ppsb/core';

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

interface SecurityOverviewProps {
  securityRoles: SecurityRoleDetail[];
  fieldSecurityProfiles: FieldSecurityProfile[];
  attributeMaskingRules?: AttributeMaskingRule[];
  columnSecurityProfiles?: ColumnSecurityProfile[];
}

function SecurityOverviewComponent({
  securityRoles,
  fieldSecurityProfiles,
  attributeMaskingRules = [],
  columnSecurityProfiles = [],
}: SecurityOverviewProps) {
  const styles = useStyles();
  const [selectedTab, setSelectedTab] = useState<string>('roles');

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
      renderCell: (role) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Text weight="semibold">{role.name}</Text>
          {role.hasSystemAdminPrivileges && <Badge appearance="filled" color="warning">Admin</Badge>}
          {role.ismanaged && <Badge appearance="outline">Managed</Badge>}
        </div>
      ),
    }),
    createTableColumn<SecurityRoleDetail>({
      columnId: 'businessUnit',
      renderHeaderCell: () => 'Business Unit',
      renderCell: (role) => role.businessunitname || 'Unknown',
    }),
    createTableColumn<SecurityRoleDetail>({
      columnId: 'entities',
      renderHeaderCell: () => 'Entities',
      renderCell: (role) => <Badge appearance="filled">{role.totalEntities}</Badge>,
    }),
    ...specialPermissions.map(perm =>
      createTableColumn<SecurityRoleDetail>({
        columnId: perm.key,
        renderHeaderCell: () => perm.label,
        renderCell: (role) => (
          role.specialPermissions[perm.key as keyof typeof role.specialPermissions] ? '✓' : ''
        ),
      })
    ),
  ], []);

  const profileColumns = useMemo<TableColumnDefinition<FieldSecurityProfile>[]>(() => [
    createTableColumn<FieldSecurityProfile>({
      columnId: 'name',
      renderHeaderCell: () => 'Profile Name',
      renderCell: (profile) => <Text weight="semibold">{profile.name}</Text>,
    }),
    createTableColumn<FieldSecurityProfile>({
      columnId: 'description',
      renderHeaderCell: () => 'Description',
      renderCell: (profile) => profile.description || <Text italic>No description</Text>,
    }),
  ], []);

  const maskingRuleColumns = useMemo<TableColumnDefinition<AttributeMaskingRule>[]>(() => [
    createTableColumn<AttributeMaskingRule>({
      columnId: 'name',
      renderHeaderCell: () => 'Rule Name',
      renderCell: (rule) => <Text weight="semibold">{rule.name}</Text>,
    }),
    createTableColumn<AttributeMaskingRule>({
      columnId: 'entity',
      renderHeaderCell: () => 'Entity',
      renderCell: (rule) => rule.entitylogicalname,
    }),
    createTableColumn<AttributeMaskingRule>({
      columnId: 'attribute',
      renderHeaderCell: () => 'Attribute',
      renderCell: (rule) => rule.attributelogicalname,
    }),
    createTableColumn<AttributeMaskingRule>({
      columnId: 'maskingType',
      renderHeaderCell: () => 'Masking Type',
      renderCell: (rule) => {
        const type = rule.maskingtype === 1 ? 'Full' : rule.maskingtype === 2 ? 'Partial' : rule.maskingtype === 3 ? 'Email' : 'Custom';
        return <Badge appearance="outline">{type}</Badge>;
      },
    }),
    createTableColumn<AttributeMaskingRule>({
      columnId: 'managed',
      renderHeaderCell: () => 'Managed',
      renderCell: (rule) => rule.ismanaged ? <Badge appearance="outline">Managed</Badge> : '',
    }),
  ], []);

  const columnSecurityColumns = useMemo<TableColumnDefinition<ColumnSecurityProfile>[]>(() => [
    createTableColumn<ColumnSecurityProfile>({
      columnId: 'name',
      renderHeaderCell: () => 'Profile Name',
      renderCell: (profile) => <Text weight="semibold">{profile.name}</Text>,
    }),
    createTableColumn<ColumnSecurityProfile>({
      columnId: 'description',
      renderHeaderCell: () => 'Description',
      renderCell: (profile) => profile.description || <Text italic>No description</Text>,
    }),
    createTableColumn<ColumnSecurityProfile>({
      columnId: 'managed',
      renderHeaderCell: () => 'Managed',
      renderCell: (profile) => profile.ismanaged ? <Badge appearance="outline">Managed</Badge> : '',
    }),
  ], []);

  const renderEntityPermissionsTable = (role: SecurityRoleDetail) => {
    if (role.entityPermissions.length === 0) {
      return <Text italic>No entity permissions</Text>;
    }

    return (
      <div className={styles.entityPermissionsTable}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${tokens.colorNeutralStroke1}` }}>
              <th style={{ padding: '8px', textAlign: 'left' }}>Entity</th>
              <th style={{ padding: '8px', textAlign: 'center' }}>Create</th>
              <th style={{ padding: '8px', textAlign: 'center' }}>Read</th>
              <th style={{ padding: '8px', textAlign: 'center' }}>Write</th>
              <th style={{ padding: '8px', textAlign: 'center' }}>Delete</th>
              <th style={{ padding: '8px', textAlign: 'center' }}>Append</th>
              <th style={{ padding: '8px', textAlign: 'center' }}>AppendTo</th>
              <th style={{ padding: '8px', textAlign: 'center' }}>Assign</th>
              <th style={{ padding: '8px', textAlign: 'center' }}>Share</th>
            </tr>
          </thead>
          <tbody>
            {role.entityPermissions.map((entityPerm) => {
              const privMap = new Map(entityPerm.privileges.map(p => [p.type, p]));
              return (
                <tr key={entityPerm.entityLogicalName} style={{ borderBottom: `1px solid ${tokens.colorNeutralStroke2}` }}>
                  <td style={{ padding: '8px' }}>{entityPerm.entityLogicalName}</td>
                  <td style={{ padding: '8px', textAlign: 'center' }}>{privMap.get('Create')?.depth || ''}</td>
                  <td style={{ padding: '8px', textAlign: 'center' }}>{privMap.get('Read')?.depth || ''}</td>
                  <td style={{ padding: '8px', textAlign: 'center' }}>{privMap.get('Write')?.depth || ''}</td>
                  <td style={{ padding: '8px', textAlign: 'center' }}>{privMap.get('Delete')?.depth || ''}</td>
                  <td style={{ padding: '8px', textAlign: 'center' }}>{privMap.get('Append')?.depth || ''}</td>
                  <td style={{ padding: '8px', textAlign: 'center' }}>{privMap.get('AppendTo')?.depth || ''}</td>
                  <td style={{ padding: '8px', textAlign: 'center' }}>{privMap.get('Assign')?.depth || ''}</td>
                  <td style={{ padding: '8px', textAlign: 'center' }}>{privMap.get('Share')?.depth || ''}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className={styles.legend}>
          <strong>Privilege Depth:</strong> Basic = User, Local = Business Unit, Deep = Parent+Child BU, Global = Organization
        </div>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <div>
        <Title3>🔒 Security</Title3>
        <Text className={styles.description}>
          Security roles and field security profiles in the selected solution(s).
        </Text>
      </div>

      <TabList
        selectedValue={selectedTab}
        onTabSelect={(_event: SelectTabEvent, data: SelectTabData) => {
          setSelectedTab(data.value as string);
        }}
      >
        {securityRoles.length > 0 && (
          <Tab value="roles">Security Roles ({securityRoles.length})</Tab>
        )}
        {fieldSecurityProfiles.length > 0 && (
          <Tab value="profiles">Field Security Profiles ({fieldSecurityProfiles.length})</Tab>
        )}
        {attributeMaskingRules.length > 0 && (
          <Tab value="masking">Attribute Masking ({attributeMaskingRules.length})</Tab>
        )}
        {columnSecurityProfiles.length > 0 && (
          <Tab value="columnsecurity">Column Security ({columnSecurityProfiles.length})</Tab>
        )}
      </TabList>

      {selectedTab === 'roles' && securityRoles.length > 0 && (
        <div className={styles.section}>
          <div>
            <Title3>Special Permissions Matrix</Title3>
            <Text className={styles.description}>
              This table shows which security roles have special/miscellaneous permissions.
            </Text>
          </div>

          <div className={styles.permissionsTable}>
            <DataGrid
              items={securityRoles}
              columns={rolesColumns}
              sortable
              resizableColumns
              size="small"
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

          <div style={{ marginTop: tokens.spacingVerticalXL }}>
            <Title3>Role Details</Title3>
            <Accordion multiple collapsible>
              {securityRoles.map((role) => (
                <AccordionItem key={role.roleid} value={role.roleid}>
                  <AccordionHeader>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                      <Text weight="semibold">{role.name}</Text>
                      <Badge appearance="filled">{role.totalEntities} entities</Badge>
                      {role.hasSystemAdminPrivileges && <Badge appearance="filled" color="warning">System Admin</Badge>}
                      {role.ismanaged && <Badge appearance="outline">Managed</Badge>}
                    </div>
                  </AccordionHeader>
                  <AccordionPanel>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <Text><strong>Business Unit:</strong> {role.businessunitname || 'Unknown'}</Text>
                      {role.description && <Text><strong>Description:</strong> {role.description}</Text>}

                      <div style={{ marginTop: '16px' }}>
                        <Text weight="semibold">Entity Permissions</Text>
                        {renderEntityPermissionsTable(role)}
                      </div>
                    </div>
                  </AccordionPanel>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      )}

      {selectedTab === 'profiles' && fieldSecurityProfiles.length > 0 && (
        <div className={styles.section}>
          <div>
            <Title3>Field Security Profiles</Title3>
            <Text className={styles.description}>
              Field security profiles control who can read, create, or update specific secured fields.
            </Text>
          </div>

          <DataGrid
            items={fieldSecurityProfiles}
            columns={profileColumns}
            sortable
            size="small"
          >
            <DataGridHeader>
              <DataGridRow>
                {({ renderHeaderCell }) => (
                  <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>
                )}
              </DataGridRow>
            </DataGridHeader>
            <DataGridBody<FieldSecurityProfile>>
              {({ item, rowId }) => (
                <DataGridRow<FieldSecurityProfile> key={rowId}>
                  {({ renderCell }) => (
                    <DataGridCell>{renderCell(item)}</DataGridCell>
                  )}
                </DataGridRow>
              )}
            </DataGridBody>
          </DataGrid>

          <div className={styles.legend}>
            <strong>Note:</strong> Field-level permissions for specific entities are documented in each entity's schema tab.
          </div>
        </div>
      )}

      {selectedTab === 'masking' && attributeMaskingRules.length > 0 && (
        <div className={styles.section}>
          <div>
            <Title3>Attribute Masking Rules</Title3>
            <Text className={styles.description}>
              Attribute masking rules control how sensitive data is masked when displayed to users without appropriate permissions.
            </Text>
          </div>

          <DataGrid
            items={attributeMaskingRules}
            columns={maskingRuleColumns}
            sortable
            size="small"
          >
            <DataGridHeader>
              <DataGridRow>
                {({ renderHeaderCell }) => (
                  <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>
                )}
              </DataGridRow>
            </DataGridHeader>
            <DataGridBody<AttributeMaskingRule>>
              {({ item, rowId }) => (
                <DataGridRow<AttributeMaskingRule> key={rowId}>
                  {({ renderCell }) => (
                    <DataGridCell>{renderCell(item)}</DataGridCell>
                  )}
                </DataGridRow>
              )}
            </DataGridBody>
          </DataGrid>

          <div className={styles.legend}>
            <strong>Masking Types:</strong> Full = Entire value masked, Partial = Part of value shown, Email = Email format preserved, Custom = Custom masking format
          </div>
        </div>
      )}

      {selectedTab === 'columnsecurity' && columnSecurityProfiles.length > 0 && (
        <div className={styles.section}>
          <div>
            <Title3>Column Security Profiles</Title3>
            <Text className={styles.description}>
              Column security profiles define which users can access specific secured columns across entities.
            </Text>
          </div>

          <DataGrid
            items={columnSecurityProfiles}
            columns={columnSecurityColumns}
            sortable
            size="small"
          >
            <DataGridHeader>
              <DataGridRow>
                {({ renderHeaderCell }) => (
                  <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>
                )}
              </DataGridRow>
            </DataGridHeader>
            <DataGridBody<ColumnSecurityProfile>>
              {({ item, rowId }) => (
                <DataGridRow<ColumnSecurityProfile> key={rowId}>
                  {({ renderCell }) => (
                    <DataGridCell>{renderCell(item)}</DataGridCell>
                  )}
                </DataGridRow>
              )}
            </DataGridBody>
          </DataGrid>

          <div className={styles.legend}>
            <strong>Note:</strong> Column-level permissions control create, read, and update access to secured fields.
          </div>
        </div>
      )}
    </div>
  );
}

// Memoize component for performance
export const SecurityOverview = memo(SecurityOverviewComponent);
