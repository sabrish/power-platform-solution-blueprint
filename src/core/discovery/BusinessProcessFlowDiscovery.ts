import type { IDataverseClient } from '../dataverse/IDataverseClient.js';
import type { BusinessProcessFlow } from '../types/businessProcessFlow.js';

interface RawBusinessProcessFlow {
  workflowid: string;
  name: string;
  description: string | null;
  category: number;
  uniquename: string;
  primaryentity: string;
  statecode: number;
  ismanaged: boolean;
  createdon: string;
  modifiedon: string;
  _ownerid_value?: string;
  '_ownerid_value@OData.Community.Display.V1.FormattedValue'?: string;
  '_modifiedby_value@OData.Community.Display.V1.FormattedValue'?: string;
  '_primaryentity_value@OData.Community.Display.V1.FormattedValue'?: string;
}

interface RawProcessStageParam {
  processstageparameterid: string;
  name: string;
  value: string | null;
}

/**
 * Raw processstage record.
 * Schema: https://learn.microsoft.com/en-us/power-apps/developer/data-platform/reference/entities/processstage
 *
 * processstage records can be:
 *  - Top-level stage  (_processid_value set, no _parentprocessstageid_value)
 *  - Child step record (_parentprocessstageid_value set to parent stage ID)
 *    In this case, parametername holds the step/field logical name.
 *
 * processstage.clientdata = "Step metadata for process stage" (JSON, read-only).
 * processstage_processstageparameter = expanded collection of related processstageparameter records.
 */
interface RawProcessStage {
  processstageid: string;
  stagename: string;
  primaryentitytypecode: string;
  parametername?: string | null;
  parametervalue?: string | null;
  clientdata?: string | null;
  '_processid_value'?: string;
  '_parentprocessstageid_value'?: string;
  // Expanded processstageparameter records (via $expand)
  processstage_processstageparameter?: RawProcessStageParam[];
}

export class BusinessProcessFlowDiscovery {
  private readonly client: IDataverseClient;
  private onProgress?: (current: number, total: number) => void;

  constructor(client: IDataverseClient, onProgress?: (current: number, total: number) => void) {
    this.client = client;
    this.onProgress = onProgress;
  }

  async getBusinessProcessFlowsByIds(workflowIds: string[]): Promise<BusinessProcessFlow[]> {
    if (workflowIds.length === 0) return [];

    try {
      const batchSize = 20;
      const allResults: RawBusinessProcessFlow[] = [];

      for (let i = 0; i < workflowIds.length; i += batchSize) {
        const batch = workflowIds.slice(i, i + batchSize);
        const filter = `(${batch.map((id) => `workflowid eq ${id}`).join(' or ')}) and category eq 4`;
        const result = await this.client.query<RawBusinessProcessFlow>('workflows', {
          select: ['workflowid', 'name', 'description', 'category', 'uniquename',
            'primaryentity', 'statecode', 'ismanaged', 'createdon', 'modifiedon',
            '_ownerid_value', '_modifiedby_value'],
          filter,
        });
        allResults.push(...result.value);
        if (this.onProgress) this.onProgress(allResults.length, workflowIds.length);
      }

      const stagesByBpfId = await this.fetchStages(allResults);

      const allStages = [...stagesByBpfId.values()].flat();
      const stepsByStageId = await this.fetchStepsByStageIds(allStages);

      return allResults.map((raw) => this.mapToBusinessProcessFlow(raw, stagesByBpfId, stepsByStageId));
    } catch (error) {
      throw new Error(
        `Failed to retrieve Business Process Flows: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Fetch top-level process stages.
   * Also attempts $expand on processstageparameter and selects clientdata
   * as potential sources for step information.
   */
  private async fetchStages(
    bpfs: RawBusinessProcessFlow[]
  ): Promise<Map<string, RawProcessStage[]>> {
    const stagesByBpfId = new Map<string, RawProcessStage[]>();
    if (bpfs.length === 0) return stagesByBpfId;

    const batchSize = 20;
    for (let i = 0; i < bpfs.length; i += batchSize) {
      const batch = bpfs.slice(i, i + batchSize);
      const filterClauses = batch.map((raw) => {
        const cleanId = raw.workflowid.toLowerCase().replace(/[{}]/g, '');
        return `_processid_value eq ${cleanId}`;
      });

      try {
        const result = await this.client.query<RawProcessStage>('processstages', {
          select: ['processstageid', 'stagename', 'primaryentitytypecode',
            'parametername', 'clientdata',
            '_processid_value', '_parentprocessstageid_value'],
          filter: filterClauses.join(' or '),
          expand: 'processstage_processstageparameter($select=processstageparameterid,name,value)',
        });

        for (const record of result.value) {
          const parentId = (record['_parentprocessstageid_value'] || '').toLowerCase().replace(/[{}]/g, '');
          if (parentId) continue;
          const processId = (record['_processid_value'] || '').toLowerCase().replace(/[{}]/g, '');
          if (!stagesByBpfId.has(processId)) stagesByBpfId.set(processId, []);
          stagesByBpfId.get(processId)!.push(record);
        }
      } catch (err) {
        void err;
        // Try without $expand as fallback
        try {
          const result = await this.client.query<RawProcessStage>('processstages', {
            select: ['processstageid', 'stagename', 'primaryentitytypecode',
              'parametername', 'clientdata',
              '_processid_value', '_parentprocessstageid_value'],
            filter: filterClauses.join(' or '),
          });
          for (const record of result.value) {
            const parentId = (record['_parentprocessstageid_value'] || '').toLowerCase().replace(/[{}]/g, '');
            if (parentId) continue;
            const processId = (record['_processid_value'] || '').toLowerCase().replace(/[{}]/g, '');
            if (!stagesByBpfId.has(processId)) stagesByBpfId.set(processId, []);
            stagesByBpfId.get(processId)!.push(record);
          }
        } catch (err2) {
          void err2;
        }
      }
    }
    return stagesByBpfId;
  }

  /**
   * Fetch child processstage records where _parentprocessstageid_value = stageId.
   * These are the data step records with parametername = field logical name.
   */
  private async fetchStepsByStageIds(
    stages: RawProcessStage[]
  ): Promise<Map<string, RawProcessStage[]>> {
    const stepsByStageId = new Map<string, RawProcessStage[]>();
    if (stages.length === 0) return stepsByStageId;

    const batchSize = 20;
    for (let i = 0; i < stages.length; i += batchSize) {
      const batch = stages.slice(i, i + batchSize);
      const filterClauses = batch.map((s) => {
        const cleanId = s.processstageid.toLowerCase().replace(/[{}]/g, '');
        return `_parentprocessstageid_value eq ${cleanId}`;
      });
      const filter = filterClauses.join(' or ');

      try {
        const result = await this.client.query<RawProcessStage>('processstages', {
          select: ['processstageid', 'stagename', 'parametername', 'parametervalue',
            '_parentprocessstageid_value'],
          filter,
        });

        for (const step of result.value) {
          const parentId = (step['_parentprocessstageid_value'] || '').toLowerCase().replace(/[{}]/g, '');
          if (!parentId) continue;
          if (!stepsByStageId.has(parentId)) stepsByStageId.set(parentId, []);
          stepsByStageId.get(parentId)!.push(step);
        }
      } catch (err) {
        void err;
      }
    }
    return stepsByStageId;
  }

  private parseClientDataSteps(
    clientdata: string | null | undefined
  ): Array<{ displayName: string; fieldName: string; required: boolean }> {
    if (!clientdata) return [];
    try {
      const data = JSON.parse(clientdata);
      // Actual Dataverse format: top-level array of
      // { DisplayName, Type, Field: { AttributeName, IsRequired } }
      if (Array.isArray(data)) {
        return (data as Record<string, unknown>[])
          .filter((item) => item['Type'] === 'Field' && item['Field'])
          .map((item) => {
            const field = item['Field'] as Record<string, unknown>;
            return {
              displayName: String(item['DisplayName'] || ''),
              fieldName: String(field['AttributeName'] || ''),
              required: Boolean(field['IsRequired']),
            };
          })
          .filter((s) => s.fieldName);
      }
      // Legacy nested formats
      if (Array.isArray(data?.steps)) {
        return (data.steps as Record<string, unknown>[]).map((s) => ({
          displayName: String(s['displayName'] || s['name'] || ''),
          fieldName: String(s['dataFieldName'] || s['fieldName'] || s['name'] || ''),
          required: Boolean(s['required'] || s['isRequired']),
        })).filter((s) => s.fieldName);
      }
      if (Array.isArray(data?.fields)) {
        return (data.fields as Record<string, unknown>[]).map((f) => ({
          displayName: String(f['displayName'] || f['name'] || ''),
          fieldName: String(f['logicalName'] || f['name'] || ''),
          required: false,
        })).filter((s) => s.fieldName);
      }
    } catch {
      // not valid JSON
    }
    return [];
  }

  private mapToBusinessProcessFlow(
    raw: RawBusinessProcessFlow,
    stagesByBpfId: Map<string, RawProcessStage[]>,
    stepsByStageId: Map<string, RawProcessStage[]>
  ): BusinessProcessFlow {
    const bpfId = raw.workflowid.toLowerCase().replace(/[{}]/g, '');
    const rawStages = stagesByBpfId.get(bpfId) || [];

    const stages = rawStages.map((s, index) => {
      const stageId = s.processstageid.toLowerCase().replace(/[{}]/g, '');

      // Source 1: expanded processstageparameter records
      const expandedParams = s.processstage_processstageparameter || [];
      let steps = expandedParams.map((p, stepIdx) => ({
        id: p.processstageparameterid,
        name: p.name,
        fieldName: p.name,
        required: false,
        order: stepIdx,
      }));

      // Source 2: child processstage records (separate query)
      if (steps.length === 0) {
        const rawSteps = stepsByStageId.get(stageId) || [];
        steps = rawSteps.map((p, stepIdx) => ({
          id: p.processstageid,
          name: p.parametername || p.stagename || `Step ${stepIdx + 1}`,
          fieldName: p.parametername || '',
          required: false,
          order: stepIdx,
        }));
      }

      // Source 3: clientdata JSON on the stage
      if (steps.length === 0 && s.clientdata) {
        const parsedSteps = this.parseClientDataSteps(s.clientdata);
        steps = parsedSteps.map((parsed, stepIdx) => ({
          id: `${stageId}_step_${stepIdx}`,
          name: parsed.displayName || parsed.fieldName,
          fieldName: parsed.fieldName,
          required: parsed.required,
          order: stepIdx,
        }));
      }

      return { id: s.processstageid, name: s.stagename, entity: s.primaryentitytypecode, order: index, steps };
    });

    const entities = [...new Set(stages.map((s) => s.entity))];
    const totalSteps = stages.reduce((sum, s) => sum + s.steps.length, 0);

    return {
      id: raw.workflowid,
      name: raw.name,
      description: raw.description,
      primaryEntity: raw.primaryentity,
      primaryEntityDisplayName: raw['_primaryentity_value@OData.Community.Display.V1.FormattedValue'] || null,
      state: this.getStateName(raw.statecode),
      stateCode: raw.statecode,
      isManaged: raw.ismanaged,
      uniqueName: raw.uniquename,
      xaml: '',
      definition: { stages, entities, totalSteps, crossEntityFlow: entities.length > 1 },
      owner: raw['_ownerid_value@OData.Community.Display.V1.FormattedValue'] || 'Unknown',
      ownerId: raw._ownerid_value || '',
      modifiedBy: raw['_modifiedby_value@OData.Community.Display.V1.FormattedValue'] || 'Unknown',
      modifiedOn: raw.modifiedon,
      createdOn: raw.createdon,
    };
  }

  private getStateName(statecode: number): 'Draft' | 'Active' {
    switch (statecode) {
      case 0: return 'Draft';
      case 1: return 'Active';
      default: return 'Draft';
    }
  }
}
