/**
 * Example usage of MarkdownFormatter utility
 * This file demonstrates all methods and is for documentation purposes only
 */
import MarkdownFormatter from './MarkdownFormatter.js';
import type { FileNode } from '../../types/blueprint.js';

// Example 1: Format a table
const tableExample = MarkdownFormatter.formatTable(
  ['Name', 'Type', 'Required'],
  [
    ['accountid', 'Guid', 'Yes'],
    ['name', 'String', 'No'],
    ['revenue', 'Money', 'No']
  ],
  ['left', 'center', 'right']
);
console.log('Table Example:');
console.log(tableExample);
console.log();

// Example 2: Format badges
console.log('Badge Examples:');
console.log(MarkdownFormatter.formatBadge('Active', 'success'));
console.log(MarkdownFormatter.formatBadge('Deprecated', 'warning'));
console.log(MarkdownFormatter.formatBadge('Failed', 'error'));
console.log(MarkdownFormatter.formatBadge('Information', 'info'));
console.log();

// Example 3: Format links
console.log('Link Example:');
console.log(MarkdownFormatter.formatLink('Microsoft Documentation', 'https://learn.microsoft.com'));
console.log();

// Example 4: Format code block
console.log('Code Block Example:');
const code = `function greet(name) {
  console.log(\`Hello, \${name}!\`);
}`;
console.log(MarkdownFormatter.formatCodeBlock(code, 'javascript'));
console.log();

// Example 5: Format lists
console.log('Unordered List Example:');
console.log(MarkdownFormatter.formatList(['Apple', 'Banana', 'Cherry'], false));
console.log();

console.log('Ordered List Example:');
console.log(MarkdownFormatter.formatList(['First step', 'Second step', 'Third step'], true));
console.log();

// Example 6: Format headings
console.log('Heading Examples:');
console.log(MarkdownFormatter.formatHeading('Main Title', 1));
console.log(MarkdownFormatter.formatHeading('Subtitle', 2));
console.log(MarkdownFormatter.formatHeading('Section', 3));
console.log();

// Example 7: Horizontal rule
console.log('Horizontal Rule:');
console.log(MarkdownFormatter.formatHorizontalRule());
console.log();

// Example 8: Escape markdown
console.log('Escape Markdown Example:');
const unsafeText = 'Hello *world* with [special] characters!';
console.log('Original:', unsafeText);
console.log('Escaped:', MarkdownFormatter.escapeMarkdown(unsafeText));
console.log();

// Example 9: File tree
console.log('File Tree Example:');
const fileTree: FileNode = {
  name: 'blueprint',
  type: 'directory',
  path: 'blueprint',
  children: [
    {
      name: 'README.md',
      type: 'file',
      path: 'blueprint/README.md'
    },
    {
      name: 'summary',
      type: 'directory',
      path: 'blueprint/summary',
      children: [
        {
          name: 'metrics.md',
          type: 'file',
          path: 'blueprint/summary/metrics.md'
        },
        {
          name: 'all-plugins.md',
          type: 'file',
          path: 'blueprint/summary/all-plugins.md'
        }
      ]
    },
    {
      name: 'entities',
      type: 'directory',
      path: 'blueprint/entities',
      children: [
        {
          name: 'account',
          type: 'directory',
          path: 'blueprint/entities/account',
          children: [
            {
              name: 'overview.md',
              type: 'file',
              path: 'blueprint/entities/account/overview.md'
            },
            {
              name: 'plugins.md',
              type: 'file',
              path: 'blueprint/entities/account/plugins.md'
            }
          ]
        },
        {
          name: 'contact',
          type: 'directory',
          path: 'blueprint/entities/contact',
          children: [
            {
              name: 'overview.md',
              type: 'file',
              path: 'blueprint/entities/contact/overview.md'
            }
          ]
        }
      ]
    }
  ]
};
console.log(MarkdownFormatter.formatFileTree(fileTree));
