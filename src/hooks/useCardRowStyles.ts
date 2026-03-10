import { makeStyles, tokens } from '@fluentui/react-components';

/**
 * Shared card-row styles used by all list components
 * (FlowsList, PluginsList, BusinessRulesList, ClassicWorkflowsList,
 *  BusinessProcessFlowsList, WebResourcesList, CustomAPIsList,
 *  EnvironmentVariablesList, GlobalChoicesList, CustomConnectorsList).
 *
 * Components that need component-specific columns (e.g. `gridTemplateColumns`)
 * define a local `*Row` key that overrides the grid template while spreading
 * the common base styles via mergeClasses.
 *
 * AUDIT-012: detailsGrid always uses minmax(200px, 1fr).
 * AUDIT-005: nameColumn always has minWidth: 0 + wordBreak: 'break-word'.
 * AUDIT-006: detailValue always has minWidth: 0 + overflow protection.
 * AUDIT-011: card rows always have transition + :hover styles.
 */
export const useCardRowStyles = makeStyles({
  /** Outer list wrapper */
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },

  /** Small toggle-buttons inside FilterBar */
  filterButton: {
    minWidth: 'unset',
    paddingLeft: tokens.spacingHorizontalS,
    paddingRight: tokens.spacingHorizontalS,
  },

  /**
   * Base card-row — components apply this alongside a local key that sets
   * `gridTemplateColumns` for their specific column layout.
   * AUDIT-007: alignItems: 'start'
   * AUDIT-011: transition + :hover required
   */
  cardRow: {
    gap: tokens.spacingHorizontalM,
    alignItems: 'start',
    padding: tokens.spacingVerticalM,
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
      boxShadow: tokens.shadow4,
    },
  },

  /** Applied on top of cardRow when a row is expanded */
  cardRowExpanded: {
    backgroundColor: tokens.colorBrandBackground2,
  },

  /** Chevron cell — left-most 24 px column */
  chevron: {
    display: 'flex',
    alignItems: 'center',
    color: tokens.colorNeutralForeground3,
  },

  /**
   * Name + subtitle column.
   * AUDIT-005: minWidth: 0 + wordBreak: 'break-word' required.
   */
  nameColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    minWidth: 0,
    wordBreak: 'break-word',
  },

  /** Monospace helper for logical names, IDs, plugin message strings, etc. */
  codeText: {
    fontFamily: 'Consolas, Monaco, monospace',
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },

  /** Wrapping text — used for descriptions and field values */
  wrapText: {
    wordBreak: 'break-word',
    overflowWrap: 'break-word',
    hyphens: 'auto',
  },

  /** Horizontal badge cluster */
  badgeGroup: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    alignItems: 'center',
    flexWrap: 'wrap',
  },

  /** Expanded detail panel beneath the card row */
  expandedDetails: {
    backgroundColor: tokens.colorNeutralBackground2,
    padding: tokens.spacingVerticalL,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderTop: 'none',
    borderRadius: `0 0 ${tokens.borderRadiusMedium} ${tokens.borderRadiusMedium}`,
    marginTop: '-4px',
  },

  /**
   * Responsive details grid inside the expanded panel.
   * AUDIT-012: minmax(200px, 1fr) — not 250px.
   */
  detailsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: tokens.spacingHorizontalM,
  },

  /** Individual label+value pair inside detailsGrid */
  detailItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXXS,
    minWidth: 0,
  },

  /** Muted label above a detail value */
  detailLabel: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },

  /**
   * Detail value cell.
   * AUDIT-006: minWidth: 0 + wordBreak + overflowWrap required.
   */
  detailValue: {
    fontWeight: tokens.fontWeightSemibold,
    minWidth: 0,
    wordBreak: 'break-word',
    overflowWrap: 'anywhere',
  },

  /** Section divider inside the expanded panel */
  section: {
    marginTop: tokens.spacingVerticalM,
  },
});
