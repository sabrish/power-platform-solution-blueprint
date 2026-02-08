# MarkdownFormatter Output Examples

This file demonstrates the actual output from each MarkdownFormatter method.

## 1. formatTable()

**Input:**
```typescript
MarkdownFormatter.formatTable(
  ['Name', 'Type', 'Required'],
  [
    ['accountid', 'Guid', 'Yes'],
    ['name', 'String', 'No'],
    ['revenue', 'Money', 'No']
  ],
  ['left', 'center', 'right']
);
```

**Output:**

| Name | Type | Required |
|----------|:--------:|---------:|
| accountid | Guid | Yes |
| name | String | No |
| revenue | Money | No |

---

## 2. formatBadge()

**Input & Output:**
```typescript
MarkdownFormatter.formatBadge('Active', 'success');     // ✅ Active
MarkdownFormatter.formatBadge('Deprecated', 'warning'); // ⚠️ Deprecated
MarkdownFormatter.formatBadge('Failed', 'error');       // ❌ Failed
MarkdownFormatter.formatBadge('Information', 'info');   // ℹ️ Information
```

Visual:
- ✅ Active
- ⚠️ Deprecated
- ❌ Failed
- ℹ️ Information

---

## 3. formatLink()

**Input:**
```typescript
MarkdownFormatter.formatLink('Microsoft Documentation', 'https://learn.microsoft.com');
```

**Output:**

[Microsoft Documentation](https://learn.microsoft.com)

---

## 4. formatCodeBlock()

**Input:**
```typescript
const code = `function greet(name) {
  console.log(\`Hello, \${name}!\`);
}`;
MarkdownFormatter.formatCodeBlock(code, 'javascript');
```

**Output:**

```javascript
function greet(name) {
  console.log(`Hello, ${name}!`);
}
```

---

## 5. formatList()

**Unordered List:**

```typescript
MarkdownFormatter.formatList(['Apple', 'Banana', 'Cherry'], false);
```

Output:
- Apple
- Banana
- Cherry

**Ordered List:**

```typescript
MarkdownFormatter.formatList(['First step', 'Second step', 'Third step'], true);
```

Output:
1. First step
2. Second step
3. Third step

---

## 6. formatHeading()

**Input:**
```typescript
MarkdownFormatter.formatHeading('Main Title', 1);
MarkdownFormatter.formatHeading('Subtitle', 2);
MarkdownFormatter.formatHeading('Section', 3);
```

**Output:**

# Main Title
## Subtitle
### Section

---

## 7. formatHorizontalRule()

**Input:**
```typescript
MarkdownFormatter.formatHorizontalRule();
```

**Output:**

---

---

## 8. escapeMarkdown()

**Input:**
```typescript
const unsafeText = 'Hello *world* with [special] characters!';
MarkdownFormatter.escapeMarkdown(unsafeText);
```

**Output:**
```
Hello \*world\* with \[special\] characters\!
```

---

## 9. formatFileTree()

**Input:**
```typescript
const fileTree: FileNode = {
  name: 'blueprint',
  type: 'directory',
  path: 'blueprint',
  children: [
    { name: 'README.md', type: 'file', path: 'blueprint/README.md' },
    {
      name: 'summary',
      type: 'directory',
      path: 'blueprint/summary',
      children: [
        { name: 'metrics.md', type: 'file', path: 'blueprint/summary/metrics.md' },
        { name: 'all-plugins.md', type: 'file', path: 'blueprint/summary/all-plugins.md' }
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
            { name: 'overview.md', type: 'file', path: 'blueprint/entities/account/overview.md' },
            { name: 'plugins.md', type: 'file', path: 'blueprint/entities/account/plugins.md' }
          ]
        }
      ]
    }
  ]
};
MarkdownFormatter.formatFileTree(fileTree);
```

**Output:**
```
blueprint/
├── README.md
├── summary/
│   ├── metrics.md
│   └── all-plugins.md
└── entities/
    └── account/
        ├── overview.md
        └── plugins.md
```

---

## Special Cases Handled

### Table with Pipe Characters

The formatter automatically escapes pipe characters in table content:

**Input:**
```typescript
MarkdownFormatter.formatTable(
  ['Expression', 'Result'],
  [
    ['a | b', 'OR operation'],
    ['x || y', 'Logical OR']
  ]
);
```

**Output:**

| Expression | Result |
|----------|----------|
| a \| b | OR operation |
| x \|\| y | Logical OR |

### Empty Arrays

All methods handle empty arrays gracefully:

```typescript
MarkdownFormatter.formatTable([], []);        // Returns ''
MarkdownFormatter.formatList([], false);      // Returns ''
```

### Heading Level Clamping

Heading levels are automatically clamped to 1-6:

```typescript
MarkdownFormatter.formatHeading('Test', 0);   // # Test (clamped to 1)
MarkdownFormatter.formatHeading('Test', 10);  // ###### Test (clamped to 6)
```
