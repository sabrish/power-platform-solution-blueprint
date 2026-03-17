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
**Superseded by:** PATTERN-001 (nameColumn/row specs) and AUDIT-005/006/007 (overflow protection checklist items). See those for the canonical rules and code examples.

Key rule: long text in list rows wraps — it does not truncate. `TruncatedText` must NOT be used in card-row list rows (it hard-codes `whiteSpace: 'nowrap'`). Use `wordBreak: 'break-word'` directly via `useCardRowStyles`.

---

## Audit-Derived Hard Rules (2026-03-09)

Full UI/UX audit completed. All findings below are hard rules for all agents.

### AUDIT-001 — Palette background tokens NEVER as raw CSS backgrounds

`tokens.colorPalette*Background*` must NEVER be applied as `backgroundColor` on raw HTML elements (`<div>`, `<td>`, `<span>`) that contain text. These are light-tinted and produce unreadable text in dark mode.

- Wrong: `style={{ backgroundColor: tokens.colorPaletteGreenBackground2 }}` on a `<div>` with text children
- Right: `<Badge color="success">` or a colored left-border with neutral/transparent background

### AUDIT-002 — Badge shape and size rules (PATTERN-014 extension)

`shape` MUST always be specified on every `Badge` — never omit it (default is `"circular"` which conflicts with the app style).

- `shape="circular"` → counts, single-char indicators, icon-only badges
- `shape="rounded"` → ALL label/text badges (type names, state names, scope names, etc.)
- `shape="square"` → never used

`size="small"` for all row-level badges in card-row list rows. `size="medium"` only in expanded detail panels.

### AUDIT-003 — Hex colors strictly forbidden

Raw hex color values (`#0078D4`, `#107C10` etc.) are NEVER permitted in `makeStyles` or inline `style` props. Always use semantic `color` prop on Badge: `brand`, `informative`, `success`, `warning`, `danger`, `important`, `severe`. Exception: the intentionally-documented entity accent palette in `CrossEntityAutomationView.tsx` (has an explanatory comment).

### AUDIT-004 — Raw pixel values forbidden for spacing

- `'16px'` → `tokens.spacingVerticalL`
- `'8px'` → `tokens.spacingVerticalS`
- `'4px'` → `tokens.spacingVerticalXS`
- `'12px'` → `tokens.spacingHorizontalM`
- `'2px'` gap in icon groups only — acceptable micro-spacing exception
- `fontSize: '12px'` → `tokens.fontSizeBase200`
- `fontSize: '9px'` or `'10px'` → `tokens.fontSizeBase100`
- `fontWeight: 500` → does not exist in Fluent UI. Use `tokens.fontWeightSemibold` (600) or `tokens.fontWeightRegular` (400)
- `borderRadius: '2px'` or `'3px'` → `tokens.borderRadiusSmall`

### AUDIT-005 — nameColumn must always include wordBreak

Every card-row list `nameColumn` style MUST include `wordBreak: 'break-word'`. Missing it causes long names to overflow.

```typescript
nameColumn: {
  display: 'flex', flexDirection: 'column', gap: '2px',
  minWidth: 0, wordBreak: 'break-word',
}
```

### AUDIT-006 — detailValue must always include overflow protection

```typescript
detailValue: {
  fontWeight: tokens.fontWeightSemibold,
  minWidth: 0, wordBreak: 'break-word', overflowWrap: 'anywhere',
}
```

### AUDIT-007 — Card-row grid alignItems must be 'start'

ALL card-row grid containers must use `alignItems: 'start'`. NEVER `'center'`. Using center causes incorrect vertical alignment when any column wraps to multiple lines.

### AUDIT-008 — FilterBar/FilterGroup is mandatory for all filter UIs

Every component list with search or filter controls MUST use `FilterBar` and `FilterGroup`. Forbidden patterns:
- Bespoke filter divs
- Bare `SearchBox` without `FilterBar`
- Bare `Checkbox` without `FilterGroup`
- Bare `Dropdown` without `FilterGroup`
- `Input` for search (use `SearchBox` — it has a built-in search icon)

`ToggleButton` inside `FilterGroup` is the standard pattern for categorical filters.

### AUDIT-009 — EmptyState component is mandatory

The inline emoji + `<Text style={{ fontSize: '48px' }}>` pattern is forbidden. Always use `<EmptyState type="..." />` from `EmptyState.tsx`. Both the "no data" and "no match" (search/filter zero results) states must use EmptyState.

### AUDIT-010 — Native HTML interactive elements are forbidden

Native `<button>`, `<input>`, `<select>` with manual CSS resets must not be used. Always use Fluent UI equivalents (`Button`, `Input`, `Dropdown`) for automatic theme adaptation.

### AUDIT-011 — Hover transition required on all card-row list rows

```typescript
rowStyle: {
  transition: 'all 0.2s ease',
  ':hover': { backgroundColor: tokens.colorNeutralBackground1Hover, boxShadow: tokens.shadow4 },
}
```

### AUDIT-012 — detailsGrid minmax standard is 200px

All `detailsGrid` styles must use `minmax(200px, 1fr)`. Not 250px.

### AUDIT-013 — DataGrid is forbidden (confirmed again)

`DataGrid` must not be used for any component browser list. Card-row accordion is required. Already in learnings.md [2026-02-22] — confirmed by the 2026-03-09 audit finding HIGH-07 and HIGH-08.

---

## PATTERN-018 — Sticky Table Column zIndex (Header AND Body Cells)

**Source:** learnings.md [2026-03-09]
**Applies to:** Developer, Reviewer

When implementing a sticky column in a scrollable HTML table, `zIndex` is required on BOTH header and body cells. Missing it from body `<td>` cells causes scrolling content to paint over the sticky column.

### Required zIndex assignment

| Element | CSS properties |
|---------|---------------|
| Header corner `<th>` (sticky col + sticky row) | `position:sticky`, `top:0`, `left:0`, `zIndex:3`, `backgroundColor` |
| Other header `<th>` (sticky row only) | `position:sticky`, `top:0`, `zIndex:1`, `backgroundColor` |
| Body sticky `<td>` (sticky col) | `position:sticky`, `left:0`, `zIndex:1`, `backgroundColor` |
| All other body `<td>` | `backgroundColor` (prevents dark-mode transparency bleed) |

### Scroll container requirements
```typescript
{ overflowX: 'auto', overflowY: 'auto', maxHeight: '...' }
```

---

## PATTERN-019 — Component-Category Icons Must Come From componentIcons.ts

**Source:** learnings.md [2026-03-09]
**Applies to:** Developer, Reviewer

All component-type icons are owned by `src/components/componentIcons.ts`. Consumer components import from there, never directly from `@fluentui/react-icons` for component-category icons.

### Canonical icon map (as of 2026-03-10)

| Category | Export name | Fluent UI icon |
|----------|-------------|----------------|
| Entities | `EntitiesIcon` | Table24Regular |
| Plugins | `PluginsIcon` | PuzzlePiece24Regular (Microsoft: jigsaw piece) |
| Plugin Packages | `PluginPackagesIcon` | Archive24Regular |
| Flows | `FlowsIcon` | CloudFlow24Regular |
| Business Rules | `BusinessRulesIcon` | ClipboardTaskListLtr24Regular |
| Classic Workflows | `ClassicWorkflowsIcon` | ClipboardSettings24Regular |
| BPFs | `BusinessProcessFlowsIcon` | Flowchart24Regular |
| Custom APIs | `CustomAPIsIcon` | FlashSettings24Regular |
| Environment Variables | `EnvironmentVariablesIcon` | BracesVariable24Regular (Microsoft: {x} variable box) |
| Connection References | `ConnectionReferencesIcon` | UsbPlug24Regular |
| Web Resources | `WebResourcesIcon` | DocumentGlobe24Regular |
| Global Choices | `GlobalChoicesIcon` | MultiselectLtr24Regular |
| Custom Connectors | `CustomConnectorsIcon` | PlugDisconnected24Regular |
| Security Roles | `SecurityRolesIcon` | PeopleLock24Regular |
| Field Security Profiles | `FieldSecurityProfilesIcon` | TableLock24Regular |
| Custom Pages | `CustomPagesIcon` | DocumentEdit24Regular |
| Canvas Apps | `CanvasAppsIcon` | AppsListRegular |
| Model-Driven Apps | `ModelDrivenAppsIcon` | AppGenericRegular |

### Tab icons
Dashboard → `DashboardIcon` (Grid24Regular), ERD → `ErdIcon` (Organization24Regular), External Dependencies → `ExternalDependenciesIcon` (Globe24Regular), Solution Distribution → `SolutionDistributionIcon` (DataUsage24Regular), Cross-Entity Automation → `CrossEntityAutomationIcon` (ArrowBetweenDown24Regular), Fetch Log → `FetchLogIcon` (DocumentBulletList24Regular).

### Exception
`HtmlTemplates.ts` uses its own `navIcon(key)` / `alertIcon()` SVG string helpers — it cannot share React components. That is the only accepted exception.

---

## PATTERN-020 — Emoji Are Forbidden in React UI; Use Fluent UI Icons

**Source:** learnings.md [2026-03-09]
**Applies to:** Developer, Reviewer

Inline emoji must not be used as visual indicators in any React component. Use Fluent UI icon components with semantic token colours.

### Replacement map

| Emoji | Replacement icon | Colour token |
|-------|-----------------|-------------|
| ⚠️ warning | `Warning20Regular` | `tokens.colorStatusWarningForeground1` |
| ℹ️ info | `Info16Regular` | `tokens.colorBrandForeground1` |
| 💡 tip | `LightbulbFilament20Regular` | `tokens.colorStatusWarningForeground1` |
| 🌐 external call (outbound) | `ArrowUpRight20Regular` | inherited |
| 🌐 web resource category | `Globe24Regular` from componentIcons.ts | inherited |

### Coverage notice list pattern
Replace emoji bullet with the matching type icon at 14px; wrap the `<Text as="p">` element:
```tsx
<Text as="p" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
  <CloudFlowIcon style={{ width: 14, height: 14 }} /> Power Automate flows
</Text>
```

### Markdown exception
Markdown exports (`MarkdownReporter.ts`, `MarkdownFormatter.ts`) MAY retain emoji (⚠️, ✅, ❌, ℹ️). Standard Markdown emoji are expected in that format.

---

## PATTERN-021 — HTML Export Icon Helpers (navIcon / alertIcon)

**Source:** learnings.md [2026-03-09]
**Applies to:** Developer, Reviewer

HTML exports in `HtmlTemplates.ts` must use the `navIcon(key)` and `alertIcon(type)` SVG string helpers. Emoji are never permitted in exported HTML.

### Required CSS

```css
/* Navigation sidebar links */
.nav-links a { display: flex; align-items: center; gap: 8px; }

/* Alert box headings */
.alert strong { display: flex; align-items: center; gap: 6px; }
```

### Section headings with icons

```html
<h2 style="display:flex;align-items:center;gap:10px;">
  ${navIcon('plugins')} Plugins
</h2>
```

### Alert boxes

```html
${alertIcon('warning')} <strong>No filter defined</strong>
```

Icons use `currentColor` so they inherit the surrounding text colour and work in both light and dark themes.

---

## COMPONENT SIZE LIMIT

Hard limit: 200 LOC per component file.
At 200 LOC, decompose into sub-components before adding more code.
Compositor pattern: parent component owns state and wiring only;
sub-components are purely presentational or single-concern.

---

## LAYER RULE — UI NEVER CONSTRUCTS CORE CLASSES

React components must never instantiate PptbDataverseClient, any Discovery class,
any Generator class, or any Reporter class directly.
All data loading goes through a hook (useScopeData, useBlueprint, etc.).

Violation (banned):
  const client = new PptbDataverseClient(window.dataverseAPI); // inside a component

Correct:
  const { publishers, solutions } = useScopeData();

---

## FILTER STATE PATTERN

All list components use useListFilter — never independent useState + useCallback pairs
for filter dimensions.
Reference correct examples: FlowsList.tsx, BusinessRulesList.tsx, PluginsList.tsx

---

## LOADING STATE PATTERN

Use discriminated union: phase: 'idle' | 'generating' | 'done' | 'error'
Never use separate isLoading: boolean alongside error state.
Reference: useBlueprint.ts

---

## EXPORT PATTERN

Named exports on all files except src/App.tsx and src/main.tsx.
No default exports on core classes, hooks, or utilities.

---

## MEMOISATION POLICY

useMemo:     required for filtered/sorted arrays derived from props or large state
useCallback: required for handlers passed as props to list items
React.memo:  apply to list item components that receive stable props
Do not over-apply — primitive state derivations do not need useMemo.

---

## REGISTRY PATTERN (component tabs)

ResultsDashboard tab logic is driven by COMPONENT_TABS: ComponentTabDefinition[].
Adding a new component type to the UI = one new entry in that array.
Never add a new branch to defaultSelectedKey, hasResults(), or tab JSX directly.
Source: src/components/ComponentTabRegistry.tsx
