# PPSB Roadmap

Future development plans for Power Platform System Blueprint

> This roadmap is subject to change based on community feedback and priorities

---

## Version 0.6 - Baseline Comparison & Automation (Q2 2026)

### Baseline Comparison Engine

**What**: Compare current system state against a saved baseline to detect changes.

**Features**:
- **Load Baseline**: Import previous blueprint JSON as comparison baseline
- **Change Detection**: Automatically identify added/removed/modified components
  - New entities, fields, relationships
  - Added/removed plugins, flows, business rules
  - Modified automation (execution order changes, trigger updates)
  - New external dependencies
- **Risk Assessment**: Assign risk levels to changes
  - **Critical**: Deleted entity with dependencies, removed required field
  - **High**: Modified sync plugin, changed relationship cardinality
  - **Medium**: New flow, added field, updated business rule
  - **Low**: Description changes, metadata updates
- **Change Log Generation**: Detailed diff report with recommendations
- **Side-by-Side View**: Visual comparison in UI
  - Highlight additions (green), deletions (red), modifications (yellow)
  - Entity-by-entity comparison
  - Automation change summary

**Use Cases**:
- **Pre-Deployment Validation**: "What changed since last deployment?"
- **Governance Enforcement**: "Were only approved changes deployed?"
- **Change Tracking**: Historical view of system evolution
- **Audit Trail**: Compliance evidence for change management

### Command Line Interface (CLI)

**What**: Run PPSB from command line for automation and CI/CD integration.

**Features**:
- **Command**: `ppsb generate [options]`
- **Authentication Options**:
  - Service principal (client ID + secret)
  - Interactive login (browser-based)
  - Stored credentials (encrypted local cache)
- **Scope Options**:
  - `--publisher <names>`: Comma-separated publisher list
  - `--solution <names>`: Comma-separated solution list
  - `--all-entities`: Document all entities
  - `--include-system`: Include system entities
- **Export Options**:
  - `--format <md|json|html|zip>`: Export format (default: all)
  - `--output <path>`: Output directory
  - `--baseline <path>`: Path to baseline JSON for comparison
- **Control Options**:
  - `--fail-on-critical`: Exit code 1 if critical changes detected
  - `--fail-on-high`: Exit code 1 if high/critical changes detected
  - `--quiet`: Suppress progress output
  - `--verbose`: Detailed logging
- **Exit Codes**:
  - `0`: Success
  - `1`: Critical/high changes detected (if --fail-on enabled)
  - `2`: Generation error
  - `3`: Authentication failed

**Example Commands**:
```bash
# Generate blueprint for specific solution
ppsb generate --solution "Sales Automation" --format json --output ./docs

# Compare against baseline and fail on critical changes
ppsb generate --solution "Sales" --baseline ./baseline.json --fail-on-critical

# Scheduled generation with service principal
ppsb generate --auth service-principal --client-id xxx --secret yyy --all-entities
```

**Use Cases**:
- **Automated Documentation**: Nightly blueprint generation
- **CI/CD Pipelines**: Pre-deployment validation gate
- **Scheduled Runs**: Weekly compliance reports
- **Scripted Analysis**: Batch processing multiple environments

### CI/CD Integration

**What**: Pre-built pipeline tasks for popular platforms.

**GitHub Actions**:
```yaml
- name: Generate Power Platform Blueprint
  uses: sabrish/ppsb-action@v1
  with:
    environment-url: ${{ secrets.DATAVERSE_URL }}
    client-id: ${{ secrets.CLIENT_ID }}
    client-secret: ${{ secrets.CLIENT_SECRET }}
    solution: 'Sales Automation'
    baseline: './baseline/prod-baseline.json'
    fail-on-critical: true
    format: 'all'
    output-path: './blueprint'

- name: Upload Blueprint Artifact
  uses: actions/upload-artifact@v3
  with:
    name: blueprint
    path: ./blueprint
```

**Azure DevOps Task**:
```yaml
- task: PowerPlatformBlueprint@1
  inputs:
    authenticationType: 'ServicePrincipal'
    environmentUrl: '$(DataverseUrl)'
    clientId: '$(ClientId)'
    clientSecret: '$(ClientSecret)'
    solution: 'Sales Automation'
    baselinePath: '$(Build.SourcesDirectory)/baseline.json'
    failOnCritical: true
    outputPath: '$(Build.ArtifactStagingDirectory)/blueprint'
```

**Features**:
- **Pre-Deployment Gate**: Block deployment if unauthorized changes detected
- **Automatic Baseline**: Store baseline JSON as pipeline artifact
- **Wiki Upload**: Automatically publish Markdown to Azure DevOps Wiki
- **Pull Request Comments**: Post change summary as PR comment
- **Slack/Teams Notifications**: Alert on critical changes

**Use Cases**:
- **Deployment Validation**: Ensure only approved changes deployed
- **Documentation Sync**: Keep wiki current automatically
- **Governance Automation**: Enforce change approval policies
- **Compliance Reporting**: Automated audit trail generation

---

## Version 0.7 - Enhanced Analysis (Q3 2026)

### Impact Analysis

**What**: "What if" scenarios to understand change impact.

**Features**:
- **Entity Deletion Impact**: "What breaks if I delete this entity?"
  - Shows dependent entities (lookups)
  - Lists dependent automation (plugins, flows)
  - Identifies security role impacts
- **Field Deletion Impact**: "Can I safely remove this field?"
  - Shows usage in automation
  - Lists views/forms using field
  - Checks if required by integrations
- **Plugin Removal Impact**: "What happens if I deactivate this plugin?"
  - Shows dependent plugins (execution order)
  - Lists affected flows (if plugin creates records for triggers)
- **Relationship Change Impact**: "Can I change this 1:N to N:N?"
  - Shows affected automation
  - Lists views using relationship
  - Identifies security impacts

**UI**:
- Click "Impact" button on any component
- See visual impact map
- Get recommendation (Safe/Risky/Blocked)

**Use Cases**:
- **Refactoring Planning**: Understand ripple effects before changes
- **Technical Debt**: Identify safe-to-remove components
- **Risk Assessment**: Validate architectural changes

### Unused Component Detection

**What**: Find orphaned and unused components.

**Features**:
- **Orphaned Web Resources**: JavaScript/HTML files never referenced
- **Unused Flows**: Flows never executed (requires execution history)
- **Inactive Plugins**: Registered but never triggered
- **Unused Custom APIs**: APIs with zero calls (requires usage logs)
- **Orphaned Environment Variables**: Variables not referenced by flows/plugins
- **Unused Security Roles**: Roles with zero user assignments

**Detection Logic**:
- **Web Resources**: Check references in forms, ribbons, other resources
- **Flows**: Query execution history (last 90 days)
- **Plugins**: Heuristic based on message/entity combination activity
- **Custom APIs**: Requires external logging (not available in v0.7)

**UI**:
- New "Unused Components" tab
- Categorized by type
- Confidence level (High/Medium/Low)
- Recommendations (Safe to delete / Investigate / Keep)

**Use Cases**:
- **Cleanup**: Remove technical debt and cruft
- **Performance**: Reduce solution size
- **Maintenance**: Focus on active components

### Business Process Mining

**What**: Analyze actual flow execution data to understand real-world usage.

**Features**:
- **Flow Execution Analysis**:
  - Top flows by execution count
  - Success vs failure rates
  - Average execution duration
  - Peak execution times
- **Trigger Pattern Analysis**:
  - Most common trigger conditions
  - Entity operation distribution (Create/Update/Delete)
  - Field change patterns
- **External Call Analysis**:
  - Most called external endpoints
  - Success rates per endpoint
  - Average latency per call
- **Optimization Recommendations**:
  - Flows with high failure rates
  - Flows exceeding timeout thresholds
  - Flows calling same endpoint multiple times (batch opportunity)

**Data Source**: Flow execution history (requires extended log retention)

**Limitations**: Requires admin to enable detailed flow logging

**UI**:
- New "Usage Analytics" tab
- Interactive charts and graphs
- Drill-down to specific flow execution details
- Export usage reports

**Use Cases**:
- **Performance Optimization**: Find slow flows
- **Reliability Improvement**: Address high-failure flows
- **Cost Optimization**: Identify premium connector overuse

### Custom Analysis Rules

**What**: Define your own compliance and quality rules.

**Features**:
- **Rule Types**:
  - **Naming Convention**: Enforce naming patterns (e.g., prefix "cust_")
  - **Complexity Threshold**: Flag entities with >100 fields or >20 plugins
  - **External Dependency**: Block untrusted domains
  - **Security**: Require field security on PII fields
  - **ALM**: Enforce environment variable usage for configs
- **Rule Definition**:
  - JSON or YAML config file
  - Support for custom JavaScript validators
  - Severity levels (Error/Warning/Info)
- **Rule Execution**:
  - Run during blueprint generation
  - Or run on-demand against existing blueprint JSON
- **Reporting**:
  - Violations listed in separate report
  - Integration with CI/CD (fail build on violations)

**Example Rule**:
```yaml
rules:
  - id: naming-convention-entity
    name: Custom Entity Naming Convention
    type: naming
    severity: error
    pattern: ^cust_[a-z]+$
    applies-to: entities
    message: Custom entities must start with "cust_" and use lowercase

  - id: complexity-limit
    name: Entity Complexity Limit
    type: complexity
    severity: warning
    max-fields: 100
    max-automation: 20
    applies-to: entities
    message: Entity complexity exceeds recommended limits
```

**Use Cases**:
- **Governance**: Enforce organizational standards
- **Quality Gates**: Prevent deployment of non-compliant solutions
- **Compliance**: Ensure regulatory requirements met

---

## Version 0.8 - Extended Platform Support (Q4 2026)

### Canvas App Enhancement

**Current**: Metadata only (name, connections)
**Future**:
- **Screen Inventory**: List all screens with navigation map
- **Control Analysis**: Count and categorize controls per screen
- **Formula Complexity**: Analyze formula complexity and nesting depth
- **Data Source Usage**: Map entity/connector usage per screen
- **Accessibility Check**: Flag missing labels, low-contrast colors

**Limitation**: Requires Power Apps source file (.msapp) extraction

### Power Pages Integration

**Current**: Site settings and web files only
**Future**:
- **Page Inventory**: Complete listing of:
  - Web pages with URLs and page templates
  - Content snippets and reusable content blocks
  - Web templates (Liquid code analysis)
  - Page templates and layouts
- **Portal Components**:
  - **Entity Forms**: Form mappings to Dataverse entities, field mappings, validation rules
  - **Entity Lists**: List configurations, views, filters, actions
  - **Web Forms**: Multi-step forms, conditional logic, submission handlers
  - **Basic Forms**: Simple form configurations
- **Liquid Template Analysis**:
  - Complexity scoring for Liquid code
  - Entity reference mapping
  - FetchXML query analysis
  - Custom filter detection
- **Content Management**:
  - Web files (CSS, JavaScript, images)
  - Content snippets
  - Site markers and settings
  - Redirect rules
- **JavaScript Analysis**:
  - Custom JavaScript for external calls
  - jQuery usage and version detection
  - Portal API usage patterns
- **Security & Access Control**:
  - Web roles and permissions
  - Page access rules and entity permissions
  - Table permissions with privilege mappings
  - Anonymous vs authenticated access patterns
- **Integration Points**:
  - External authentication providers (Azure AD, OAuth)
  - Custom API integrations
  - Third-party widgets and embeds

**Limitation**: Requires Power Pages admin access and maker portal API

### Customer Insights - Journeys & Marketing

**Current**: Not included
**Future**:
- **Journey Inventory**: All customer journeys with trigger conditions
- **Segment Analysis**: Segment definitions, membership criteria, and complexity scoring
- **Email Template Inventory**: Marketing emails with:
  - Personalization tokens and dynamic content
  - A/B test configurations
  - Template complexity analysis
  - Asset dependencies (images, forms)
- **Marketing Forms**: Form fields, submission handlers, multi-page forms
- **Marketing Pages**: Landing pages, hosted forms, event registrations
- **Event Management**: Events, sessions, speakers, registrations
- **Lead Scoring Models**: Scoring rules and thresholds
- **Custom Channels**: SMS, custom channel configurations
- **Event Tracking**: Custom events, triggers, and goal tracking
- **Integration Mapping**: Map to Dataverse entities and external systems
- **Compliance**: GDPR consent tracking, subscription management

**Limitation**: Requires Customer Insights - Journeys license and API access

### Additional Component Types

**What**: Expand component discovery to cover the complete Power Platform ecosystem.

**Components to Add**:

#### Dataverse Components
- **Alternate Keys**: Secondary key definitions and uniqueness constraints
- **Entity Images**: Image attribute configurations
- **Hierarchies**: Self-referential hierarchies and hierarchy settings
- **Virtual Tables**: Virtual entity providers and data sources
- **Elastic Tables**: Elastic table configurations for high-scale scenarios
- **AI Models**: AI Builder models integrated with Dataverse
- **Duplicate Detection Rules**: Duplicate detection configurations
- **Import Maps**: Data import mappings
- **SDK Message Filters**: Custom message availability per entity

#### Power Automate Components
- **Desktop Flows**: RPA flows with action details
- **Process Advisor**: Process mining flows and insights
- **Approvals**: Approval flow configurations
- **AI Builder Actions**: AI model usage in flows
- **Custom Connectors (Enhanced)**: Full OpenAPI spec analysis
- **Shared Flows**: Child flows and flow references

#### Power Apps Components
- **Canvas Apps (Enhanced)**:
  - Complete screen hierarchy
  - Control tree with properties
  - Formula complexity analysis
  - Data source usage per screen
  - Component library usage
  - Custom connectors
  - Collections and variables
- **Model-Driven Apps (Enhanced)**:
  - App modules and sitemap
  - Form configurations
  - View definitions
  - Dashboards and charts
  - Business process flows in app
- **Component Libraries**: Reusable component definitions
- **PCF Controls**: Custom controls and their usage

#### Dynamics 365 Specific
- **Sales**: Opportunity scoring models, forecasting configurations
- **Customer Service**: Case routing rules, SLA configurations, entitlements
- **Field Service**: Work order types, resource scheduling, booking rules
- **Project Operations**: Project templates, pricing dimensions
- **Marketing**: Additional marketing-specific entities not covered by Customer Insights

#### Integration Components
- **Data Integrations**: Data integration projects and mappings
- **Virtual Connectors**: Virtual table data sources
- **Azure Synapse Link**: Synapse link configurations
- **Export to Data Lake**: Data lake export configurations
- **Dataflows**: Power Platform dataflows

#### AI & Analytics
- **AI Builder Models**: Model types, training data, usage
- **Power BI Reports**: Embedded reports and dashboards
- **Power BI Datasets**: Dataset connections
- **Paginated Reports**: SQL Server Reporting Services reports

#### Administration & Governance
- **Audit Settings**: Audit configurations per entity
- **Data Loss Prevention Policies**: DLP policy impact
- **Environment Variables (Enhanced)**: Usage tracking across components
- **Solution Layers**: Layer analysis for managed properties
- **Application Users**: Service principal registrations

#### Legacy Components
- **Dialogs**: Legacy dialogs (deprecated, migration needed)
- **Processes (Legacy)**: On-demand workflows
- **ISV Config**: Legacy ISV.config customizations

**Implementation Priority**:
1. **High**: Canvas app enhancement, model-driven app details, desktop flows
2. **Medium**: Dynamics 365 modules, AI models, duplicate detection
3. **Low**: Legacy components (for migration planning)

---

## Version 0.9 - Advanced Features (Q1 2027)

### Performance Benchmarking

**What**: Compare your environment against performance baselines.

**Features**:
- **Benchmark Metrics**:
  - Average entity complexity vs industry baseline
  - Plugin execution time estimates
  - Flow duration predictions
  - API call latency assessments
- **Comparison**:
  - Your environment vs PPSB baseline (anonymized aggregate data)
  - Your solution vs your organization's other solutions
  - Production vs sandbox (highlight config differences)
- **Recommendations**:
  - Top 10 optimization opportunities
  - Quick wins (low effort, high impact)
  - Architectural improvements (high effort, high impact)

**Data Privacy**: All benchmarking data anonymized, opt-in only

### Multi-Environment Comparison

**What**: Compare blueprints across environments (Dev/Test/Prod).

**Features**:
- **Configuration Drift Detection**: Find differences in environment variables, connection references
- **ALM Validation**: Ensure solutions deployed consistently across environments
- **Automation Parity**: Verify flows/plugins match across environments
- **Security Consistency**: Check security roles match
- **Visual Diff**: Side-by-side environment comparison

**Use Cases**:
- **Deployment Validation**: Ensure prod matches expected state
- **ALM Maturity**: Identify configuration that should be environment variables
- **Troubleshooting**: "Why does this work in dev but not prod?"

---

## Version 1.0 - Enterprise Features (Q2 2027)

### Multi-Tenant Support

**What**: Manage blueprints across multiple tenants/organizations.

**Features**:
- **Tenant Registry**: Save multiple tenant connections
- **Cross-Tenant Comparison**: Compare similar solutions across customers
- **Template Library**: Save blueprint as template for new implementations
- **Bulk Operations**: Generate blueprints for all tenants automatically

### Advanced Visualization

**What**: Enhanced diagrams and interactive visualizations.

**Features**:
- **Interactive ERD**: Click relationships to see details, filter by publisher
- **3D Automation Graph**: Visualize complex execution chains in 3D
- **Heat Maps**: Entity complexity heat map, automation density visualization
- **Timeline View**: See solution evolution over time (requires historical baselines)

### AI-Powered Insights

**What**: Machine learning recommendations.

**Features**:
- **Anomaly Detection**: Flag unusual patterns (e.g., sudden complexity spike)
- **Optimization Suggestions**: AI-generated refactoring recommendations
- **Predictive Analysis**: "This entity will likely cause performance issues"
- **Natural Language Queries**: "Show me all entities with external calls in sync plugins"

**Privacy**: All AI processing client-side, no data sent to external AI services

---

## Community Requests

### Top Requested Features (Vote on GitHub Discussions)

1. **PDF Export**: Native PDF generation (currently: print HTML to PDF)
2. **Diff View**: Visual diff between two blueprints (v0.6)
3. **Plugin Code Analysis**: Analyze plugin source code if available
4. **Custom Templates**: User-defined export templates
5. **Real-Time Monitoring**: Dashboard showing live environment health

---

## How to Influence the Roadmap

We welcome community input!

- **Vote on Features**: [GitHub Discussions - Roadmap](https://github.com/sabrish/power-platform-solution-blueprint/discussions/categories/roadmap)
- **Request Features**: [GitHub Issues](https://github.com/sabrish/power-platform-solution-blueprint/issues/new?template=feature_request.md)
- **Contribute**: [Contribution Guide](../CONTRIBUTING.md) (coming soon)

---

## Versioning Strategy

PPSB follows Semantic Versioning (SemVer):

- **Major (1.0, 2.0)**: Breaking changes, major new features
- **Minor (0.6, 0.7)**: New features, backward compatible
- **Patch (0.5.1, 0.5.2)**: Bug fixes, minor improvements

**Release Cadence**: Quarterly minor releases, monthly patch releases

---

**Made with ❤️ for the Power Platform community**
