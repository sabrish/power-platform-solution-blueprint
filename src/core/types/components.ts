/**
 * Component inventory types for solution discovery
 */

/**
 * Inventory of components found in solution(s)
 */
export interface ComponentInventory {
  entityIds: string[];
  attributeIds: string[];
  pluginIds: string[];
  pluginPackageIds: string[];
  workflowIds: string[];
  webResourceIds: string[];
  formIds: string[];
  canvasAppIds: string[];
  /** @deprecated Always empty — Custom Pages share component type 300 with Canvas Apps and are split post-retrieval in AppDiscovery by canvasapptype === 2. Do not read from this field. */
  readonly customPageIds: string[];
  appModuleIds: string[];
  connectionReferenceIds: string[];
  customApiIds: string[];
  environmentVariableIds: string[];
  globalChoiceIds: string[];
  customConnectorIds: string[];
  securityRoleIds: string[];
  fieldSecurityProfileIds: string[];
  pcfControlIds: string[];
  serviceEndpointIds: string[];
  copilotAgentIds: string[];
  viewIds: string[];
  reportIds: string[];
  duplicateDetectionRuleIds: string[];
  chartIds: string[];
  siteMapIds: string[];
  slaDefinitionIds: string[];
  virtualTableDataSourceIds: string[];
  aiModelIds: string[];
}

/**
 * Classified workflow inventory
 */
export interface WorkflowInventory {
  flowIds: string[];
  businessRuleIds: string[];
  classicWorkflowIds: string[];
  businessProcessFlowIds: string[];
  dialogIds: string[];
}

/**
 * Enhanced inventory with solution membership tracking
 */
export interface ComponentInventoryWithSolutions extends ComponentInventory {
  // Maps for solution membership
  componentToSolutions: Map<string, string[]>;  // componentId → solutionIds
  solutionComponentMap: Map<string, Set<string>>;  // solutionId → componentIds
  componentTypes: Map<string, number>;  // componentId → componentType
  entitiesWithAllSubcomponents: Set<string>;  // entityIds with rootcomponentbehavior=0 (include all subcomponents)
}

/**
 * Classified workflow inventory with solution tracking
 */
export interface WorkflowInventoryWithSolutions extends WorkflowInventory {
  // Solution membership
  componentToSolutions: Map<string, string[]>;
  solutionComponentMap: Map<string, Set<string>>;
  // dialogIds inherited from WorkflowInventory
}

/**
 * Solution component type codes
 * Reference: https://learn.microsoft.com/en-us/power-apps/developer/data-platform/reference/entities/solutioncomponent
 */
export enum ComponentType {
  Entity = 1,
  Attribute = 2,
  GlobalOptionSet = 9,
  SecurityRole = 20,
  Workflow = 29,
  SystemForm = 60,  // Forms (Main, Quick Create, Quick View, Card)
  WebResource = 61,
  FieldSecurityProfile = 70,
  AppModule = 80,  // Model-Driven Apps
  PluginType = 90,
  PluginAssembly = 91,
  SdkMessageProcessingStep = 92,  // Plugin steps
  SdkMessageProcessingStepImage = 93,  // Plugin step images
  // Canvas Apps and Custom Pages both use type 300; differentiated by canvasapptype (0 = Standard, 1 = Component Library, 2 = Custom Page)
  CanvasApp = 300,
  // NOTE: Connection References (371) and Custom Connectors (372) do not appear in solutioncomponents
  // under these type codes. Both have solutionid pointing to Default Solution on their entity records.
  // Discovered via objectid intersection: query all records and match against solutioncomponents objectids.
  ConnectionReference = 371,
  CustomConnector = 372,
  EnvironmentVariableDefinition = 380,
  // NOTE: Custom APIs appear in solutioncomponents under undocumented type codes (not 10076).
  // Discovered via objectid intersection: query all customapis and match against
  // solutioncomponents objectids. PluginPackage (10030) does appear in solutioncomponents.
  CustomAPI = 10076,
  PluginPackage = 10030,  // Plugin packages
  CustomControl = 66,     // PCF controls
  ServiceEndpoint = 95,   // Service Bus / Event Hub / Webhook endpoints
  View = 26,              // Saved queries (views)
  Report = 31,            // SSRS reports
  DuplicateDetectionRule = 44,  // Duplicate detection rules
  Chart = 59,             // Saved query visualizations (charts)
  SiteMap = 62,           // Site maps (navigation structure)
  SlaDefinition = 152,    // Service Level Agreements
  VirtualTableDataSource = 166, // Virtual table data sources
  // AI Builder: types 400, 401, 402 all route to aiModelIds (queried against msdyn_aimodels)
  AiProjectType = 400,
  AiProject = 401,
  AiConfiguration = 402,
}

/**
 * Workflow category codes
 */
export enum WorkflowCategory {
  ClassicWorkflow = 0,
  Dialog = 1,
  BusinessRule = 2,
  BusinessProcessFlow = 4,
  Flow = 5,
}
