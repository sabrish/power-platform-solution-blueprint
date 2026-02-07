import { useState, useEffect, useMemo } from 'react';
import {
  Button,
  Spinner,
  Title1,
  Subtitle1,
  Text,
  Radio,
  RadioGroup,
  Checkbox,
  Dropdown,
  Option,
  Tag,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  makeStyles,
  tokens,
  Tooltip,
  Field,
} from '@fluentui/react-components';
import {
  PptbDataverseClient,
  PublisherDiscovery,
  SolutionDiscovery,
  type Publisher,
  type Solution,
} from '@ppsb/core';
import type { ScopeType, ScopeSelection, PublisherScopeMode } from '../types/scope';

const useStyles = makeStyles({
  container: {
    padding: tokens.spacingVerticalXXL,
    maxWidth: '800px',
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
  radioContent: {
    marginLeft: '28px',
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  dropdown: {
    minWidth: '400px',
  },
  selectedItems: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalS,
    marginTop: tokens.spacingVerticalS,
  },
  solutionInfo: {
    display: 'flex',
    flexDirection: 'column',
  },
  secondaryText: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
  },
  subOptions: {
    marginTop: tokens.spacingVerticalM,
    paddingLeft: tokens.spacingHorizontalL,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
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
  hint: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    marginTop: tokens.spacingVerticalXS,
  },
});

export interface ScopeSelectorProps {
  onScopeSelected: (scope: ScopeSelection) => void;
  onCancel?: () => void;
}

export function ScopeSelector({ onScopeSelected, onCancel }: ScopeSelectorProps) {
  const styles = useStyles();

  // Data state
  const [publishers, setPublishers] = useState<Publisher[]>([]);
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selection state
  const [scopeType, setScopeType] = useState<ScopeType>('solution');
  const [selectedPublisherIds, setSelectedPublisherIds] = useState<string[]>([]);
  const [publisherScopeMode, setPublisherScopeMode] = useState<PublisherScopeMode>('all-solutions');
  const [selectedSolutionIds, setSelectedSolutionIds] = useState<string[]>([]);
  const [includeSystem, setIncludeSystem] = useState(false);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

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

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!window.toolboxAPI) {
        throw new Error('PPTB Desktop API not available. Please run this tool inside PPTB Desktop.');
      }

      const client = new PptbDataverseClient(window.toolboxAPI);
      const publisherDiscovery = new PublisherDiscovery(client);
      const solutionDiscovery = new SolutionDiscovery(client);

      const [publishersData, solutionsData] = await Promise.all([
        publisherDiscovery.getPublishers(),
        solutionDiscovery.getSolutions(),
      ]);

      setPublishers(publishersData);
      setSolutions(solutionsData);

      if (publishersData.length === 0 && solutionsData.length === 0) {
        setError('No custom publishers or solutions found in this environment.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    loadData();
  };

  const handleScopeTypeChange = (_: unknown, data: { value: string }) => {
    setScopeType(data.value as ScopeType);
  };

  const handlePublisherScopeModeChange = (ev: unknown, data: { value: string }) => {
    // Prevent event bubbling to parent RadioGroup
    if (ev && typeof ev === 'object' && 'stopPropagation' in ev && typeof ev.stopPropagation === 'function') {
      ev.stopPropagation();
    }
    setPublisherScopeMode(data.value as PublisherScopeMode);
  };

  // Filtered solutions based on selected publishers
  const filteredSolutions = useMemo(() => {
    if (scopeType !== 'publisher' || selectedPublisherIds.length === 0) {
      return [];
    }

    // Get the unique names of selected publishers
    const selectedPublisherUniqueNames = publishers
      .filter((p) => selectedPublisherIds.includes(p.publisherid))
      .map((p) => p.uniquename);

    // Filter solutions where the publisher's unique name matches
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

  const handleContinue = () => {
    if (!isValidSelection()) return;

    let scope: ScopeSelection;

    if (scopeType === 'publisher') {
      const selectedPubs = publishers.filter((p) => selectedPublisherIds.includes(p.publisherid));

      scope = {
        type: 'publisher',
        publisherIds: selectedPublisherIds,
        publisherNames: selectedPubs.map((p) => p.friendlyname),
        publisherPrefixes: selectedPubs.map((p) => p.customizationprefix),
        mode: publisherScopeMode,
        includeSystem,
      };

      if (publisherScopeMode === 'specific-solutions') {
        const selectedSols = solutions.filter((s) => selectedSolutionIds.includes(s.solutionid));
        scope.solutionIds = selectedSolutionIds;
        scope.solutionNames = selectedSols.map((s) => s.friendlyname);
      }
    } else {
      const selectedSols = solutions.filter((s) => selectedSolutionIds.includes(s.solutionid));
      scope = {
        type: 'solution',
        solutionIds: selectedSolutionIds,
        solutionNames: selectedSols.map((s) => s.friendlyname),
        includeSystem,
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
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Title1>Power Platform System Blueprint</Title1>
        <Subtitle1 className={styles.subtitle}>Select what you'd like to document</Subtitle1>
      </div>

      {error && (
        <div className={styles.errorContainer}>
          <MessageBar intent="error">
            <MessageBarBody>
              <MessageBarTitle>Failed to load data</MessageBarTitle>
              {error}
              <br />
              <Button appearance="secondary" size="small" onClick={handleRetry} style={{ marginTop: '8px' }}>
                Retry
              </Button>
            </MessageBarBody>
          </MessageBar>
        </div>
      )}

      <div className={styles.section}>
        <RadioGroup value={scopeType} onChange={handleScopeTypeChange} className={styles.radioGroup}>
          {/* Option A: By Publisher */}
          <div className={styles.radioOption}>
            <Radio value="publisher" label="By Publisher" disabled={loading || publishers.length === 0} />
            {scopeType === 'publisher' && (
              <div className={styles.radioContent}>
                <Field hint={`Select one or more publishers. ${selectedPublisherIds.length} selected.`}>
                  <Dropdown
                    className={styles.dropdown}
                    placeholder="Select publishers..."
                    multiselect
                    selectedOptions={selectedPublisherIds}
                    onOptionSelect={(_, data) => {
                      if (data.selectedOptions) {
                        setSelectedPublisherIds(data.selectedOptions);
                      }
                    }}
                    disabled={loading}
                  >
                    {publishers.map((publisher) => (
                      <Option key={publisher.publisherid} value={publisher.publisherid} text={publisher.friendlyname}>
                        <div className={styles.solutionInfo}>
                          <Text>{publisher.friendlyname}</Text>
                          <Text className={styles.secondaryText}>Prefix: {publisher.customizationprefix}</Text>
                        </div>
                      </Option>
                    ))}
                  </Dropdown>
                </Field>

                {selectedPublisherIds.length > 0 && (
                  <div className={styles.selectedItems}>
                    {selectedPublisherIds.map((pubId) => {
                      const publisher = publishers.find((p) => p.publisherid === pubId);
                      return publisher ? (
                        <Tag
                          key={pubId}
                          dismissible
                          dismissIcon={{
                            onClick: () =>
                              setSelectedPublisherIds(selectedPublisherIds.filter((id) => id !== pubId)),
                          }}
                          secondaryText={`Prefix: ${publisher.customizationprefix}`}
                        >
                          {publisher.friendlyname}
                        </Tag>
                      ) : null;
                    })}
                  </div>
                )}

                {selectedPublisherIds.length > 0 && (
                  <div className={styles.subOptions}>
                    <div onClick={(e) => e.stopPropagation()}>
                      <RadioGroup
                        value={publisherScopeMode}
                        onChange={handlePublisherScopeModeChange}
                        layout="horizontal"
                      >
                        <Radio
                          value="all-solutions"
                          label={`All solutions from selected publisher${selectedPublisherIds.length > 1 ? 's' : ''}`}
                        />
                        <Radio value="specific-solutions" label="Specific solutions only" />
                      </RadioGroup>
                    </div>

                    {publisherScopeMode === 'specific-solutions' && (
                      <>
                        <Field
                          hint={`Select solutions from chosen publishers. ${selectedSolutionIds.length}/${filteredSolutions.length} selected.`}
                        >
                          <Dropdown
                            className={styles.dropdown}
                            placeholder="Select solutions..."
                            multiselect
                            selectedOptions={selectedSolutionIds}
                            onOptionSelect={(_, data) => {
                              if (data.selectedOptions) {
                                setSelectedSolutionIds(data.selectedOptions);
                              }
                            }}
                            disabled={loading || filteredSolutions.length === 0}
                          >
                            {filteredSolutions.map((solution) => (
                              <Option key={solution.solutionid} value={solution.solutionid} text={solution.friendlyname}>
                                <div className={styles.solutionInfo}>
                                  <Text>{solution.friendlyname}</Text>
                                  <Text className={styles.secondaryText}>
                                    v{solution.version} | {solution.publisherid.friendlyname}
                                  </Text>
                                </div>
                              </Option>
                            ))}
                          </Dropdown>
                        </Field>

                        {selectedSolutionIds.length > 0 && (
                          <div className={styles.selectedItems}>
                            {selectedSolutionIds.map((solId) => {
                              const solution = solutions.find((s) => s.solutionid === solId);
                              return solution ? (
                                <Tag
                                  key={solId}
                                  dismissible
                                  dismissIcon={{
                                    onClick: () =>
                                      setSelectedSolutionIds(selectedSolutionIds.filter((id) => id !== solId)),
                                  }}
                                  secondaryText={`v${solution.version}`}
                                >
                                  {solution.friendlyname}
                                </Tag>
                              ) : null;
                            })}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Option B: By Solution */}
          <div className={styles.radioOption}>
            <Radio value="solution" label="By Solution (Recommended)" disabled={loading || solutions.length === 0} />
            {scopeType === 'solution' && (
              <div className={styles.radioContent}>
                <Field hint={`Select one or more solutions. ${selectedSolutionIds.length} selected.`}>
                  <Dropdown
                    className={styles.dropdown}
                    placeholder="Select solutions..."
                    multiselect
                    selectedOptions={selectedSolutionIds}
                    onOptionSelect={(_, data) => {
                      if (data.selectedOptions) {
                        setSelectedSolutionIds(data.selectedOptions);
                      }
                    }}
                    disabled={loading}
                  >
                    {solutions.map((solution) => (
                      <Option key={solution.solutionid} value={solution.solutionid} text={solution.friendlyname}>
                        <div className={styles.solutionInfo}>
                          <Text>{solution.friendlyname}</Text>
                          <Text className={styles.secondaryText}>
                            v{solution.version} | {solution.publisherid.friendlyname}
                          </Text>
                        </div>
                      </Option>
                    ))}
                  </Dropdown>
                </Field>

                {selectedSolutionIds.length > 0 && (
                  <div className={styles.selectedItems}>
                    {selectedSolutionIds.map((solId) => {
                      const solution = solutions.find((s) => s.solutionid === solId);
                      return solution ? (
                        <Tag
                          key={solId}
                          dismissible
                          dismissIcon={{
                            onClick: () => setSelectedSolutionIds(selectedSolutionIds.filter((id) => id !== solId)),
                          }}
                          secondaryText={`v${solution.version}`}
                        >
                          {solution.friendlyname}
                        </Tag>
                      ) : null;
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </RadioGroup>
      </div>

      {/* Include System Entities Checkbox */}
      <div className={styles.checkboxContainer}>
        <Tooltip
          content="Include Microsoft-owned entities like Account, Contact, Opportunity, etc."
          relationship="label"
        >
          <Checkbox
            label="Include system-owned entities"
            checked={includeSystem}
            onChange={(_, data) => setIncludeSystem(data.checked === true)}
          />
        </Tooltip>
      </div>

      {/* Continue Button */}
      <div className={styles.buttonContainer}>
        {onCancel && (
          <Button appearance="secondary" onClick={onCancel} style={{ marginRight: '8px' }}>
            Cancel
          </Button>
        )}
        <Button appearance="primary" onClick={handleContinue} disabled={!isValidSelection()}>
          Continue
        </Button>
      </div>
    </div>
  );
}
