import mermaid from 'mermaid';

/**
 * Initialize Mermaid with PPSB-specific configuration
 */
export function initMermaid(): void {
  mermaid.initialize({
    startOnLoad: false,
    theme: 'default',
    securityLevel: 'loose',
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
    console.error('Failed to render Mermaid diagram:', error);
    console.error('Diagram content:', diagram.substring(0, 500) + '...');

    // Try with simplified configuration
    try {
      console.log('Attempting render with simplified configuration...');
      mermaid.initialize({
        startOnLoad: false,
        theme: 'default',
        securityLevel: 'loose',
        maxTextSize: 900000,
        er: {
          useMaxWidth: true,
          fontSize: 12,
          layoutDirection: 'TB',
        },
      });

      const { svg } = await mermaid.render(elementId + '-retry', diagram.trim());
      return svg;
    } catch (retryError) {
      console.error('Retry also failed:', retryError);
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
    // Basic validation: check for required ERD syntax
    if (!diagram.trim().startsWith('erDiagram')) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}
