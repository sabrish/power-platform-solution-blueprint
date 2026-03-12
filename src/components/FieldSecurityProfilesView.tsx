import { useMemo, memo, useState, useCallback } from 'react';
import {
  Title3,
  Text,
  makeStyles,
  mergeClasses,
  tokens,
  Badge,
  Table,
  TableHeader,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
} from '@fluentui/react-components';
import { ChevronDown20Regular, ChevronRight20Regular } from '@fluentui/react-icons';
import { FilterBar } from './FilterBar';
import { EmptyState } from './EmptyState';
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
    gap: tokens.spacingVerticalS,
  },
  sectionHeader: {
    marginBottom: tokens.spacingVerticalXS,
  },
  description: {
    color: tokens.colorNeutralForeground3,
    display: 'block',
  },
  legend: {
    padding: tokens.spacingVerticalS,
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    marginTop: tokens.spacingVerticalM,
  },
  // Card-row (PATTERN-001)
  profileRow: {
    display: 'grid',
    gridTemplateColumns: `${tokens.spacingHorizontalXXL} minmax(200px, 2fr) auto`,
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
  profileRowExpanded: {
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
  descriptionText: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    wordBreak: 'break-word',
  },
  expandedDetails: {
    backgroundColor: tokens.colorNeutralBackground2,
    padding: tokens.spacingVerticalL,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderTop: 'none',
    borderRadius: `0 0 ${tokens.borderRadiusMedium} ${tokens.borderRadiusMedium}`,
    marginTop: '-4px',
  },
  detailItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXXS,
  },
  detailLabel: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  detailValue: {
    fontWeight: tokens.fontWeightSemibold,
    minWidth: 0,
    wordBreak: 'break-word',
    overflowWrap: 'anywhere',
  },
  // Fluent UI Table (for masking rules — dense tabular data)
  tableWrapper: {
    overflowX: 'auto',
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

  const [profileSearch, setProfileSearch] = useState('');
  const [expandedProfileId, setExpandedProfileId] = useState<string | null>(null);

  const [colProfileSearch, setColProfileSearch] = useState('');
  const [expandedColProfileId, setExpandedColProfileId] = useState<string | null>(null);

  const filteredProfiles = useMemo(() => {
    const q = profileSearch.toLowerCase().trim();
    if (!q) return profiles;
    return profiles.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q))
    );
  }, [profiles, profileSearch]);

  const filteredColProfiles = useMemo(() => {
    const q = colProfileSearch.toLowerCase().trim();
    if (!q) return columnSecurityProfiles;
    return columnSecurityProfiles.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q))
    );
  }, [columnSecurityProfiles, colProfileSearch]);

  const toggleProfile = useCallback((id: string): void => {
    setExpandedProfileId((prev) => (prev === id ? null : id));
  }, []);

  const toggleColProfile = useCallback((id: string): void => {
    setExpandedColProfileId((prev) => (prev === id ? null : id));
  }, []);

  const allEmpty =
    profiles.length === 0 &&
    attributeMaskingRules.length === 0 &&
    columnSecurityProfiles.length === 0;

  if (allEmpty) {
    return (
      <EmptyState
        type="security"
        title="No Field Security Profiles Found"
        message="No field security profiles were found in the selected solution(s)."
      />
    );
  }

  return (
    <div className={styles.container}>

      {/* Field Security Profiles — card-row accordion */}
      {profiles.length > 0 && (
        <div className={styles.section}>
          <FilterBar
            searchValue={profileSearch}
            onSearchChange={setProfileSearch}
            searchPlaceholder="Search field security profiles..."
            filteredCount={filteredProfiles.length}
            totalCount={profiles.length}
            itemLabel="profiles"
          />

          {filteredProfiles.length === 0 && (
            <EmptyState type="search" />
          )}

          {filteredProfiles.map((profile) => {
            const isExpanded = expandedProfileId === profile.fieldsecurityprofileid;
            return (
              <div key={profile.fieldsecurityprofileid}>
                <div
                  className={mergeClasses(styles.profileRow, isExpanded && styles.profileRowExpanded)}
                  onClick={() => toggleProfile(profile.fieldsecurityprofileid)}
                >
                  <div className={styles.chevron}>
                    {isExpanded ? <ChevronDown20Regular /> : <ChevronRight20Regular />}
                  </div>
                  <div className={styles.nameColumn}>
                    <Text weight="semibold">{profile.name}</Text>
                    {profile.description && (
                      <Text className={styles.descriptionText}>{profile.description}</Text>
                    )}
                  </div>
                </div>
                {isExpanded && (
                  <div className={styles.expandedDetails}>
                    <div className={styles.detailItem}>
                      <Text className={styles.detailLabel}>Description</Text>
                      {profile.description ? (
                        <Text className={styles.detailValue}>{profile.description}</Text>
                      ) : (
                        <Text italic className={styles.detailValue}>No description provided.</Text>
                      )}
                    </div>
                    <div className={styles.legend}>
                      <strong>Note:</strong> Field-level permissions for specific entities are documented in each entity's schema tab.
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Attribute Masking Rules — Fluent UI Table (dense tabular data, no expand needed) */}
      {attributeMaskingRules.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <Title3>Attribute Masking Rules ({attributeMaskingRules.length})</Title3>
            <Text className={styles.description}>
              Attribute masking rules control how sensitive data is masked when displayed to users without appropriate permissions.
            </Text>
          </div>

          <div className={styles.tableWrapper}>
            <Table size="small" aria-label="Attribute masking rules">
              <TableHeader>
                <TableRow>
                  <TableHeaderCell>Entity</TableHeaderCell>
                  <TableHeaderCell>Attribute</TableHeaderCell>
                  <TableHeaderCell>Masking Rule</TableHeaderCell>
                  <TableHeaderCell>Managed</TableHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attributeMaskingRules.map((rule) => (
                  <TableRow key={rule.attributemaskingruleid}>
                    <TableCell>
                      <Text weight="semibold" style={{ wordBreak: 'break-word' }}>{rule.entitylogicalname}</Text>
                    </TableCell>
                    <TableCell>
                      <Text style={{ wordBreak: 'break-word' }}>{rule.attributelogicalname}</Text>
                    </TableCell>
                    <TableCell>
                      <Badge appearance="outline" shape="rounded">{rule.maskingRuleName}</Badge>
                    </TableCell>
                    <TableCell>
                      {rule.ismanaged && (
                        <Badge appearance="tint" shape="rounded" color="informative">Managed</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className={styles.legend}>
            <strong>Masking Types:</strong> Full = Entire value masked, Partial = Part of value shown, Email = Email format preserved, Custom = Custom masking format
          </div>
        </div>
      )}

      {/* Column Security Profiles — card-row accordion */}
      {columnSecurityProfiles.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <Title3>Column Security Profiles</Title3>
            <Text className={styles.description}>
              Column security profiles define which users can access specific secured columns across entities.
            </Text>
          </div>

          <FilterBar
            searchValue={colProfileSearch}
            onSearchChange={setColProfileSearch}
            searchPlaceholder="Search column security profiles..."
            filteredCount={filteredColProfiles.length}
            totalCount={columnSecurityProfiles.length}
            itemLabel="profiles"
          />

          {filteredColProfiles.length === 0 && (
            <EmptyState type="search" />
          )}

          {filteredColProfiles.map((profile) => {
            const isExpanded = expandedColProfileId === profile.columnsecurityprofileid;
            return (
              <div key={profile.columnsecurityprofileid}>
                <div
                  className={mergeClasses(styles.profileRow, isExpanded && styles.profileRowExpanded)}
                  onClick={() => toggleColProfile(profile.columnsecurityprofileid)}
                >
                  <div className={styles.chevron}>
                    {isExpanded ? <ChevronDown20Regular /> : <ChevronRight20Regular />}
                  </div>
                  <div className={styles.nameColumn}>
                    <Text weight="semibold">{profile.name}</Text>
                    {profile.description && (
                      <Text className={styles.descriptionText}>{profile.description}</Text>
                    )}
                  </div>
                  {profile.ismanaged && (
                    <Badge appearance="tint" shape="rounded" color="informative" size="small">
                      Managed
                    </Badge>
                  )}
                </div>
                {isExpanded && (
                  <div className={styles.expandedDetails}>
                    <div className={styles.detailItem}>
                      <Text className={styles.detailLabel}>Description</Text>
                      {profile.description ? (
                        <Text className={styles.detailValue}>{profile.description}</Text>
                      ) : (
                        <Text italic className={styles.detailValue}>No description provided.</Text>
                      )}
                    </div>
                    <div className={styles.legend}>
                      <strong>Note:</strong> Column-level permissions control create, read, and update access to secured fields.
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export const FieldSecurityProfilesView = memo(FieldSecurityProfilesViewComponent);
