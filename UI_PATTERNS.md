# UI Patterns and Guidelines

This document captures the UI patterns and design decisions used across all components in the PPSB tool.

## Text Display Pattern

**Problem**: Long text content in table/grid rows was being cut off with ellipsis, making it difficult to read full content.

**Solution**: Use text wrapping instead of truncation for all list components.

### Implementation

#### CSS Styles
```typescript
// For wrapping text in columns
wrapText: {
  wordBreak: 'break-word',
  overflowWrap: 'break-word',
  hyphens: 'auto',
}

// For columns that contain wrapping text
nameColumn: {
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
  minWidth: 0,
  wordBreak: 'break-word',
}
```

#### Grid Layout
```typescript
// Use minmax() for flexible columns that can grow/shrink
gridTemplateColumns: '24px 40px minmax(200px, 2fr) minmax(100px, 1fr) auto auto auto'

// Use alignItems: 'start' instead of 'center' for rows with wrapping text
alignItems: 'start'
```

### Where Applied
- ✅ PluginsList - Grid layout with wrapping text in name and assembly columns
- ✅ EntityList - Flex layout with wrapping description
- ✅ FlowsList - Grid layout with wrapping name and description

### Key Principles
1. **Never truncate with ellipsis** - Always allow text to wrap
2. **Use `alignItems: 'start'`** - For multi-line content alignment
3. **Use `minmax()` in grid columns** - Allows flexible sizing with minimum constraints
4. **Apply `wordBreak: 'break-word'`** - Prevents overflow by breaking long words
5. **Remove `title` attributes** - Not needed when full text is visible

## Collapsible Row Pattern

All list components use a collapsible row pattern instead of side panels or separate detail views.

### Implementation
- Click row to expand/collapse details inline
- Chevron icon (→/↓) indicates expand state
- Expanded details shown immediately below the row
- Details section has connected border styling

### Benefits
- Consistent UX across all components
- No side panels taking up space
- Single-click access to full details
- Better mobile/responsive experience

## Color Coding

- **Attribute count**: `colorBrandForeground1` with `fontWeightSemibold` - highlights important metrics
- **Expanded row**: `colorBrandBackground2` - indicates active/selected state
- **Code text**: `colorNeutralForeground3` with monospace font - for technical identifiers

## Future Components

When creating new list components:
1. Use collapsible rows (not side panels)
2. Apply text wrapping styles (not truncation)
3. Use `alignItems: 'start'` for multi-line layouts
4. Use `minmax()` for flexible grid columns
5. Follow the color coding patterns above
