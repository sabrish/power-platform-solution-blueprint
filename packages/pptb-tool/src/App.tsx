import { useState } from 'react';
import {
  Button,
  Title1,
  Subtitle1,
  Text,
  Card,
  CardHeader,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { ScopeSelector } from './components/ScopeSelector';
import type { ScopeSelection } from './types/scope';

const useStyles = makeStyles({
  container: {
    padding: tokens.spacingVerticalXXL,
    maxWidth: '1200px',
    margin: '0 auto',
  },
  header: {
    marginBottom: tokens.spacingVerticalXXL,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  subtitle: {
    color: tokens.colorNeutralForeground3,
  },
  confirmationCard: {
    marginBottom: tokens.spacingVerticalL,
  },
  scopeInfo: {
    padding: tokens.spacingVerticalL,
  },
  scopeDetails: {
    marginTop: tokens.spacingVerticalM,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  label: {
    fontWeight: tokens.fontWeightSemibold,
  },
  value: {
    color: tokens.colorNeutralForeground2,
  },
  buttonContainer: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
  },
});

function App() {
  const styles = useStyles();
  const [selectedScope, setSelectedScope] = useState<ScopeSelection | null>(null);

  const handleScopeSelected = (scope: ScopeSelection) => {
    setSelectedScope(scope);
  };

  const handleChangeSelection = () => {
    setSelectedScope(null);
  };

  const renderScopeDetails = (scope: ScopeSelection) => {
    if (scope.type === 'publisher') {
      return (
        <>
          <div>
            <Text className={styles.label}>Scope Type: </Text>
            <Text className={styles.value}>By Publisher</Text>
          </div>
          <div>
            <Text className={styles.label}>Publishers ({scope.publisherIds.length}): </Text>
            <Text className={styles.value}>{scope.publisherNames.join(', ')}</Text>
          </div>
          <div>
            <Text className={styles.label}>Prefixes: </Text>
            <Text className={styles.value}>{scope.publisherPrefixes.join(', ')}</Text>
          </div>
          <div>
            <Text className={styles.label}>Mode: </Text>
            <Text className={styles.value}>
              {scope.mode === 'all-solutions'
                ? `All solutions from selected publisher${scope.publisherIds.length > 1 ? 's' : ''}`
                : 'Specific solutions only'}
            </Text>
          </div>
          {scope.mode === 'specific-solutions' && scope.solutionNames && (
            <div>
              <Text className={styles.label}>Solutions ({scope.solutionIds?.length || 0}): </Text>
              <Text className={styles.value}>{scope.solutionNames.join(', ')}</Text>
            </div>
          )}
          <div>
            <Text className={styles.label}>Include System Entities: </Text>
            <Text className={styles.value}>{scope.includeSystem ? 'Yes' : 'No'}</Text>
          </div>
        </>
      );
    }

    if (scope.type === 'solution') {
      return (
        <>
          <div>
            <Text className={styles.label}>Scope Type: </Text>
            <Text className={styles.value}>By Solution</Text>
          </div>
          <div>
            <Text className={styles.label}>Solutions ({scope.solutionIds.length}): </Text>
            <Text className={styles.value}>{scope.solutionNames.join(', ')}</Text>
          </div>
          <div>
            <Text className={styles.label}>Include System Entities: </Text>
            <Text className={styles.value}>{scope.includeSystem ? 'Yes' : 'No'}</Text>
          </div>
        </>
      );
    }

    return null;
  };

  // Show scope selector if no scope is selected
  if (!selectedScope) {
    return <ScopeSelector onScopeSelected={handleScopeSelected} />;
  }

  // Show confirmation screen after scope selection
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Title1>Power Platform System Blueprint</Title1>
        <Subtitle1 className={styles.subtitle}>
          Complete architectural blueprints for your Power Platform systems
        </Subtitle1>
      </div>

      <Card className={styles.confirmationCard}>
        <CardHeader header={<Text weight="semibold">Selected Scope</Text>} />
        <div className={styles.scopeInfo}>
          <div className={styles.scopeDetails}>{renderScopeDetails(selectedScope)}</div>
        </div>
      </Card>

      <div className={styles.buttonContainer}>
        <Button appearance="secondary" onClick={handleChangeSelection}>
          Change Selection
        </Button>
        <Button appearance="primary">Generate Blueprint</Button>
      </div>
    </div>
  );
}

export default App;
