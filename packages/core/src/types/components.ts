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
  canvasAppIds: string[];
  customPageIds: string[];
  connectionReferenceIds: string[];
  customApiIds: string[];
  environmentVariableIds: string[];
  globalChoiceIds: string[];
  customConnectorIds: string[];
  securityRoleIds: string[];
  fieldSecurityProfileIds: string[];
}

/**
 * Classified workflow inventory
 */
export interface WorkflowInventory {
  flowIds: string[];
  businessRuleIds: string[];
  classicWorkflowIds: string[];
  businessProcessFlowIds: string[];
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
  PluginType = 90,
  PluginAssembly = 91,
  SdkMessageProcessingStep = 92,  // Plugin steps
  SdkMessageProcessingStepImage = 93,  // Plugin step images
  Workflow = 29,
  WebResource = 61,
  FieldSecurityProfile = 70,
  CanvasApp = 300,
  CustomPage = 10004,
  PluginPackage = 10030,  // Plugin packages
  ConnectionReference = 371,
  CustomConnector = 372,
  CustomAPI = 10076,
  EnvironmentVariableDefinition = 380,
}

/**
 * Workflow category codes
 */
export enum WorkflowCategory {
  ClassicWorkflow = 0,
  BusinessRule = 2,
  BusinessProcessFlow = 4,
  Flow = 5,
}
