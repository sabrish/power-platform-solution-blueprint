# HTML Reporter

The HTML Reporter generates a single-page, self-contained, interactive HTML document for the Power Platform Solution Blueprint.

## Features

- **Self-contained**: Single HTML file with embedded CSS and JavaScript (only external dependency: Mermaid CDN for diagrams)
- **Interactive Navigation**: Fixed sidebar with smooth scrolling to sections
- **Accordion Entities**: Expandable/collapsible entity details
- **Sortable Tables**: Click column headers to sort data
- **Responsive Design**: Mobile-friendly with hamburger menu
- **Print-Optimized**: Clean print styles for paper output
- **Professional Design**: Fluent UI-inspired color scheme and typography

## Usage

```typescript
import { HtmlReporter, BlueprintResult } from '@ppsb/core';

// After generating a blueprint
const htmlReporter = new HtmlReporter();
const htmlContent = htmlReporter.generate(blueprintResult);

// Save to file or display in browser
await window.toolboxAPI.fileSystem.writeFile('blueprint.html', htmlContent);
```

## HTML Structure

```
<!DOCTYPE html>
<html lang="en">
  <head>
    - Meta tags
    - Embedded CSS
    - Mermaid CDN script
  </head>
  <body>
    <nav class="sidebar">
      - Navigation links
      - Print button
    </nav>
    <main>
      <header>
        - Title
        - Metadata (Environment, Generated date, Scope, Entity count)
      </header>

      <section id="summary">
        - Summary cards (Entities, Attributes, Plugins, Flows, etc.)
      </section>

      <section id="erd">
        - Entity Relationship Diagram (Mermaid)
        - Publisher legend
      </section>

      <section id="entities">
        - Accordion of entities
        - Each entity shows: metadata, attributes, plugins, flows
      </section>

      <section id="plugins">
        - Sortable table of all plugins
      </section>

      <section id="flows">
        - Sortable table of all flows
      </section>

      <section id="business-rules">
        - Sortable table of business rules
      </section>

      <section id="classic-workflows">
        - Warning alert
        - Sortable table with migration info
      </section>

      <section id="business-process-flows">
        - Sortable table of BPFs
      </section>

      <section id="web-resources">
        - Sortable table of web resources
      </section>

      <section id="custom-apis">
        - Sortable table of Custom APIs
      </section>

      <section id="environment-variables">
        - Sortable table of environment variables
      </section>

      <section id="connection-references">
        - Sortable table of connection references
      </section>

      <section id="external-dependencies">
        - Risk analysis table
      </section>

      <section id="cross-entity">
        - Cross-entity automation links
      </section>
    </main>

    <footer>
      - Tool attribution
    </footer>

    <script>
      - Mermaid initialization
      - Accordion toggle
      - Table sorting
      - Smooth scrolling
      - Mobile menu toggle
    </script>
  </body>
</html>
```

## CSS Classes

### Layout
- `.sidebar` - Fixed navigation sidebar
- `.nav-links` - Navigation link list
- `.btn-print` - Print button
- `main` - Main content area with margin for sidebar

### Components
- `.summary-card` - Summary stat cards
- `.accordion-item` - Expandable entity sections
- `.data-table` - Sortable tables
- `.badge` - Status badges (success, warning, error, info, primary)
- `.alert` - Alert boxes (warning, info)

### Color Scheme
- Primary: `#0078d4` (Blue)
- Success: `#107c10` (Green)
- Warning: `#ffb900` (Yellow)
- Error: `#d13438` (Red)
- Neutral: `#323130` (Dark Gray)

## JavaScript Functions

- `toggleAccordion(id)` - Expand/collapse entity details
- `sortTable(tableId, columnIndex)` - Sort table by column (ascending/descending)
- Smooth scroll on navigation link click
- Mobile sidebar toggle

## Browser Compatibility

- Modern browsers (Chrome, Edge, Firefox, Safari)
- IE11 not supported (uses modern CSS and ES6+)
- Print tested in Chrome/Edge

## File Size

Typical blueprint HTML file size:
- Small (1-5 entities): ~100-200 KB
- Medium (10-20 entities): ~300-500 KB
- Large (50+ entities): ~1-2 MB

All sizes include embedded CSS, JavaScript, and full data.
