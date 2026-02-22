import {
  Text,
  Badge,
  Card,
  Title3,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { Key20Regular } from '@fluentui/react-icons';
import type { EntityKey } from '../core';

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
  primaryKeyCard: {
    padding: tokens.spacingVerticalL,
    backgroundColor: tokens.colorBrandBackground2,
  },
  primaryKeyContent: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
  },
  keyIcon: {
    fontSize: '32px',
    color: tokens.colorBrandForeground1,
  },
  keysList: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  keyCard: {
    padding: tokens.spacingVerticalM,
  },
  keyHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: tokens.spacingVerticalS,
  },
  keyAttributes: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    flexWrap: 'wrap',
  },
  emptyState: {
    padding: tokens.spacingVerticalXXL,
    textAlign: 'center',
    color: tokens.colorNeutralForeground3,
  },
});

export interface AlternateKeysViewProps {
  keys: EntityKey[];
  primaryIdAttribute: string;
}

export function AlternateKeysView({ keys, primaryIdAttribute }: AlternateKeysViewProps) {
  const styles = useStyles();

  const getIndexStatusBadge = (status?: string) => {
    switch (status) {
      case 'Active':
        return <Badge appearance="filled" color="success">Active</Badge>;
      case 'Creating':
      case 'InProgress':
        return <Badge appearance="filled" color="warning">Creating</Badge>;
      case 'Failed':
        return <Badge appearance="filled" color="important">Failed</Badge>;
      default:
        return <Badge appearance="outline">Unknown</Badge>;
    }
  };

  return (
    <div className={styles.container}>
      {/* Primary Key Section */}
      <div className={styles.section}>
        <Title3>Primary Key</Title3>
        <Card className={styles.primaryKeyCard}>
          <div className={styles.primaryKeyContent}>
            <Key20Regular className={styles.keyIcon} />
            <div>
              <Text weight="semibold" size={400}>{primaryIdAttribute}</Text>
              <Text style={{ color: tokens.colorNeutralForeground3, marginTop: tokens.spacingVerticalXXS, display: 'block' }}>
                System-generated unique identifier for this entity
              </Text>
            </div>
          </div>
        </Card>
      </div>

      {/* Alternate Keys Section */}
      <div className={styles.section}>
        <Title3>Alternate Keys ({keys.length})</Title3>
        {keys.length === 0 ? (
          <div className={styles.emptyState}>
            <Text>No alternate keys defined for this entity.</Text>
            <Text style={{ marginTop: tokens.spacingVerticalXS }}>
              Alternate keys provide additional ways to uniquely identify records besides the primary key.
            </Text>
          </div>
        ) : (
          <div className={styles.keysList}>
            {keys.map((key, idx) => (
              <Card key={idx} className={styles.keyCard}>
                <div className={styles.keyHeader}>
                  <Text weight="semibold">
                    {key.DisplayName?.UserLocalizedLabel?.Label || key.LogicalName}
                  </Text>
                  {getIndexStatusBadge(key.EntityKeyIndexStatus)}
                </div>
                <Text style={{ color: tokens.colorNeutralForeground3, fontSize: tokens.fontSizeBase200, marginBottom: tokens.spacingVerticalS }}>
                  {key.LogicalName}
                </Text>
                <div>
                  <Text style={{ color: tokens.colorNeutralForeground3, fontSize: tokens.fontSizeBase200 }}>
                    Key Fields:
                  </Text>
                  <div className={styles.keyAttributes} style={{ marginTop: tokens.spacingVerticalXXS }}>
                    {key.KeyAttributes.map((attr, attrIdx) => (
                      <Badge key={attrIdx} appearance="tint" color="brand">
                        {attr}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Text style={{ fontSize: tokens.fontSizeBase200, color: tokens.colorNeutralForeground3, marginTop: tokens.spacingVerticalS }}>
                  This combination of fields must be unique across all records in this entity.
                </Text>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
