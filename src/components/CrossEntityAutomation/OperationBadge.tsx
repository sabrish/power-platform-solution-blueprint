import { Badge, makeStyles, tokens } from '@fluentui/react-components';

const useStyles = makeStyles({
  stepBadge: { fontSize: tokens.fontSizeBase100, flexShrink: 0 },
});

export function OperationBadge({ operation }: { operation: string }): JSX.Element {
  const styles = useStyles();
  const label = operation === 'Manual' ? 'On-Demand / Manual Trigger'
    : operation === 'Action' ? 'Custom Action'
    : operation;
  const color = operation === 'Create' ? 'success'
    : operation === 'Delete' ? 'danger'
    : operation === 'Manual' ? 'informative'
    : operation === 'Action' ? 'brand'
    : 'warning';
  return (
    <Badge
      appearance="tint"
      shape="rounded"
      color={color}
      className={styles.stepBadge}
    >
      {label}
    </Badge>
  );
}
