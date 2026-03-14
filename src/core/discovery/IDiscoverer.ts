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
 *
 * NOTE: The following discovery classes intentionally do NOT implement IDiscoverer<T>
 * because their discovery involves multiple API calls, metadata queries, or multi-step
 * operations that do not fit the simple discoverByIds(ids: string[]) contract:
 * - EntityDiscovery: uses metadata API + schema discovery + multi-step resolution
 * - FieldSecurityProfileDiscovery: requires separate profile + permissions queries
 *
 * If generic orchestration is ever needed for these types, an adapter class should be
 * created (e.g. EntityDiscoveryAdapter implements IDiscoverer<EntityBlueprint>) that
 * wraps the specific discovery logic behind the standard interface.
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
