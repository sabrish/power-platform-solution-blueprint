import type { KnipConfig } from 'knip';

const config: KnipConfig = {
  // entry is auto-detected from package.json "main"/"module" — no need to specify
  project: ['src/**/*.{ts,tsx}'],

  rules: {
    // Props interfaces (e.g. FlowsListProps) are exported for documentation clarity
    // but never imported externally in this app. Downgraded to warn — not a blocker,
    // but will surface if the count grows unexpectedly or a type leaks sensitive data.
    types: 'warn',

    // ComponentType enum members (PluginType, PluginAssembly, etc.) are reserved for
    // future Dataverse component type detection. Downgraded to warn for same reason.
    enumMembers: 'warn',
  },
};

export default config;
