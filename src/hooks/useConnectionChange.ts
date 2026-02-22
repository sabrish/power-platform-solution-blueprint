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

    const handleConnectionEvent = (event: string) => {
      // Only handle connection-related events
      if (
        event === 'connection:created' ||
        event === 'connection:updated' ||
        event === 'connection:deleted'
      ) {
        onConnectionChange();
      }
    };

    // Subscribe to PPTB events
    window.toolboxAPI.events.on(handleConnectionEvent);

    // Cleanup subscription on unmount
    return () => {
      if (window.toolboxAPI?.events) {
        window.toolboxAPI.events.off(handleConnectionEvent);
      }
    };
  }, [onConnectionChange]);
}
