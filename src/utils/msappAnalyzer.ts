import JSZip from 'jszip';

export interface MsAppControlSummary {
  controlType: string;
  count: number;
}

export interface MsAppAccessibilityIssue {
  screenName: string;
  severity: 'High' | 'Medium' | 'Low';
  issue: string;
  recommendation: string;
}

export interface MsAppScreenAnalysis {
  screenName: string;
  controlCount: number;
  distinctControlTypes: number;
  formulaCount: number;
  formulaComplexityScore: number;
  complexityBand: 'High' | 'Medium' | 'Low';
  dataSourceHints: string[];
  navigationTargets: string[];
  accessibilityIssueCount: number;
}

export interface MsAppAnalysisResult {
  fileCount: number;
  totalCompressedBytes: number;
  screenNames: string[];
  navigationTargets: string[];
  controlTypes: MsAppControlSummary[];
  dataSourceHints: string[];
  screenAnalysis: MsAppScreenAnalysis[];
  accessibilityIssues: MsAppAccessibilityIssue[];
  warnings: string[];
}

const TEXT_FILE_PATTERN = /\.(json|txt|yaml|yml|fx|md)$/i;
const SCREEN_FILE_PATTERN = /(^|\/)(screen|screens)[^/]*\.(json|yaml|yml|fx)$/i;
const NAVIGATE_PATTERN = /Navigate\(\s*([A-Za-z0-9_]+)/g;
const DATASOURCE_HINT_PATTERN = /\b(dataverse|sharepoint|sql|office365|salesforce|oracle|mysql|postgres|azureblob|onedrive|servicenow|customconnector|powerbi)\b/gi;
const URL_PATTERN = /https?:\/\/[^\s"'<>]+/gi;
const FORMULA_TOKEN_PATTERN = /\b(If|ForAll|LookUp|Patch|Collect|ClearCollect|Filter|Search|SortByColumns|With|Concurrent|Switch|Set|UpdateContext)\s*\(/g;
const CONTROL_TYPE_REGEX = /(button|label|gallery|screen|form|icon|textinput|dropdown|combobox|container|timer|media|chart|map|toggle|checkbox|radiobutton|datepicker|listbox)/i;
const FONT_SIZE_REGEX = /(fontsize|fontSize)\s*[:=]\s*(\d+(?:\.\d+)?)/gi;
const TAB_INDEX_NEGATIVE_REGEX = /(tabindex|tabIndex)\s*[:=]\s*-1\b/g;

interface InternalScreenState {
  screenName: string;
  controlTypeCount: Map<string, number>;
  formulaCount: number;
  formulaComplexityScore: number;
  dataSourceHints: Set<string>;
  navigationTargets: Set<string>;
  accessibilityIssues: MsAppAccessibilityIssue[];
}

export async function analyzeMsAppFile(file: File): Promise<MsAppAnalysisResult> {
  const zip = await JSZip.loadAsync(file);

  const screenNames = new Set<string>();
  const navigationTargets = new Set<string>();
  const dataSourceHints = new Set<string>();
  const controlCountMap = new Map<string, number>();
  const warnings: string[] = [];
  const accessibilityIssues: MsAppAccessibilityIssue[] = [];
  const screenStateMap = new Map<string, InternalScreenState>();

  let fileCount = 0;
  let totalCompressedBytes = 0;

  const entries = Object.values(zip.files).filter(entry => !entry.dir);

  for (const entry of entries) {
    fileCount += 1;
    const internalData = (entry as unknown as { _data?: { compressedSize?: number } })._data;
    totalCompressedBytes += internalData?.compressedSize || 0;

    const normalisedPath = entry.name.replace(/\\/g, '/');
    const screenFromPath = extractScreenNameFromPath(normalisedPath);
    const screenState = screenFromPath ? getOrCreateScreenState(screenStateMap, screenFromPath) : null;

    if (screenFromPath) {
      screenNames.add(screenFromPath);
    }

    if (!TEXT_FILE_PATTERN.test(normalisedPath)) {
      continue;
    }

    let text = '';
    try {
      text = await entry.async('string');
    } catch {
      warnings.push(`Could not read ${normalisedPath}`);
      continue;
    }

    scanTextForNavigation(text, navigationTargets, screenState);
    scanTextForDataSources(text, dataSourceHints, screenState);
    scanTextForUrls(text, dataSourceHints, screenState);
    scanTextForFormulaComplexity(text, screenState);
    scanTextForAccessibility(text, screenState);

    if (/\.json$/i.test(normalisedPath)) {
      try {
        const parsed = JSON.parse(text);
        scanObjectForControls(parsed, controlCountMap, screenState);
      } catch {
        // Not all .msapp JSON files are strict JSON; skip parse errors.
      }
    }
  }

  for (const screenState of screenStateMap.values()) {
    for (const issue of screenState.accessibilityIssues) {
      accessibilityIssues.push(issue);
    }
  }

  const controlTypes = [...controlCountMap.entries()]
    .map(([controlType, count]) => ({ controlType, count }))
    .sort((a, b) => b.count - a.count || a.controlType.localeCompare(b.controlType));

  const screenAnalysis = [...screenStateMap.values()]
    .map((screenState) => {
      const distinctControlTypes = screenState.controlTypeCount.size;
      const controlCount = [...screenState.controlTypeCount.values()].reduce((sum, value) => sum + value, 0);
      const band = toComplexityBand(screenState.formulaComplexityScore, controlCount);

      return {
        screenName: screenState.screenName,
        controlCount,
        distinctControlTypes,
        formulaCount: screenState.formulaCount,
        formulaComplexityScore: screenState.formulaComplexityScore,
        complexityBand: band,
        dataSourceHints: [...screenState.dataSourceHints].sort((a, b) => a.localeCompare(b)),
        navigationTargets: [...screenState.navigationTargets].sort((a, b) => a.localeCompare(b)),
        accessibilityIssueCount: screenState.accessibilityIssues.length,
      };
    })
    .sort((a, b) => {
      if (a.formulaComplexityScore !== b.formulaComplexityScore) {
        return b.formulaComplexityScore - a.formulaComplexityScore;
      }
      return a.screenName.localeCompare(b.screenName);
    });

  return {
    fileCount,
    totalCompressedBytes,
    screenNames: [...screenNames].sort((a, b) => a.localeCompare(b)),
    navigationTargets: [...navigationTargets].sort((a, b) => a.localeCompare(b)),
    controlTypes,
    dataSourceHints: [...dataSourceHints].sort((a, b) => a.localeCompare(b)),
    screenAnalysis,
    accessibilityIssues: dedupeAccessibilityIssues(accessibilityIssues),
    warnings,
  };
}

function extractScreenNameFromPath(path: string): string | null {
  if (!SCREEN_FILE_PATTERN.test(path)) {
    return null;
  }

  const fileName = path.split('/').pop();
  if (!fileName) {
    return null;
  }

  return fileName.replace(/\.(json|yaml|yml|fx)$/i, '');
}

function getOrCreateScreenState(map: Map<string, InternalScreenState>, screenName: string): InternalScreenState {
  const existing = map.get(screenName);
  if (existing) {
    return existing;
  }

  const created: InternalScreenState = {
    screenName,
    controlTypeCount: new Map<string, number>(),
    formulaCount: 0,
    formulaComplexityScore: 0,
    dataSourceHints: new Set<string>(),
    navigationTargets: new Set<string>(),
    accessibilityIssues: [],
  };
  map.set(screenName, created);
  return created;
}

function scanTextForNavigation(text: string, targets: Set<string>, screenState: InternalScreenState | null): void {
  let match: RegExpExecArray | null;
  while ((match = NAVIGATE_PATTERN.exec(text)) !== null) {
    if (match[1]) {
      const target = match[1];
      targets.add(target);
      screenState?.navigationTargets.add(target);
    }
  }
}

function scanTextForDataSources(text: string, hints: Set<string>, screenState: InternalScreenState | null): void {
  let match: RegExpExecArray | null;
  while ((match = DATASOURCE_HINT_PATTERN.exec(text)) !== null) {
    if (match[1]) {
      const hint = match[1].toLowerCase();
      hints.add(hint);
      screenState?.dataSourceHints.add(hint);
    }
  }
}

function scanTextForUrls(text: string, hints: Set<string>, screenState: InternalScreenState | null): void {
  const urls = text.match(URL_PATTERN) || [];
  for (const url of urls) {
    try {
      const host = new URL(url).hostname.toLowerCase();
      hints.add(host);
      screenState?.dataSourceHints.add(host);
    } catch {
      // Ignore invalid URLs.
    }
  }
}

function scanTextForFormulaComplexity(text: string, screenState: InternalScreenState | null): void {
  if (!screenState) {
    return;
  }

  const matches = text.match(FORMULA_TOKEN_PATTERN) || [];
  const formulaCount = matches.length;

  if (formulaCount > 0) {
    screenState.formulaCount += formulaCount;
    screenState.formulaComplexityScore += calculateFormulaComplexityScore(text, formulaCount);
  }
}

function calculateFormulaComplexityScore(text: string, formulaCount: number): number {
  let score = formulaCount;

  const nestingSignals = (text.match(/\bIf\s*\(/g) || []).length +
    (text.match(/\bSwitch\s*\(/g) || []).length +
    (text.match(/\bWith\s*\(/g) || []).length;
  score += nestingSignals * 2;

  const iterationSignals = (text.match(/\bForAll\s*\(/g) || []).length +
    (text.match(/\bCollect\s*\(/g) || []).length +
    (text.match(/\bPatch\s*\(/g) || []).length;
  score += iterationSignals * 3;

  return score;
}

function scanTextForAccessibility(text: string, screenState: InternalScreenState | null): void {
  if (!screenState) {
    return;
  }

  const lowerText = text.toLowerCase();

  const containsInteractiveControls = /(button|icon|textinput|dropdown|combobox|checkbox|radiobutton)/i.test(text);
  const hasAccessibleLabel = /accessiblelabel/i.test(text);
  if (containsInteractiveControls && !hasAccessibleLabel) {
    screenState.accessibilityIssues.push({
      screenName: screenState.screenName,
      severity: 'High',
      issue: 'Interactive controls detected without AccessibleLabel hints.',
      recommendation: 'Add AccessibleLabel values for controls used by screen readers.',
    });
  }

  let fontSizeMatch: RegExpExecArray | null;
  while ((fontSizeMatch = FONT_SIZE_REGEX.exec(text)) !== null) {
    const sizeValue = Number(fontSizeMatch[2]);
    if (!Number.isNaN(sizeValue) && sizeValue > 0 && sizeValue < 12) {
      screenState.accessibilityIssues.push({
        screenName: screenState.screenName,
        severity: 'Medium',
        issue: `Small font size detected (${sizeValue}).`,
        recommendation: 'Use font size 12 or greater for readability where possible.',
      });
      break;
    }
  }

  if (TAB_INDEX_NEGATIVE_REGEX.test(text)) {
    screenState.accessibilityIssues.push({
      screenName: screenState.screenName,
      severity: 'Medium',
      issue: 'Negative TabIndex detected.',
      recommendation: 'Review keyboard navigation order and avoid removing key controls from tab flow.',
    });
  }

  const colourSignals = /(color\s*=|fill\s*=|rgba\(|#(?:[0-9a-f]{3}){1,2})/i.test(text);
  const contrastSignals = /contrast/i.test(lowerText);
  if (colourSignals && !contrastSignals) {
    screenState.accessibilityIssues.push({
      screenName: screenState.screenName,
      severity: 'Low',
      issue: 'Colour styling detected without explicit contrast indicators.',
      recommendation: 'Validate text/background contrast ratios for key controls and labels.',
    });
  }
}

function scanObjectForControls(
  value: unknown,
  controlCountMap: Map<string, number>,
  screenState: InternalScreenState | null
): void {
  if (!value || typeof value !== 'object') {
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      scanObjectForControls(item, controlCountMap, screenState);
    }
    return;
  }

  const record = value as Record<string, unknown>;
  const controlType =
    asString(record.controlType) ||
    asString(record.ControlType) ||
    asString(record.type) ||
    asString(record.Type);

  if (controlType && looksLikeControlType(controlType)) {
    controlCountMap.set(controlType, (controlCountMap.get(controlType) || 0) + 1);
    if (screenState) {
      screenState.controlTypeCount.set(controlType, (screenState.controlTypeCount.get(controlType) || 0) + 1);
    }
  }

  for (const child of Object.values(record)) {
    scanObjectForControls(child, controlCountMap, screenState);
  }
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function looksLikeControlType(value: string): boolean {
  const lower = value.toLowerCase();
  if (lower.length < 3 || lower.length > 60) {
    return false;
  }

  return CONTROL_TYPE_REGEX.test(value);
}

function toComplexityBand(score: number, controlCount: number): 'High' | 'Medium' | 'Low' {
  if (score >= 35 || controlCount >= 80) {
    return 'High';
  }
  if (score >= 15 || controlCount >= 35) {
    return 'Medium';
  }
  return 'Low';
}

function dedupeAccessibilityIssues(issues: MsAppAccessibilityIssue[]): MsAppAccessibilityIssue[] {
  const map = new Map<string, MsAppAccessibilityIssue>();
  for (const issue of issues) {
    const key = `${issue.screenName}|${issue.severity}|${issue.issue}`;
    if (!map.has(key)) {
      map.set(key, issue);
    }
  }

  return [...map.values()].sort((a, b) => {
    if (a.screenName !== b.screenName) {
      return a.screenName.localeCompare(b.screenName);
    }
    const order: Record<MsAppAccessibilityIssue['severity'], number> = { High: 0, Medium: 1, Low: 2 };
    return order[a.severity] - order[b.severity];
  });
}
