import type { IDataverseClient } from '../dataverse/IDataverseClient.js';
import type { PluginStep, ImageDefinition } from '../types.js';
import type { FetchLogger } from '../utils/FetchLogger.js';
import { withAdaptiveBatch } from '../utils/withAdaptiveBatch.js';
import { buildOrFilter } from '../utils/odata.js';

interface RawPluginStep {
  sdkmessageprocessingstepid: string;
  name: string;
  stage: number;
  mode: number;
  rank: number;
  filteringattributes: string | null;
  description: string | null;
  asyncautodelete: boolean;
  configuration: string | null;
  statecode: number;
  sdkmessageid?: { name: string };
  plugintypeid?: { typename: string; name: string; assemblyname: string; plugintypeid: string };
  sdkmessagefilterid?: { primaryobjecttypecode: string };
  _impersonatinguserid_value?: string;
  '_impersonatinguserid_value@OData.Community.Display.V1.FormattedValue'?: string;
}

interface RawPluginImage {
  sdkmessageprocessingstepimageid: string;
  _sdkmessageprocessingstepid_value?: string;
  imagetype: number;
  name: string;
  attributes: string | null;
  messagepropertyname: string;
}

export class PluginDiscovery {
  private readonly client: IDataverseClient;
  private onProgress?: (current: number, total: number) => void;
  private logger?: FetchLogger;

  constructor(
    client: IDataverseClient,
    onProgress?: (current: number, total: number) => void,
    logger?: FetchLogger
  ) {
    this.client = client;
    this.onProgress = onProgress;
    this.logger = logger;
  }

  async getPluginsByIds(pluginIds: string[]): Promise<PluginStep[]> {
    if (pluginIds.length === 0) return [];

    try {
      // Fetch plugin steps in adaptive batches
      const { results: allPluginSteps } = await withAdaptiveBatch<string, RawPluginStep>(
        pluginIds,
        async (batch) => {
          const filter = buildOrFilter(
            batch.map(id => id.replace(/[{}]/g, '')),
            'sdkmessageprocessingstepid',
            { guids: true }
          );
          const result = await this.client.query<RawPluginStep>('sdkmessageprocessingsteps', {
            select: [
              'sdkmessageprocessingstepid', 'name', 'stage', 'mode', 'rank',
              'filteringattributes', 'description', 'asyncautodelete', 'configuration',
              'statecode', '_impersonatinguserid_value',
            ],
            filter,
            expand: 'sdkmessageid($select=name),plugintypeid($select=typename,name,assemblyname,plugintypeid),sdkmessagefilterid($select=primaryobjecttypecode)',
            orderBy: ['stage asc', 'rank asc'],
          });
          return result.value;
        },
        {
          initialBatchSize: 20,
          step: 'Plugin Discovery',
          entitySet: 'sdkmessageprocessingsteps',
          logger: this.logger,
          onProgress: (done, total) => this.onProgress?.(Math.floor(done / 2), total),
        }
      );

      // Build step name map for getBatchLabel in images pass
      const stepIdToName = new Map(allPluginSteps.map(r => [r.sdkmessageprocessingstepid.toLowerCase(), r.name]));

      // Fetch all plugin images in adaptive batches
      const allImages = await this.getPluginImagesForAllSteps(
        allPluginSteps.map(r => r.sdkmessageprocessingstepid),
        stepIdToName
      );

      this.onProgress?.(pluginIds.length, pluginIds.length);

      return allPluginSteps.map(raw => {
        const images = allImages.get(raw.sdkmessageprocessingstepid) || { preImage: null, postImage: null };
        return {
          id: raw.sdkmessageprocessingstepid,
          name: raw.name,
          stage: raw.stage,
          stageName: this.getStageName(raw.stage),
          mode: raw.mode,
          modeName: this.getModeName(raw.mode),
          rank: raw.rank,
          message: raw.sdkmessageid?.name || 'Unknown',
          entity: raw.sdkmessagefilterid?.primaryobjecttypecode || 'none',
          assemblyName: raw.plugintypeid?.assemblyname || 'Unknown',
          typeName: raw.plugintypeid?.typename || 'Unknown',
          pluginTypeId: raw.plugintypeid?.plugintypeid || '',
          filteringAttributes: this.parseFilteringAttributes(raw.filteringattributes),
          description: raw.description,
          asyncAutoDelete: raw.asyncautodelete,
          configuration: null,
          customConfiguration: raw.configuration,
          preImage: images.preImage,
          postImage: images.postImage,
          impersonatingUserId: raw._impersonatinguserid_value || null,
          impersonatingUserName: raw['_impersonatinguserid_value@OData.Community.Display.V1.FormattedValue'] || null,
          stateCode: raw.statecode,
          state: this.getStateName(raw.statecode),
        } as PluginStep;
      });

    } catch (error) {
      throw new Error(
        `Failed to retrieve plugins: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private async getPluginImagesForAllSteps(
    pluginStepIds: string[],
    stepIdToName: Map<string, string>
  ): Promise<Map<string, { preImage: ImageDefinition | null; postImage: ImageDefinition | null }>> {
    const imageMap = new Map<string, { preImage: ImageDefinition | null; postImage: ImageDefinition | null }>();
    for (const stepId of pluginStepIds) {
      imageMap.set(stepId, { preImage: null, postImage: null });
    }
    if (pluginStepIds.length === 0) return imageMap;

    try {
      const { results: allImages } = await withAdaptiveBatch<string, RawPluginImage>(
        pluginStepIds,
        async (batch) => {
          const imageFilters = batch.map(id => {
            const guidWithBraces = id.startsWith('{') ? id : `{${id}}`;
            return `_sdkmessageprocessingstepid_value eq '${guidWithBraces}'`;
          }).join(' or ');
          const result = await this.client.query<RawPluginImage>('sdkmessageprocessingstepimages', {
            select: [
              'sdkmessageprocessingstepimageid', '_sdkmessageprocessingstepid_value',
              'imagetype', 'name', 'attributes', 'messagepropertyname',
            ],
            filter: imageFilters,
          });
          return result.value;
        },
        {
          initialBatchSize: 20,
          step: 'Plugin Discovery',
          entitySet: 'sdkmessageprocessingstepimages',
          logger: this.logger,
          onProgress: (done, total) => this.onProgress?.(
            Math.floor(pluginStepIds.length / 2) + Math.floor(done / 2),
            total
          ),
          getBatchLabel: (batch) => batch.map(id => stepIdToName.get(id.toLowerCase()) ?? id).join(', '),
        }
      );

      for (const raw of allImages) {
        const stepId = (raw as any)._sdkmessageprocessingstepid_value?.toLowerCase();
        if (!stepId) continue;
        const imageType = raw.imagetype === 0 ? 'PreImage' : 'PostImage';
        const image: ImageDefinition = {
          id: raw.sdkmessageprocessingstepimageid,
          name: raw.name,
          imageType,
          attributes: this.parseImageAttributes(raw.attributes),
          messagePropertyName: raw.messagepropertyname,
        };
        const stepImages = imageMap.get(stepId);
        if (stepImages) {
          if (imageType === 'PreImage') stepImages.preImage = image;
          else stepImages.postImage = image;
        }
      }
    } catch {
      // Partial failure — return what we have
    }

    return imageMap;
  }

  getStageName(stage: number): string {
    switch (stage) {
      case 10: return 'PreValidation';
      case 20: return 'PreOperation';
      case 30: return 'MainOperation';
      case 40: return 'PostOperation';
      case 50: return 'Asynchronous';
      default: return 'Unknown';
    }
  }

  getModeName(mode: number): string {
    switch (mode) {
      case 0: return 'Synchronous';
      case 1: return 'Asynchronous';
      default: return 'Unknown';
    }
  }

  getStateName(stateCode: number): 'Enabled' | 'Disabled' {
    return stateCode === 0 ? 'Enabled' : 'Disabled';
  }

  parseFilteringAttributes(filteringAttributes: string | null): string[] {
    if (!filteringAttributes) return [];
    return filteringAttributes.split(',').map(a => a.trim()).filter(a => a.length > 0);
  }

  private parseImageAttributes(attributes: string | null): string[] {
    if (!attributes) return [];
    return attributes.split(',').map(a => a.trim()).filter(a => a.length > 0);
  }
}
