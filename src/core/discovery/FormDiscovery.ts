import type { IDataverseClient } from '../dataverse/IDataverseClient.js';
import type { FormDefinition, FormEventHandler } from '../types/blueprint.js';

/**
 * Raw form data from systemform table
 */
interface RawForm {
  formid: string;
  name: string;
  type: number;
  objecttypecode: string;
  formxml: string;
}

/**
 * Discovers form definitions and JavaScript event handlers
 */
export class FormDiscovery {
  private readonly client: IDataverseClient;

  constructor(client: IDataverseClient) {
    this.client = client;
  }

  /**
   * Get forms for specific entities
   * @param entityNames Array of entity logical names
   * @returns Array of form definitions with event handlers
   */
  async getFormsForEntities(entityNames: string[]): Promise<FormDefinition[]> {
    if (entityNames.length === 0) {
      return [];
    }

    try {
      // BATCH QUERIES to avoid HTTP 414 (URL too long) errors
      // With 100+ entities, URL can exceed limits
      const batchSize = 20;
      const allForms: RawForm[] = [];

      for (let i = 0; i < entityNames.length; i += batchSize) {
        const batch = entityNames.slice(i, i + batchSize);
        const filterClauses = batch.map((name) => `objecttypecode eq '${name}'`);
        const filter = filterClauses.join(' or ');

        // Query forms for this batch
        // Note: Dataverse doesn't support 'in' operator, use OR instead
        const result = await this.client.query<RawForm>('systemforms', {
          select: ['formid', 'name', 'type', 'objecttypecode', 'formxml'],
          filter: `(${filter}) and (type eq 2 or type eq 7 or type eq 8 or type eq 11)`, // Main, Quick Create, Quick View, Card forms
        });

        allForms.push(...result.value);
      }

      // Parse each form
      return allForms.map((raw) => this.parseForm(raw));
    } catch (error) {
      throw new Error(
        `Failed to retrieve forms: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Parse a form definition from raw data
   */
  private parseForm(raw: RawForm): FormDefinition {
    const libraries = this.extractLibraries(raw.formxml);
    const eventHandlers = this.extractEventHandlers(raw.formxml);

    return {
      id: raw.formid,
      name: raw.name,
      type: raw.type,
      typeName: this.getFormTypeName(raw.type),
      entity: raw.objecttypecode,
      formXml: raw.formxml,
      libraries,
      eventHandlers,
    };
  }

  /**
   * Extract JavaScript library references from FormXml
   */
  private extractLibraries(formXml: string): string[] {
    const libraries: string[] = [];

    // Match <Library name="..." libraryUniqueId="..." /> patterns
    const libraryRegex = /<Library\s+name="([^"]+)"/gi;
    let match;

    while ((match = libraryRegex.exec(formXml)) !== null) {
      libraries.push(match[1]);
    }

    return libraries;
  }

  /**
   * Extract event handlers from FormXml
   */
  private extractEventHandlers(formXml: string): FormEventHandler[] {
    const handlers: FormEventHandler[] = [];

    // Extract form-level events (OnLoad, OnSave)
    handlers.push(...this.extractFormEvents(formXml));

    // Extract field-level events (OnChange)
    handlers.push(...this.extractFieldEvents(formXml));

    // Extract tab events (TabStateChange)
    handlers.push(...this.extractTabEvents(formXml));

    return handlers;
  }

  /**
   * Extract form-level event handlers (OnLoad, OnSave)
   */
  private extractFormEvents(formXml: string): FormEventHandler[] {
    const handlers: FormEventHandler[] = [];

    // Match <event name="onload" ... > ... <Handler functionName="..." library="..." ... />
    const formEventRegex = /<event\s+name="(onload|onsave)"[^>]*>(.*?)<\/event>/gis;
    let eventMatch;

    while ((eventMatch = formEventRegex.exec(formXml)) !== null) {
      const eventName = eventMatch[1];
      const eventContent = eventMatch[2];

      // Extract handlers within this event
      const handlerRegex = /<Handler\s+functionName="([^"]+)"\s+library="([^"]+)"\s+enabled="([^"]+)"(?:\s+parameters="([^"]*)")?/gi;
      let handlerMatch;

      while ((handlerMatch = handlerRegex.exec(eventContent)) !== null) {
        handlers.push({
          event: eventName === 'onload' ? 'OnLoad' : 'OnSave',
          libraryName: handlerMatch[2],
          functionName: handlerMatch[1],
          enabled: handlerMatch[3] === 'true',
          parameters: handlerMatch[4] || undefined,
        });
      }
    }

    return handlers;
  }

  /**
   * Extract field-level OnChange event handlers
   */
  private extractFieldEvents(formXml: string): FormEventHandler[] {
    const handlers: FormEventHandler[] = [];

    // Match <control datafieldname="..." ... > ... <event name="onchange" ... > ... <Handler ... />
    const controlRegex = /<control\s+[^>]*datafieldname="([^"]+)"[^>]*>(.*?)<\/control>/gis;
    let controlMatch;

    while ((controlMatch = controlRegex.exec(formXml)) !== null) {
      const fieldName = controlMatch[1];
      const controlContent = controlMatch[2];

      // Look for onchange events
      const onchangeRegex = /<event\s+name="onchange"[^>]*>(.*?)<\/event>/gis;
      let onchangeMatch;

      while ((onchangeMatch = onchangeRegex.exec(controlContent)) !== null) {
        const eventContent = onchangeMatch[1];

        // Extract handlers
        const handlerRegex = /<Handler\s+functionName="([^"]+)"\s+library="([^"]+)"\s+enabled="([^"]+)"(?:\s+parameters="([^"]*)")?/gi;
        let handlerMatch;

        while ((handlerMatch = handlerRegex.exec(eventContent)) !== null) {
          handlers.push({
            event: 'OnChange',
            libraryName: handlerMatch[2],
            functionName: handlerMatch[1],
            attribute: fieldName,
            enabled: handlerMatch[3] === 'true',
            parameters: handlerMatch[4] || undefined,
          });
        }
      }
    }

    return handlers;
  }

  /**
   * Extract tab state change event handlers
   */
  private extractTabEvents(formXml: string): FormEventHandler[] {
    const handlers: FormEventHandler[] = [];

    // Match <tab ... > ... <event name="TabStateChange" ... > ... <Handler ... />
    const tabRegex = /<tab\s+[^>]*>(.*?)<\/tab>/gis;
    let tabMatch;

    while ((tabMatch = tabRegex.exec(formXml)) !== null) {
      const tabContent = tabMatch[1];

      // Look for TabStateChange events
      const tabEventRegex = /<event\s+name="TabStateChange"[^>]*>(.*?)<\/event>/gis;
      let eventMatch;

      while ((eventMatch = tabEventRegex.exec(tabContent)) !== null) {
        const eventContent = eventMatch[1];

        // Extract handlers
        const handlerRegex = /<Handler\s+functionName="([^"]+)"\s+library="([^"]+)"\s+enabled="([^"]+)"(?:\s+parameters="([^"]*)")?/gi;
        let handlerMatch;

        while ((handlerMatch = handlerRegex.exec(eventContent)) !== null) {
          handlers.push({
            event: 'TabStateChange',
            libraryName: handlerMatch[2],
            functionName: handlerMatch[1],
            enabled: handlerMatch[3] === 'true',
            parameters: handlerMatch[4] || undefined,
          });
        }
      }
    }

    return handlers;
  }

  /**
   * Get form type name from type code
   */
  private getFormTypeName(type: number): string {
    switch (type) {
      case 2:
        return 'Main';
      case 7:
        return 'Quick Create';
      case 8:
        return 'Quick View';
      case 11:
        return 'Card';
      default:
        return 'Unknown';
    }
  }
}
