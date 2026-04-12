import type { IDataverseClient } from '../dataverse/IDataverseClient.js';
import type { Report, ReportType } from '../types/report.js';
import type { FetchLogger } from '../utils/FetchLogger.js';
import type { IDiscoverer } from './IDiscoverer.js';
import { withAdaptiveBatch } from '../utils/withAdaptiveBatch.js';
import { buildOrFilter } from '../utils/odata.js';
import { normalizeGuid } from '../utils/guid.js';

interface RawReport {
  reportid: string;
  name: string;
  description?: string | null;
  reporttypecode?: number;
  iscustomreport?: boolean;
  filename?: string | null;
  ismanaged?: boolean;
  createdon?: string;
  modifiedon?: string;
}

const REPORT_TYPE_MAP: Record<number, ReportType> = {
  1: 'ReportingServices',
  2: 'Other',
  3: 'Linked',
};

/**
 * Discovery service for Dataverse Reports (SSRS/linked).
 * Component type code: 31 — Strategy A.
 */
export class ReportDiscovery implements IDiscoverer<Report> {
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

  async discoverByIds(ids: string[]): Promise<Report[]> {
    if (ids.length === 0) return [];

    const { results } = await withAdaptiveBatch<string, RawReport>(
      ids,
      async (batch) => {
        const filter = buildOrFilter(batch, 'reportid', { guids: true });
        const result = await this.client.query<RawReport>('reports', {
          select: ['reportid', 'name', 'description', 'reporttypecode', 'iscustomreport', 'filename', 'ismanaged', 'createdon', 'modifiedon'],
          filter,
        });
        return result.value;
      },
      {
        initialBatchSize: 20,
        step: 'Report Discovery',
        entitySet: 'reports',
        logger: this.logger,
        onProgress: (done, total) => this.onProgress?.(done, total),
      }
    );

    return results.map(raw => this.mapToReport(raw));
  }

  private mapToReport(raw: RawReport): Report {
    return {
      id: normalizeGuid(raw.reportid),
      name: raw.name,
      description: raw.description ?? null,
      reportType: REPORT_TYPE_MAP[raw.reporttypecode ?? 2] ?? 'Other',
      isCustomReport: raw.iscustomreport ?? false,
      fileName: raw.filename ?? null,
      isManaged: raw.ismanaged ?? false,
      createdOn: raw.createdon || new Date().toISOString(),
      modifiedOn: raw.modifiedon || raw.createdon || new Date().toISOString(),
    };
  }
}
