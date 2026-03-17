import {
  Text,
  Radio,
  RadioGroup,
  Dropdown,
  Option,
  OptionGroup,
  Tag,
  Field,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import type { Publisher, Solution } from '../../core';
import type { PublisherScopeMode } from '../../types/scope';

const useStyles = makeStyles({
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
  disabledOptionText: {
    color: tokens.colorNeutralForeground4,
    fontSize: tokens.fontSizeBase200,
    fontStyle: 'italic',
  },
  subOptions: {
    marginTop: tokens.spacingVerticalM,
    paddingLeft: tokens.spacingHorizontalL,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
});

export interface PublisherScopePanelProps {
  publishers: Publisher[];
  solutions: Solution[];
  filteredSolutions: Solution[];
  selectedPublisherIds: string[];
  onPublisherIdsChange: (ids: string[]) => void;
  publisherScopeMode: PublisherScopeMode;
  onPublisherScopeModeChange: (mode: PublisherScopeMode) => void;
  selectedSolutionIds: string[];
  onSolutionIdsChange: (ids: string[]) => void;
  isDefaultPublisher: (pub: Publisher) => boolean;
  isDefaultSolution: (sol: Solution) => boolean;
  disabled: boolean;
}

export function PublisherScopePanel({
  publishers,
  solutions,
  filteredSolutions,
  selectedPublisherIds,
  onPublisherIdsChange,
  publisherScopeMode,
  onPublisherScopeModeChange,
  selectedSolutionIds,
  onSolutionIdsChange,
  isDefaultPublisher,
  isDefaultSolution,
  disabled,
}: PublisherScopePanelProps): JSX.Element {
  const styles = useStyles();

  const handlePublisherScopeModeChange = (ev: unknown, data: { value: string }): void => {
    // Prevent event bubbling to parent RadioGroup
    if (
      ev &&
      typeof ev === 'object' &&
      'stopPropagation' in ev &&
      typeof (ev as { stopPropagation: unknown }).stopPropagation === 'function'
    ) {
      (ev as { stopPropagation: () => void }).stopPropagation();
    }
    onPublisherScopeModeChange(data.value as PublisherScopeMode);
  };

  return (
    <div className={styles.radioContent}>
      <Field hint={`Select one or more publishers. ${selectedPublisherIds.length} selected.`}>
        <Dropdown
          className={styles.dropdown}
          placeholder="Select publishers..."
          multiselect
          selectedOptions={selectedPublisherIds}
          onOptionSelect={(_, data) => {
            onPublisherIdsChange(
              (data.selectedOptions ?? []).filter((id) => {
                const pub = publishers.find((p) => p.publisherid === id);
                return !pub || !isDefaultPublisher(pub);
              })
            );
          }}
          disabled={disabled}
        >
          {publishers
            .filter((p) => !isDefaultPublisher(p))
            .map((publisher) => (
              <Option
                key={publisher.publisherid}
                value={publisher.publisherid}
                text={publisher.friendlyname}
              >
                <div className={styles.solutionInfo}>
                  <Text>{publisher.friendlyname}</Text>
                  <Text className={styles.secondaryText}>
                    Prefix: {publisher.customizationprefix}
                  </Text>
                </div>
              </Option>
            ))}
          {publishers.some((p) => isDefaultPublisher(p)) && (
            <OptionGroup label="Not Recommended">
              {publishers
                .filter((p) => isDefaultPublisher(p))
                .map((publisher) => (
                  <Option
                    key={publisher.publisherid}
                    value={publisher.publisherid}
                    text={publisher.friendlyname}
                    disabled
                  >
                    <div className={styles.solutionInfo}>
                      <Text>{publisher.friendlyname}</Text>
                      <Text className={styles.disabledOptionText}>
                        Default Publisher — contains all direct environment customisations.
                      </Text>
                    </div>
                  </Option>
                ))}
            </OptionGroup>
          )}
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
                    onPublisherIdsChange(selectedPublisherIds.filter((id) => id !== pubId)),
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
                    onSolutionIdsChange(
                      (data.selectedOptions ?? []).filter((id) => {
                        const sol = solutions.find((s) => s.solutionid === id);
                        return !sol || !isDefaultSolution(sol);
                      })
                    );
                  }}
                  disabled={disabled || filteredSolutions.length === 0}
                >
                  {filteredSolutions
                    .filter((s) => !isDefaultSolution(s))
                    .map((solution) => (
                      <Option
                        key={solution.solutionid}
                        value={solution.solutionid}
                        text={solution.friendlyname}
                      >
                        <div className={styles.solutionInfo}>
                          <Text>{solution.friendlyname}</Text>
                          <Text className={styles.secondaryText}>
                            v{solution.version} | {solution.publisherid.friendlyname}
                          </Text>
                        </div>
                      </Option>
                    ))}
                  {filteredSolutions.some((s) => isDefaultSolution(s)) && (
                    <OptionGroup label="Not Recommended">
                      {filteredSolutions
                        .filter((s) => isDefaultSolution(s))
                        .map((solution) => (
                          <Option
                            key={solution.solutionid}
                            value={solution.solutionid}
                            text={solution.friendlyname}
                            disabled
                          >
                            <div className={styles.solutionInfo}>
                              <Text>{solution.friendlyname}</Text>
                              <Text className={styles.disabledOptionText}>
                                Default Solution — contains all direct environment customisations.
                              </Text>
                            </div>
                          </Option>
                        ))}
                    </OptionGroup>
                  )}
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
                            onSolutionIdsChange(selectedSolutionIds.filter((id) => id !== solId)),
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
  );
}
