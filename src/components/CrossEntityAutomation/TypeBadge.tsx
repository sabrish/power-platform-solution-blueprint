import type { ReactElement } from 'react';
import { Badge, makeStyles, tokens } from '@fluentui/react-components';
import { ArrowRight24Regular } from '@fluentui/react-icons';
import {
  PluginsIcon as BracesVariable24Regular,
  FlowsIcon as CloudFlow24Regular,
  BusinessRulesIcon as ClipboardTaskListLtr24Regular,
  ClassicWorkflowsIcon as ClipboardSettings24Regular,
} from '../componentIcons';
import type { AutomationActivation, PipelineStep } from '../../core';

const useStyles = makeStyles({
  stepBadge: { fontSize: tokens.fontSizeBase100, flexShrink: 0 },
});

const TYPE_ICON_STYLE = { width: tokens.fontSizeBase200, height: tokens.fontSizeBase200, flexShrink: 0, verticalAlign: 'middle' } as const;

function typeIcon(type: AutomationActivation['automationType'] | PipelineStep['automationType']): ReactElement {
  switch (type) {
    case 'Plugin': return <BracesVariable24Regular style={TYPE_ICON_STYLE} />;
    case 'Flow': return <CloudFlow24Regular style={TYPE_ICON_STYLE} />;
    case 'BusinessRule': return <ClipboardTaskListLtr24Regular style={TYPE_ICON_STYLE} />;
    case 'ClassicWorkflow': return <ClipboardSettings24Regular style={TYPE_ICON_STYLE} />;
    default: return <ArrowRight24Regular style={TYPE_ICON_STYLE} />;
  }
}

export function TypeBadge({ type }: { type: AutomationActivation['automationType'] | PipelineStep['automationType'] }): JSX.Element {
  const color = type === 'Plugin' ? 'important'
    : type === 'Flow' ? 'success'
    : type === 'BusinessRule' ? 'brand'
    : 'warning';
  const styles = useStyles();
  return (
    <Badge appearance="outline" shape="rounded" color={color} className={styles.stepBadge}>
      {typeIcon(type)} {type}
    </Badge>
  );
}
