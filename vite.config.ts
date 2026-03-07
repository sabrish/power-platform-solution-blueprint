import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    {
      // Provides the raw minified cytoscape source as a string so HtmlTemplates
      // can embed it directly into the exported HTML file (no CDN dependency).
      name: 'virtual-cytoscape-raw',
      resolveId(id) {
        if (id === 'virtual:cytoscape-raw') return '\0virtual:cytoscape-raw';
        return null;
      },
      load(id) {
        if (id === '\0virtual:cytoscape-raw') {
          const p = path.resolve(process.cwd(), 'node_modules/cytoscape/dist/cytoscape.min.js');
          return `export default ${JSON.stringify(fs.readFileSync(p, 'utf8'))}`;
        }
        return null;
      },
    },
  ],
  base: './',
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
