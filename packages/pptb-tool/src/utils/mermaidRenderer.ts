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
    const { svg } = await mermaid.render(elementId, diagram);
    return svg;
  } catch (error) {
    console.error('Failed to render Mermaid diagram:', error);
    throw new Error(
      `Mermaid rendering failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
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
