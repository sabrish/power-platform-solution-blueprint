/**
 * Common interface for all ID-based batch discovery classes.
 *
 * Implemented by: FlowDiscovery, ClassicWorkflowDiscovery,
 * BusinessProcessFlowDiscovery, PluginDiscovery, BusinessRuleDiscovery,
 * CustomAPIDiscovery, WebResourceDiscovery, EnvironmentVariableDiscovery,
 * ConnectionReferenceDiscovery, GlobalChoiceDiscovery, SecurityRoleDiscovery
 *
 * Not implemented by: SchemaDiscovery (single-entity by name),
 * PublisherDiscovery (fetch-all), FieldSecurityProfileDiscovery (no ID input),
 * AppDiscovery (returns multiple types), SolutionComponentDiscovery (multi-type)
 */
export interface IDiscoverer<T> {
  /**
   * Discover items by their Dataverse component IDs.
   * IDs may be in any format (with or without braces); normalisation is internal.
   * @param ids Array of component IDs from solution component discovery
   * @returns Discovered items in the same order as possible, omitting not-found
   */
  discoverByIds(ids: string[]): Promise<T[]>;
}
