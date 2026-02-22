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
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
} from '@fluentui/react-components';
import { ScopeSelector } from './components/ScopeSelector';
import { ProcessingScreen } from './components/ProcessingScreen';
import { ResultsDashboard } from './components/ResultsDashboard';
import { useBlueprint } from './hooks/useBlueprint';
import type { ScopeSelection } from './types/scope';
import { Footer } from './components/Footer';
import { ThemeToggle } from './components/ThemeToggle';

const useStyles = makeStyles({
  container: {
    padding: tokens.spacingVerticalXXL,
    maxWidth: '1200px',
    margin: '0 auto',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    marginBottom: tokens.spacingVerticalL,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    position: 'relative',
  },
  headerTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    flex: 1,
  },
  subtitle: {
    color: tokens.colorNeutralForeground3,
  },
  confirmationCard: {
    marginBottom: tokens.spacingVerticalL,
  },
  scopeDetails: {
    padding: tokens.spacingVerticalM,
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
  readyCard: {
    marginBottom: tokens.spacingVerticalL,
    textAlign: 'center',
    padding: tokens.spacingVerticalXXL,
  },
  buttonGroup: {
    display: 'flex',
    justifyContent: 'center',
    gap: tokens.spacingHorizontalM,
    marginTop: tokens.spacingVerticalL,
  },
  successCard: {
    marginBottom: tokens.spacingVerticalL,
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: tokens.spacingHorizontalM,
    marginTop: tokens.spacingVerticalM,
  },
  summaryItem: {
    textAlign: 'center',
    padding: tokens.spacingVerticalM,
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
  },
  summaryValue: {
    fontSize: tokens.fontSizeHero900,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorBrandForeground1,
  },
  summaryLabel: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    marginTop: tokens.spacingVerticalXS,
  },
  errorContainer: {
    marginBottom: tokens.spacingVerticalL,
  },
});

function App() {
  const styles = useStyles();
  const [selectedScope, setSelectedScope] = useState<ScopeSelection | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const { generate, result, progress, isGenerating, error, cancel, blueprintGenerator } = useBlueprint(
    selectedScope!
  );

  const handleScopeSelected = (scope: ScopeSelection) => {
    setSelectedScope(scope);
    setShowConfirmation(true);
  };

  const handleChangeSelection = () => {
    setSelectedScope(null);
    setShowConfirmation(false);
  };

  const handleGenerate = async () => {
    await generate();
  };

  const handleCancel = () => {
    cancel();
    setShowConfirmation(true);
  };

  const renderScopeSummary = (scope: ScopeSelection) => {
    if (scope.type === 'publisher') {
      return (
        <div className={styles.scopeDetails}>
          <div>
            <Text className={styles.label}>Scope: </Text>
            <Text className={styles.value}>
              {scope.mode === 'all-solutions'
                ? `All solutions from ${scope.publisherNames.join(', ')}`
                : `Specific solutions from ${scope.publisherNames.join(', ')}`}
            </Text>
          </div>
          {scope.mode === 'specific-solutions' && scope.solutionNames && (
            <div>
              <Text className={styles.label}>Solutions: </Text>
              <Text className={styles.value}>{scope.solutionNames.join(', ')}</Text>
            </div>
          )}
          <div>
            <Text className={styles.label}>Include System Entities: </Text>
            <Text className={styles.value}>{scope.includeSystem ? 'Yes' : 'No'}</Text>
          </div>
        </div>
      );
    }

    if (scope.type === 'solution') {
      return (
        <div className={styles.scopeDetails}>
          <div>
            <Text className={styles.label}>Scope: </Text>
            <Text className={styles.value}>Selected Solutions</Text>
          </div>
          <div>
            <Text className={styles.label}>Solutions: </Text>
            <Text className={styles.value}>{scope.solutionNames.join(', ')}</Text>
          </div>
          <div>
            <Text className={styles.label}>Include System Entities: </Text>
            <Text className={styles.value}>{scope.includeSystem ? 'Yes' : 'No'}</Text>
          </div>
        </div>
      );
    }

    return null;
  };

  // Show scope selector
  if (!selectedScope || !showConfirmation) {
    return <ScopeSelector onScopeSelected={handleScopeSelected} />;
  }

  // Show processing screen
  if (isGenerating && progress) {
    return <ProcessingScreen progress={progress} onCancel={handleCancel} />;
  }

  // Show results
  if (result && selectedScope) {
    return (
      <ResultsDashboard
        result={result}
        scope={selectedScope}
        onStartOver={handleChangeSelection}
        blueprintGenerator={blueprintGenerator}
      />
    );
  }

  // Show confirmation screen
  return (
    <main id="main-content" className={styles.container} role="main" aria-label="Power Platform Solution Blueprint">
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div className={styles.headerContent}>
            <Title1>Power Platform Solution Blueprint</Title1>
            <Subtitle1 className={styles.subtitle}>
              Complete architectural blueprints for your Power Platform systems
            </Subtitle1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {error && (
        <div className={styles.errorContainer}>
          <MessageBar intent="error">
            <MessageBarBody>
              <MessageBarTitle>Generation Failed</MessageBarTitle>
              {error.message}
              <br />
              <Button
                appearance="secondary"
                size="small"
                onClick={handleGenerate}
                style={{ marginTop: '8px' }}
              >
                Retry
              </Button>
            </MessageBarBody>
          </MessageBar>
        </div>
      )}

      <Card className={styles.confirmationCard}>
        <CardHeader header={<Text weight="semibold">Selected Scope</Text>} />
        {renderScopeSummary(selectedScope)}
      </Card>

      <Card className={styles.readyCard}>
        <Text size={500} weight="semibold">
          Ready to generate blueprint
        </Text>
        <Text style={{ marginTop: tokens.spacingVerticalM }}>
          This will process all entities in your selected scope and generate a complete system
          blueprint.
        </Text>
      </Card>

      <div className={styles.buttonGroup}>
        <Button appearance="secondary" onClick={handleChangeSelection}>
          Change Selection
        </Button>
        <Button appearance="primary" onClick={handleGenerate} aria-label="Generate system blueprint">
          Generate Blueprint
        </Button>
      </div>

      <Footer />
    </main>
  );
}

export default App;
