# API Security & Data Access Documentation

**Power Platform Solution Blueprint (PPSB)** - Complete API Call Reference

This document provides a comprehensive overview of all API calls made by PPSB, the data accessed, and security considerations.

---

## Overview

PPSB is a **read-only documentation tool** that analyzes Power Platform solutions by querying Microsoft Dataverse APIs. It does **NOT**:
- Modify any data
- Create, update, or delete records
- Store credentials
- Send data to external servers
- Execute code within Dataverse

All API calls are standard OData queries to Microsoft Dataverse Web API using authenticated connections provided by PPTB Desktop.

---

## Authentication & Authorization

### Connection Mechanism
- **Provider**: PPTB Desktop (Power Platform Toolbox)
- **API**: `window.toolboxAPI.dataverse`
- **Authentication**: User's existing Dataverse connection (OAuth)
- **Permissions Required**: Read access to solution components and metadata

### Security Model
- Uses user's existing authentication context
- Respects Dataverse security roles
- Cannot access data user doesn't have permission to read
- No credential storage or transmission

---

## API Endpoints Used

### 1. Metadata API Queries

#### Entity Metadata
**Purpose**: Retrieve entity definitions, attributes, relationships

**Endpoints**:
- `EntityDefinitions` - Get entity schema
- `EntityDefinitions(guid)` - Get specific entity details
- `EntityDefinitions?$select=...&$filter=...` - Query entities by criteria

**Data Accessed**:
- Entity logical names, display names
- Attribute definitions (name, type, length, format)
- Relationship metadata (1:N, N:1, N:N)
- Keys and alternate keys
- Entity ownership and customization flags

**Sensitive Data**: None (metadata only)

---

#### Global Option Sets (Choice Metadata)
**Purpose**: Retrieve global choice definitions

**Endpoints**:
- `GlobalOptionSetDefinitions(guid)` - Get choice options

**Data Accessed**:
- Choice name and display name
- Option values and labels
- Color codes for options

**Sensitive Data**: None (metadata only)

---

### 2. OData Queries (Data Retrieval)

All queries use standard OData protocol with `$select`, `$filter`, `$expand`, `$orderby` parameters.

#### Solution Components
**Purpose**: Discover what components exist in selected solutions

**Table**: `solutioncomponents`

**Query Pattern**:
```
solutioncomponents?$select=objectid,componenttype,_solutionid_value
&$filter=_solutionid_value eq 'guid1' or _solutionid_value eq 'guid2'
```

**Data Accessed**:
- Component GUIDs (objectid)
- Component type codes (1=Entity, 29=Workflow, etc.)
- Solution ID associations

**Frequency**: 1 query per blueprint generation

**Sensitive Data**: Component GUIDs (not exposed in UI, only used internally)

---

#### Publishers
**Purpose**: Get list of solution publishers for scope selection

**Table**: `publishers`

**Query Pattern**:
```
publishers?$select=publisherid,friendlyname,uniquename,customizationprefix
&$filter=isreadonly eq false
&$orderby=friendlyname asc
```

**Data Accessed**:
- Publisher names
- Customization prefixes
- Publisher IDs

**Frequency**: Once on app load

**Sensitive Data**: None

---

#### Solutions
**Purpose**: Get list of solutions for scope selection

**Table**: `solutions`

**Query Pattern**:
```
solutions?$select=solutionid,friendlyname,uniquename,version,publisherid
&$expand=publisherid($select=friendlyname)
&$orderby=friendlyname asc
```

**Data Accessed**:
- Solution names and versions
- Solution IDs
- Associated publisher names

**Frequency**: Once on app load

**Sensitive Data**: None

---

#### Plugin Steps
**Purpose**: Document plugin registrations and execution order

**Table**: `sdkmessageprocessingsteps`

**Query Pattern** (batched):
```
sdkmessageprocessingsteps?$select=sdkmessageprocessingstepid,name,stage,mode,rank,...
&$filter=sdkmessageprocessingstepid eq guid1 or sdkmessageprocessingstepid eq guid2
&$expand=sdkmessageid,plugintypeid,sdkmessagefilterid
&$orderby=stage asc,rank asc
```

**Batch Size**: 20 plugins per query

**Data Accessed**:
- Plugin step names and GUIDs
- Execution stage, mode, rank
- Message names (Create, Update, Delete, etc.)
- Entity names (filter)
- Assembly and type names
- Filtering attributes
- Impersonation user

**Frequency**: Batched queries based on plugin count

**Sensitive Data**: Plugin step GUIDs (not exposed in UI)

---

#### Plugin Images
**Purpose**: Get pre/post images for plugin steps

**Table**: `sdkmessageprocessingstepimages`

**Query Pattern** (batched):
```
sdkmessageprocessingstepimages?$select=sdkmessageprocessingstepimageid,imagetype,name,attributes
&$filter=_sdkmessageprocessingstepid_value eq 'guid1' or _sdkmessageprocessingstepid_value eq 'guid2'
```

**Batch Size**: 20 plugin steps per query

**Data Accessed**:
- Image names and types (PreImage/PostImage)
- Attribute lists

**Frequency**: 1 query per 20 plugins

**Sensitive Data**: None

---

#### Workflows (Flows, Business Rules, Classic Workflows, BPFs)
**Purpose**: Get workflow definitions and metadata

**Table**: `workflows`

**Query Pattern** (batched):
```
workflows?$select=workflowid,name,category,type,statuscode,description,clientdata,xaml,...
&$filter=workflowid eq guid1 or workflowid eq guid2
```

**Batch Size**: 20 workflows per query

**Data Accessed**:
- Workflow names and categories
- Flow definitions (JSON)
- Business rule client data (JSON)
- Classic workflow XAML
- Trigger conditions
- Entity associations

**Frequency**: Batched queries based on workflow count

**Sensitive Data**:
- Flow definitions may contain connection references
- NOT exposed: Actual credential values (only reference names)

---

#### Web Resources
**Purpose**: Analyze JavaScript, HTML, CSS, images

**Table**: `webresources`

**Query Pattern** (batched):
```
webresources?$select=webresourceid,name,webresourcetype,content,displayname
&$filter=webresourceid eq guid1 or webresourceid eq guid2
```

**Batch Size**: 20 resources per query

**Data Accessed**:
- Resource names and types
- Base64-encoded content (for JavaScript analysis)
- Display names

**JavaScript Analysis**:
- Extracts external API calls (domains, URLs)
- Detects deprecated API usage
- Does NOT execute code
- Static analysis only

**Frequency**: Batched queries based on web resource count

**Sensitive Data**:
- JavaScript code may contain URLs
- API keys in code ARE exposed if hardcoded (bad practice detection)

---

#### Custom APIs
**Purpose**: Document custom API definitions

**Table**: `customapis`

**Query Pattern** (batched):
```
customapis?$select=customapiid,uniquename,displayname,description,bindingtype,...
&$filter=customapiid eq guid1 or customapiid eq guid2
```

**Data Accessed**:
- API unique names
- Binding types, allowed custom processing
- Plugin type associations

**Related Tables**:
- `customapirequestparameters` - Input parameters
- `customapiresponseparameters` - Output parameters

**Frequency**: Batched queries + 2 queries for parameters

**Sensitive Data**: None

---

#### Environment Variables
**Purpose**: Document environment variable definitions

**Table**: `environmentvariabledefinitions`

**Query Pattern** (batched):
```
environmentvariabledefinitions?$select=environmentvariabledefinitionid,schemaname,displayname,type,defaultvalue
&$filter=environmentvariabledefinitionid eq guid1 or ...
```

**Related Table**: `environmentvariablevalues` - Current values

**Data Accessed**:
- Variable names and types
- Default values
- Current values

**Frequency**: Batched queries + 1 query for values

**Sensitive Data**:
- **YES**: Environment variable values may contain sensitive data
- **Mitigation**: Values are exported to documentation (user responsibility to review)

---

#### Connection References
**Purpose**: Identify connectors and premium connector usage

**Table**: `connectionreferences`

**Query Pattern** (batched):
```
connectionreferences?$select=connectionreferenceid,connectionreferencelogicalname,connectorid,connectionid
&$filter=connectionreferenceid eq guid1 or ...
```

**Related Table**: `connectors` - Connector metadata

**Data Accessed**:
- Connection reference names
- Connector IDs
- Premium connector detection

**Frequency**: Batched queries + 1 query for connector details

**Sensitive Data**: None (connector IDs only, not credentials)

---

#### Custom Connectors
**Purpose**: Document custom connector definitions

**Table**: `connectors`

**Query Pattern** (batched):
```
connectors?$select=connectorid,name,displayname,description,connectortype
&$filter=connectorid eq guid1 or connectorid eq guid2
```

**Data Accessed**:
- Connector names
- Connector types
- OpenAPI definitions (if custom)

**Frequency**: Batched queries

**Sensitive Data**: None

---

#### Security Roles
**Purpose**: Document security role permissions

**Tables**:
- `roles` - Role definitions
- `roleprivileges` - Privilege assignments
- `privileges` - Privilege metadata

**Query Pattern**:
```
roles?$select=roleid,name,businessunitid
roleprivileges?$filter=_roleid_value eq 'guid'
&$expand=privilegeid($select=name)
```

**Data Accessed**:
- Role names
- Privilege names and depths (Basic, Local, Deep, Global)
- Entity permissions (Create, Read, Write, Delete, Append, etc.)

**Frequency**: 1 query for roles + 1 per role for privileges

**Sensitive Data**: None (permission metadata only)

---

#### Field Security Profiles
**Purpose**: Document field-level security

**Tables**:
- `fieldsecurityprofiles` - Profile definitions
- `fieldpermissions` - Field permission assignments

**Query Pattern**:
```
fieldsecurityprofiles?$select=fieldsecurityprofileid,name
fieldpermissions?$filter=_fieldsecurityprofileid_value eq 'guid'
```

**Data Accessed**:
- Profile names
- Field names with permissions (Create, Read, Update)

**Frequency**: 1 query for profiles + 1 query per entity

**Sensitive Data**: None

---

#### Attribute Masking Rules
**Purpose**: Document data masking configurations

**Table**: `attributemaskingrules`

**Query Pattern**:
```
attributemaskingrules?$select=attributemaskingruleid,entitylogicalname,attributelogicalname,maskingtype
```

**Data Accessed**:
- Entity and field names
- Masking types (email, partial SSN, etc.)

**Frequency**: 1 query total

**Sensitive Data**: None (metadata only)

---

#### Column Security Profiles
**Purpose**: Document column-level security

**Table**: `columnsecurityprofiles`

**Query Pattern**:
```
columnsecurityprofiles?$select=name,columnsecurityprofileid,organizationid
```

**Data Accessed**:
- Profile names
- Organization IDs

**Frequency**: 1 query total

**Sensitive Data**: None

---

#### Forms
**Purpose**: Document entity forms and JavaScript handlers

**Table**: `systemforms`

**Query Pattern** (per entity):
```
systemforms?$select=formid,name,type,formxml,objecttypecode
&$filter=objecttypecode eq 'entityname'
```

**Data Accessed**:
- Form names and types
- Form XML (contains JavaScript library references)
- Event handlers

**Frequency**: 1 query per entity

**Sensitive Data**: None

---

## Data Processing

### Static Analysis
PPSB performs static analysis on:
- **JavaScript code**: Extracts API calls, detects deprecated APIs (REGEX-based, no execution)
- **Flow definitions**: Parses JSON for triggers, actions, connection references
- **Business rules**: Parses client data JSON for conditions and actions
- **Classic workflows**: Parses XAML for steps (limited)

### No Code Execution
- JavaScript is NEVER executed
- Workflows are NEVER triggered
- Plugins are NEVER invoked
- Only metadata and definitions are read

---

## Query Optimization

### Batching Strategy
- **Plugin steps**: 20 per batch
- **Plugin images**: 20 per batch
- **Workflows**: 20 per batch
- **Web resources**: 20 per batch
- **Custom APIs**: 20 per batch
- **Other components**: 20 per batch

**Rationale**: Prevents HTTP 414 (URL too long) errors while minimizing query count

### Total Query Count (Typical)
For a solution with:
- 50 entities
- 100 plugins
- 50 flows
- 30 web resources
- 5 security roles

**Estimated queries**: ~60-80 total
- 1 for solution components
- 1 for publishers
- 1 for solutions
- 50 for entity metadata (1 per entity)
- 5 for plugin batches (100÷20)
- 5 for plugin images
- 3 for workflow batches (50÷20)
- 2 for web resource batches (30÷20)
- 1 for security roles
- 5 for role privileges
- ~10 for other components

---

## Security Risks & Mitigations

### Risk 1: Environment Variable Exposure
**Risk**: Environment variables may contain API keys, connection strings, or secrets

**Mitigation**:
- ⚠️ Users are responsible for reviewing exported documentation
- Values are displayed in UI and exported to files
- **Recommendation**: Use Azure Key Vault references instead of hardcoded values

---

### Risk 2: Hardcoded Secrets in JavaScript
**Risk**: JavaScript web resources may contain hardcoded API keys

**Mitigation**:
- PPSB exposes these (intentional - helps identify security issues)
- Users should remediate by moving secrets to secure storage
- **Detection**: External API call analysis highlights potential issues

---

### Risk 3: GUID Exposure
**Risk**: Component GUIDs are exposed in exported documentation

**Mitigation**:
- GUIDs are not sensitive (they're public identifiers in Dataverse)
- Cannot be used to access data without proper authentication
- **Not a security concern**

---

### Risk 4: Connection Reference Details
**Risk**: Connection reference names are exported

**Mitigation**:
- Only reference names are exposed (not credentials)
- Actual credentials are managed by Dataverse
- **Not a security concern**

---

## Data Retention

### In-Memory Only
- All data is processed in browser memory
- No data sent to external servers
- No local storage or persistence (except user-initiated exports)

### User-Initiated Exports
When user clicks "Export":
- Markdown files (downloaded as ZIP)
- JSON files (downloaded)
- HTML files (downloaded)

**User Responsibility**: Review exported files before sharing externally

---

## Compliance Considerations

### GDPR
- PPSB does not process personal data
- Metadata only (schema, configuration)
- User exports may contain organization-specific names

### SOC 2
- Read-only access only
- No data modification
- Audit trail via Dataverse audit logs (user's queries are logged by Dataverse)

### HIPAA / PHI
- PPSB does not access patient data
- Metadata and configuration only
- No PHI is retrieved or processed

---

## API Call Summary Table

| API Category | Tables Queried | Purpose | Sensitive Data |
|-------------|---------------|---------|---------------|
| **Metadata** | EntityDefinitions, GlobalOptionSetDefinitions | Schema discovery | None |
| **Solutions** | publishers, solutions, solutioncomponents | Scope selection | None |
| **Plugins** | sdkmessageprocessingsteps, sdkmessageprocessingstepimages | Plugin documentation | Step GUIDs (internal) |
| **Workflows** | workflows | Flow/BPF/Business Rule definitions | Connection references |
| **Web Resources** | webresources | Code analysis | Hardcoded secrets (detection) |
| **Custom APIs** | customapis, customapi*parameters | API documentation | None |
| **Env Variables** | environmentvariabledefinitions, environmentvariablevalues | Configuration tracking | **Values may be sensitive** |
| **Connections** | connectionreferences, connectors | Connector usage | None |
| **Security** | roles, roleprivileges, fieldsecurityprofiles, fieldpermissions | Permission documentation | None |
| **Masking** | attributemaskingrules, columnsecurityprofiles | Data protection config | None |
| **Forms** | systemforms | Form/JavaScript discovery | None |

---

## Recommendations

### For Users
1. ✅ Review environment variable values before sharing exports
2. ✅ Check JavaScript web resources for hardcoded secrets
3. ✅ Use Azure Key Vault for sensitive configuration values
4. ✅ Limit PPSB usage to users with appropriate Dataverse permissions

### For Administrators
1. ✅ Grant read-only access to users running PPSB
2. ✅ Review Dataverse audit logs to track API usage
3. ✅ Implement data loss prevention (DLP) policies for exported files
4. ✅ Train users on secure handling of exported documentation

---

## Contact & Support

For security concerns or questions:
- **GitHub Issues**: https://github.com/sabrish/power-platform-solution-blueprint/issues
- **Documentation**: https://github.com/sabrish/power-platform-solution-blueprint/tree/main/docs

---

**Last Updated**: 2026-02-10
**Version**: 0.5.0
