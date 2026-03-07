import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    // Inline cytoscape.min.js at build time so HTML exports work without CDN
    {
      name: 'virtual-cytoscape-raw',
      resolveId(id) {
        if (id === 'virtual:cytoscape-raw') return '\0virtual:cytoscape-raw';
      },
      load(id) {
        if (id === '\0virtual:cytoscape-raw') {
          const filePath = path.resolve('node_modules/cytoscape/dist/cytoscape.min.js');
          const content = fs.readFileSync(filePath, 'utf-8');
          return `export default ${JSON.stringify(content)};`;
        }
      },
    },
  ],
  base: './',
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
