/**
 * Lightweight conditional debug logger for PPSB.
 *
 * Active in any of three situations:
 *   1. Vite dev server  (`pnpm dev`) — import.meta.env.DEV is true automatically.
 *   2. Any http: origin  — same as above, covers browser-based testing.
 *   3. PPTB Desktop registry / local install — opt in once from DevTools console:
 *        localStorage.setItem('ppsb-debug', 'true')
 *      To disable:
 *        localStorage.removeItem('ppsb-debug')
 *
 * Production store installs running under pptb-webview:// with no localStorage
 * flag are completely silent — zero overhead.
 */

function isDebugActive(): boolean {
  try {
    if (import.meta.env.DEV) return true;
    if (typeof window !== 'undefined') {
      if (window.location.protocol === 'http:') return true;
      if (window.localStorage?.getItem('ppsb-debug') === 'true') return true;
    }
  } catch {
    // Never throw from a debug guard
  }
  return false;
}

/**
 * Emit a labelled debug log. No-op in production unless the localStorage
 * opt-in is set.
 *
 * @param tag   Short category label, e.g. 'flow-scope'
 * @param msg   Human-readable description
 * @param data  Optional structured payload logged as a second argument
 *              so browser DevTools renders it as an expandable object.
 */
export function debugLog(tag: string, msg: string, data?: unknown): void {
  if (!isDebugActive()) return;
  if (data !== undefined) {
    console.log(`[PPSB:${tag}] ${msg}`, data);
  } else {
    console.log(`[PPSB:${tag}] ${msg}`);
  }
}
