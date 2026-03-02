# Established Patterns — UI, React & Fluent UI v9

<!-- Agents: load this file for any task involving React components, -->
<!-- Fluent UI v9, makeStyles, or user-facing UI behaviour. -->
<!-- For Dataverse patterns see: .claude/memory/patterns-dataverse.md -->

---

## PATTERN-001 — Card-Row Expandable List (Component Browser)

**Source:** CLAUDE.md, UI_PATTERNS.md, FlowsList.tsx, PluginsList.tsx
**Applies to:** All agents, especially Developer

Every list in the Component Browser MUST use the card-row expandable pattern. DataGrid is forbidden for new lists.

### Required Structure

```tsx
const useStyles = makeStyles({
  container: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalS },
  row: {
    display: 'grid',
    // First col: 24px chevron. Second col: minmax(200px, 2fr) name. Rest: auto
    gridTemplateColumns: '24px minmax(200px, 2fr) auto auto auto',
    gap: tokens.spacingHorizontalM,
    alignItems: 'start',
    padding: tokens.spacingVerticalM,
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
    cursor: 'pointer',
    ':hover': { backgroundColor: tokens.colorNeutralBackground1Hover, boxShadow: tokens.shadow4 },
  },
  rowExpanded: { backgroundColor: tokens.colorBrandBackground2 },
  chevron: { display: 'flex', alignItems: 'center', color: tokens.colorNeutralForeground3 },
  nameColumn: {
    display: 'flex', flexDirection: 'column', gap: '2px',
    minWidth: 0,  // REQUIRED — allows column to shrink so text can wrap
    wordBreak: 'break-word',
  },
  codeText: { fontFamily: 'Consolas, Monaco, monospace', fontSize: tokens.fontSizeBase200, color: tokens.colorNeutralForeground3 },
  expandedDetails: {
    backgroundColor: tokens.colorNeutralBackground2,
    padding: tokens.spacingVerticalL,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderTop: 'none',       // REQUIRED — seamless attachment
    borderRadius: `0 0 ${tokens.borderRadiusMedium} ${tokens.borderRadiusMedium}`,
    marginTop: '-4px',       // REQUIRED — seamless attachment
  },
});
```

### Rules
1. Self-contained — no `onSelect` prop, no navigation. Detail expands inline below the row.
2. `makeStyles` only — all styles via design tokens, no inline style objects except one-off overrides.
3. First grid column is always `24px` (chevron), second is always `minmax(200px, 2fr)` (name column).
4. `nameColumn` always has `minWidth: 0` to allow text to wrap below its natural width.
5. Long text in name/detail columns **wraps** — it does not truncate. Do not use `TruncatedText` in card-row lists: it hard-codes `whiteSpace: 'nowrap'` and `textOverflow: 'ellipsis'`, which contradicts the wrap-don't-truncate rule. Use `wordBreak: 'break-word'` directly. See PATTERN-013.
6. Expanded detail has `borderTop: 'none'` and `marginTop: '-4px'` to attach seamlessly.
7. Empty state: full centred panel with icon, heading, description — never a plain string.
8. ResultsDashboard renders `<MyList items={result.items} />` directly — no surrounding conditional or back button.

### Checklist
- [ ] Uses makeStyles + card-row grid (NOT DataGrid)
- [ ] First grid column 24px chevron, second minmax(200px, 2fr) name
- [ ] nameColumn has minWidth: 0 and wordBreak: 'break-word' (wraps — not truncated)
- [ ] TruncatedText NOT used in card-row list rows
- [ ] Expanded detail: borderTop none, marginTop -4px
- [ ] Self-contained — no onSelect / navigation prop
- [ ] Empty state has icon + heading + description

---

## PATTERN-008 — Consistent Checkbox Language ("Include" Pattern)

**Source:** CLAUDE.md, CHANGELOG v0.5.3
**Applies to:** Developer (UI)

All checkboxes use "Include" phrasing, never "Exclude". Internal logic can invert if needed.

```typescript
// UI state — positive naming
const [includeSystem, setIncludeSystem] = useState(true);
const [includeSystemFields, setIncludeSystemFields] = useState(false);

// Defaults: Include system entities ON, Include system fields OFF

// Convert for internal/backward compat if needed
const scope = {
  includeSystem,
  excludeSystemFields: !includeSystemFields,  // invert internally
};
```

---

## PATTERN-009 — Context-Aware Progress Messages

**Source:** CLAUDE.md, CHANGELOG v0.5.3
**Applies to:** Developer

Progress messages show the type of component being processed, not just a generic "entities".

```typescript
const getComponentLabel = (phase: ProgressPhase): string => {
  switch (phase) {
    case 'schema': return 'entities';
    case 'plugins': return 'plugins';
    case 'flows': return 'flows';
    case 'business-rules': return 'business rules';
    default: return 'items';
  }
};
// Produces: "5 of 20 plugins processed" (not "5 of 20 entities processed")
```

---

## PATTERN-013 — Text Display: Wrap, Don't Truncate

**Source:** UI_PATTERNS.md
**Applies to:** Developer (UI)

Long text in list rows wraps; it does not truncate with ellipsis. Use `TruncatedText` for grid cells (which handles the word-break approach). Key CSS values:

```typescript
// Column containing long text
nameColumn: {
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
  minWidth: 0,               // enables wrapping
  wordBreak: 'break-word',
}

// Grid rows with wrapping text
row: {
  alignItems: 'start',       // not 'center' — multi-line content needs top alignment
  gridTemplateColumns: '24px minmax(200px, 2fr) auto auto',
}
```

For detail panels: `minWidth: 0`, `wordBreak: 'break-word'`, `overflowWrap: 'anywhere'`.
