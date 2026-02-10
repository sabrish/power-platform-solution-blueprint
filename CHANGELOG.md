# Changelog

All notable changes to Power Platform Solution Blueprint will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
