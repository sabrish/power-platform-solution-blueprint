# Changelog

All notable changes to Power Platform Solution Blueprint will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.7.2] - 2026-02-23

### Fixed
- **BPF Steps Always 0** - Business Process Flow stages now correctly report their step count
  - Steps are defined in `processstage.clientdata` as a top-level JSON array
  - Each entry has `DisplayName`, `Type`, and `Field: { AttributeName, IsRequired }`
  - Updated parser to read this format, exposing field names and required flags per step
- **Export Failures Under PPTB Desktop** - All export operations (JSON, Markdown, HTML, ZIP) now work correctly
  - Dynamic `import()` calls created separate Vite chunks unreachable under the `pptb-webview://` protocol
  - Converted to static imports so reporters and zip packager bundle into the main chunk
- **Text Overflow in Component Lists** - Long strings (assembly names, unique names) no longer overflow grid columns
  - Added `minWidth: 0`, `wordBreak: 'break-word'`, and `overflowWrap: 'anywhere'` to detail grid items
  - Affects Plugin list, BPF list, and their expanded detail panels
- **OData Query Compatibility** - Fixed query failures in multiple discovery classes
  - Removed unsupported `orderBy` from classic workflow queries
  - Fixed GUID format in custom connector OData filters
  - Improved GUID normalisation in column security and web resource queries
- **Placeholder Descriptions** - Business rules no longer show "Click to add description" placeholder text
  - Applied existing `filterDescription` utility to both row preview and expanded detail panel
- **Business Rule Parser** - Improved parsing robustness for edge-case XAML structures

### Changed
- **Classic Workflow Detail View** - Removed verbose migration guidance sections
  - Removed: Migration Approach, Detected Features & Migration Path, Migration Challenges, Migration Resources
  - Retained: Migration Complexity Alert and Advisory summary
- **Theme System** - Simplified by removing the standalone `ThemeToggle` component
  - Theme handling consolidated into `ThemeContext`; toggle removed from header bars
- **Component List Layouts** - Improved EnvironmentVariablesList, CustomConnectorsList, and security views with expandable rows
- **Blueprint Metadata** - Added `solutionNames` field to blueprint result metadata
- **Connection URL** - `PptbDataverseClient` now receives the environment URL from `toolContext.connectionUrl`

## [0.7.1] - 2026-02-23

### Fixed
- **Classic Workflows Not Appearing** - Removed unsupported `orderBy` from the classic workflow OData query
  - The `orderBy primaryentity` clause caused the Dataverse query to fail silently, returning an empty list
  - Replaced with equivalent in-memory sort after fetch
- **Custom Connectors Not Appearing** - Corrected GUID format in custom connectors OData filter
  - Filter was adding braces (`connectorid eq {guid}`) instead of removing them
  - OData requires raw GUIDs without braces or quotes; changed to use `id.replace(/[{}]/g, '')`
- **ERD Split-Publisher Diagrams** - Replaced split per-publisher ERDs with a single all-entities diagram
  - Removed top-15 most-connected-entities filter that was hiding entities
  - Removed per-publisher diagram splitting; now generates one diagram with all entities colour-coded by publisher
  - Removed misleading "50+ entities" warning banner
- **Component Browser Column Overflow** - Long strings no longer overflow list columns
  - `EnvironmentVariablesList`: replaced wordWrap hacks with `TruncatedText`
  - `ClassicWorkflowsList`: added `TruncatedText` for name, description, and entity columns
  - `CustomConnectorsList`: added `TruncatedText` for display name and schema name columns

## [0.7.0] - 2026-02-22

### Added
- **Component Browser Relationship Filtering** - Entity detail view now filters relationships intelligently
  - Filters out system relationships (createdby, modifiedby, ownerid, owninguser, etc.)
  - Filters relationships to system entities (systemuser, team, businessunit, organization, transactioncurrency)
  - Shows only relationships where both entities are in the selected solution scope
  - Consistent filtering with ERD and dbdiagram.io exports
  - Uses same `isSystemRelationship()` logic across all views

- **Cross-Entity Automation Preview** - New "Coming Soon" placeholder with sample data
  - Always visible tab showing planned feature capabilities
  - Demonstrates future functionality with sample cross-entity operations
  - Lists planned features: plugin decompilation (ILSpy), workflow XAML parsing, business rule analysis
  - Includes GitHub repository link for tracking development progress
  - Sample data: Contact→Account (Flow), Opportunity→Quote (Plugin), Case→Email (Flow)

### Changed
- **Tab Organization** - Improved tab ordering for better user experience
  - Moved "Cross-Entity Automation (Coming Soon)" to last position
  - Order: Dashboard → ERD → External Dependencies → Solution Distribution → Cross-Entity Automation
  - Added "(Coming Soon)" label to tab name for clarity
  - Consistent positioning across UI and all export formats (HTML, Markdown)

- **Cross-Entity Automation Status** - Changed from limited implementation to transparent development preview
  - Removed unreliable plugin name pattern matching
  - Removed placeholder business rule and classic workflow detection
  - Now shows clear "Coming Soon" banner explaining planned capabilities
  - Provides realistic sample data demonstrating future functionality

### Enhanced
- **Export Consistency** - All export formats reflect new structure
  - HTML export: Cross-Entity Automation section repositioned as last section
  - HTML navigation: Updated link label to include "(Coming Soon)"
  - Markdown export: Cross-Entity Automation moved to last position in README navigation
  - Markdown export: Section heading and link updated with "(Coming Soon)" label
  - All exports always include cross-entity section (not conditionally generated)

## [0.6.2] - 2026-02-12

### Fixed
- **npm-shrinkwrap.json Compatibility** - Regenerated npm-shrinkwrap.json using npm instead of pnpm
  - Previous version was generated with pnpm, creating `.pnpm` directory paths incompatible with npm
  - Caused `Cannot read properties of null (reading 'matches')` error during npm install
  - Now generated using native npm, ensuring full compatibility with npm install workflows
  - Fixes installation issues when testing with `npm pack` and `npm install --production --no-optional`

### Added
- **Documentation** - Added `NPM_SHRINKWRAP_GENERATION.md` with step-by-step instructions for regenerating npm-shrinkwrap.json
  - Required whenever dependencies are updated
  - Maintains compatibility with both pnpm (development) and npm (PPTB Desktop installation)

## [0.6.1] - 2026-02-11

### Added
- **npm-shrinkwrap.json** - Added shrinkwrap file for PPTB Desktop npm installation compatibility
  - Required by PPTB Desktop's debug mode when loading tools from npm
  - Ensures consistent dependency versions across installations

### Fixed
- **PPTB Desktop Compatibility** - Resolved "npm-shrinkwrap.json required but not found" error when loading tool via npm in PPTB Desktop

## [0.6.0] - 2026-02-11

### Added
- **Forms & Web Resources Discovery** - Complete form documentation with web resource registration
  - Form discovery now correctly handles `rootcomponentbehavior` field:
    - Entities with `rootcomponentbehavior=0` include all their forms implicitly
    - Entities with `rootcomponentbehavior=1` only include forms explicitly in solutioncomponents
  - Discovers all form types (Main, Quick Create, Quick View, Card)
  - Tracks web resource (JavaScript) libraries registered on each form
  - Documents event handlers for each form:
    - OnLoad, OnSave, OnChange, TabStateChange events
    - Library name, function name, and parameters
    - Enabled/disabled status
    - Attribute-specific handlers (e.g., OnChange for specific fields)

### Enhanced
- **HTML Export** - Added "Forms & Web Resources" tab to entity documentation
  - Displays form name, type, and all registered web resources
  - Shows event handlers table with Event, Library, Function, and Status columns
  - OnChange events display the associated attribute name
  - Event handler parameters displayed when present
- **Markdown Export** - Added "Forms & Web Resources" section to entity schema documentation
  - Form name and type as heading
  - Web resources listed with monospace formatting
  - Event handlers in markdown table format
- **JSON Export** - Already includes complete form data (no changes needed)

### Changed
- **Code Quality** - Removed all debug console.logs that displayed GUIDs and component details
- **Solution Component Discovery** - Now queries and tracks `rootcomponentbehavior` field for accurate form membership

### Fixed
- **Form Discovery Bug** - Forms were incorrectly excluded when entity had `rootcomponentbehavior=0`
  - Previously only showed forms explicitly in solutioncomponents table
  - Now correctly includes all forms for entities with "include all subcomponents" behavior
  - Matches Power Platform solution behavior exactly
- **Column Security Profiles** - Added graceful error handling when `columnsecurityprofiles` table doesn't exist
  - Returns empty array instead of failing when table is not available in environment

### Technical Details
- Updated `ComponentInventoryWithSolutions` interface to include `entitiesWithAllSubcomponents: Set<string>`
- Modified `SolutionComponentDiscovery.discoverComponents()` to query and track `rootcomponentbehavior`
- Enhanced `BlueprintGenerator.processForms()` to accept and use `entitiesWithAllSubcomponents` parameter
- Form filtering logic now checks both explicit solutioncomponents membership and implicit inclusion via rootcomponentbehavior

## [0.5.4] - 2026-02-11

### Changed
- **Documentation** - Updated README version badge to reflect correct version (was showing 0.5.1, now shows 0.5.4)

## [0.5.3] - 2026-02-11

### Fixed
- **HTTP 414/400 "Request Too Long" errors** - Fixed query URL length issues across multiple discovery classes
  - Added batching (batch size = 20) to 4 discovery classes: SecurityRoleDiscovery, FieldSecurityProfileDiscovery, FormDiscovery, SolutionComponentDiscovery
  - Reduced privilege query batch size to 10 for conservative URL length management
  - Properly clean GUIDs (remove braces) before building OData filters
- **Metadata API query errors** - Fixed "query parameter not supported" error when selecting by publisher
  - Removed unsupported `startswith()` function from EntityDefinitions metadata queries
  - Removed unsupported `orderBy` parameter from metadata API calls
  - Now fetches all custom entities and filters in memory (metadata API limitations)

### Changed
- **Publisher scope architecture** - Major refactoring for simplicity and maintainability
  - Publisher scope now always uses solution IDs internally (same path as solution scope)
  - Eliminated separate publisher-specific query paths
  - Removed `getEntitiesByPublisher()` method (no longer needed)
  - Reduced code by 78 lines while improving reliability
- **Consistent UX** - Changed "Exclude system fields" checkbox to "Include system fields"
  - Both checkboxes now use "Include" pattern for clarity
  - Default: Include system entities ✓, Include system fields ✗
- **Better progress messages** - Progress bar now shows component type being processed
  - Was: "x of y entities processed" (always)
  - Now: "x of y [plugins/flows/business rules/entities] processed" (dynamic)

### Technical Details
- All discovery classes now consistently use `batchSize = 20` (except privileges which uses 10)
- GUIDs in OData filters: raw format without braces or quotes per Dataverse requirements
- Normalized GUID comparison: lowercase without braces for consistent lookups

## [0.5.2] - 2026-02-10

### Changed

**Publishing Infrastructure**
- Testing npm release with Trusted Publishers (OIDC)
- Fixed workflow environment name to match actual environment configuration
- Configured npm Trusted Publishing for token-free deployments

### Technical Notes
- This is a test release to verify npm Trusted Publishing setup
- Future releases will use OIDC authentication automatically
- No functional changes to the tool itself

[0.5.2]: https://github.com/sabrish/power-platform-solution-blueprint/releases/tag/v0.5.2

## [0.5.1] - 2026-02-10

### Changed

**Repository Structure**
- Restructured repository from monorepo to flat structure to comply with PPTB tool development standards
- Moved `packages/pptb-tool/*` to root directory for proper PPTB Desktop integration
- Moved `packages/core/src/*` to `src/core/` maintaining logical separation
- Updated all 47 source files with corrected import paths (replaced workspace references with relative paths)
- Consolidated package.json files (removed workspace configuration)
- Preserved documentation and screenshots during restructure

**API Integration**
- Integrated official `@pptb/types` package (v1.0.19) from npm registry
- Updated all code to use `window.dataverseAPI` global (official PPTB Desktop API structure)
- Removed custom type definitions in favor of official types
- Updated `PptbDataverseClient` to accept `DataverseAPI.API` directly instead of nested structure
- Updated all components to use `await window.toolboxAPI.getToolContext()` (async method)

**Documentation**
- Updated `docs/API_SECURITY.md` to reflect official @pptb/types integration
- Clarified API connection mechanism and authentication flow

### Fixed

**Export Consistency**
- Fixed ERD exports to generate single comprehensive diagram instead of 3 diagrams
- HTML exports now show 1 ERD matching the in-tool UI behavior
- Markdown exports now use only the first (comprehensive) ERD diagram
- Eliminated redundant publisher-specific diagrams in exported documentation

**PPTB Desktop Compatibility**
- Added `base: './'` to `vite.config.ts` to fix dynamic import path resolution
- Resolved "Failed to fetch dynamically imported module" error with custom `pptb-webview://` protocol
- All asset paths now use relative paths compatible with PPTB Desktop's webview environment

### Added

**User Interface**
- Added author attribution to footer ("by SAB" with link to GitHub profile)
- Enhanced footer with GitHub repository link and Open icon

### Technical Notes

**Breaking Changes**
- Repository structure changed from monorepo to flat layout
- Import paths changed from workspace references (`@ppsb/core`) to relative paths (`./core` or `../core`)
- API initialization requires awaiting `getToolContext()` instead of synchronous access
- `PptbDataverseClient` constructor signature changed to accept `DataverseAPI.API`

**Migration Guide**
- If extending this codebase, use relative imports instead of workspace package references
- Use `window.dataverseAPI` for Dataverse operations instead of `window.toolboxAPI.dataverse`
- Always await `window.toolboxAPI.getToolContext()` for tool context access

**Dependencies**
- Added `@pptb/types@^1.0.19` as devDependency (official PPTB Desktop type definitions)
- Maintained all existing runtime dependencies (React, Fluent UI, Mermaid, JSZip)

[0.5.1]: https://github.com/sabrish/power-platform-solution-blueprint/releases/tag/v0.5.1
## [0.5.0] - 2026-02-08

### Added

**Discovery & Documentation**
- Complete entity schema discovery (fields, relationships, keys, alternate keys)
- Plugin discovery with full registration details and execution order analysis
- Power Automate flow discovery with trigger analysis and external call detection
- Business rule discovery and parsing (client-side and server-side)
- Classic workflow discovery with migration recommendations and risk assessment
- Business Process Flow documentation with stage and step details
- JavaScript web resource analysis with external call detection and deprecated API warnings (Xrm.Page)
- Custom API documentation with complete parameter specifications
- Environment variable discovery and value tracking (critical for ALM)
- Connection reference discovery with premium connector detection
- Global choice (shared option set) documentation
- Security role discovery with entity permissions and special permissions matrices
- Field security profile discovery
- Attribute masking rule discovery
- Column security profile discovery

**Analysis & Visualization**
- Entity Relationship Diagram (ERD) generation using Mermaid with publisher color-coding
- Execution pipeline visualization showing client → sync → async automation flow per entity
- Cross-entity automation mapping to identify automation that affects multiple entities
- External dependency detection and risk analysis (categorized as Trusted/Known/Unknown)
- Solution distribution analysis showing component breakdown across solutions
- Entity complexity scoring based on field count, automation density, and relationships
- Performance risk identification (synchronous plugins with external calls, execution chains)
- Deprecated API detection (classic workflows, Xrm.Page usage in JavaScript)

**Export Formats**
- Markdown export with complete file structure ready for Azure DevOps Wiki
- JSON export for programmatic use, baseline storage, and CI/CD integration
- HTML single-page export with interactive navigation, search, and accordion sections
- ZIP packaging bundling all formats with organized directory structure

**User Interface**
- Smart scope selection (by publisher, solution, or all entities)
- Multi-select dropdowns with live filtering and selected item management
- Real-time progress tracking during generation with phase indicators
- Interactive results dashboard with tabs and expandable sections
- ERD view with zoom/pan and entity quick links
- Entity detail view with complete schema, automation, and execution pipeline
- Security roles view with interactive accordion and permission matrices
- Export dialog with format selection and download management
- Comprehensive error handling with user-friendly messages and retry options
- Accessibility compliance (WCAG AA standards)
- Loading states with spinners and progress indicators
- Responsive design (desktop optimized, mobile functional)

**Technical Infrastructure**
- Monorepo structure with `@ppsb/core` (pure TypeScript) and `@ppsb/pptb-tool` (React UI)
- PPTB Desktop integration via `window.toolboxAPI`
- TypeScript 5.x with strict mode and comprehensive type definitions
- React 18 with Vite 5 for fast development and optimized builds
- Fluent UI v9 component library (Microsoft Design System)
- Mermaid diagram rendering for ERD and execution pipelines
- JSZip for multi-file export packages
- Performance optimizations (batched queries, in-memory filtering, lazy rendering)
- Error handling and retry logic for Dataverse API calls

### Development Notes
- Developed with significant AI collaboration:
  - **ChatGPT (OpenAI)**: Initial brainstorming, concept validation, feature ideation
  - **Claude (Anthropic)**: Detailed architecture design, comprehensive implementation via Claude Code
- Built on modern web technologies: TypeScript 5.x, React 18, Fluent UI v9, Vite 5
- Clean architecture with core business logic separated from UI concerns
- Extensible design for future enhancements and custom analyzers

### Known Limitations
- **Canvas Apps**: Metadata only (description, connection references) due to API limitations
- **Custom Pages**: Metadata only (no component-level analysis available)
- **Power Pages**: Only included if deployed to Dataverse (site settings, web files)
- **Customer Insights - Journeys**: Not included in v0.5 (planned for future version)
- **Baseline Comparison**: Planned for v0.6 (compare current state against saved JSON baseline)
- **CLI Tool**: Planned for v0.6 (command-line interface for automation)
- **CI/CD Integration**: Planned for v0.6 (GitHub Actions, Azure DevOps tasks)
- **Plugin Code Analysis**: Not available (requires source code access, most plugins are compiled DLLs)
- **Custom Connector Details**: Metadata only (OpenAPI spec not accessible via Dataverse API)
- **Large Environments**: May take 10-20 minutes for environments with 500+ entities and complex automation

### Performance Considerations
- **Query Optimization**: Batched queries reduce API calls from thousands to hundreds
- **GUID Normalization**: Proper GUID handling prevents silent failures in OData filters
- **Selective $select**: Only requests needed fields to minimize payload size
- **Strategic $expand**: Fetches related data when always needed to reduce round-trips
- **In-Memory Filtering**: Client-side filtering when server-side options are limited
- **Lazy Rendering**: Large tables and diagrams render only when viewed
- **Progress Tracking**: Real-time feedback during long-running operations

### Security & Privacy
- **No Data Storage**: PPSB never stores your Dataverse data on external servers
- **Local Processing**: All analysis happens client-side in your browser
- **Export Control**: You control where exported files are saved
- **Connection Security**: Uses PPTB Desktop's existing authenticated connection
- **No Telemetry**: No usage data collected or transmitted

[0.5.0]: https://github.com/sabrish/power-platform-solution-blueprint/releases/tag/v0.5.0
