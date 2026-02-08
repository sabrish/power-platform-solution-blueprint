import {
  makeStyles,
  tokens,
  Text,
  Title3,
} from '@fluentui/react-components';
import {
  DatabaseSearch24Regular,
  BoxMultiple24Regular,
  FlowRegular,
  Code24Regular,
  Shield24Regular,
  PlugConnected24Regular,
  CloudFlow24Regular,
  DataPie24Regular,
} from '@fluentui/react-icons';
import { ReactNode } from 'react';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: tokens.spacingVerticalXXXL,
    gap: tokens.spacingVerticalL,
    textAlign: 'center',
    minHeight: '300px',
  },
  icon: {
    color: tokens.colorNeutralForeground4,
    fontSize: '64px',
  },
  title: {
    color: tokens.colorNeutralForeground2,
  },
  message: {
    color: tokens.colorNeutralForeground3,
    maxWidth: '400px',
  },
});

export type EmptyStateType =
  | 'entities'
  | 'plugins'
  | 'flows'
  | 'webresources'
  | 'security'
  | 'customapis'
  | 'workflows'
  | 'generic'
  | 'search';

interface EmptyStateConfig {
  icon: ReactNode;
  title: string;
  message: string;
}

const emptyStateConfigs: Record<EmptyStateType, EmptyStateConfig> = {
  entities: {
    icon: <BoxMultiple24Regular />,
    title: 'No entities found',
    message: 'No entities match the current scope or filter criteria.',
  },
  plugins: {
    icon: <PlugConnected24Regular />,
    title: 'No plugins found',
    message: 'No plugins are registered in the selected solution(s).',
  },
  flows: {
    icon: <FlowRegular />,
    title: 'No flows found',
    message: 'No cloud flows are included in the selected solution(s).',
  },
  webresources: {
    icon: <Code24Regular />,
    title: 'No web resources found',
    message: 'No web resources are included in the selected solution(s).',
  },
  security: {
    icon: <Shield24Regular />,
    title: 'No security components found',
    message: 'No security roles or field security profiles are included in the selected solution(s).',
  },
  customapis: {
    icon: <CloudFlow24Regular />,
    title: 'No custom APIs found',
    message: 'No custom APIs are included in the selected solution(s).',
  },
  workflows: {
    icon: <FlowRegular />,
    title: 'No workflows found',
    message: 'No classic workflows or business process flows are included in the selected solution(s).',
  },
  generic: {
    icon: <DataPie24Regular />,
    title: 'No data available',
    message: 'There is no data to display for this section.',
  },
  search: {
    icon: <DatabaseSearch24Regular />,
    title: 'No results found',
    message: 'Try adjusting your search or filter criteria.',
  },
};

export interface EmptyStateProps {
  type?: EmptyStateType;
  title?: string;
  message?: string;
  icon?: ReactNode;
}

export function EmptyState({
  type = 'generic',
  title,
  message,
  icon,
}: EmptyStateProps) {
  const styles = useStyles();
  const config = emptyStateConfigs[type];

  return (
    <div className={styles.container}>
      <div className={styles.icon}>{icon || config.icon}</div>
      <Title3 className={styles.title}>{title || config.title}</Title3>
      <Text className={styles.message}>{message || config.message}</Text>
    </div>
  );
}
