import mermaid from 'mermaid';

/**
 * Initialize Mermaid with PPSB-specific configuration
 */
export function initMermaid(): void {
  mermaid.initialize({
    startOnLoad: false,
    theme: 'base',
    securityLevel: 'loose',
    maxTextSize: 1000000,
    class: {
      useMaxWidth: false,
    },
    themeVariables: {
      fontFamily: 'Segoe UI, Arial, sans-serif',
      primaryTextColor: '#242424',
      lineColor: '#616161',
      primaryBorderColor: '#8a8886',
    },
    er: {
      useMaxWidth: true,
      fontSize: 14,
      layoutDirection: 'TB', // Top to bottom
    },
    flowchart: {
      useMaxWidth: true,
    },
  });
}

/**
 * Render Mermaid diagram to SVG
 * @param diagram Mermaid diagram definition
 * @param elementId Unique ID for the diagram element
 * @returns SVG string
 */
export async function renderMermaid(
  diagram: string,
  elementId: string
): Promise<string> {
  try {
    // Clean up the diagram string
    const cleanedDiagram = diagram.trim();

    // Re-initialize Mermaid before each render to ensure clean state
    initMermaid();

    const { svg } = await mermaid.render(elementId, cleanedDiagram);
    return svg;
  } catch (error) {
    // Try with simplified configuration
    try {
      mermaid.initialize({
        startOnLoad: false,
        theme: 'base',
        securityLevel: 'loose',
        maxTextSize: 900000,
        class: {
          useMaxWidth: false,
        },
        er: {
          useMaxWidth: true,
          fontSize: 12,
          layoutDirection: 'TB',
        },
      });

      const { svg } = await mermaid.render(elementId + '-retry', diagram.trim());
      return svg;
    } catch (retryError) {
      throw new Error(
        `Mermaid rendering failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}

/**
 * Validate Mermaid diagram syntax
 * @param diagram Mermaid diagram definition
 * @returns True if valid, false otherwise
 */
export function validateMermaidDiagram(diagram: string): boolean {
  try {
    const normalized = diagram.trim();
    // Basic validation: support both ER and class diagram syntax
    if (!normalized.startsWith('erDiagram') && !normalized.startsWith('classDiagram')) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}
