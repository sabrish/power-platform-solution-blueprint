import type { BlueprintResult } from '../types/blueprint.js';
import type {
  BaselineChange,
  BaselineComparisonResult,
  BaselineCountComparison,
  BaselineRiskLevel,
  BaselineRiskSummary,
} from '../types/baselineComparison.js';

export interface BlueprintExportLike {
  metadata?: {
    generatedAt?: string;
    environment?: string;
  };
  summary?: {
    totalEntities?: number;
    totalPlugins?: number;
    totalFlows?: number;
    totalBusinessRules?: number;
    totalWebResources?: number;
    totalCustomAPIs?: number;
    totalEnvironmentVariables?: number;
    totalConnectionReferences?: number;
    totalGlobalChoices?: number;
    totalCustomConnectors?: number;
    totalSecurityRoles?: number;
    totalFieldSecurityProfiles?: number;
  };
  entities?: Array<{
    entity?: {
      LogicalName?: string;
      Attributes?: Array<{ LogicalName?: string }>;
      OneToManyRelationships?: Array<{ SchemaName?: string }>;
      ManyToOneRelationships?: Array<{ SchemaName?: string }>;
      ManyToManyRelationships?: Array<{ SchemaName?: string }>;
    };
  }>;
  plugins?: Array<{ id?: string; name?: string }>;
  flows?: Array<{ id?: string; name?: string }>;
  businessRules?: Array<{ id?: string; name?: string }>;
  webResources?: Array<{ id?: string; name?: string }>;
  customAPIs?: Array<{ id?: string; uniqueName?: string; name?: string }>;
}

interface JsonExportWrapperLike {
  exportVersion?: string;
  exportedAt?: string;
  toolVersion?: string;
  blueprint?: BlueprintExportLike;
}

const COMPONENT_LABELS: Array<{
  key: string;
  label: string;
  baselineCount: (baseline: BlueprintExportLike) => number;
  currentCount: (current: BlueprintResult) => number;
}> = [
  {
    key: 'entities',
    label: 'Entities',
    baselineCount: b => b.summary?.totalEntities ?? b.entities?.length ?? 0,
    currentCount: c => c.summary.totalEntities,
  },
  {
    key: 'plugins',
    label: 'Plugins',
    baselineCount: b => b.summary?.totalPlugins ?? b.plugins?.length ?? 0,
    currentCount: c => c.summary.totalPlugins,
  },
  {
    key: 'flows',
    label: 'Flows',
    baselineCount: b => b.summary?.totalFlows ?? b.flows?.length ?? 0,
    currentCount: c => c.summary.totalFlows,
  },
  {
    key: 'businessRules',
    label: 'Business Rules',
    baselineCount: b => b.summary?.totalBusinessRules ?? b.businessRules?.length ?? 0,
    currentCount: c => c.summary.totalBusinessRules,
  },
  {
    key: 'webResources',
    label: 'Web Resources',
    baselineCount: b => b.summary?.totalWebResources ?? b.webResources?.length ?? 0,
    currentCount: c => c.summary.totalWebResources,
  },
  {
    key: 'customAPIs',
    label: 'Custom APIs',
    baselineCount: b => b.summary?.totalCustomAPIs ?? b.customAPIs?.length ?? 0,
    currentCount: c => c.summary.totalCustomAPIs,
  },
  {
    key: 'environmentVariables',
    label: 'Environment Variables',
    baselineCount: b => b.summary?.totalEnvironmentVariables ?? 0,
    currentCount: c => c.summary.totalEnvironmentVariables,
  },
  {
    key: 'connectionReferences',
    label: 'Connection References',
    baselineCount: b => b.summary?.totalConnectionReferences ?? 0,
    currentCount: c => c.summary.totalConnectionReferences,
  },
  {
    key: 'globalChoices',
    label: 'Global Choices',
    baselineCount: b => b.summary?.totalGlobalChoices ?? 0,
    currentCount: c => c.summary.totalGlobalChoices,
  },
  {
    key: 'customConnectors',
    label: 'Custom Connectors',
    baselineCount: b => b.summary?.totalCustomConnectors ?? 0,
    currentCount: c => c.summary.totalCustomConnectors,
  },
  {
    key: 'securityRoles',
    label: 'Security Roles',
    baselineCount: b => b.summary?.totalSecurityRoles ?? 0,
    currentCount: c => c.summary.totalSecurityRoles,
  },
  {
    key: 'fieldSecurityProfiles',
    label: 'Field Security Profiles',
    baselineCount: b => b.summary?.totalFieldSecurityProfiles ?? 0,
    currentCount: c => c.summary.totalFieldSecurityProfiles,
  },
];

export function parseBaselineBlueprintJson(json: string): BlueprintExportLike {
  let parsed: unknown;

  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error('Baseline file is not valid JSON.');
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Baseline JSON has an invalid structure.');
  }

  const candidate = parsed as JsonExportWrapperLike | BlueprintExportLike;
  const blueprint = 'blueprint' in candidate && candidate.blueprint
    ? candidate.blueprint
    : (candidate as BlueprintExportLike);

  if (!blueprint || typeof blueprint !== 'object') {
    throw new Error('Baseline JSON does not include a blueprint payload.');
  }

  return blueprint;
}

export function compareWithBaseline(
  current: BlueprintResult,
  baseline: BlueprintExportLike
): BaselineComparisonResult {
  const countComparisons: BaselineCountComparison[] = COMPONENT_LABELS.map((item) => {
    const baselineCount = item.baselineCount(baseline);
    const currentCount = item.currentCount(current);

    return {
      component: item.label,
      baseline: baselineCount,
      current: currentCount,
      delta: currentCount - baselineCount,
    };
  });

  const changes: BaselineChange[] = [];
  changes.push(...compareEntities(current, baseline));
  changes.push(...compareSimpleCollection(
    'Plugins',
    baseline.plugins,
    current.plugins,
    item => item.id || item.name || 'unknown-plugin',
    item => item.name || item.id || 'Unknown Plugin',
    'High',
    'Review plugin registration and solution dependencies before deployment.'
  ));
  changes.push(...compareSimpleCollection(
    'Flows',
    baseline.flows,
    current.flows,
    item => item.id || item.name || 'unknown-flow',
    item => item.name || item.id || 'Unknown Flow',
    'Medium',
    'Validate trigger configuration and downstream connections in target environment.'
  ));
  changes.push(...compareSimpleCollection(
    'Business Rules',
    baseline.businessRules,
    current.businessRules,
    item => item.id || item.name || 'unknown-business-rule',
    item => item.name || item.id || 'Unknown Business Rule',
    'Medium',
    'Review form behaviour and validation logic impacted by business rule changes.'
  ));

  const riskSummary = buildRiskSummary(changes);

  return {
    baselineGeneratedAt: baseline.metadata?.generatedAt,
    baselineEnvironment: baseline.metadata?.environment,
    currentGeneratedAt: current.metadata.generatedAt.toISOString(),
    currentEnvironment: current.metadata.environment,
    countComparisons,
    changes,
    riskSummary,
  };
}

export function generateBaselineChangeLogMarkdown(result: BaselineComparisonResult): string {
  const lines: string[] = [];

  lines.push('# Baseline Comparison Change Log');
  lines.push('');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push(`Baseline Environment: ${result.baselineEnvironment || 'Unknown'}`);
  lines.push(`Current Environment: ${result.currentEnvironment || 'Unknown'}`);
  lines.push('');

  lines.push('## Risk Summary');
  lines.push('');
  lines.push(`- Critical: ${result.riskSummary.critical}`);
  lines.push(`- High: ${result.riskSummary.high}`);
  lines.push(`- Medium: ${result.riskSummary.medium}`);
  lines.push(`- Low: ${result.riskSummary.low}`);
  lines.push('');

  lines.push('## Count Comparison');
  lines.push('');
  lines.push('| Component | Baseline | Current | Delta |');
  lines.push('|---|---:|---:|---:|');
  for (const row of result.countComparisons) {
    const deltaPrefix = row.delta > 0 ? '+' : '';
    lines.push(`| ${row.component} | ${row.baseline} | ${row.current} | ${deltaPrefix}${row.delta} |`);
  }
  lines.push('');

  lines.push('## Changes');
  lines.push('');
  if (result.changes.length === 0) {
    lines.push('- No differences detected.');
  } else {
    for (const change of result.changes) {
      lines.push(`- [${change.severity}] ${change.component} - ${change.changeType}: ${change.itemName}`);
      lines.push(`  - ${change.description}`);
      lines.push(`  - Recommendation: ${change.recommendation}`);
    }
  }

  return lines.join('\n');
}

function compareEntities(current: BlueprintResult, baseline: BlueprintExportLike): BaselineChange[] {
  const changes: BaselineChange[] = [];

  const baselineEntities = baseline.entities || [];
  const baselineMap = new Map<string, NonNullable<BlueprintExportLike['entities']>[number]>();
  for (const item of baselineEntities) {
    const name = item.entity?.LogicalName;
    if (name) {
      baselineMap.set(name.toLowerCase(), item);
    }
  }

  const currentMap = new Map<string, BlueprintResult['entities'][number]>();
  for (const item of current.entities) {
    currentMap.set(item.entity.LogicalName.toLowerCase(), item);
  }

  for (const currentEntity of current.entities) {
    const key = currentEntity.entity.LogicalName.toLowerCase();
    const baselineEntity = baselineMap.get(key);

    if (!baselineEntity) {
      changes.push(makeChange(
        'Entities',
        currentEntity.entity.LogicalName,
        'Added',
        'Low',
        'Table added since baseline.',
        'Confirm downstream integrations and security model for the new table.'
      ));
      continue;
    }

    const baselineAttributes = new Set((baselineEntity.entity?.Attributes || []).map(a => (a.LogicalName || '').toLowerCase()).filter(Boolean));
    const currentAttributes = new Set((currentEntity.entity.Attributes || []).map(a => a.LogicalName.toLowerCase()));

    const removedAttributes = [...baselineAttributes].filter(a => !currentAttributes.has(a));
    const addedAttributes = [...currentAttributes].filter(a => !baselineAttributes.has(a));

    for (const attribute of removedAttributes) {
      changes.push(makeChange(
        'Entities',
        `${currentEntity.entity.LogicalName}.${attribute}`,
        'Modified',
        'High',
        'Column removed since baseline.',
        'Review plugins, flows, reports, and integrations that may reference this column.'
      ));
    }

    for (const attribute of addedAttributes) {
      changes.push(makeChange(
        'Entities',
        `${currentEntity.entity.LogicalName}.${attribute}`,
        'Modified',
        'Medium',
        'Column added since baseline.',
        'Validate form layout, field security, and API contract changes.'
      ));
    }

    const baselineRelationships = collectRelationshipNames(baselineEntity.entity);
    const currentRelationships = collectRelationshipNames(currentEntity.entity);

    const removedRelationships = [...baselineRelationships].filter(r => !currentRelationships.has(r));
    const addedRelationships = [...currentRelationships].filter(r => !baselineRelationships.has(r));

    for (const relationship of removedRelationships) {
      changes.push(makeChange(
        'Entities',
        `${currentEntity.entity.LogicalName}:${relationship}`,
        'Modified',
        'High',
        'Relationship removed since baseline.',
        'Check referential behaviour and automation logic that depended on this relationship.'
      ));
    }

    for (const relationship of addedRelationships) {
      changes.push(makeChange(
        'Entities',
        `${currentEntity.entity.LogicalName}:${relationship}`,
        'Modified',
        'Medium',
        'Relationship added since baseline.',
        'Review cascading settings and ensure relationship behaviour is intentional.'
      ));
    }
  }

  for (const [key, baselineEntity] of baselineMap.entries()) {
    if (!currentMap.has(key)) {
      changes.push(makeChange(
        'Entities',
        baselineEntity.entity?.LogicalName || key,
        'Removed',
        'Critical',
        'Table removed since baseline.',
        'Block deployment until all dependencies, data migration, and security impacts are assessed.'
      ));
    }
  }

  return changes;
}

function compareSimpleCollection<TBaseline, TCurrent>(
  component: string,
  baselineCollection: TBaseline[] | undefined,
  currentCollection: TCurrent[] | undefined,
  getKey: (item: TBaseline | TCurrent) => string,
  getLabel: (item: TBaseline | TCurrent) => string,
  removalSeverity: BaselineRiskLevel,
  recommendation: string
): BaselineChange[] {
  const changes: BaselineChange[] = [];

  const baselineMap = new Map<string, TBaseline>();
  for (const item of baselineCollection || []) {
    const key = getKey(item).toLowerCase();
    if (key) {
      baselineMap.set(key, item);
    }
  }

  const currentMap = new Map<string, TCurrent>();
  for (const item of currentCollection || []) {
    const key = getKey(item).toLowerCase();
    if (key) {
      currentMap.set(key, item);
    }
  }

  for (const [key, currentItem] of currentMap.entries()) {
    if (!baselineMap.has(key)) {
      changes.push(makeChange(
        component,
        getLabel(currentItem),
        'Added',
        'Low',
        `${component.slice(0, -1)} added since baseline.`,
        recommendation
      ));
    }
  }

  for (const [key, baselineItem] of baselineMap.entries()) {
    if (!currentMap.has(key)) {
      changes.push(makeChange(
        component,
        getLabel(baselineItem),
        'Removed',
        removalSeverity,
        `${component.slice(0, -1)} removed since baseline.`,
        recommendation
      ));
    }
  }

  return changes;
}

function collectRelationshipNames(entity: {
  OneToManyRelationships?: Array<{ SchemaName?: string }>;
  ManyToOneRelationships?: Array<{ SchemaName?: string }>;
  ManyToManyRelationships?: Array<{ SchemaName?: string }>;
} | undefined): Set<string> {
  const names = new Set<string>();

  for (const rel of entity?.OneToManyRelationships || []) {
    if (rel.SchemaName) {
      names.add(rel.SchemaName.toLowerCase());
    }
  }
  for (const rel of entity?.ManyToOneRelationships || []) {
    if (rel.SchemaName) {
      names.add(rel.SchemaName.toLowerCase());
    }
  }
  for (const rel of entity?.ManyToManyRelationships || []) {
    if (rel.SchemaName) {
      names.add(rel.SchemaName.toLowerCase());
    }
  }

  return names;
}

function makeChange(
  component: string,
  itemName: string,
  changeType: 'Added' | 'Removed' | 'Modified',
  severity: BaselineRiskLevel,
  description: string,
  recommendation: string
): BaselineChange {
  return {
    component,
    itemName,
    changeType,
    severity,
    description,
    recommendation,
  };
}

function buildRiskSummary(changes: BaselineChange[]): BaselineRiskSummary {
  const summary: BaselineRiskSummary = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };

  for (const change of changes) {
    if (change.severity === 'Critical') summary.critical += 1;
    else if (change.severity === 'High') summary.high += 1;
    else if (change.severity === 'Medium') summary.medium += 1;
    else summary.low += 1;
  }

  return summary;
}
