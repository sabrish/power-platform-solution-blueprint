import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Button,
  Spinner,
  Title1,
  Subtitle1,
  Text,
  Radio,
  RadioGroup,
  Checkbox,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  makeStyles,
  tokens,
  Tooltip,
} from '@fluentui/react-components';
import type { Publisher, Solution } from '../core';
import type { ScopeType, ScopeSelection, PublisherScopeMode } from '../types/scope';
import { useScopeData } from '../hooks/useScopeData';
import { PublisherScopePanel } from './scope/PublisherScopePanel';
import { SolutionScopePanel } from './scope/SolutionScopePanel';
import { Footer } from './Footer';

const useStyles = makeStyles({
  container: {
    padding: tokens.spacingVerticalXXL,
    width: '95%',
    maxWidth: '1200px',
    margin: '0 auto',
    minHeight: '100vh',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    '@media (max-width: 768px)': {
      width: '100%',
      padding: tokens.spacingVerticalL,
    },
  },
  header: {
    marginBottom: tokens.spacingVerticalXXL,
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
  section: {
    marginBottom: tokens.spacingVerticalXL,
  },
  radioGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
  },
  radioOption: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  checkboxContainer: {
    marginTop: tokens.spacingVerticalL,
    paddingTop: tokens.spacingVerticalL,
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  buttonContainer: {
    marginTop: tokens.spacingVerticalXXL,
    display: 'flex',
    justifyContent: 'flex-end',
  },
  cancelButton: {
    marginRight: tokens.spacingHorizontalS,
  },
  retryButton: {
    marginTop: tokens.spacingVerticalS,
  },
  checkboxesSubSection: {
    marginTop: tokens.spacingVerticalM,
  },
  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.spacingHorizontalM,
    padding: tokens.spacingVerticalXXL,
  },
  errorContainer: {
    marginBottom: tokens.spacingVerticalL,
  },
});

export interface ScopeSelectorProps {
  onScopeSelected: (scope: ScopeSelection) => void;
  onCancel?: () => void;
}

export function ScopeSelector({ onScopeSelected, onCancel }: ScopeSelectorProps) {
  const styles = useStyles();

  // Data fetching — delegated to useScopeData hook
  const { publishers, solutions, isLoading: loading, error, retry: handleRetry } = useScopeData();

  // Selection state
  const [scopeType, setScopeType] = useState<ScopeType>('solution');
  const [selectedPublisherIds, setSelectedPublisherIds] = useState<string[]>([]);
  const [publisherScopeMode, setPublisherScopeMode] = useState<PublisherScopeMode>('all-solutions');
  const [selectedSolutionIds, setSelectedSolutionIds] = useState<string[]>([]);
  const [includeSystem, setIncludeSystem] = useState(true);
  const [includeSystemFields, setIncludeSystemFields] = useState(false);

  // Reset selections when scope type changes
  useEffect(() => {
    setSelectedPublisherIds([]);
    setSelectedSolutionIds([]);
    setPublisherScopeMode('all-solutions');
  }, [scopeType]);

  // Reset solution selection when publisher scope mode changes
  useEffect(() => {
    if (publisherScopeMode === 'all-solutions') {
      setSelectedSolutionIds([]);
    }
  }, [publisherScopeMode]);

  // Identifies the Default Solution (uniquename === 'Default') and its publisher.
  // Selecting the Default Solution/Publisher is not recommended — it contains all
  // unmanaged customisations made directly in the environment. (Refs: GitHub issue #34)
  const defaultPublisherUniqueName = useMemo(() => {
    const defaultSol = solutions.find((s) => s.uniquename === 'Default');
    return defaultSol?.publisherid.uniquename ?? null;
  }, [solutions]);

  // Known system publisher friendly names to exclude regardless of uniquename.
  // The CDS Default Publisher has an auto-generated uniquename (e.g. cr114, cr23a)
  // that varies per environment, so we match by friendly name as a fallback.
  const EXCLUDED_PUBLISHER_NAMES = ['CDS Default Publisher'] as const;

  const isDefaultPublisher = useCallback(
    (pub: Publisher) =>
      (!!defaultPublisherUniqueName && pub.uniquename === defaultPublisherUniqueName) ||
      EXCLUDED_PUBLISHER_NAMES.includes(
        pub.friendlyname as (typeof EXCLUDED_PUBLISHER_NAMES)[number]
      ),
    [defaultPublisherUniqueName]
  );

  const isDefaultSolution = useCallback(
    (sol: Solution) =>
      sol.uniquename === 'Default' ||
      sol.friendlyname === 'Common Data Services Default Solution' ||
      (!!sol.publisherid &&
        ((!!defaultPublisherUniqueName &&
          sol.publisherid.uniquename === defaultPublisherUniqueName) ||
          EXCLUDED_PUBLISHER_NAMES.includes(
            sol.publisherid.friendlyname as (typeof EXCLUDED_PUBLISHER_NAMES)[number]
          ))),
    [defaultPublisherUniqueName]
  );

  // Filtered solutions based on selected publishers
  const filteredSolutions = useMemo(() => {
    if (scopeType !== 'publisher' || selectedPublisherIds.length === 0) {
      return [];
    }
    const selectedPublisherUniqueNames = publishers
      .filter((p) => selectedPublisherIds.includes(p.publisherid))
      .map((p) => p.uniquename);
    return solutions.filter((solution) =>
      selectedPublisherUniqueNames.includes(solution.publisherid.uniquename)
    );
  }, [scopeType, selectedPublisherIds, publishers, solutions]);

  const isValidSelection = (): boolean => {
    if (scopeType === 'publisher') {
      if (selectedPublisherIds.length === 0) return false;
      if (publisherScopeMode === 'specific-solutions' && selectedSolutionIds.length === 0) {
        return false;
      }
      return true;
    }
    if (scopeType === 'solution') {
      return selectedSolutionIds.length > 0;
    }
    return false;
  };

  const handleContinue = (): void => {
    if (!isValidSelection()) return;

    let scope: ScopeSelection;

    if (scopeType === 'publisher') {
      const selectedPubs = publishers.filter((p) => selectedPublisherIds.includes(p.publisherid));

      let solutionIds: string[];
      let solutionNames: string[];

      if (publisherScopeMode === 'specific-solutions') {
        const selectedSols = solutions.filter((s) => selectedSolutionIds.includes(s.solutionid));
        solutionIds = selectedSolutionIds;
        solutionNames = selectedSols.map((s) => s.friendlyname);
      } else {
        solutionIds = filteredSolutions.map((s) => s.solutionid);
        solutionNames = filteredSolutions.map((s) => s.friendlyname);
      }

      scope = {
        type: 'publisher',
        publisherIds: selectedPublisherIds,
        publisherNames: selectedPubs.map((p) => p.friendlyname),
        publisherPrefixes: selectedPubs.map((p) => p.customizationprefix),
        mode: publisherScopeMode,
        solutionIds,
        solutionNames,
        includeSystem,
        excludeSystemFields: !includeSystemFields,
      };
    } else {
      const selectedSols = solutions.filter((s) => selectedSolutionIds.includes(s.solutionid));
      scope = {
        type: 'solution',
        solutionIds: selectedSolutionIds,
        solutionNames: selectedSols.map((s) => s.friendlyname),
        includeSystem,
        excludeSystemFields: !includeSystemFields,
      };
    }

    onScopeSelected(scope);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <Spinner size="medium" />
          <Text>Loading publishers and solutions...</Text>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <div className={styles.headerContent}>
            <Title1>Power Platform Solution Blueprint</Title1>
            <Subtitle1 className={styles.subtitle}>Select what you'd like to document</Subtitle1>
          </div>
        </div>
      </div>

      {error && (
        <div className={styles.errorContainer}>
          <MessageBar intent="error">
            <MessageBarBody>
              <MessageBarTitle>Failed to load data</MessageBarTitle>
              {error}
              <br />
              <Button
                appearance="secondary"
                size="small"
                onClick={handleRetry}
                className={styles.retryButton}
              >
                Retry
              </Button>
            </MessageBarBody>
          </MessageBar>
        </div>
      )}

      <div className={styles.section}>
        <RadioGroup
          value={scopeType}
          onChange={(_, data) => setScopeType(data.value as ScopeType)}
          className={styles.radioGroup}
        >
          {/* Option A: By Publisher */}
          <div className={styles.radioOption}>
            <Radio
              value="publisher"
              label="By Publisher"
              disabled={loading || publishers.length === 0}
            />
            {scopeType === 'publisher' && (
              <PublisherScopePanel
                publishers={publishers}
                solutions={solutions}
                filteredSolutions={filteredSolutions}
                selectedPublisherIds={selectedPublisherIds}
                onPublisherIdsChange={setSelectedPublisherIds}
                publisherScopeMode={publisherScopeMode}
                onPublisherScopeModeChange={setPublisherScopeMode}
                selectedSolutionIds={selectedSolutionIds}
                onSolutionIdsChange={setSelectedSolutionIds}
                isDefaultPublisher={isDefaultPublisher}
                isDefaultSolution={isDefaultSolution}
                disabled={loading}
              />
            )}
          </div>

          {/* Option B: By Solution */}
          <div className={styles.radioOption}>
            <Radio
              value="solution"
              label="By Solution (Recommended)"
              disabled={loading || solutions.length === 0}
            />
            {scopeType === 'solution' && (
              <SolutionScopePanel
                solutions={solutions}
                selectedSolutionIds={selectedSolutionIds}
                onSolutionIdsChange={setSelectedSolutionIds}
                isDefaultSolution={isDefaultSolution}
                disabled={loading}
              />
            )}
          </div>
        </RadioGroup>
      </div>

      {/* Options Checkboxes */}
      <div className={styles.checkboxContainer}>
        <div>
          <Tooltip
            content="Include Microsoft-owned entities like Account, Contact, Opportunity, etc. (only if they are in the selected solutions)"
            relationship="description"
          >
            <Checkbox
              label="Include system-owned entities"
              checked={includeSystem}
              onChange={(_, data) => setIncludeSystem(data.checked === true)}
            />
          </Tooltip>
        </div>

        <div className={styles.checkboxesSubSection}>
          <Tooltip
            content="Include common system fields like createdon, createdby, modifiedon, modifiedby, ownerid, statecode, statuscode, etc."
            relationship="description"
          >
            <Checkbox
              label="Include system fields (createdon, modifiedby, etc.)"
              checked={includeSystemFields}
              onChange={(_, data) => setIncludeSystemFields(data.checked === true)}
            />
          </Tooltip>
        </div>
      </div>

      {/* Continue Button */}
      <div className={styles.buttonContainer}>
        {onCancel && (
          <Button appearance="secondary" onClick={onCancel} className={styles.cancelButton}>
            Cancel
          </Button>
        )}
        <Button appearance="primary" onClick={handleContinue} disabled={!isValidSelection()}>
          Continue
        </Button>
      </div>

      <Footer />
    </div>
  );
}
