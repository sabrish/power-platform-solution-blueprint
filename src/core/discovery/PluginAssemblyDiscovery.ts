import type { IDataverseClient } from '../dataverse/IDataverseClient.js';
import type { PluginStep } from '../types.js';
import type { PluginAssembly, RecoveredPluginAssembly } from '../types/pluginAssembly.js';

interface RawPluginAssembly {
  pluginassemblyid: string;
  name: string;
  version: string | null;
  culture: string | null;
  publickeytoken: string | null;
  sourcetype: number | null;
  'sourcetype@OData.Community.Display.V1.FormattedValue'?: string;
  isolationmode: number | null;
  'isolationmode@OData.Community.Display.V1.FormattedValue'?: string;
  description: string | null;
  createdon: string | null;
  modifiedon: string | null;
}

interface RawPluginAssemblyContent {
  pluginassemblyid: string;
  name: string;
  content: string | null;
}

/**
 * Discovers and recovers Dataverse plugin assemblies.
 */
export class PluginAssemblyDiscovery {
  private readonly client: IDataverseClient;

  constructor(client: IDataverseClient) {
    this.client = client;
  }

  /**
   * Get plugin assembly metadata by IDs.
   */
  async getAssembliesByIds(assemblyIds: string[], plugins: PluginStep[] = []): Promise<PluginAssembly[]> {
    if (assemblyIds.length === 0) {
      return [];
    }

    const uniqueIds = Array.from(
      new Set(assemblyIds.map(id => this.normalizeGuid(id)).filter(Boolean))
    );

    const pluginStatsByAssembly = this.buildPluginStatsByAssembly(plugins);
    const batchSize = 20;
    const rawAssemblies: RawPluginAssembly[] = [];

    for (let i = 0; i < uniqueIds.length; i += batchSize) {
      const batch = uniqueIds.slice(i, i + batchSize);
      const filter = batch.map(id => `pluginassemblyid eq ${id}`).join(' or ');

      const result = await this.client.query<RawPluginAssembly>('pluginassemblies', {
        select: [
          'pluginassemblyid',
          'name',
          'version',
          'culture',
          'publickeytoken',
          'sourcetype',
          'isolationmode',
          'description',
          'createdon',
          'modifiedon',
        ],
        filter,
        orderBy: ['name asc'],
      });

      rawAssemblies.push(...result.value);
    }

    return rawAssemblies
      .map((raw) => {
        const stats = pluginStatsByAssembly.get(raw.name.toLowerCase());
        return {
          id: raw.pluginassemblyid,
          name: raw.name,
          version: raw.version,
          culture: raw.culture,
          publicKeyToken: raw.publickeytoken,
          sourceType: raw.sourcetype,
          sourceTypeName:
            raw['sourcetype@OData.Community.Display.V1.FormattedValue'] ||
            this.getSourceTypeName(raw.sourcetype),
          isolationMode: raw.isolationmode,
          isolationModeName:
            raw['isolationmode@OData.Community.Display.V1.FormattedValue'] ||
            this.getIsolationModeName(raw.isolationmode),
          description: raw.description,
          createdOn: raw.createdon,
          modifiedOn: raw.modifiedon,
          pluginStepCount: stats?.stepCount || 0,
          pluginTypes: stats ? Array.from(stats.pluginTypes).sort((a, b) => a.localeCompare(b)) : [],
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Get recoverable assembly content for one assembly.
   */
  async getAssemblyContentById(assemblyId: string): Promise<RecoveredPluginAssembly> {
    const normalizedId = this.normalizeGuid(assemblyId);
    if (!normalizedId) {
      throw new Error('Invalid assembly ID');
    }

    const result = await this.client.query<RawPluginAssemblyContent>('pluginassemblies', {
      select: ['pluginassemblyid', 'name', 'content'],
      filter: `pluginassemblyid eq ${normalizedId}`,
      top: 1,
    });

    if (result.value.length === 0) {
      throw new Error(`Plugin assembly ${assemblyId} not found`);
    }

    const assembly = result.value[0];
    if (!assembly.content) {
      throw new Error(`Assembly ${assembly.name} does not contain recoverable binary content`);
    }

    return {
      assemblyId: assembly.pluginassemblyid,
      assemblyName: assembly.name,
      fileName: this.buildAssemblyFileName(assembly.name),
      contentBase64: assembly.content,
      sizeBytes: this.estimateDecodedSize(assembly.content),
    };
  }

  private buildPluginStatsByAssembly(plugins: PluginStep[]): Map<string, { stepCount: number; pluginTypes: Set<string> }> {
    const stats = new Map<string, { stepCount: number; pluginTypes: Set<string> }>();

    for (const plugin of plugins) {
      const assemblyName = (plugin.assemblyName || '').trim();
      if (!assemblyName || assemblyName.toLowerCase() === 'unknown') {
        continue;
      }

      const key = assemblyName.toLowerCase();
      if (!stats.has(key)) {
        stats.set(key, { stepCount: 0, pluginTypes: new Set<string>() });
      }

      const current = stats.get(key)!;
      current.stepCount += 1;

      if (plugin.typeName && plugin.typeName.toLowerCase() !== 'unknown') {
        current.pluginTypes.add(plugin.typeName);
      }
    }

    return stats;
  }

  private normalizeGuid(value: string): string {
    return String(value).trim().replace(/[{}]/g, '').toLowerCase();
  }

  private buildAssemblyFileName(name: string): string {
    const sanitized = name.replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').trim() || 'plugin-assembly';
    return sanitized.toLowerCase().endsWith('.dll') ? sanitized : `${sanitized}.dll`;
  }

  private estimateDecodedSize(base64: string): number {
    const trimmed = base64.trim();
    const padding = (trimmed.endsWith('==') ? 2 : trimmed.endsWith('=') ? 1 : 0);
    return Math.max(0, Math.floor((trimmed.length * 3) / 4) - padding);
  }

  private getSourceTypeName(sourceType: number | null): string {
    switch (sourceType) {
      case 0:
        return 'Database';
      case 1:
        return 'Disk';
      case 2:
        return 'Normal';
      case 3:
        return 'AzureWebApp';
      default:
        return 'Unknown';
    }
  }

  private getIsolationModeName(isolationMode: number | null): string {
    switch (isolationMode) {
      case 1:
        return 'None';
      case 2:
        return 'Sandbox';
      case 3:
        return 'External';
      default:
        return 'Unknown';
    }
  }
}
