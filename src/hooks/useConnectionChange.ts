import { useEffect } from 'react';

/**
 * Hook to listen for PPTB connection changes and trigger a callback
 * Listens for connection:created, connection:updated, and connection:deleted events
 */
export function useConnectionChange(onConnectionChange: () => void) {
  useEffect(() => {
    // Check if toolboxAPI is available
    if (typeof window === 'undefined' || !window.toolboxAPI?.events) {
      return;
    }

    // Event handler that filters for connection-related events
    const handleEvent = (_event: any, payload: any) => {
      // The actual event name is in payload.event, not the first parameter
      if (
        payload?.event === 'connection:created' ||
        payload?.event === 'connection:updated' ||
        payload?.event === 'connection:deleted'
      ) {
        onConnectionChange();
      }
    };

    // Subscribe to PPTB events
    window.toolboxAPI.events.on(handleEvent);

    // Cleanup subscription on unmount
    return () => {
      if (window.toolboxAPI?.events) {
        window.toolboxAPI.events.off(handleEvent);
      }
    };
  }, [onConnectionChange]);
}
