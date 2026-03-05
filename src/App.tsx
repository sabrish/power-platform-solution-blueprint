import { useState, useCallback } from 'react';
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
import { useConnectionChange } from './hooks/useConnectionChange';
import type { ScopeSelection } from './types/scope';
import { Footer } from './components/Footer';

const useStyles = makeStyles({
  container: {
    width: '100vw',
    minHeight: '100vh',
    padding: tokens.spacingVerticalXXL,
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentWrapper: {
    width: '100%',
    maxWidth: '800px',
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
    animation: 'slideInUp 0.5s ease-out',
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    textAlign: 'center',
  },
  headerTop: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
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
    // Relying on global glass-panel for style
  },
  scopeDetails: {
    padding: tokens.spacingVerticalM,
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: tokens.spacingVerticalM,
  },
  label: {
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground3,
    display: 'block',
    marginBottom: tokens.spacingVerticalXS,
  },
  value: {
    color: tokens.colorNeutralForeground1,
    fontSize: tokens.fontSizeBase300,
  },
  readyCard: {
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

  const { generate, result, progress, isGenerating, error, cancel, reset, blueprintGenerator } = useBlueprint(
    selectedScope!
  );

  // Reset app to scope selector when connection changes
  const handleConnectionChange = useCallback(() => {
    reset(); // Clear blueprint state first
    setSelectedScope(null);
    setShowConfirmation(false);
  }, [reset]);

  useConnectionChange(handleConnectionChange);

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
      <div className={styles.contentWrapper}>
        <header className={styles.header}>
          <div className={styles.headerTop}>
            <div className={styles.headerContent}>
              <Title1 style={{ textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>Power Platform Solution Blueprint</Title1>
              <Subtitle1 className={styles.subtitle}>
                Complete architectural blueprints for your Power Platform systems
              </Subtitle1>
            </div>
          </div>
        </header>

        {error && (
          <div className={styles.errorContainer}>
            <MessageBar intent="error" className="glass-panel">
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

        <Card className={`${styles.confirmationCard} glass-panel`}>
          <CardHeader header={<Text size={400} weight="semibold">Configuration Summary</Text>} />
          {renderScopeSummary(selectedScope)}
        </Card>

        <Card className={`${styles.readyCard} glass-panel`}>
          <Text size={600} weight="semibold">
            Ready to generate blueprint
          </Text>
          <Text style={{ marginTop: tokens.spacingVerticalM, display: 'block', color: tokens.colorNeutralForeground2 }}>
            This will process all entities in your selected scope and generate a complete system blueprint.
          </Text>

          <div className={styles.buttonGroup}>
            <Button size="large" appearance="secondary" onClick={handleChangeSelection}>
              Change Selection
            </Button>
            <Button size="large" appearance="primary" onClick={handleGenerate} aria-label="Generate system blueprint">
              Generate Blueprint
            </Button>
          </div>
        </Card>

        <Footer />
      </div>
    </main>
  );
}

export default App;
