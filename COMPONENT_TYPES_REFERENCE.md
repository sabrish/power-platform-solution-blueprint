# Dataverse Solution Component Types - Official Reference

**Source:** [Microsoft Dataverse SolutionComponent Documentation](https://learn.microsoft.com/en-us/power-apps/developer/data-platform/reference/entities/solutioncomponent)

**IMPORTANT:** Always reference this document when working with solution components. Do NOT guess component type values.

---

## Complete ComponentType Choice/Option Set

| Value | Label | Notes |
|-------|-------|-------|
| 1 | Entity | Tables/entities in Dataverse |
| 2 | Attribute | Fields/columns on entities |
| 3 | Relationship | Entity relationships |
| 4 | Attribute Picklist Value | Choice/option set values |
| 5 | Attribute Lookup Value | |
| 6 | View Attribute | |
| 7 | Localized Label | |
| 8 | Relationship Extra Condition | |
| 9 | Option Set | Global choice/option sets |
| 10 | Entity Relationship | |
| 11 | Entity Relationship Role | |
| 12 | Entity Relationship Relationships | |
| 13 | Managed Property | |
| 14 | Entity Key | |
| 16 | Privilege | |
| 17 | PrivilegeObjectTypeCode | |
| 18 | Index | |
| 20 | Role | Security roles |
| 21 | Role Privilege | |
| 22 | Display String | |
| 23 | Display String Map | |
| 24 | Form | Model-driven app forms |
| 25 | Organization | |
| 26 | Saved Query | Views |
| 29 | Workflow | Workflows (includes flows, business rules, classic workflows, BPFs) |
| 31 | Report | |
| 32 | Report Entity | |
| 33 | Report Category | |
| 34 | Report Visibility | |
| 35 | Attachment | |
| 36 | Email Template | |
| 37 | Contract Template | |
| 38 | KB Article Template | |
| 39 | Mail Merge Template | |
| 44 | Duplicate Rule | |
| 45 | Duplicate Rule Condition | |
| 46 | Entity Map | |
| 47 | Attribute Map | |
| 48 | Ribbon Command | |
| 49 | Ribbon Context Group | |
| 50 | Ribbon Customization | |
| 52 | Ribbon Rule | |
| 53 | Ribbon Tab To Command Map | |
| 55 | Ribbon Diff | |
| 59 | Saved Query Visualization | Charts |
| 60 | System Form | System forms (main, quick create, etc.) |
| 61 | Web Resource | JavaScript, HTML, CSS, images, etc. |
| 62 | Site Map | App navigation/site map |
| 63 | Connection Role | |
| 64 | Complex Control | |
| 65 | Hierarchy Rule | |
| 66 | Custom Control | PCF controls |
| 68 | Custom Control Default Config | |
| 70 | Field Security Profile | |
| 71 | Field Permission | |
| **80** | **App Module** | **Model-driven apps (AppModule)** |
| **90** | **Plugin Type** | **Individual plugin class** |
| **91** | **Plugin Assembly** | **DLL containing plugin types** |
| **92** | **SDK Message Processing Step** | **Plugin step registration (what we use for plugins)** |
| **93** | **SDK Message Processing Step Image** | **Pre/post images for plugin steps** |
| 95 | Service Endpoint | Service bus/webhook endpoints |
| 150 | Routing Rule | |
| 151 | Routing Rule Item | |
| 152 | SLA | Service Level Agreements |
| 153 | SLA Item | |
| 154 | Convert Rule | |
| 155 | Convert Rule Item | |
| 161 | Mobile Offline Profile | |
| 162 | Mobile Offline Profile Item | |
| 165 | Similarity Rule | |
| 166 | Data Source Mapping | Virtual table data sources |
| 201 | SDKMessage | |
| 202 | SDKMessageFilter | |
| 203 | SdkMessagePair | |
| 204 | SdkMessageRequest | |
| 205 | SdkMessageRequestField | |
| 206 | SdkMessageResponse | |
| 207 | SdkMessageResponseField | |
| 208 | Import Map | |
| 210 | WebWizard | |
| **300** | **Canvas App** | **Power Apps canvas apps** |
| 371 | Connection Reference / Connector | Both labeled "Connector" in official docs. In practice, objectid 371 entries route to `connectionreferences` (not connectors). Discovered via objectid intersection — these entries do NOT appear under type 371 in solutioncomponents in tested environments. |
| 372 | Custom Connector | Also labeled "Connector" in official docs (duplicate entry). Routes to `connectors` table. Discovered via objectid intersection — same caveat as 371. |
| 380 | Environment Variable Definition | |
| 381 | Environment Variable Value | |
| 400 | AI Project Type | |
| 401 | AI Project | |
| 402 | AI Configuration | |
| 430 | Entity Analytics Configuration | |
| 431 | Attribute Image Configuration | |
| 432 | Entity Image Configuration | |
| **10030** | **Plugin Package** | **NuGet-based plugin packages (introduced 2021+). Verified in production use; not listed in the main SolutionComponent reference table but documented in Power Platform ALM guidance.** |
| **10076** | **Custom API** | **Custom API definitions. Verified in production use; code above 10000 reflects a later-generation component type registered post-GA.** |

---

## Plugin-Related Component Types

**CRITICAL:** When working with plugins, understand the distinction:

- **90 (Plugin Type)** - Individual plugin class (e.g., `MyNamespace.AccountPlugin`)
- **91 (Plugin Assembly)** - The DLL file containing plugin types
- **92 (SDK Message Processing Step)** - The actual plugin step registration
  - This is what we query for plugin steps
  - Contains: message, entity, stage, mode, rank, filtering attributes, images
- **93 (SDK Message Processing Step Image)** - Pre-image and post-image registrations

**For plugin step discovery, always use component type 92.**

---

## Workflow-Related Component Types

- **29 (Workflow)** - Includes:
  - Classic workflows (category = 0)
  - Business rules (category = 2)
  - Business process flows (category = 4)
  - Cloud flows (category = 5)

Must query the `workflows` table with category field to classify them.

---

## Key Tables for Component Discovery

There are two discovery strategies depending on whether the component type reliably appears in `solutioncomponents`:

### Strategy A — solutioncomponents filter (preferred, targeted)

These component types appear in `solutioncomponents` under their documented (or verified) type codes. In solution-scoped mode, `SolutionComponentDiscovery` queries `solutioncomponents` filtered by `_solutionid_value` and routes each `objectid` to the correct inventory list via the type code. **No separate entity query is needed for these types in solution-scoped mode.**

| Component Type | Query Table (Default Solution path only) | Primary Key Field |
|---------------|------------------------------------------|-------------------|
| 1 (Entity) | `EntityDefinitions` (metadata) | `MetadataId` |
| 2 (Attribute) | `EntityDefinitions` → Attributes | `MetadataId` |
| 9 (GlobalOptionSet) | `GlobalOptionSetDefinitions` (metadata) | `MetadataId` |
| 20 (Security Role) | `roles` | `roleid` |
| 29 (Workflow) | `workflows` | `workflowid` |
| 60 (System Form) | `systemforms` | `formid` |
| 61 (Web Resource) | `webresourceset` | `webresourceid` |
| 70 (Field Security Profile) | `fieldsecurityprofiles` | `fieldsecurityprofileid` |
| 80 (App Module) | `appmodules` | `appmoduleid` |
| 92 (SDK Message Processing Step) | `sdkmessageprocessingsteps` | `sdkmessageprocessingstepid` |
| 300 (Canvas App / Custom Page) | `canvasapps` | `canvasappid` — split post-retrieval by `canvasapptype` (0=Standard, 1=Component Library, 2=Custom Page) |
| 380 (Environment Variable Definition) | `environmentvariabledefinitions` | `environmentvariabledefinitionid` |
| 10030 (Plugin Package) | `pluginpackages` | `pluginpackageid` — verified present in solutioncomponents at runtime |

### Strategy B — objectid intersection (required for broken type codes)

These component types store `solutionid = Default Solution` on every record regardless of which named solution they belong to. They also do **not** appear in `solutioncomponents` under their expected type codes (verified from live environments — type codes 371 and 10076 are absent from the solutioncomponents result set). Server-side filtering by `solutionid` or by `componenttype` is therefore unreliable.

**Discovery pattern:** Query ALL records for the type using `IDataverseClient.queryAll()` (which paginates automatically by following `@odata.nextLink` — `$skip` is NOT used because Dataverse does not support it on all entity types, e.g. `customapis` returns `0x80060888: Skip Clause is not supported in CRM`), then keep only those whose primary key appears in the `solutioncomponents` objectid set for the selected solutions. In Default Solution mode, all records are included without filtering.

**CRITICAL:** Do NOT add a `$filter=solutionid eq <guid>` to these queries — it will return 0 results for any named solution.

| Component Type | Query Table | Primary Key Field | Notes |
|---------------|-------------|-------------------|-------|
| 371 (Connection Reference) | `connectionreferences` | `connectionreferenceid` | Type 371 absent from solutioncomponents in tested environments; objectids appear under undocumented codes |
| 372 (Custom Connector) | `connectors` | `connectorid` | Same caveat as 371 |
| 10076 (Custom API) | `customapis` | `customapiid` | Type 10076 absent from solutioncomponents in tested environments; objectids appear under undocumented codes |

---

## Official Microsoft Documentation

**Always refer to these when implementing component discovery:**

### Primary References
- [SolutionComponent Table Reference](https://learn.microsoft.com/en-us/power-apps/developer/data-platform/reference/entities/solutioncomponent) - Component types list
- [SDK Message Processing Step Reference](https://learn.microsoft.com/en-us/power-apps/developer/data-platform/reference/entities/sdkmessageprocessingstep) - Plugin step schema
- [SDK Message Processing Step Image Reference](https://learn.microsoft.com/en-us/power-apps/developer/data-platform/reference/entities/sdkmessageprocessingstepimage) - Plugin image schema
- [Workflow Reference](https://learn.microsoft.com/en-us/power-apps/developer/data-platform/reference/entities/workflow) - Workflow/flow schema

### Additional References
- [Web API Reference](https://learn.microsoft.com/en-us/power-apps/developer/data-platform/webapi/reference/solutioncomponent) - OData queries
- [Component Dependency Tracking](https://learn.microsoft.com/en-us/power-platform/alm/dependency-tracking-solution-components)

---

## Usage in Code

```typescript
// From src/core/types/components.ts
export enum ComponentType {
  Entity = 1,
  Attribute = 2,
  GlobalOptionSet = 9,
  SecurityRole = 20,
  Workflow = 29,
  SystemForm = 60,
  WebResource = 61,
  FieldSecurityProfile = 70,
  AppModule = 80,               // Model-driven apps
  PluginType = 90,
  PluginAssembly = 91,
  SdkMessageProcessingStep = 92,  // Plugin steps
  SdkMessageProcessingStepImage = 93,  // Plugin step images
  CanvasApp = 300,              // Canvas Apps AND Custom Pages (split by canvasapptype)
  // 371 and 372 are both labeled "Connector" in official docs; 371 = connection references, 372 = custom connectors
  ConnectionReference = 371,
  CustomConnector = 372,
  EnvironmentVariableDefinition = 380,
  // 10030 and 10076 are undocumented in the official option set but appear in solutioncomponents at runtime
  PluginPackage = 10030,        // NuGet-based plugin packages
  CustomAPI = 10076,            // Custom API definitions
}
```

**When adding new component types:**
1. ✅ Check this reference document first
2. ✅ Verify the component type value from Microsoft docs
3. ✅ Add the correct enum value to ComponentType
4. ✅ Implement discovery logic in SolutionComponentDiscovery.ts
5. ✅ Test with actual solution data

**DO NOT guess component type values!**

---

## Last Updated
February 2026 - Based on official Microsoft Dataverse documentation

**Maintainer:** Keep this document in sync with Microsoft documentation updates.
