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
  customconfiguration: string | null;
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
      // Build filter for multiple IDs
      const filterClauses = pluginIds.map((id) => `sdkmessageprocessingstepid eq ${id}`);
      const filter = filterClauses.join(' or ');

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
          'customconfiguration',
        ],
        filter,
        expand:
          'sdkmessageid($select=name),plugintypeid($select=typename,name,assemblyname,plugintypeid),sdkmessagefilterid($select=primaryobjecttypecode),impersonatinguserid($select=fullname,systemuserid)',
        orderBy: ['stage asc', 'rank asc'],
      });

      // Process each plugin step
      const pluginSteps: PluginStep[] = [];

      for (const raw of result.value) {
        // Query images for this plugin
        const images = await this.getPluginImages(raw.sdkmessageprocessingstepid);

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
          configuration: raw.configuration,
          customConfiguration: raw.customconfiguration,
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
   * Get plugin images (pre and post) for a plugin step
   */
  private async getPluginImages(
    pluginStepId: string
  ): Promise<{ preImage: ImageDefinition | null; postImage: ImageDefinition | null }> {
    try {
      const result = await this.client.query<RawPluginImage>('sdkmessageprocessingstepimages', {
        select: [
          'sdkmessageprocessingstepimageid',
          'imagetype',
          'name',
          'attributes',
          'messagepropertyname',
        ],
        filter: `_sdkmessageprocessingstepid_value eq ${pluginStepId}`,
      });

      let preImage: ImageDefinition | null = null;
      let postImage: ImageDefinition | null = null;

      for (const raw of result.value) {
        const imageType = raw.imagetype === 0 ? 'PreImage' : 'PostImage';
        const image: ImageDefinition = {
          id: raw.sdkmessageprocessingstepimageid,
          name: raw.name,
          imageType,
          attributes: this.parseImageAttributes(raw.attributes),
          messagePropertyName: raw.messagepropertyname,
        };

        if (imageType === 'PreImage') {
          preImage = image;
        } else {
          postImage = image;
        }
      }

      return { preImage, postImage };
    } catch (error) {
      // If images query fails, just return null images
      console.warn(`Failed to retrieve images for plugin ${pluginStepId}:`, error);
      return { preImage: null, postImage: null };
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
