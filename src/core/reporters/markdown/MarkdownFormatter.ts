/**
 * Markdown formatting utility class for PPSB
 * Provides static helper methods for generating markdown content
 */
import type { FileNode } from '../../types/blueprint.js';

export default class MarkdownFormatter {
  /**
   * Generate a markdown table with proper alignment
   * @param headers - Table header labels
   * @param rows - Array of row data (each row is an array of cell values)
   * @param alignment - Optional alignment for each column ('left' | 'center' | 'right'), defaults to 'left'
   * @returns Formatted markdown table string
   *
   * @example
   * ```typescript
   * const table = MarkdownFormatter.formatTable(
   *   ['Name', 'Type', 'Required'],
   *   [
   *     ['id', 'String', 'Yes'],
   *     ['name', 'String', 'No']
   *   ],
   *   ['left', 'center', 'right']
   * );
   * ```
   */
  static formatTable(
    headers: string[],
    rows: string[][],
    alignment?: ('left' | 'center' | 'right')[]
  ): string {
    if (headers.length === 0) {
      return '';
    }

    const alignments = alignment || headers.map(() => 'left');

    // Escape pipe characters in content
    const escapePipes = (text: string): string => {
      return (text || '').replace(/\|/g, '\\|');
    };

    // Build header row
    const headerRow = '| ' + headers.map(escapePipes).join(' | ') + ' |';

    // Build separator row with alignment
    const separatorRow = '| ' + headers.map((_, i) => {
      const align = alignments[i] || 'left';
      switch (align) {
        case 'center':
          return ':--------:';
        case 'right':
          return '---------:';
        default:
          return '----------';
      }
    }).join(' | ') + ' |';

    // Build data rows
    const dataRows = rows.map(row => {
      const cells = headers.map((_, i) => escapePipes(row[i] || ''));
      return '| ' + cells.join(' | ') + ' |';
    });

    return [headerRow, separatorRow, ...dataRows].join('\n');
  }

  /**
   * Format a badge with emoji/symbol based on type
   * @param text - Badge text
   * @param type - Badge type (success, warning, error, info)
   * @returns Formatted badge string
   *
   * @example
   * ```typescript
   * MarkdownFormatter.formatBadge('Active', 'success'); // ✅ Active
   * MarkdownFormatter.formatBadge('Warning', 'warning'); // ⚠️ Warning
   * ```
   */
  static formatBadge(text: string, type: 'success' | 'warning' | 'error' | 'info'): string {
    const icons = {
      success: '✅',
      warning: '⚠️',
      error: '❌',
      info: 'ℹ️'
    };

    return `${icons[type]} ${text}`;
  }

  /**
   * Format a markdown link
   * @param text - Link display text
   * @param url - Link URL
   * @returns Formatted markdown link
   *
   * @example
   * ```typescript
   * MarkdownFormatter.formatLink('Google', 'https://google.com'); // [Google](https://google.com)
   * ```
   */
  static formatLink(text: string, url: string): string {
    return `[${text}](${url})`;
  }

  /**
   * Format a code block with language syntax highlighting
   * @param code - Code content
   * @param language - Programming language identifier
   * @returns Formatted fenced code block
   *
   * @example
   * ```typescript
   * MarkdownFormatter.formatCodeBlock('console.log("hello");', 'javascript');
   * // Returns:
   * // ```javascript
   * // console.log("hello");
   * // ```
   * ```
   */
  static formatCodeBlock(code: string, language: string): string {
    return `\`\`\`${language}\n${code}\n\`\`\``;
  }

  /**
   * Format a markdown list (ordered or unordered)
   * @param items - List items
   * @param ordered - Whether to create an ordered list (default: false)
   * @returns Formatted markdown list
   *
   * @example
   * ```typescript
   * MarkdownFormatter.formatList(['Apple', 'Banana'], false);
   * // - Apple
   * // - Banana
   *
   * MarkdownFormatter.formatList(['First', 'Second'], true);
   * // 1. First
   * // 2. Second
   * ```
   */
  static formatList(items: string[], ordered: boolean = false): string {
    if (items.length === 0) {
      return '';
    }

    if (ordered) {
      return items.map((item, index) => `${index + 1}. ${item}`).join('\n');
    } else {
      return items.map(item => `- ${item}`).join('\n');
    }
  }

  /**
   * Format a markdown heading
   * @param text - Heading text
   * @param level - Heading level (1-6), will be clamped to this range
   * @returns Formatted markdown heading
   *
   * @example
   * ```typescript
   * MarkdownFormatter.formatHeading('Title', 1); // # Title
   * MarkdownFormatter.formatHeading('Subtitle', 2); // ## Subtitle
   * ```
   */
  static formatHeading(text: string, level: number): string {
    const clampedLevel = Math.max(1, Math.min(6, level));
    const hashes = '#'.repeat(clampedLevel);
    return `${hashes} ${text}`;
  }

  /**
   * Format a horizontal rule
   * @returns Markdown horizontal rule
   *
   * @example
   * ```typescript
   * MarkdownFormatter.formatHorizontalRule(); // ---
   * ```
   */
  static formatHorizontalRule(): string {
    return '---';
  }

  /**
   * Escape special markdown characters in user content
   * @param text - Text to escape
   * @returns Escaped text safe for markdown
   *
   * @example
   * ```typescript
   * MarkdownFormatter.escapeMarkdown('Hello *world*'); // Hello \\*world\\*
   * ```
   */
  static escapeMarkdown(text: string): string {
    if (!text) {
      return '';
    }

    // Escape markdown special characters
    const specialChars = /([*_\[\]()#+\-.!|\\])/g;
    return text.replace(specialChars, '\\$1');
  }

  /**
   * Generate ASCII file tree representation
   * @param node - Root file node
   * @returns Formatted file tree string
   *
   * @example
   * ```typescript
   * const tree: FileNode = {
   *   name: 'blueprint',
   *   type: 'directory',
   *   path: 'blueprint',
   *   children: [
   *     { name: 'README.md', type: 'file', path: 'blueprint/README.md' },
   *     {
   *       name: 'entities',
   *       type: 'directory',
   *       path: 'blueprint/entities',
   *       children: [
   *         { name: 'account.md', type: 'file', path: 'blueprint/entities/account.md' }
   *       ]
   *     }
   *   ]
   * };
   * MarkdownFormatter.formatFileTree(tree);
   * // blueprint/
   * // ├── README.md
   * // └── entities/
   * //     └── account.md
   * ```
   */
  static formatFileTree(node: FileNode): string {
    return this.formatFileTreeRecursive(node, '', true, true);
  }

  /**
   * Helper method for recursive file tree formatting
   * @param node - Current file node
   * @param prefix - Current prefix for indentation
   * @param isLast - Whether this node is the last sibling
   * @param isRoot - Whether this is the root node
   * @returns Formatted file tree string
   */
  private static formatFileTreeRecursive(
    node: FileNode,
    prefix: string,
    isLast: boolean,
    isRoot: boolean
  ): string {
    const lines: string[] = [];

    // Format current node
    const nodeName = node.name + (node.type === 'directory' ? '/' : '');

    if (isRoot) {
      lines.push(nodeName);
    } else {
      const connector = isLast ? '└── ' : '├── ';
      lines.push(prefix + connector + nodeName);
    }

    // Process children
    if (node.children && node.children.length > 0) {
      node.children.forEach((child, index) => {
        const isLastChild = index === node.children!.length - 1;

        // Calculate new prefix for children
        let newPrefix: string;
        if (isRoot) {
          newPrefix = '';
        } else {
          newPrefix = prefix + (isLast ? '    ' : '│   ');
        }

        const childLines = this.formatFileTreeRecursive(child, newPrefix, isLastChild, false);
        lines.push(childLines);
      });
    }

    return lines.join('\n');
  }
}
