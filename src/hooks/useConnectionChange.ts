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
    const handleEvent = (event: any, payload: any) => {
      console.log('[PPSB] Event received:', event, payload);

      // Check if this is a connection-related event
      if (
        event === 'connection:created' ||
        event === 'connection:updated' ||
        event === 'connection:deleted'
      ) {
        console.log('[PPSB] Connection change detected, triggering reset');
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
