import type { KnipConfig } from 'knip';

const config: KnipConfig = {
  entry: ['src/main.tsx'],
  project: ['src/**/*.{ts,tsx}'],
  ignore: [],
  ignoreDependencies: [],
  // Props interfaces and enum members flagged by knip are acceptable in this project.
  // Re-run `pnpm lint:unused` after any significant refactor to catch real dead code.
};

export default config;
