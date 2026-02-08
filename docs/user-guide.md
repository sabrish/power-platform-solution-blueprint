# PPSB User Guide

Complete guide for using Power Platform System Blueprint (PPSB) v0.5

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Selecting Scope](#selecting-scope)
4. [Generating Blueprint](#generating-blueprint)
5. [Understanding Results](#understanding-results)
6. [Exporting Blueprint](#exporting-blueprint)
7. [Understanding Output](#understanding-output)
8. [Common Use Cases](#common-use-cases)
9. [Troubleshooting](#troubleshooting)
10. [Best Practices](#best-practices)
11. [FAQ](#faq)

---

## 1. Introduction

PPSB (Power Platform System Blueprint) generates comprehensive architectural documentation for your Power Platform systems automatically. Instead of spending weeks manually documenting entities, plugins, flows, and dependencies, PPSB discovers everything in minutes and produces production-ready documentation.

###What PPSB Does

- **Discovers**: Scans your Dataverse environment to find all components (entities, plugins, flows, etc.)
- **Analyzes**: Examines relationships, execution order, external dependencies, and complexity
- **Visualizes**: Creates ERD diagrams and execution pipeline views
- **Documents**: Generates complete technical documentation in multiple formats
- **Exports**: Packages everything as Markdown (wiki-ready), JSON (programmatic), or HTML (shareable)

### What You Get

After running PPSB, you'll have:
- Complete entity relationship diagram (ERD) with publisher color-coding
- Detailed documentation for every entity (schema, automation, execution pipeline)
- All plugins with execution order and registration details
- All Power Automate flows with trigger and connection analysis
- All business rules, classic workflows, BPFs
- JavaScript web resources with external call detection
- Custom APIs, environment variables, connection references
- Security roles with permission matrices
- External dependency analysis with risk assessment
- Cross-entity automation mapping
- Solution distribution breakdown

---

## 2. Getting Started

### Prerequisites

- **PPTB Desktop** installed and running
- **Active Dataverse connection** in PPTB Desktop
- **Appropriate permissions**:
  - System Administrator (full access) OR
  - System Customizer + Read access to solution components

### Launch PPSB

1. Open **PPTB Desktop**
2. Ensure you're connected to your Dataverse environment
3. Navigate to the **Tools** section
4. Click **Power Platform System Blueprint (PPSB)**
5. Wait for PPSB to load (2-5 seconds)

### First-Time Setup

No setup required! PPSB works immediately with your existing PPTB Desktop connection. However:

- **Permissions Check**: PPSB will verify it can read solution metadata
- **Large Environments**: First run may take 10-15 minutes for 500+ entities
- **Network**: Ensure stable connection to Dataverse

---

## 3. Selecting Scope

Scope selection determines what PPSB will document. Choose carefully to balance completeness with generation time.

### Scope Options

#### Option 1: By Publisher (Recommended for Multi-Publisher Environments)

**When to use**: You want to document everything from specific publishers (e.g., all customizations from your organization)

**How to select**:
1. Choose "By Publisher" radio button
2. Click "Select publishers" dropdown
3. Multi-select publishers (dropdown stays open)
4. Click outside dropdown to close
5. Choose either:
   - "All solutions from selected publishers" (documents everything)
   - "Specific solutions only" (shows filtered solution list)

**Example**: Select "Contoso" publisher → Get all Contoso solutions documented

**Tips**:
- System publishers (Microsoft, Dynamics) are excluded by default
- Selected publishers shown as dismissible tags
- Use this when you own multiple solutions

#### Option 2: By Solution (Recommended for Targeted Documentation)

**When to use**: You need documentation for specific solutions regardless of publisher

**How to select**:
1. Choose "By Solution" radio button
2. Click "Select solutions" dropdown
3. Multi-select solutions (dropdown stays open)
4. Click outside dropdown to close

**Example**: Select "Sales Automation v2" and "Service Portal" → Get documentation for just these two solutions

**Tips**:
- Default/recommended option
- Best for focused documentation
- Faster generation time
- Selected solutions shown as dismissible tags

#### Option 3: All Entities (Use Sparingly)

**When to use**: Complete environment audit or migration planning

**How to select**:
1. Choose "By Solution" (or Publisher)
2. Select all solutions
3. Optionally check "Include system-owned entities"

**Warning**:
- Can take 15-20 minutes for large environments
- Generates massive documentation (1000s of pages)
- Only use when you truly need everything

### Include System Entities?

**Checkbox**: "Include system-owned entities (Account, Contact, etc.)"

**Checked** = Documents Microsoft entities (Account, Contact, Opportunity, etc.)
**Unchecked** = Only your custom entities

**When to check**:
- You've customized Microsoft entities (added fields, plugins)
- You need complete entity list for migration planning
- You're documenting integrations that use system entities

**When to uncheck**:
- You only care about your custom entities
- You want faster generation
- System entities are unchanged

---

## 4. Generating Blueprint

After selecting scope, click **"Generate Blueprint"** to start.

### Generation Process

PPSB goes through multiple phases:

#### Phase 1: Fetching Solution Components (10-30 seconds)
- Queries solution components table
- Identifies all entities in scope
- Builds component inventory

**What you'll see**: "Discovering solution components..."

#### Phase 2: Entity Schema Discovery (30-60 seconds per 100 entities)
- Fetches entity metadata
- Retrieves all fields (attributes)
- Gets relationships (1:N, N:1, N:N)
- Captures keys and alternate keys

**What you'll see**: "Discovering entity schema for {EntityName}..."

#### Phase 3: Automation Discovery (20-40 seconds per 100 entities)
- Plugins: Registration details, execution order
- Flows: Triggers, connections, external calls
- Business Rules: Conditions, actions
- Classic Workflows: Steps, migration recommendations
- BPFs: Stages, steps

**What you'll see**: "Discovering automation for {EntityName}..."

#### Phase 4: Component Discovery (30-90 seconds)
- Web resources (JavaScript, HTML, CSS, images)
- Custom APIs
- Environment variables
- Connection references
- Global choices
- Security roles and field security

**What you'll see**: "Discovering web resources...", "Discovering custom APIs...", etc.

#### Phase 5: Analysis (10-30 seconds)
- Generates ERD with publisher color-coding
- Maps cross-entity automation
- Analyzes external dependencies
- Scores entity complexity
- Identifies performance risks

**What you'll see**: "Generating ERD...", "Analyzing automation...", etc.

### Progress Tracking

- **Progress Bar**: Shows overall completion
- **Phase Indicator**: Current activity
- **Entity Counter**: "Processing 45 of 120 entities"
- **Time Estimate**: Rough estimate of remaining time (appears after 1 minute)

### Generation Times

Typical generation times by environment size:

| Environment Size | Entities | Time Estimate |
|-----------------|----------|---------------|
| Small | <50 | 1-3 minutes |
| Medium | 50-200 | 3-8 minutes |
| Large | 200-500 | 8-15 minutes |
| Very Large | 500+ | 15-25 minutes |

**Factors affecting time**:
- Number of entities
- Automation density (plugins/flows per entity)
- Network latency
- Dataverse instance performance

### If Generation Fails

PPSB handles errors gracefully:

- **Recoverable Errors**: Logged but generation continues
- **Entity-Level Errors**: That entity skipped, others continue
- **Fatal Errors**: Generation stops, error displayed with retry option

**Common Issues**:
- **"Permission denied"**: Need System Administrator or System Customizer role
- **"Connection lost"**: Network issue, click "Retry"
- **"Timeout"**: Dataverse overloaded, wait 5 minutes and retry
- **"Invalid query"**: Report as bug with error details

---

## 5. Understanding Results

After generation, PPSB displays results in an interactive dashboard.

### Summary Card

At the top, you'll see:
- **Total Entities**: Count of discovered entities
- **Total Automation**: Count of all automation (plugins + flows + rules + workflows)
- **External Endpoints**: Count of unique external API domains
- **Solutions**: Count of solutions in scope

### Entity Relationship Diagram (ERD)

**What it shows**:
- All entities as boxes
- Relationships as connecting lines (1:N, N:1, N:N with cardinality symbols)
- Publisher color-coding (each publisher gets a unique color)

**Interactive Features**:
- **Zoom**: Browser zoom (Ctrl+scroll)
- **Legend**: Publisher colors with entity counts
- **Quick Links Table**: Click entity name to jump to details

**Tips**:
- Use legend to understand publisher distribution
- Look for disconnected entities (no relationships)
- Identify central entities (many relationships)

### Tabs

Click tabs to explore different aspects:

#### Entities Tab
- Searchable list of all entities
- Shows field count, automation count
- Click entity to see full details

#### Plugins Tab
- All plugins grouped by entity
- Execution order visualization
- Sync vs async indicators
- Click to expand details

#### Flows Tab
- All Power Automate flows
- Trigger type badges
- External call indicators
- Click to expand connection details

#### Business Rules Tab
- Client-side and server-side rules
- Entity grouping
- Condition summaries

#### Classic Workflows Tab
- All classic workflows
- Migration priority (High/Medium/Low)
- Complexity indicators
- Click to see migration recommendations

#### Security Tab
- **Security Roles**: Permission matrices per role
- **Field Security**: Profiles and entity permissions
- **Attribute Masking**: Masking rules by entity
- **Column Security**: Column-level access controls

#### External Dependencies Tab
- All external API calls grouped by domain
- Risk levels (Trusted/Known/Unknown)
- Called from (flows, plugins, web resources)
- Confidence levels

#### Cross-Entity Automation Tab
- Automation that affects multiple entities
- Source → Target entity mapping
- Automation type (plugin, flow, etc.)
- Synchronous warning indicators

### Entity Detail View

Click any entity to see:

**Overview Tab**:
- Entity description
- Publisher information
- Primary key
- Creation/modification dates
- Complexity score

**Schema Tab**:
- All fields in sortable table
- Field types, requirements
- Lookups and relationships
- Keys and alternate keys

**Automation Tab**:
- All plugins affecting this entity
- All flows triggered by this entity
- All business rules
- Classic workflows

**Execution Pipeline Tab** (if entity has automation):
- Visual diagram showing automation sequence
- Client-side → Business rules
- Sync plugins → PreValidation, PreOperation, etc.
- Async plugins → PostOperation
- Flows → Automated, scheduled

---

## 6. Exporting Blueprint

After reviewing results, export documentation in your preferred format.

### Export Dialog

Click **"Export Blueprint"** button to open export dialog.

### Format Selection

Choose one or more formats:

#### Markdown
**Best for**: Azure DevOps Wiki, GitHub, documentation portals

**What you get**:
- Complete folder structure
- Index.md (home page)
- Entities/ folder (one .md per entity)
- Plugins.md, Flows.md, etc.
- ERD.md with Mermaid diagram

**How to use**:
1. Extract ZIP
2. Upload to Azure DevOps Wiki:
   - Go to Wiki
   - Click "Publish code as wiki"
   - Select repository and extracted folder
3. Navigate wiki with sidebar

**Tip**: Markdown is the most versatile format

#### JSON
**Best for**: Programmatic use, baselines, CI/CD pipelines

**What you get**:
- Single blueprint.json file
- Complete blueprint data structure
- All metadata, relationships, automation
- Can be re-loaded for comparison (v0.6+)

**How to use**:
- Save as baseline before deployment
- Parse with jq or custom scripts
- Compare against future blueprints
- Feed into custom analysis tools

**Tip**: Essential for automated workflows

#### HTML
**Best for**: Stakeholder sharing, presentations, offline viewing

**What you get**:
- Single self-contained .html file
- Interactive navigation sidebar
- Searchable (Ctrl+F)
- Accordion sections
- Embedded Mermaid diagrams
- Works offline (no external dependencies except Mermaid CDN)

**How to use**:
- Email to stakeholders
- Open in any browser
- Present in meetings
- Print to PDF (browser print dialog)

**Tip**: Best for non-technical audiences

#### ZIP (All Formats)
**Best for**: Complete package with all formats

**What you get**:
- blueprint.zip containing:
  - markdown/ folder (complete Markdown structure)
  - blueprint.json (JSON export)
  - blueprint.html (HTML export)

**How to use**:
- Archive for documentation repository
- Provide complete package to team
- Upload to SharePoint/Teams

### Download Process

1. Select format(s)
2. Click **"Download"**
3. Browser download dialog appears
4. Choose save location
5. Wait for download (large blueprints may take 5-10 seconds)

### File Naming

- Markdown: `{SolutionName}-blueprint-{timestamp}.zip`
- JSON: `{SolutionName}-blueprint-{timestamp}.json`
- HTML: `{SolutionName}-blueprint-{timestamp}.html`
- ZIP (all): `{SolutionName}-blueprint-complete-{timestamp}.zip`

---

## 7. Understanding Output

Deep dive into exported documentation structure.

### Markdown Structure

```
{SolutionName}-blueprint/
├── Index.md                     # Home page with summary
├── ERD.md                       # Entity Relationship Diagram
├── Entities/
│   ├── _Index.md                # Entity list
│   ├── Account.md               # One file per entity
│   ├── Contact.md
│   └── CustomEntity.md
├── Plugins.md                   # All plugins
├── Flows.md                     # All flows
├── BusinessRules.md             # All business rules
├── ClassicWorkflows.md          # Classic workflows with migration guide
├── BusinessProcessFlows.md      # Business process flows
├── WebResources.md              # Web resources with analysis
├── CustomAPIs.md                # Custom APIs
├── EnvironmentVariables.md      # Environment variables
├── ConnectionReferences.md      # Connection references
├── GlobalChoices.md             # Global choices
├── Security/
│   ├── SecurityRoles.md         # Security roles with permissions
│   ├── FieldSecurity.md         # Field security profiles
│   ├── AttributeMasking.md      # Attribute masking rules
│   └── ColumnSecurity.md        # Column security profiles
├── ExternalDependencies.md      # External API analysis
└── CrossEntityAutomation.md     # Cross-entity automation mapping
```

### JSON Structure

```json
{
  "metadata": {
    "version": "0.5.0",
    "timestamp": "2026-02-08T10:30:00Z",
    "environment": "contoso-prod",
    "scope": {
      "type": "solution",
      "solutionIds": ["guid1", "guid2"],
      "includeSystemEntities": false
    }
  },
  "summary": {
    "totalEntities": 42,
    "totalPlugins": 156,
    "totalFlows": 89,
    "externalEndpointCount": 12
  },
  "erd": {
    "mermaidDiagram": "erDiagram...",
    "legend": [...],
    "entityQuickLinks": [...]
  },
  "entities": [
    {
      "entity": { /* EntityMetadata */ },
      "plugins": [...],
      "flows": [...],
      "businessRules": [...],
      "complexity": "High"
    }
  ],
  "plugins": [...],
  "flows": [...],
  "webResources": [...],
  "securityRoles": [...],
  "externalEndpoints": [...],
  "crossEntityLinks": [...]
}
```

### HTML Structure

Single-file HTML with:
- **Sidebar Navigation**: Smooth scrolling links
- **Sections**: Collapsible accordions
- **Tables**: Sortable columns
- **Diagrams**: Embedded Mermaid rendering
- **Search**: Browser Ctrl+F works
- **Print**: CSS optimized for PDF export

---

## 8. Common Use Cases

Real-world scenarios and how to use PPSB.

### Use Case 1: Onboarding New Developer

**Scenario**: New developer joins team, needs to understand system architecture quickly.

**Steps**:
1. Generate blueprint for production environment (by solution)
2. Export as HTML
3. Share HTML file with developer
4. Developer reviews:
   - ERD to understand entity relationships
   - Entity details for schema
   - Execution pipelines to see automation flow
5. Use as reference during first sprint

**Tip**: Generate fresh blueprint every quarter to keep onboarding docs current.

### Use Case 2: Pre-Deployment Documentation

**Scenario**: Need to document changes before deploying to production.

**Steps**:
1. Generate baseline blueprint of production (export JSON)
2. Deploy changes to production
3. Generate new blueprint
4. Compare JSON files (v0.6 will automate this)
5. Document delta in change request

**Tip**: Store baseline JSONs in version control alongside solution files.

### Use Case 3: Security Audit

**Scenario**: Annual security audit requires documentation of all external API calls and security roles.

**Steps**:
1. Generate blueprint with all solutions
2. Review "External Dependencies" tab
3. Export HTML for auditor
4. Highlight "Unknown" risk endpoints
5. Review "Security" tab for role permissions
6. Export permission matrices as evidence

**Tip**: Schedule quarterly security blueprint generation for ongoing compliance.

### Use Case 4: Classic Workflow Migration

**Scenario**: Need to migrate classic workflows to cloud flows before deadline.

**Steps**:
1. Generate blueprint
2. Go to "Classic Workflows" tab
3. Sort by migration priority (High first)
4. For each workflow:
   - Review complexity assessment
   - Read migration recommendations
   - Note blockers (e.g., child workflows)
5. Create migration backlog in Azure DevOps
6. Link blueprint HTML as reference

**Tip**: Focus on High priority workflows first—they're time-critical.

### Use Case 5: Performance Optimization

**Scenario**: Environment is slow, need to identify performance bottlenecks.

**Steps**:
1. Generate blueprint
2. Review "External Dependencies" tab
3. Filter for synchronous plugins
4. Identify plugins with external calls (blocks user transactions)
5. Check "Cross-Entity Automation" for complex chains
6. Prioritize refactoring:
   - Move external calls to async
   - Break execution chains
   - Simplify complex business rules

**Tip**: Complexity scores help prioritize optimization efforts.

### Use Case 6: Solution Packaging

**Scenario**: Need to prepare solution for AppSource or customer delivery.

**Steps**:
1. Generate blueprint for target solution
2. Review "Solution Distribution" to ensure no shared components
3. Check "External Dependencies" for external API requirements
4. Review "Connection References" for premium connectors (licensing impact)
5. Check "Environment Variables" for configuration needs
6. Export complete package (ZIP) as delivery documentation

**Tip**: Include blueprint in solution package as "Technical Documentation.html".

---

## 9. Troubleshooting

Common issues and solutions.

### Issue: "Permission Denied" Error

**Symptoms**: Generation fails immediately with permission error.

**Cause**: Insufficient Dataverse permissions.

**Solution**:
1. Ask admin for **System Administrator** or **System Customizer** role
2. Ensure role has Read access to solution components
3. Retry generation

**Prevention**: Request appropriate permissions before starting.

### Issue: Generation Takes Too Long (>30 minutes)

**Symptoms**: Progress stalls or generation never completes.

**Cause**: Environment too large or network issues.

**Solution**:
1. Cancel generation (refresh page)
2. Reduce scope:
   - Select fewer solutions
   - Exclude system entities
   - Target specific publisher
3. Retry with smaller scope
4. Check network connection stability

**Prevention**: Start with small scope, expand gradually.

### Issue: Missing Entities in Results

**Symptoms**: Expected entities not in blueprint.

**Cause**: Entities not in selected solutions or published.

**Solution**:
1. Verify entity is published (unpublished entities not included)
2. Check entity is in selected solution
3. Try "All Entities" scope to verify entity exists
4. Refresh PPTB connection and retry

**Prevention**: Use "All Entities" scope for complete audit.

### Issue: ERD Not Rendering

**Symptoms**: ERD section shows error or empty.

**Cause**: Mermaid syntax error or browser compatibility.

**Solution**:
1. Check browser console for errors
2. Try different browser (Chrome recommended)
3. Verify relationships exist (isolated entities won't show relationships)
4. Export HTML and open separately

**Prevention**: Use latest Chrome/Edge for best compatibility.

### Issue: Export Download Fails

**Symptoms**: Export button does nothing or download fails.

**Cause**: Browser popup blocker or large file size.

**Solution**:
1. Allow popups for PPTB Desktop
2. Try smaller scope (reduces file size)
3. Export one format at a time
4. Check browser download settings
5. Ensure sufficient disk space

**Prevention**: Configure browser to allow PPTB Desktop downloads.

### Issue: HTML Export Too Large to Open

**Symptoms**: Browser hangs when opening HTML file.

**Cause**: Extremely large environment (1000+ entities).

**Solution**:
1. Use Markdown export instead (splits into files)
2. Use JSON export for programmatic access
3. Reduce scope to specific solutions
4. Open HTML in lightweight browser (Firefox)

**Prevention**: Limit scope for large environments.

---

## 10. Best Practices

Guidelines for optimal PPSB usage.

### Scope Selection

✅ **Do**:
- Start with single solution to test
- Use "By Solution" for focused documentation
- Exclude system entities unless customized
- Document production environment for accuracy

❌ **Don't**:
- Select "All Entities" unless necessary
- Include system entities by default
- Document dev environment for baseline (use prod)

### Generation Timing

✅ **Do**:
- Generate during off-hours (less Dataverse load)
- Allow 15-20 minutes for large environments
- Monitor progress (don't leave unattended)
- Save multiple exports (before/after deployment)

❌ **Don't**:
- Generate during peak business hours
- Cancel prematurely (wait for progress indicator)
- Generate excessively (once per deployment is enough)

### Export Strategy

✅ **Do**:
- Export all formats for complete archive
- Save JSON for future comparison
- Share HTML with stakeholders
- Upload Markdown to wiki for team access
- Name files with environment and date

❌ **Don't**:
- Rely on single format
- Delete JSON exports (needed for baselines)
- Share exports publicly (may contain sensitive data)

### Documentation Maintenance

✅ **Do**:
- Generate new blueprint after major deployments
- Update wiki documentation quarterly
- Keep baseline JSONs in version control
- Archive old blueprints for historical reference
- Review and act on performance risks

❌ **Don't**:
- Assume one-time documentation is sufficient
- Ignore external dependency warnings
- Skip migration recommendations
- Leave deprecated code unaddressed

### Team Collaboration

✅ **Do**:
- Share HTML exports with entire team
- Use wiki for living documentation
- Review blueprints in architecture meetings
- Include blueprint generation in deployment checklist
- Train team members on PPSB usage

❌ **Don't**:
- Hoard documentation (share widely)
- Skip blueprint before major changes
- Generate without clear purpose

---

## 11. FAQ

Frequently asked questions.

### General

**Q: How long does generation take?**
A: 1-3 minutes for small environments (<50 entities), 8-15 minutes for medium (50-200 entities), 15-25 minutes for large (500+ entities).

**Q: Does PPSB store my data?**
A: No. All processing is client-side in your browser. Data never leaves your machine.

**Q: Can I generate blueprints offline?**
A: No. PPSB needs active Dataverse connection to query metadata.

**Q: Is PPSB free?**
A: Yes, PPSB is free and open-source (MIT license).

### Technical

**Q: What permissions do I need?**
A: System Administrator or System Customizer role with Read access to solution components.

**Q: Why are some entities missing?**
A: Unpublished entities or entities not in selected solutions are excluded.

**Q: Can I customize the output?**
A: Not currently. Customization planned for future version.

**Q: Does PPSB modify anything in Dataverse?**
A: No. PPSB is read-only and never modifies your environment.

### Export & Usage

**Q: Can I edit Markdown exports?**
A: Yes! Edit freely. Generated Markdown is standard format.

**Q: How do I compare blueprints?**
A: V0.6 will add automatic comparison. For now, diff JSON files manually or use JSON diff tools.

**Q: Can I schedule automatic generation?**
A: Not yet. CLI in v0.6 will enable scheduled generation.

**Q: How do I print the blueprint?**
A: Open HTML export and use browser print (Ctrl+P). Select "Save as PDF" for digital copy.

### Troubleshooting

**Q: Generation failed. What now?**
A: Check permissions, reduce scope, ensure stable network, retry. If persists, report issue with error details.

**Q: ERD won't render. Why?**
A: Check browser (Chrome recommended), verify relationships exist, try HTML export separately.

**Q: Export is huge (>100MB). Normal?**
A: For 500+ entity environments, yes. Reduce scope or use Markdown (splits into smaller files).

---

## Need More Help?

- **GitHub Issues**: [Report bugs or request features](https://github.com/sabrish/power-platform-solution-blueprint/issues)
- **GitHub Discussions**: [Ask questions](https://github.com/sabrish/power-platform-solution-blueprint/discussions)
- **Documentation**: [More guides](../README.md#documentation)

---

**Made with ❤️ for the Power Platform community**
