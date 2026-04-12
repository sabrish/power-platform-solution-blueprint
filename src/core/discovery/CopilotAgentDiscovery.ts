import type { IDataverseClient } from '../dataverse/IDataverseClient.js';
import type { CopilotAgent, AgentKind } from '../types/copilotAgent.js';
import type { FetchLogger } from '../utils/FetchLogger.js';
import { withAdaptiveBatch } from '../utils/withAdaptiveBatch.js';
import { normalizeGuid } from '../utils/guid.js';

interface RawBot {
  botid: string;
  name: string;
  schemaname?: string;
  description?: string;
  statecode?: number;
  statuscode?: number;
  ismanaged?: boolean;
  modifiedon?: string;
  createdon?: string;
  template?: string;
}

interface BotComponentCountRecord {
  _botid_value: string;
}

/**
 * Discovery service for Copilot Studio agents (and classic PVA bots).
 *
 * Uses Strategy B (objectid intersection): the bot component type code in
 * solutioncomponents is not reliably documented. SolutionComponentDiscovery
 * pre-populates copilotAgentIds via objectid intersection against the `bots` entity set.
 */
export class CopilotAgentDiscovery {
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

  async getAgentsByIds(ids: string[]): Promise<CopilotAgent[]> {
    if (ids.length === 0) return [];

    // Pass 1 — fetch bot metadata
    const { results: rawBots } = await withAdaptiveBatch<string, RawBot>(
      ids,
      async (batch) => {
        const filter = batch
          .map(id => `botid eq ${id.replace(/[{}]/g, '')}`)
          .join(' or ');
        const result = await this.client.query<RawBot>('bots', {
          select: ['botid', 'name', 'schemaname', 'description', 'statecode', 'statuscode', 'ismanaged', 'modifiedon', 'createdon', 'template'],
          filter,
        });
        return result.value;
      },
      {
        initialBatchSize: 20,
        step: 'Copilot Agent Discovery',
        entitySet: 'bots',
        logger: this.logger,
        onProgress: (done) => this.onProgress?.(Math.floor(done / 2), ids.length),
      }
    );

    // Pass 2 — count botcomponents per agent
    const componentCountMap = new Map<string, number>();
    try {
      const { results: componentRecords } = await withAdaptiveBatch<string, BotComponentCountRecord>(
        rawBots.map(b => normalizeGuid(b.botid)),
        async (batch) => {
          const filter = batch
            .map(id => `_botid_value eq ${id.replace(/[{}]/g, '')}`)
            .join(' or ');
          const result = await this.client.query<BotComponentCountRecord>('botcomponents', {
            select: ['_botid_value'],
            filter,
          });
          return result.value;
        },
        {
          initialBatchSize: 15,
          step: 'Copilot Agent Discovery — Component Counts',
          entitySet: 'botcomponents',
          logger: this.logger,
          onProgress: (done) => this.onProgress?.(Math.floor(ids.length / 2) + Math.floor(done / 2), ids.length),
        }
      );
      for (const rec of componentRecords) {
        const botId = normalizeGuid(rec._botid_value);
        componentCountMap.set(botId, (componentCountMap.get(botId) ?? 0) + 1);
      }
    } catch {
      // Component count is informational — continue without it
    }

    return rawBots.map(raw => this.mapToCopilotAgent(raw, componentCountMap));
  }

  /**
   * Infer agent kind from available metadata.
   * The `template` field on the bot record may contain a GUID referencing a bot template
   * for classic PVA bots; modern Copilot Studio agents typically have it null/empty.
   * Defaulting to 'Unknown' is safe — this can be refined once the field semantics are verified.
   */
  private inferKind(raw: RawBot): AgentKind {
    if (raw.template) return 'ClassicBot';
    return 'Unknown';
  }

  private mapToCopilotAgent(raw: RawBot, componentCountMap: Map<string, number>): CopilotAgent {
    const id = normalizeGuid(raw.botid);
    return {
      id,
      name: raw.name,
      schemaName: raw.schemaname || raw.name,
      description: raw.description ?? null,
      kind: this.inferKind(raw),
      isActive: (raw.statecode ?? 0) === 0,
      isManaged: raw.ismanaged ?? false,
      componentCount: componentCountMap.get(id) ?? 0,
      modifiedOn: raw.modifiedon || raw.createdon || new Date().toISOString(),
      createdOn: raw.createdon || new Date().toISOString(),
    };
  }
}
