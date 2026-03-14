/// <reference types="vite/client" />

/**
 * PPTB Desktop event bus — used by ThemeContext and useConnectionChange.
 * Events are dispatched as (event, payload) tuples; handlers receive both.
 */
interface ToolboxEvents {
  on(handler: (event: unknown, payload: unknown) => void): void;
  off(handler: (event: unknown, payload: unknown) => void): void;
}

/**
 * PPTB Desktop utility helpers — optional; may not be present in all versions.
 */
interface ToolboxUtils {
  getCurrentTheme?(): Promise<'light' | 'dark'>;
}

/**
 * PPTB Desktop API surface exposed on window.toolboxAPI.
 * All methods are optional to allow safe optional-chaining in UI code;
 * presence must always be checked before use (see useBlueprint.ts guard).
 */
interface ToolboxAPI {
  /** Returns the current tool context including connectionUrl. Always await. */
  getToolContext(): Promise<import('@pptb/types').ToolContext>;
  /** Event bus for PPTB Desktop host events (connection changes, settings, etc.) */
  events?: ToolboxEvents;
  /** Utility helpers (theme, etc.) — may be absent in older PPTB Desktop versions */
  utils?: ToolboxUtils;
}

interface Window {
  toolboxAPI: ToolboxAPI;
  dataverseAPI: import('@pptb/types').DataverseAPI;
}
