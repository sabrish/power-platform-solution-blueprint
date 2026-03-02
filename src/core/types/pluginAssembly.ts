/**
 * Plugin assembly metadata used for recovery and reverse engineering workflows.
 */
export interface PluginAssembly {
  id: string;
  name: string;
  version: string | null;
  culture: string | null;
  publicKeyToken: string | null;
  sourceType: number | null;
  sourceTypeName: string;
  isolationMode: number | null;
  isolationModeName: string;
  description: string | null;
  createdOn: string | null;
  modifiedOn: string | null;
  pluginStepCount: number;
  pluginTypes: string[];
}

/**
 * Recoverable assembly payload.
 */
export interface RecoveredPluginAssembly {
  assemblyId: string;
  assemblyName: string;
  fileName: string;
  contentBase64: string;
  sizeBytes: number;
}
