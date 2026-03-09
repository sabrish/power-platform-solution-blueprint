import type { IDataverseClient } from '../dataverse/IDataverseClient.js';
import type { FormDefinition, FormEventHandler } from '../types/blueprint.js';
import type { FetchLogger } from '../utils/FetchLogger.js';
import { withAdaptiveBatch } from '../utils/withAdaptiveBatch.js';

interface RawFormMeta {
  formid: string;
  name: string;
  type: number;
  objecttypecode: string;
}

interface RawFormXml {
  formid: string;
  formxml: string;
}

export class FormDiscovery {
  private readonly client: IDataverseClient;
  private logger?: FetchLogger;
  private onProgress?: (current: number, total: number) => void;

  constructor(client: IDataverseClient, logger?: FetchLogger, onProgress?: (current: number, total: number) => void) {
    this.client = client;
    this.logger = logger;
    this.onProgress = onProgress;
  }

  async getFormsForEntities(entityNames: string[]): Promise<FormDefinition[]> {
    if (entityNames.length === 0) return [];

    try {
      const N = entityNames.length;

      // Pass 1 — fetch form IDs + metadata only (no formxml), in adaptive batches of 20 entity names
      // Pass 1 owns all reported progress (0→N); Pass 2 is silent to avoid >100%.
      const { results: metaForms } = await withAdaptiveBatch<string, RawFormMeta>(
        entityNames,
        async (batch) => {
          const filter = `(${batch.map(n => `objecttypecode eq '${n}'`).join(' or ')}) and (type eq 2 or type eq 7 or type eq 8 or type eq 11)`;
          const result = await this.client.query<RawFormMeta>('systemforms', {
            select: ['formid', 'name', 'type', 'objecttypecode'],
            filter,
          });
          return result.value;
        },
        {
          initialBatchSize: 20,
          step: 'Form Discovery',
          entitySet: 'systemforms (metadata)',
          logger: this.logger,
          getBatchLabel: (batch) => batch.join(', '),
          onProgress: (done) => this.onProgress?.(done, N),
        }
      );

      if (metaForms.length === 0) return [];

      // Pass 2 — fetch formxml in small adaptive batches (can be 100–500 KB per form)
      // No onProgress here — Pass 1 already drove progress to N; Pass 2 is silent.
      const formIds = metaForms.map(f => f.formid);
      const formIdToName = new Map(metaForms.map(f => [f.formid.toLowerCase(), `${f.objecttypecode}: ${f.name}`]));
      const xmlMap = new Map<string, string>();

      const { results: xmlRecords } = await withAdaptiveBatch<string, RawFormXml>(
        formIds,
        async (batch) => {
          const filter = batch.map(id => `formid eq ${id}`).join(' or ');
          const result = await this.client.query<RawFormXml>('systemforms', {
            select: ['formid', 'formxml'],
            filter,
          });
          return result.value;
        },
        {
          initialBatchSize: 5,
          step: 'Form Discovery',
          entitySet: 'systemforms (formxml)',
          logger: this.logger,
          getBatchLabel: (batch) => batch.map(id => formIdToName.get(id.toLowerCase()) ?? id).join(', '),
        }
      );

      for (const r of xmlRecords) {
        if (r.formxml) xmlMap.set(r.formid, r.formxml);
      }

      this.onProgress?.(N, N);

      return metaForms.map(raw => this.parseForm(raw, xmlMap.get(raw.formid) ?? ''));

    } catch (error) {
      throw new Error(
        `Failed to retrieve forms: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private parseForm(raw: RawFormMeta, formxml: string): FormDefinition {
    const libraries = this.extractLibraries(formxml);
    const eventHandlers = this.extractEventHandlers(formxml);
    return {
      id: raw.formid,
      name: raw.name,
      type: raw.type,
      typeName: this.getFormTypeName(raw.type),
      entity: raw.objecttypecode,
      formXml: formxml,
      libraries,
      eventHandlers,
    };
  }

  private extractLibraries(formXml: string): string[] {
    const libraries: string[] = [];
    const libraryRegex = /<Library\s+name="([^"]+)"/gi;
    let match;
    while ((match = libraryRegex.exec(formXml)) !== null) {
      libraries.push(match[1]);
    }
    return libraries;
  }

  private extractEventHandlers(formXml: string): FormEventHandler[] {
    return [
      ...this.extractFormEvents(formXml),
      ...this.extractFieldEvents(formXml),
      ...this.extractTabEvents(formXml),
    ];
  }

  private extractFormEvents(formXml: string): FormEventHandler[] {
    const handlers: FormEventHandler[] = [];
    const formEventRegex = /<event\s+name="(onload|onsave)"[^>]*>(.*?)<\/event>/gis;
    let eventMatch;
    while ((eventMatch = formEventRegex.exec(formXml)) !== null) {
      const eventName = eventMatch[1];
      const eventContent = eventMatch[2];
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

  private extractFieldEvents(formXml: string): FormEventHandler[] {
    const handlers: FormEventHandler[] = [];
    const controlRegex = /<control\s+[^>]*datafieldname="([^"]+)"[^>]*>(.*?)<\/control>/gis;
    let controlMatch;
    while ((controlMatch = controlRegex.exec(formXml)) !== null) {
      const fieldName = controlMatch[1];
      const controlContent = controlMatch[2];
      const onchangeRegex = /<event\s+name="onchange"[^>]*>(.*?)<\/event>/gis;
      let onchangeMatch;
      while ((onchangeMatch = onchangeRegex.exec(controlContent)) !== null) {
        const eventContent = onchangeMatch[1];
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

  private extractTabEvents(formXml: string): FormEventHandler[] {
    const handlers: FormEventHandler[] = [];
    const tabRegex = /<tab\s+[^>]*>(.*?)<\/tab>/gis;
    let tabMatch;
    while ((tabMatch = tabRegex.exec(formXml)) !== null) {
      const tabContent = tabMatch[1];
      const tabEventRegex = /<event\s+name="TabStateChange"[^>]*>(.*?)<\/event>/gis;
      let eventMatch;
      while ((eventMatch = tabEventRegex.exec(tabContent)) !== null) {
        const eventContent = eventMatch[1];
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

  private getFormTypeName(type: number): string {
    switch (type) {
      case 2: return 'Main';
      case 7: return 'Quick Create';
      case 8: return 'Quick View';
      case 11: return 'Card';
      default: return 'Unknown';
    }
  }
}
