import type { ExecutionPipeline, ExecutionStep, PerformanceRisk } from '../types/blueprint.js';

/**
 * Analyzes execution pipelines for performance risks
 */
export class PerformanceAnalyzer {
  /**
   * Analyze execution pipeline for performance risks
   * @param pipeline Execution pipeline to analyze
   * @returns Array of detected performance risks
   */
  analyzePerformanceRisks(pipeline: ExecutionPipeline): PerformanceRisk[] {
    const risks: PerformanceRisk[] = [];

    // Check client-side steps
    this.analyzeClientSideRisks(pipeline.clientSide, risks);

    // Check server-side synchronous steps
    this.analyzeServerSideSyncRisks(pipeline.serverSideSync, risks);

    // Check async steps
    this.analyzeAsyncRisks(pipeline.serverSideAsync, risks);

    // Check overall pipeline complexity
    this.analyzeComplexityRisks(pipeline, risks);

    return risks.sort((a, b) => this.getSeverityWeight(b.severity) - this.getSeverityWeight(a.severity));
  }

  /**
   * Analyze client-side execution risks
   */
  private analyzeClientSideRisks(steps: ExecutionStep[], risks: PerformanceRisk[]): void {
    if (steps.length > 5) {
      risks.push({
        severity: 'Medium',
        step: steps[0],
        reason: `${steps.length} business rules executing on client side`,
        recommendation: 'Consider consolidating business rules to reduce client-side processing',
      });
    }

    if (steps.length > 10) {
      risks.push({
        severity: 'High',
        step: steps[0],
        reason: `Excessive client-side automation: ${steps.length} business rules`,
        recommendation: 'Review and consolidate business rules. Consider moving logic to server-side plugins for better performance',
      });
    }
  }

  /**
   * Analyze server-side synchronous execution risks
   */
  private analyzeServerSideSyncRisks(
    serverSideSync: {
      preValidation: ExecutionStep[];
      preOperation: ExecutionStep[];
      mainOperation: ExecutionStep[];
      postOperation: ExecutionStep[];
    },
    risks: PerformanceRisk[]
  ): void {
    const allSyncSteps = [
      ...serverSideSync.preValidation,
      ...serverSideSync.preOperation,
      ...serverSideSync.mainOperation,
      ...serverSideSync.postOperation,
    ];

    // Check for external calls in synchronous steps (CRITICAL)
    allSyncSteps.forEach((step) => {
      if (step.hasExternalCall && step.mode === 'Sync') {
        risks.push({
          severity: 'Critical',
          step,
          reason: 'Synchronous external call blocking transaction',
          recommendation: `Move ${step.type} "${step.name}" to asynchronous execution or use message queuing to avoid blocking the user transaction`,
        });
      }
    });

    // Check for multiple sync plugins in same stage
    const stageGroups = [
      { name: 'PreValidation', steps: serverSideSync.preValidation },
      { name: 'PreOperation', steps: serverSideSync.preOperation },
      { name: 'MainOperation', steps: serverSideSync.mainOperation },
      { name: 'PostOperation', steps: serverSideSync.postOperation },
    ];

    stageGroups.forEach((group) => {
      if (group.steps.length > 3) {
        risks.push({
          severity: 'Medium',
          step: group.steps[0],
          reason: `${group.steps.length} synchronous steps in ${group.name} stage`,
          recommendation: `Consider consolidating logic or moving non-critical steps to async execution`,
        });
      }

      if (group.steps.length > 5) {
        risks.push({
          severity: 'High',
          step: group.steps[0],
          reason: `Excessive synchronous steps: ${group.steps.length} in ${group.name}`,
          recommendation: `Review execution order and consolidate plugins. Move non-transactional logic to async`,
        });
      }
    });

    // Check for plugins in PreValidation (should be minimal)
    if (serverSideSync.preValidation.length > 2) {
      risks.push({
        severity: 'Medium',
        step: serverSideSync.preValidation[0],
        reason: `${serverSideSync.preValidation.length} steps in PreValidation stage`,
        recommendation: 'PreValidation should only validate input. Consider moving logic to PreOperation or PostOperation',
      });
    }
  }

  /**
   * Analyze async execution risks
   */
  private analyzeAsyncRisks(steps: ExecutionStep[], risks: PerformanceRisk[]): void {
    // Check for excessive async steps
    if (steps.length > 10) {
      risks.push({
        severity: 'Medium',
        step: steps[0],
        reason: `${steps.length} asynchronous automation steps`,
        recommendation: 'Review async workflows for consolidation opportunities to reduce system load',
      });
    }

    if (steps.length > 20) {
      risks.push({
        severity: 'High',
        step: steps[0],
        reason: `Excessive async automation: ${steps.length} steps`,
        recommendation: 'Consider batch processing or consolidating workflows to reduce async queue load',
      });
    }

    // External calls in async are OK but still worth noting if excessive
    const externalCallSteps = steps.filter((s) => s.hasExternalCall);
    if (externalCallSteps.length > 5) {
      risks.push({
        severity: 'Low',
        step: externalCallSteps[0],
        reason: `${externalCallSteps.length} async steps with external calls`,
        recommendation: 'Monitor external service availability and implement retry logic with exponential backoff',
      });
    }
  }

  /**
   * Analyze overall pipeline complexity
   */
  private analyzeComplexityRisks(pipeline: ExecutionPipeline, risks: PerformanceRisk[]): void {
    const totalSyncSteps =
      pipeline.clientSide.length +
      pipeline.serverSideSync.preValidation.length +
      pipeline.serverSideSync.preOperation.length +
      pipeline.serverSideSync.mainOperation.length +
      pipeline.serverSideSync.postOperation.length;

    // Check total synchronous steps
    if (totalSyncSteps > 10) {
      const sampleStep =
        pipeline.clientSide[0] ||
        pipeline.serverSideSync.preValidation[0] ||
        pipeline.serverSideSync.preOperation[0] ||
        pipeline.serverSideSync.mainOperation[0] ||
        pipeline.serverSideSync.postOperation[0];

      if (sampleStep) {
        risks.push({
          severity: 'High',
          step: sampleStep,
          reason: `Total synchronous automation: ${totalSyncSteps} steps in pipeline`,
          recommendation: 'User experience will be degraded. Review entire automation chain and move non-critical logic to async',
        });
      }
    }

    // Check if both sync and async external calls exist
    const hasSyncExternalCall = [
      ...pipeline.clientSide,
      ...pipeline.serverSideSync.preValidation,
      ...pipeline.serverSideSync.preOperation,
      ...pipeline.serverSideSync.mainOperation,
      ...pipeline.serverSideSync.postOperation,
    ].some((s) => s.hasExternalCall);

    const hasAsyncExternalCall = pipeline.serverSideAsync.some((s) => s.hasExternalCall);

    if (hasSyncExternalCall && hasAsyncExternalCall) {
      const syncStep = [
        ...pipeline.clientSide,
        ...pipeline.serverSideSync.preValidation,
        ...pipeline.serverSideSync.preOperation,
        ...pipeline.serverSideSync.mainOperation,
        ...pipeline.serverSideSync.postOperation,
      ].find((s) => s.hasExternalCall);

      if (syncStep) {
        risks.push({
          severity: 'Critical',
          step: syncStep,
          reason: 'External calls in both sync and async execution',
          recommendation: 'All external integrations should be async to prevent transaction blocking and improve reliability',
        });
      }
    }

    // Check for multiple flows (can indicate over-automation)
    const flowCount = [...Object.values(pipeline.serverSideSync).flat(), ...pipeline.serverSideAsync].filter(
      (s) => s.type === 'Flow'
    ).length;

    if (flowCount > 5) {
      const flowStep = [...Object.values(pipeline.serverSideSync).flat(), ...pipeline.serverSideAsync].find(
        (s) => s.type === 'Flow'
      );

      if (flowStep) {
        risks.push({
          severity: 'Medium',
          step: flowStep,
          reason: `${flowCount} Power Automate flows triggered by this event`,
          recommendation: 'Consider consolidating flows to reduce overhead and improve maintainability',
        });
      }
    }
  }

  /**
   * Get numeric weight for severity (for sorting)
   */
  private getSeverityWeight(severity: 'Critical' | 'High' | 'Medium' | 'Low'): number {
    switch (severity) {
      case 'Critical':
        return 4;
      case 'High':
        return 3;
      case 'Medium':
        return 2;
      case 'Low':
        return 1;
      default:
        return 0;
    }
  }

  /**
   * Get summary statistics for performance analysis
   */
  getSummaryStats(risks: PerformanceRisk[]): {
    critical: number;
    high: number;
    medium: number;
    low: number;
    total: number;
  } {
    return {
      critical: risks.filter((r) => r.severity === 'Critical').length,
      high: risks.filter((r) => r.severity === 'High').length,
      medium: risks.filter((r) => r.severity === 'Medium').length,
      low: risks.filter((r) => r.severity === 'Low').length,
      total: risks.length,
    };
  }
}
