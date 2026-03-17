import { Text, makeStyles, tokens } from '@fluentui/react-components';

const useStyles = makeStyles({
  fieldPillRow: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXXS,
    flexWrap: 'wrap',
    marginTop: tokens.spacingVerticalXXS,
  },
  fieldPillLabel: { fontSize: tokens.fontSizeBase100, color: tokens.colorNeutralForeground3 },
  mpillHit: {
    fontFamily: 'monospace',
    fontSize: tokens.fontSizeBase100,
    padding: `0 ${tokens.spacingHorizontalXS}`,
    borderRadius: tokens.borderRadiusSmall,
    backgroundColor: tokens.colorNeutralBackground1,
    color: tokens.colorPaletteGreenForeground2,
    border: `1px solid ${tokens.colorPaletteGreenBorder2}`,
    fontWeight: tokens.fontWeightSemibold,
  },
  mpillMiss: {
    fontFamily: 'monospace',
    fontSize: tokens.fontSizeBase100,
    padding: `0 ${tokens.spacingHorizontalXS}`,
    borderRadius: tokens.borderRadiusSmall,
    backgroundColor: tokens.colorNeutralBackground3,
    color: tokens.colorNeutralForeground3,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
});

export function FieldPills({
  entryFields,
  filterFields,
  matchedFields,
}: {
  entryFields: string[];
  filterFields: string[];
  matchedFields: string[];
}): JSX.Element {
  const styles = useStyles();
  const matchedSet = new Set(matchedFields.map(f => f.toLowerCase()));

  const showEntry = entryFields.length > 0;
  const showFilter = filterFields.length > 0;

  return (
    <div>
      {showEntry && (
        <div className={styles.fieldPillRow}>
          <Text className={styles.fieldPillLabel}>Updated:</Text>
          {entryFields.slice(0, 6).map(f => (
            <span key={f} className={matchedSet.has(f.toLowerCase()) ? styles.mpillHit : styles.mpillMiss}>
              {f}{matchedSet.has(f.toLowerCase()) ? ' ✔' : ''}
            </span>
          ))}
          {entryFields.length > 6 && <span className={styles.mpillMiss}>+{entryFields.length - 6}</span>}
        </div>
      )}
      {showFilter && filterFields.length > 0 && (
        <div className={styles.fieldPillRow}>
          <Text className={styles.fieldPillLabel}>Filter:</Text>
          {filterFields.slice(0, 6).map(f => (
            <span key={f} className={matchedSet.has(f.toLowerCase()) ? styles.mpillHit : styles.mpillMiss}>
              {f}{matchedSet.has(f.toLowerCase()) ? ' ✔' : ''}
            </span>
          ))}
          {filterFields.length > 6 && <span className={styles.mpillMiss}>+{filterFields.length - 6}</span>}
        </div>
      )}
    </div>
  );
}
