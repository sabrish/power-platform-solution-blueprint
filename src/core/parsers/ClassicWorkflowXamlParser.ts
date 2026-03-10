/**
 * Parser for Classic Workflow XAML to extract cross-entity steps.
 *
 * Classic workflow XAML uses mxswa: namespace elements to describe
 * operations on Dataverse entities. This parser extracts Create/Update/Delete
 * steps that target entities other than the workflow's own entity.
 */

export interface XamlCrossEntityStep {
  operation: 'Create' | 'Update' | 'Delete';
  targetEntity: string;
  /** Attribute Key values from AttributeCollection */
  fields: string[];
  confidence: 'High' | 'Low';
}

/**
 * Parse a classic workflow XAML string for cross-entity operations.
 * Uses regex-based string parsing (same approach as BusinessRuleParser).
 */
export class ClassicWorkflowXamlParser {
  /**
   * Extract all cross-entity steps from workflow XAML.
   * @param xaml Raw XAML string from workflow.xaml field
   * @returns Array of cross-entity steps detected
   */
  static parse(xaml: string): XamlCrossEntityStep[] {
    if (!xaml || xaml.trim().length === 0) {
      return [];
    }

    const steps: XamlCrossEntityStep[] = [];

    // Detect CreateEntity steps
    // Pattern: <mxswa:CreateEntity EntityName="..." ...> ... </mxswa:CreateEntity>
    // or self-closing: <mxswa:CreateEntity EntityName="..." ... />
    steps.push(...this.extractSteps(xaml, 'CreateEntity', 'Create'));

    // Detect UpdateEntity steps
    steps.push(...this.extractSteps(xaml, 'UpdateEntity', 'Update'));

    // Detect SetState steps (state/status change — treated as Delete/state change)
    steps.push(...this.extractSetStateSteps(xaml));

    return steps;
  }

  /**
   * Extract steps for a given XAML element name and operation type
   */
  private static extractSteps(
    xaml: string,
    elementName: string,
    operation: 'Create' | 'Update'
  ): XamlCrossEntityStep[] {
    const results: XamlCrossEntityStep[] = [];

    // Match opening tag with EntityName attribute (may span multiple attrs)
    const openTagPattern = new RegExp(
      `<(?:mxswa:)?${elementName}\\b([^>]*)>`,
      'gi'
    );
    // Also match self-closing
    const selfClosingPattern = new RegExp(
      `<(?:mxswa:)?${elementName}\\b([^>]*)\\/\\s*>`,
      'gi'
    );
    // Closing tag
    const closeTagPattern = new RegExp(`</(?:mxswa:)?${elementName}\\s*>`, 'gi');

    // Process self-closing tags
    let match: RegExpExecArray | null;
    selfClosingPattern.lastIndex = 0;
    while ((match = selfClosingPattern.exec(xaml)) !== null) {
      const attrs = match[1];
      const entityName = this.extractEntityName(attrs);
      if (entityName) {
        results.push({ operation, targetEntity: entityName, fields: [], confidence: 'High' });
      }
    }

    // Process open+close tag pairs (may have AttributeCollection inside)
    // Skip self-closing tags — they are already handled by selfClosingPattern above.
    // A self-closing tag like <mxswa:UpdateEntity ... /> is also matched by [^>]*>
    // because the pattern sees the trailing '>' in '/>'. Guard: attrs ends with '/'.
    openTagPattern.lastIndex = 0;
    while ((match = openTagPattern.exec(xaml)) !== null) {
      const startIndex = match.index + match[0].length;
      const attrs = match[1];
      if (attrs.trimEnd().endsWith('/')) continue; // already handled as self-closing
      const entityName = this.extractEntityName(attrs);
      if (!entityName) continue;

      // Find matching close tag
      closeTagPattern.lastIndex = startIndex;
      const closeMatch = closeTagPattern.exec(xaml);
      const endIndex = closeMatch ? closeMatch.index : xaml.length;

      const innerXml = xaml.substring(startIndex, endIndex);
      const fields = this.extractAttributeCollectionKeys(innerXml);

      results.push({ operation, targetEntity: entityName, fields, confidence: 'High' });
    }

    return results;
  }

  /**
   * Extract SetState steps which indicate a state/status change (treated as Delete/state change)
   */
  private static extractSetStateSteps(xaml: string): XamlCrossEntityStep[] {
    const results: XamlCrossEntityStep[] = [];

    // <SetState EntityName="account" ... /> or <mxswa:SetState EntityName="account" ... />
    const pattern = /<(?:mxswa:)?SetState\b([^>]*?)(?:\/>|>)/gi;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(xaml)) !== null) {
      const attrs = match[1];
      const entityName = this.extractEntityName(attrs);
      if (entityName) {
        results.push({
          operation: 'Update', // SetState = state/status transition (Update, not Delete)
          targetEntity: entityName,
          fields: ['statecode', 'statuscode'],
          confidence: 'Low', // Lower confidence since it may be the workflow's own entity
        });
      }
    }

    return results;
  }

  /**
   * Extract EntityName attribute value from an attribute string
   */
  private static extractEntityName(attrs: string): string | null {
    const match = /EntityName\s*=\s*"([^"]+)"/i.exec(attrs);
    return match ? match[1].toLowerCase() : null;
  }

  /**
   * Extract Key values from an AttributeCollection block
   * <mxswa:AttributeCollection>
   *   <KeyValuePairOfStringObject Key="fieldname">...</KeyValuePairOfStringObject>
   * </mxswa:AttributeCollection>
   */
  private static extractAttributeCollectionKeys(innerXml: string): string[] {
    const keys: string[] = [];

    // Find AttributeCollection blocks
    const collectionPattern = /<(?:mxswa:)?AttributeCollection\b[^>]*>([\s\S]*?)<\/(?:mxswa:)?AttributeCollection\s*>/gi;
    let collMatch: RegExpExecArray | null;
    while ((collMatch = collectionPattern.exec(innerXml)) !== null) {
      const collectionContent = collMatch[1];
      // Extract Key attributes from KeyValuePair elements
      const keyPattern = /Key\s*=\s*"([^"]+)"/gi;
      let keyMatch: RegExpExecArray | null;
      while ((keyMatch = keyPattern.exec(collectionContent)) !== null) {
        const key = keyMatch[1].toLowerCase();
        if (!keys.includes(key)) {
          keys.push(key);
        }
      }
    }

    return keys;
  }
}
