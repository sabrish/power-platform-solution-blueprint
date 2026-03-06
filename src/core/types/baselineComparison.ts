export type BaselineChangeType = 'Added' | 'Removed' | 'Modified';

export type BaselineRiskLevel = 'Critical' | 'High' | 'Medium' | 'Low';

export interface BaselineCountComparison {
  component: string;
  baseline: number;
  current: number;
  delta: number;
}

export interface BaselineChange {
  component: string;
  itemName: string;
  changeType: BaselineChangeType;
  severity: BaselineRiskLevel;
  description: string;
  recommendation: string;
}

export interface BaselineRiskSummary {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export interface BaselineComparisonResult {
  baselineGeneratedAt?: string;
  baselineEnvironment?: string;
  currentGeneratedAt?: string;
  currentEnvironment?: string;
  countComparisons: BaselineCountComparison[];
  changes: BaselineChange[];
  riskSummary: BaselineRiskSummary;
}
