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
} from '@fluentui/react-components';
import type {
  FieldSecurityProfile,
  AttributeMaskingRule,
  ColumnSecurityProfile,
} from '../core';

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
  legend: {
    padding: tokens.spacingVerticalS,
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
    fontSize: '12px',
    color: tokens.colorNeutralForeground3,
    marginTop: tokens.spacingVerticalM,
  },
});

interface FieldSecurityProfilesViewProps {
  profiles: FieldSecurityProfile[];
  attributeMaskingRules: AttributeMaskingRule[] | undefined;
  columnSecurityProfiles: ColumnSecurityProfile[] | undefined;
}

function FieldSecurityProfilesViewComponent({
  profiles,
  attributeMaskingRules = [],
  columnSecurityProfiles = [],
}: FieldSecurityProfilesViewProps) {
  const styles = useStyles();

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
      columnId: 'entity',
      renderHeaderCell: () => 'Entity',
      renderCell: (rule) => <Text weight="semibold">{rule.entitylogicalname}</Text>,
    }),
    createTableColumn<AttributeMaskingRule>({
      columnId: 'attribute',
      renderHeaderCell: () => 'Attribute',
      renderCell: (rule) => <Text>{rule.attributelogicalname}</Text>,
    }),
    createTableColumn<AttributeMaskingRule>({
      columnId: 'maskingType',
      renderHeaderCell: () => 'Masking Type',
      renderCell: (rule) => {
        const type = rule.maskingtype === 1 ? 'Full' : rule.maskingtype === 2 ? 'Partial' : rule.maskingtype === 3 ? 'Email' : 'Custom';
        return <Badge appearance="outline" shape="rounded">{type}</Badge>;
      },
    }),
    createTableColumn<AttributeMaskingRule>({
      columnId: 'managed',
      renderHeaderCell: () => 'Managed',
      renderCell: (rule) => rule.ismanaged ? <Badge appearance="outline" shape="rounded">Managed</Badge> : '',
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
      renderCell: (profile) => profile.ismanaged ? <Badge appearance="outline" shape="rounded">Managed</Badge> : '',
    }),
  ], []);

  return (
    <div className={styles.container}>
      {profiles.length > 0 && (
        <div className={styles.section}>
          <DataGrid
            items={profiles}
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

      {attributeMaskingRules.length > 0 && (
        <div className={styles.section}>
          <div style={{ marginBottom: tokens.spacingVerticalS }}>
            <Title3 style={{ marginBottom: tokens.spacingVerticalXS }}>Attribute Masking Rules</Title3>
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

      {columnSecurityProfiles.length > 0 && (
        <div className={styles.section}>
          <div style={{ marginBottom: tokens.spacingVerticalS }}>
            <Title3 style={{ marginBottom: tokens.spacingVerticalXS }}>Column Security Profiles</Title3>
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

      {profiles.length === 0 && attributeMaskingRules.length === 0 && columnSecurityProfiles.length === 0 && (
        <div style={{ textAlign: 'center', padding: tokens.spacingVerticalXXL }}>
          <Text>No field security profiles found in the selected solution(s).</Text>
        </div>
      )}
    </div>
  );
}

export const FieldSecurityProfilesView = memo(FieldSecurityProfilesViewComponent);
