import { Text, makeStyles, mergeClasses, tokens } from '@fluentui/react-components';
import {
  CheckmarkCircle16Regular,
  ErrorCircle16Regular,
  Warning20Regular,
} from '@fluentui/react-icons';
import { FieldPills } from './FieldPills';
import type { AutomationActivation, CrossEntityTrace } from '../../core';

const useStyles = makeStyles({
  fieldMatchBase: {
    marginTop: tokens.spacingVerticalXXS,
    marginBottom: tokens.spacingVerticalXS,
    padding: tokens.spacingVerticalXS,
    paddingInline: tokens.spacingHorizontalS,
    borderRadius: tokens.borderRadiusSmall,
    fontSize: tokens.fontSizeBase200,
    lineHeight: '1.5',
  },
  fieldMatchFires: {
    backgroundColor: tokens.colorNeutralBackground2,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderLeft: `3px solid ${tokens.colorPaletteGreenForeground1}`,
  },
  fieldMatchNoFire: {
    opacity: 0.55,
    backgroundColor: tokens.colorNeutralBackground3,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  fieldMatchNoFilter: {
    backgroundColor: tokens.colorNeutralBackground2,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderLeft: `3px solid ${tokens.colorPaletteRedForeground1}`,
  },
  matchVerdict: { fontWeight: tokens.fontWeightSemibold, marginBottom: '2px' },
  noFilterAdvisory: { fontSize: tokens.fontSizeBase100, color: tokens.colorPaletteRedForeground1 },
});

export function FieldMatchVerdict({
  activation,
  trace,
}: {
  activation: AutomationActivation;
  trace: CrossEntityTrace;
}): JSX.Element | null {
  const styles = useStyles();
  const { firingStatus, matchedFields, filteringAttributes } = activation;
  const isCreateOrDelete = trace.entryPoint.operation === 'Create' || trace.entryPoint.operation === 'Delete';

  if (firingStatus === 'WillFire') {
    if (isCreateOrDelete) {
      return (
        <div className={mergeClasses(styles.fieldMatchBase, styles.fieldMatchFires)}>
          <div className={styles.matchVerdict} style={{ color: tokens.colorPaletteGreenForeground1 }}>
            <CheckmarkCircle16Regular /> FIRES — all {trace.entryPoint.operation} automations fire
          </div>
        </div>
      );
    }
    return (
      <div className={mergeClasses(styles.fieldMatchBase, styles.fieldMatchFires)}>
        <div className={styles.matchVerdict} style={{ color: tokens.colorPaletteGreenForeground1 }}>
          <CheckmarkCircle16Regular /> WILL FIRE
          {filteringAttributes.length > 0 && ' — matched filtering attributes'}
        </div>
        {matchedFields.length > 0 && (
          <FieldPills
            entryFields={trace.entryPoint.fields}
            filterFields={filteringAttributes}
            matchedFields={matchedFields}
          />
        )}
      </div>
    );
  }

  if (firingStatus === 'WontFire') {
    return (
      <div className={mergeClasses(styles.fieldMatchBase, styles.fieldMatchNoFire)}>
        <div className={styles.matchVerdict} style={{ color: tokens.colorNeutralForeground3 }}>
          <ErrorCircle16Regular /> WON'T FIRE — no overlap between updated fields and filter
        </div>
        <FieldPills
          entryFields={trace.entryPoint.fields}
          filterFields={filteringAttributes}
          matchedFields={matchedFields}
        />
      </div>
    );
  }

  if (firingStatus === 'WillFireNoFilter') {
    return (
      <div className={mergeClasses(styles.fieldMatchBase, styles.fieldMatchNoFilter)}>
        <div className={styles.matchVerdict} style={{ color: tokens.colorPaletteRedForeground1, display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalXS }}>
          <Warning20Regular /> WILL FIRE — no filtering attributes, fires on ALL updates
        </div>
        <Text className={styles.noFilterAdvisory}>
          Add filtering attributes to this {activation.automationType.toLowerCase()} to improve performance.
        </Text>
      </div>
    );
  }

  return null;
}
