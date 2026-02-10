import type { JavaScriptAnalysis, ExternalCall } from '../types/blueprint.js';

/**
 * Parser for JavaScript web resources
 */
export class JavaScriptParser {
  /**
   * Parse JavaScript content for external calls and patterns
   */
  static parse(content: string, _resourceName: string): JavaScriptAnalysis {
    const externalCalls: ExternalCall[] = [];
    const frameworks: string[] = [];
    let usesXrm = false;
    let usesDeprecatedXrmPage = false;

    try {
      // Count lines of code (non-empty, non-comment lines)
      const linesOfCode = this.countLinesOfCode(content);

      // Detect external HTTP calls
      const calls = this.detectExternalCalls(content);
      externalCalls.push(...calls);

      // Detect Xrm usage
      if (content.includes('Xrm.WebApi') || content.includes('Xrm.Navigation') || content.includes('Xrm.Utility')) {
        usesXrm = true;
      }

      // Detect deprecated Xrm.Page usage
      if (content.includes('Xrm.Page')) {
        usesDeprecatedXrmPage = true;
      }

      // Detect frameworks
      if (content.includes('jQuery') || content.includes('$') || content.includes('$.ajax')) {
        frameworks.push('jQuery');
      }
      if (content.includes('React') || content.includes('ReactDOM')) {
        frameworks.push('React');
      }
      if (content.includes('angular') || content.includes('ng-')) {
        frameworks.push('Angular');
      }
      if (content.includes('Vue') || content.includes('vue')) {
        frameworks.push('Vue');
      }

      // Determine complexity
      const complexity = this.determineComplexity(linesOfCode, externalCalls.length, frameworks.length);

      return {
        externalCalls,
        usesXrm,
        usesDeprecatedXrmPage,
        frameworks,
        linesOfCode,
        complexity,
      };
    } catch (error) {
      return {
        externalCalls: [],
        usesXrm: false,
        usesDeprecatedXrmPage: false,
        frameworks: [],
        linesOfCode: 0,
        complexity: 'Low',
      };
    }
  }

  /**
   * Count non-empty, non-comment lines
   */
  private static countLinesOfCode(content: string): number {
    const lines = content.split('\n');
    let count = 0;

    for (const line of lines) {
      const trimmed = line.trim();
      // Skip empty lines and comment-only lines
      if (trimmed && !trimmed.startsWith('//') && !trimmed.startsWith('/*') && !trimmed.startsWith('*')) {
        count++;
      }
    }

    return count;
  }

  /**
   * Detect external API calls
   */
  private static detectExternalCalls(content: string): ExternalCall[] {
    const calls: ExternalCall[] = [];
    const seenUrls = new Set<string>();

    // Pattern 1: fetch(url, options)
    const fetchPattern = /fetch\s*\(\s*['"`]([^'"`]+)['"`](?:\s*,\s*\{[^}]*method\s*:\s*['"`]([^'"`]+)['"`])?/gi;
    let match;

    while ((match = fetchPattern.exec(content)) !== null) {
      const url = match[1];
      const method = match[2] || 'GET';

      if (this.isExternalUrl(url) && !seenUrls.has(url)) {
        seenUrls.add(url);
        calls.push({
          url,
          domain: this.extractDomain(url),
          method,
          actionName: 'fetch',
          confidence: 'High',
        });
      }
    }

    // Pattern 2: XMLHttpRequest
    const xhrPattern = /\.open\s*\(\s*['"`]([^'"`]+)['"`]\s*,\s*['"`]([^'"`]+)['"`]/gi;
    while ((match = xhrPattern.exec(content)) !== null) {
      const method = match[1];
      const url = match[2];

      if (this.isExternalUrl(url) && !seenUrls.has(url)) {
        seenUrls.add(url);
        calls.push({
          url,
          domain: this.extractDomain(url),
          method,
          actionName: 'XMLHttpRequest',
          confidence: 'High',
        });
      }
    }

    // Pattern 3: axios
    const axiosPattern = /axios\s*\.\s*(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/gi;
    while ((match = axiosPattern.exec(content)) !== null) {
      const method = match[1].toUpperCase();
      const url = match[2];

      if (this.isExternalUrl(url) && !seenUrls.has(url)) {
        seenUrls.add(url);
        calls.push({
          url,
          domain: this.extractDomain(url),
          method,
          actionName: 'axios',
          confidence: 'High',
        });
      }
    }

    // Pattern 4: $.ajax({ url: ... })
    const jqueryPattern = /\$\.ajax\s*\(\s*\{[^}]*url\s*:\s*['"`]([^'"`]+)['"`][^}]*(?:method|type)\s*:\s*['"`]([^'"`]+)['"`]/gi;
    while ((match = jqueryPattern.exec(content)) !== null) {
      const url = match[1];
      const method = match[2];

      if (this.isExternalUrl(url) && !seenUrls.has(url)) {
        seenUrls.add(url);
        calls.push({
          url,
          domain: this.extractDomain(url),
          method,
          actionName: '$.ajax',
          confidence: 'Medium',
        });
      }
    }

    // Pattern 5: Generic HTTPS URLs in strings (lower confidence)
    const urlPattern = /https?:\/\/[a-zA-Z0-9\-._~:/?#[\]@!$&'()*+,;=%]+/gi;
    while ((match = urlPattern.exec(content)) !== null) {
      const url = match[0];

      if (this.isExternalUrl(url) && !seenUrls.has(url)) {
        seenUrls.add(url);
        calls.push({
          url,
          domain: this.extractDomain(url),
          method: null,
          actionName: 'URL in string',
          confidence: 'Low',
        });
      }
    }

    return calls;
  }

  /**
   * Check if URL is external (not Dataverse/CRM)
   */
  private static isExternalUrl(url: string): boolean {
    // Filter out internal Dataverse/CRM URLs
    const internalPatterns = [
      '/api/data/',
      'dynamics.com',
      'crm.dynamics.com',
      'Xrm.WebApi',
    ];

    for (const pattern of internalPatterns) {
      if (url.includes(pattern)) {
        return false;
      }
    }

    return url.startsWith('http://') || url.startsWith('https://');
  }

  /**
   * Extract domain from URL
   */
  private static extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      // Fallback: extract manually
      const match = url.match(/https?:\/\/([^/]+)/);
      return match ? match[1] : 'unknown';
    }
  }

  /**
   * Determine code complexity
   */
  private static determineComplexity(linesOfCode: number, externalCallsCount: number, frameworksCount: number): 'Low' | 'Medium' | 'High' {
    let score = 0;

    // Lines of code contribution
    if (linesOfCode > 500) {
      score += 2;
    } else if (linesOfCode > 200) {
      score += 1;
    }

    // External calls contribution
    if (externalCallsCount > 3) {
      score += 2;
    } else if (externalCallsCount > 0) {
      score += 1;
    }

    // Frameworks contribution
    if (frameworksCount > 1) {
      score += 1;
    }

    if (score >= 4) {
      return 'High';
    } else if (score >= 2) {
      return 'Medium';
    }
    return 'Low';
  }
}
