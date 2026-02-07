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
| 371 | Connector | Custom connectors |
| 372 | Connector | (duplicate entry in docs) |
| 380 | Environment Variable Definition | |
| 381 | Environment Variable Value | |
| 400 | AI Project Type | |
| 401 | AI Project | |
| 402 | AI Configuration | |
| 430 | Entity Analytics Configuration | |
| 431 | Attribute Image Configuration | |
| 432 | Entity Image Configuration | |

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

| Component Type | Query Table | Primary Key Field |
|---------------|-------------|-------------------|
| 1 (Entity) | `EntityDefinitions` (metadata) | `MetadataId` |
| 2 (Attribute) | `EntityDefinitions` → Attributes | `MetadataId` |
| 29 (Workflow) | `workflows` | `workflowid` |
| 61 (Web Resource) | `webresources` | `webresourceid` |
| 92 (SDK Message Processing Step) | `sdkmessageprocessingsteps` | `sdkmessageprocessingstepid` |
| 93 (SDK Message Processing Step Image) | `sdkmessageprocessingstepimages` | `sdkmessageprocessingstepimageid` |
| 300 (Canvas App) | `canvasapps` | `canvasappid` |
| 371 (Connector) | `connectors` | `connectorid` |
| 380 (Environment Variable Definition) | `environmentvariabledefinitions` | `environmentvariabledefinitionid` |

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
// From packages/core/src/types/components.ts
export enum ComponentType {
  Entity = 1,
  Attribute = 2,
  PluginType = 90,
  PluginAssembly = 91,
  SdkMessageProcessingStep = 92,  // Plugin steps
  SdkMessageProcessingStepImage = 93,  // Plugin images
  Workflow = 29,
  WebResource = 61,
  CanvasApp = 300,
  CustomPage = 10004,
  ConnectionReference = 371,
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
