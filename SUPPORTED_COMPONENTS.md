# Supported Components — Power Platform Solution Blueprint

PPSB discovers and documents Dataverse environments across a growing range of component types. This document lists every component type by coverage status — Supported (full discovery and export), Partial (limited coverage), and Planned (not yet implemented).

## Supported Components

| Component | What it is | Export formats | Notes |
|---|---|---|---|
| Tables / Entities | Schema metadata — attributes, relationships, keys | MD / JSON / HTML / ZIP | ERD included; per-entity breakdown; attribute details per relationship |
| Plugin Steps & Assemblies | .NET code registered on Dataverse messages | MD / JSON / HTML / ZIP | Stage, rank, mode, filtering attributes, images; per-entity grouping |
| Power Automate Flows | Cloud flows triggered by Dataverse or schedule | MD / JSON / HTML / ZIP | Trigger analysis, connection references, external call detection; per-entity grouping |
| Business Rules | Low-code rules defined on entity forms | MD / JSON / HTML / ZIP | Condition and action parsing from compiled JavaScript |
| Classic Workflows | Legacy process-based workflows | MD / JSON / HTML / ZIP | Migration recommendations and risk scoring included |
| Business Process Flows | Guided stage-based processes | MD / JSON / HTML / ZIP | Stages and steps from process stage client data |
| JavaScript Web Resources | Client-side JS libraries and form scripts | MD / JSON / HTML / ZIP | External call detection, deprecated Xrm.Page API flagging, complexity analysis |
| Custom APIs | Custom actions and functions | MD / JSON / HTML / ZIP | Request parameters and response properties |
| Environment Variables | Configuration values with optional current value | MD / JSON / HTML / ZIP | Definition and current value tracking |
| Connection References | Named connector references used by flows | MD / JSON / HTML / ZIP | Premium connector detection |
| Global Choices | Shared option sets reused across entities | MD / JSON / HTML / ZIP | Option values and labels |
| Custom Connectors | Custom API connectors built with the connector SDK | MD / JSON / HTML / ZIP | Connector metadata; display name, description, managed status |
| Canvas Apps | Low-code apps built with Power Apps Studio | MD / JSON / HTML / ZIP | Metadata only: display name, logical name, description, managed status, modified date |
| Custom Pages | Modern Power Apps pages used in model-driven apps | MD / JSON / HTML / ZIP | Metadata only: display name, logical name, description, managed status, modified date |
| Model-Driven Apps | App modules defining navigation, forms, and views | MD / JSON / HTML / ZIP | Metadata only: display name, unique name, description, managed status, modified date |
| PCF Controls | Custom controls built with the Power Apps Component Framework | MD / JSON / HTML / ZIP | Display name, version, compatible data types, managed status |
| Service Endpoints / Webhooks | External messaging endpoints registered on Dataverse (Service Bus, Event Hub, Webhook) | MD / JSON / HTML / ZIP | Contract type, registered step count, connection mode, message format |
| Copilot Studio Agents | AI agents and classic bots built in Copilot Studio | MD / JSON / HTML / ZIP | Kind (Copilot Agent / Classic Bot), active status, component count |
| Security Roles | Role-based access control definitions | MD / JSON / HTML / ZIP | Per-role privilege matrix with depth values (None/Basic/Local/Deep/Global) |
| Field Security Profiles | Column-level security assignments | MD / JSON / HTML / ZIP | Per-profile column permission matrix |
| Attribute Masking Rules | Data masking definitions on sensitive columns | MD / JSON / HTML / ZIP | Masked column assignments and masking rule names |
| Column Security Profiles | Profile metadata for column-level security | MD / JSON / HTML / ZIP | Included as part of field security discovery |
| Forms | Main, Quick Create, Quick View, and Dialog forms | MD / JSON / HTML / ZIP | Event handlers and JavaScript library references per form |
| Entity Relationship Diagram | Visual graph of entity relationships | HTML / ZIP | Interactive Cytoscape.js graph; per-publisher colour coding; PNG/SVG export |
| Cross-Entity Automation | Pipeline traces across entity boundaries | MD / JSON / HTML / ZIP | Pipeline-first view with inbound trigger badges, external call detection, and Manual/On-Demand pipeline support; shipped in v1.0.0, enhanced in v1.1.0 |
| External Dependency Analysis | Aggregated view of external HTTP/connector calls | MD / JSON / HTML / ZIP | Risk scoring across plugins, flows, and web resources |
| Solution Distribution | Per-solution component breakdown | MD / JSON / HTML / ZIP | Shared component detection across solutions |

## Planned Components

| Component | What it is | Notes |
|---|---|---|
| AI Models | AI Builder models (Prediction, Object Detection, Form Processing) | Type codes 400, 401, 402 |
| Allowed MCP Clients | Model Context Protocol client allowlist for Copilot Studio agents | New feature; type code TBD |
| Catalog | Power Platform Catalog items and packages | Requires Catalog API surface; type code TBD |
| Dialogs | Legacy Dataverse dialog workflows (deprecated) | Type code 29, category 1; still present in older solutions |
| Duplicate Detection Rules | Rules that identify duplicate records | Type code 44 |
| FxExpression | Power Fx formula expressions stored as solution components | Type code TBD; newer Power Platform feature |
| Model-Driven App Views | Predefined entity list views and advanced find queries | Type code 26 |
| Charts | Saved query visualizations attached to entity views | Type code 59 |
| Reports | SSRS and FetchXML-based reports | Type code 31 |
| Site Maps | Navigation structure definitions for model-driven apps | Type code 62 |
| SLA Definitions | Service level agreement configurations | Type code 152 |
| Virtual / Elastic Table Data Sources | External data source connections for virtual tables | Type code 166 |
| Power Pages (Portal Components) | Customer-facing portal sites built on Power Pages | Requires separate portal API surface |
| Customer Insights / Journeys | Marketing journeys and customer data platform integration | Requires separate API surface |

---
*Last updated: v1.2.0 — 2026-04-12*
*Component type integer codes: see [COMPONENT_TYPES_REFERENCE.md](./COMPONENT_TYPES_REFERENCE.md)*
