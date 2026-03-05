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
} from '../core';
import type { ScopeType, ScopeSelection, PublisherScopeMode } from '../types/scope';
import { Footer } from './Footer';

const useStyles = makeStyles({
  container: {
    width: '100%',
    minHeight: '100%',
    padding: tokens.spacingVerticalXXL,
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    animation: 'fadeIn 0.4s ease-out',
  },
  contentWrapper: {
    width: '100%',
    maxWidth: '900px',
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
  },
  header: {
    marginBottom: tokens.spacingVerticalXL,
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
  },
  subtitle: {
    color: tokens.colorNeutralForeground3,
  },
  section: {
    padding: tokens.spacingVerticalXL,
    borderRadius: tokens.borderRadiusLarge,
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
  const [includeSystem, setIncludeSystem] = useState(true);
  const [includeSystemFields, setIncludeSystemFields] = useState(false); // Default: exclude system fields

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

      if (!window.toolboxAPI || !window.dataverseAPI) {
        throw new Error('PPTB Desktop API not available. Please run this tool inside PPTB Desktop.');
      }

      // Get environment URL from tool context
      const toolContext = await window.toolboxAPI.getToolContext();
      const environmentUrl = toolContext?.connectionUrl || 'Current Environment';

      const client = new PptbDataverseClient(window.dataverseAPI, environmentUrl);
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
      console.error('Error loading publishers and solutions:', err instanceof Error ? err.message : 'Unknown error');
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

      // ALWAYS use solution IDs - we have them in both modes
      let solutionIds: string[];
      let solutionNames: string[];

      if (publisherScopeMode === 'specific-solutions') {
        // User selected specific solutions
        const selectedSols = solutions.filter((s) => selectedSolutionIds.includes(s.solutionid));
        solutionIds = selectedSolutionIds;
        solutionNames = selectedSols.map((s) => s.friendlyname);
      } else {
        // All solutions from selected publishers
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
        excludeSystemFields: !includeSystemFields, // Invert for internal use
      };
    } else {
      const selectedSols = solutions.filter((s) => selectedSolutionIds.includes(s.solutionid));
      scope = {
        type: 'solution',
        solutionIds: selectedSolutionIds,
        solutionNames: selectedSols.map((s) => s.friendlyname),
        includeSystem,
        excludeSystemFields: !includeSystemFields, // Invert for internal use
      };
    }

    onScopeSelected(scope);
  };

  if (loading) {
    return (
      <div className={`${styles.container}`}>
        <div className={`${styles.loadingContainer} enhanced-card`}>
          <Spinner size="large" />
          <Text size={500}>Waking up Dataverse connections...</Text>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.contentWrapper}>
        <div className={styles.header}>
          <div className={styles.headerTop}>
            <div className={styles.headerContent}>
              <Title1 style={{ textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>Power Platform Solution Blueprint</Title1>
              <Subtitle1 className={styles.subtitle}>Select what you'd like to document</Subtitle1>
            </div>
          </div>
        </div>

        {error && (
          <div className={styles.errorContainer}>
            <MessageBar intent="error" className="enhanced-card">
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

        <div className={`${styles.section} enhanced-card`}>
          <Text as="h2" size={600} weight="semibold" style={{ marginBottom: tokens.spacingVerticalL, display: 'block' }}>Choose Selection Mode</Text>
          <RadioGroup value={scopeType} onChange={handleScopeTypeChange} className={styles.radioGroup}>
            {/* Option A: By Publisher */}
            <div className={styles.radioOption}>
              <Radio value="publisher" label="By Publisher" disabled={loading || publishers.length === 0} />
              {scopeType === 'publisher' && (
                <div className={`${styles.radioContent} fade-in`}>
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
                <div className={`${styles.radioContent} fade-in`}>
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

      </div>

      {/* Options Checkboxes */}
      <div className={`${styles.checkboxContainer} enhanced-card`} style={{ marginTop: '0', borderTop: 'none', padding: tokens.spacingVerticalXL }}>
        <Text as="h3" size={500} weight="semibold" style={{ marginBottom: tokens.spacingVerticalM, display: 'block' }}>Additional Settings</Text>
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

        <div style={{ marginTop: tokens.spacingVerticalM }}>
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
          <Button size="large" appearance="secondary" onClick={onCancel} style={{ marginRight: '8px' }}>
            Cancel
          </Button>
        )}
        <Button size="large" appearance="primary" onClick={handleContinue} disabled={!isValidSelection()}>
          Continue
        </Button>
      </div>

      <Footer />
    </div>
  );
}
