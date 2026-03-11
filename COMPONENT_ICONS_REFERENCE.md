# Component Icons Reference

This file documents the icons Microsoft uses for each Dataverse / Power Platform solution
component type in the **Power Apps maker portal solution explorer** (`make.powerapps.com`),
observed from the Objects panel screenshots (captured 2026-03-10).

Use this as the source of truth when choosing or updating icons in `src/components/componentIcons.ts`.

---

## Icon decision rules

1. **Microsoft uses a unique, recognisable icon** → match it using the equivalent Fluent UI v9 icon.
2. **Microsoft uses a generic folder icon** → use our own meaningful icon instead.
3. **Component not yet in PPSB** → record here for future reference; do not add to code until the
   component is actually discovered and displayed.

---

## Full catalogue from screenshots

### Unique icons (Microsoft uses a specific, non-folder icon)

| Solution Explorer label | Visual description | Fluent UI icon (best match) | Notes |
|---|---|---|---|
| All | Bullet-list with mixed items | `AppsListDetail24Regular` | Summary/all-items view |
| Agent component collections | Stack of books / library | `Library24Regular` | |
| Agents | Robot / bot head | `Bot24Regular` | |
| AI models | Brain / neural network | `Brain24Regular` | |
| Apps | 2×2 grid quadrant | `Grid24Regular` | Same as our DashboardIcon — consider different size/variant |
| Cards | Flat card with horizontal lines | `Card24Regular` or `Rectangle24Regular` | |
| Choices | Three horizontal lines (list) | `TextBulletList24Regular` | Our current `MultiselectLtr24Regular` is a reasonable match |
| Cloud flows | Branching split arrow (fork) | `CloudFlow24Regular` | **MATCHES** our current icon |
| Column security profiles | Rectangle/table with a lock badge | `LockClosedKey24Regular` or `TableLock24Regular` | We call this Field Security Profiles |
| Connection references | USB/plug connector (vertical plug with prongs) | `PlugConnected24Regular` variant | Distinct from Custom Connectors — exact Fluent name TBD |
| Connection roles | Person silhouette + lock | `PersonLock24Regular` | |
| Custom connectors | Plug pulled out at diagonal angle | `PlugDisconnected24Regular` | Our current `PlugConnected24Regular` shows connected |
| Custom controls | "Abc" text input box | `TextboxAlignBottom24Regular` or `FormNew24Regular` | |
| Dashboards | Bar chart with upward bars | `DataBarVertical24Regular` | |
| Dialogs | Window / dialog box | `AppGeneric24Regular` or `WindowNew24Regular` | |
| Email templates | Envelope | `Mail24Regular` | |
| Environment variables | Formula variable box `{(v)}` | `BracesVariable24Regular` | **Our current `TextBulletListSquareSettingsRegular` does not match** |
| Mail merge templates | Envelope with settings gear | `MailSettings24Regular` | |
| Pages | Document with pencil/pen | `DocumentEdit24Regular` | **Our current `Document24Regular` does not match** |
| Plug-in assemblies | Jigsaw puzzle piece | `PuzzlePiece24Regular` | **Our current `BracesVariable24Regular` does not match** |
| Plug-in steps | Stepped / staircase document | `DocumentFlow24Regular` or `Steps24Regular` | We do not separate steps from assemblies |
| Processes | Gear / settings wrench | `Settings24Regular` | Microsoft groups BPF, Classic WF, Business Rules here |
| Reports | Bar chart with document | `DataBarVerticalAscending24Regular` or `DocumentChart24Regular` | |
| Security roles | Two person silhouettes + lock badge | `PeopleLock24Regular` | **Our current `Shield24Regular` does not match** |
| Service endpoints | Arrow / plug pointing left (connector) | `PlugDisconnected24Regular` or `ArrowImport24Regular` | |
| Settings | Folder with gear overlay | `FolderSettings24Regular` | |
| Site maps | Window with grid/sitemap layout | `LayoutCellFour24Regular` or `Map24Regular` | |
| Tables | Grid table (rows and columns) | `Table24Regular` | **MATCHES** our current icon |
| Web resources | Globe with grid lines | `Globe24Regular` | **MATCHES** our current icon |

### Generic folder icons (Microsoft uses a plain folder — use our own meaningful icon)

The following component types show a generic folder icon in the solution explorer.
For these, our own semantically meaningful icon is preferred over matching Microsoft.

| Solution Explorer label | Notes |
|---|---|
| Agent components | |
| AICopilot | |
| Allowed MCP Client | |
| Application ribbons | |
| Article templates | |
| Catalog | |
| Catalog Assignment | |
| Custom API | We use our own icon (not folder); `ArrowSwap24Regular` was wrong — TBD replacement |
| Custom API Request Parameter | Sub-type of Custom API |
| Custom API Response Property | Sub-type of Custom API |
| Data Processing configuration | |
| Data workspaces | |
| Duplicate Detection Rule | |
| DVFileSearch / DVFileSearchAttribute / DVFileSearchEntity | |
| DVTableSearch / DVTableSearchEntity | |
| FeatureControlSetting | |
| Flow Machine Group / Image / Image Version | |
| FxExpression | |
| Key Vault Reference | |
| Knowledge search filter | |
| MainFewShot | |
| Managed Identity | |
| MetadataForArchival | |
| Plugin Package | We use `Archive24Regular` — more informative than folder |
| PM Template | |
| Privileges Removal Setting | |
| Record Filter | |
| RoleEditorLayout | |
| Schedule | |
| Secured Masking Rule | |
| Solution Component Attribute/Batch/Configuration/Relationship Configuration | |
| Synapse Link Profile / Profile Entity / Schedule | |
| Virtual table data providers / data sources | |

---

## Current PPSB icon decisions

This table shows every component type PPSB currently documents, the Microsoft icon from
the solution explorer, our current icon, and the status.

| PPSB Component | Microsoft icon | Our icon | Status |
|---|---|---|---|
| Entities / Tables | Grid table | `Table24Regular` | ✅ Matches |
| Plugins | Puzzle piece | `BracesVariable24Regular` | ❌ Should be `PuzzlePiece24Regular` |
| Plugin Packages | Generic folder | `Archive24Regular` | ✅ Our own (better than folder) |
| Cloud Flows | Branching split arrow | `CloudFlow24Regular` | ✅ Matches |
| Business Rules | Not shown separately (part of Processes) | `ClipboardTaskListLtr24Regular` | ✅ Our own |
| Classic Workflows | Document + gear badge (grouped under Processes) | `ClipboardSettings24Regular` | ✅ Matches Microsoft's Processes icon |
| Business Process Flows | Not shown separately (part of Processes) | `Flowchart24Regular` | ✅ Our own |
| Custom APIs | Generic folder | `ArrowSwap24Regular` | ⚠️ Our own but `ArrowSwap` is semantically wrong — replace |
| Environment Variables | Formula variable box `{(v)}` | `TextBulletListSquareSettingsRegular` | ❌ Should be `BracesVariable24Regular` |
| Connection References | USB/plug connector | `Link24Regular` | ❌ Should be plug icon (chain link ≠ plug) |
| Web Resources | Globe | `Globe24Regular` | ✅ Matches |
| Global Choices | Three-line list | `MultiselectLtr24Regular` | ✅ Reasonable match |
| Custom Connectors | Angled/disconnected plug | `PlugConnected24Regular` | ⚠️ Close but connected vs disconnected |
| Security Roles | Two people + lock badge | `Shield24Regular` | ❌ Should be `PeopleLock24Regular` (or equivalent) |
| Field Security Profiles | Table/rectangle + lock badge | `ShieldTask24Regular` | ❌ Should be table+lock icon |
| Custom Pages | Document + pencil | `Document24Regular` | ❌ Should be `DocumentEdit24Regular` |

---

## Pending icon name verification

The following proposed replacements need `pnpm typecheck` verification before committing,
as the Fluent UI export names may differ from what is listed here:

- `PuzzlePiece24Regular` — for Plugins
- `PeopleLock24Regular` — for Security Roles (may be `PersonLock24Regular` or similar)
- `PlugDisconnected24Regular` — for Custom Connectors
- `DocumentEdit24Regular` — for Custom Pages
- Table+lock icon — for Field Security Profiles (exact name TBD)
- Plug/connector icon — for Connection References (must not clash with Custom Connectors)

Run `pnpm typecheck` after any icon name change; the TypeScript compiler will catch
non-existent export names immediately.

---

*Last updated: 2026-03-10 — sourced from Power Apps maker portal solution explorer screenshots.*
