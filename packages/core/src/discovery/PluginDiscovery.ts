import type { IDataverseClient } from '../dataverse/IDataverseClient.js';
import type { PluginStep, ImageDefinition } from '../types.js';

/**
 * Raw plugin step data from Dataverse
 */
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
  sdkmessageid?: {
    name: string;
  };
  plugintypeid?: {
    typename: string;
    name: string;
    assemblyname: string;
    plugintypeid: string;
  };
  sdkmessagefilterid?: {
    primaryobjecttypecode: string;
  };
  impersonatinguserid?: {
    fullname: string;
    systemuserid: string;
  };
}

/**
 * Raw image data from Dataverse
 */
interface RawPluginImage {
  sdkmessageprocessingstepimageid: string;
  _sdkmessageprocessingstepid_value?: string;
  imagetype: number;
  name: string;
  attributes: string | null;
  messagepropertyname: string;
}

/**
 * Discovers plugins for entities
 */
export class PluginDiscovery {
  private readonly client: IDataverseClient;

  constructor(client: IDataverseClient) {
    this.client = client;
  }

  /**
   * Get plugin steps by their IDs
   * @param pluginIds Array of plugin step IDs
   * @returns Array of complete plugin steps with all metadata
   */
  async getPluginsByIds(pluginIds: string[]): Promise<PluginStep[]> {
    if (pluginIds.length === 0) {
      return [];
    }

    try {
      // Build filter for multiple IDs (use OData v4 guid literal syntax)
      const filterClauses = pluginIds.map((id) => {
        // Remove braces if present for OData guid literal
        const cleanGuid = id.replace(/[{}]/g, '');
        return `sdkmessageprocessingstepid eq ${cleanGuid}`;
      });
      const filter = filterClauses.join(' or ');

      console.log('🔌 Plugin query filter:', filter);

      // Query plugin steps with expanded relationships
      const result = await this.client.query<RawPluginStep>('sdkmessageprocessingsteps', {
        select: [
          'sdkmessageprocessingstepid',
          'name',
          'stage',
          'mode',
          'rank',
          'filteringattributes',
          'description',
          'asyncautodelete',
          'configuration',
        ],
        filter,
        expand:
          'sdkmessageid($select=name),plugintypeid($select=typename,name,assemblyname,plugintypeid),sdkmessagefilterid($select=primaryobjecttypecode),impersonatinguserid($select=fullname,systemuserid)',
        orderBy: ['stage asc', 'rank asc'],
      });

      console.log(`🔌 Plugin query returned ${result.value.length} results`);

      // OPTIMIZED: Pre-fetch all plugin images in a single batch query
      // This reduces N queries (one per plugin) to 1 query for all plugins
      const allImages = await this.getPluginImagesForAllSteps(
        result.value.map(r => r.sdkmessageprocessingstepid)
      );

      // Process each plugin step
      const pluginSteps: PluginStep[] = [];

      for (const raw of result.value) {
        // Get images from pre-fetched data
        const images = allImages.get(raw.sdkmessageprocessingstepid) || { preImage: null, postImage: null };

        // Build complete plugin step
        const pluginStep: PluginStep = {
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
          configuration: null, // Secure config requires separate lookup
          customConfiguration: raw.configuration, // Unsecure configuration
          preImage: images.preImage,
          postImage: images.postImage,
          impersonatingUserId: raw.impersonatinguserid?.systemuserid || null,
          impersonatingUserName: raw.impersonatinguserid?.fullname || null,
        };

        pluginSteps.push(pluginStep);
      }

      return pluginSteps;
    } catch (error) {
      throw new Error(
        `Failed to retrieve plugins: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get plugin images (pre and post) for multiple plugin steps in a single batch query
   * OPTIMIZED: Reduces N queries to 1 query
   */
  private async getPluginImagesForAllSteps(
    pluginStepIds: string[]
  ): Promise<Map<string, { preImage: ImageDefinition | null; postImage: ImageDefinition | null }>> {
    const imageMap = new Map<string, { preImage: ImageDefinition | null; postImage: ImageDefinition | null }>();

    // Initialize map with null images for all steps
    for (const stepId of pluginStepIds) {
      imageMap.set(stepId, { preImage: null, postImage: null });
    }

    if (pluginStepIds.length === 0) {
      return imageMap;
    }

    try {
      // Batch query all images with OR filter (GUIDs need braces and quotes in OData)
      const imageFilters = pluginStepIds.map(id => {
        const guidWithBraces = id.startsWith('{') ? id : `{${id}}`;
        return `_sdkmessageprocessingstepid_value eq '${guidWithBraces}'`;
      }).join(' or ');

      const result = await this.client.query<RawPluginImage>('sdkmessageprocessingstepimages', {
        select: [
          'sdkmessageprocessingstepimageid',
          '_sdkmessageprocessingstepid_value',
          'imagetype',
          'name',
          'attributes',
          'messagepropertyname',
        ],
        filter: imageFilters,
      });

      // Group images by plugin step ID
      for (const raw of result.value) {
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
          if (imageType === 'PreImage') {
            stepImages.preImage = image;
          } else {
            stepImages.postImage = image;
          }
        }
      }

      return imageMap;
    } catch (error) {
      // If images query fails, return map with null images
      console.warn('Failed to retrieve plugin images in batch:', error);
      return imageMap;
    }
  }

  /**
   * Get human-readable stage name
   */
  getStageName(stage: number): string {
    switch (stage) {
      case 10:
        return 'PreValidation';
      case 20:
        return 'PreOperation';
      case 30:
        return 'MainOperation';
      case 40:
        return 'PostOperation';
      case 50:
        return 'Asynchronous';
      default:
        return 'Unknown';
    }
  }

  /**
   * Get human-readable mode name
   */
  getModeName(mode: number): string {
    switch (mode) {
      case 0:
        return 'Synchronous';
      case 1:
        return 'Asynchronous';
      default:
        return 'Unknown';
    }
  }

  /**
   * Parse filtering attributes from comma-separated string
   */
  parseFilteringAttributes(filteringAttributes: string | null): string[] {
    if (!filteringAttributes) {
      return [];
    }

    return filteringAttributes
      .split(',')
      .map((attr) => attr.trim())
      .filter((attr) => attr.length > 0);
  }

  /**
   * Parse image attributes from comma-separated string
   */
  private parseImageAttributes(attributes: string | null): string[] {
    if (!attributes) {
      return [];
    }

    return attributes
      .split(',')
      .map((attr) => attr.trim())
      .filter((attr) => attr.length > 0);
  }
}
