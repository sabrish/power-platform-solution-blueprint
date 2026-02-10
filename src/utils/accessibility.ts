/**
 * Accessibility utilities for WCAG AA compliance
 */

/**
 * Generate unique ID for ARIA labels
 */
let idCounter = 0;
export function generateId(prefix: string = 'aria'): string {
  return `${prefix}-${++idCounter}`;
}

/**
 * Announce message to screen readers
 */
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;

  document.body.appendChild(announcement);

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

/**
 * Trap focus within a container (for modals/dialogs)
 */
export function trapFocus(container: HTMLElement): () => void {
  const focusableElements = container.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    }
  };

  container.addEventListener('keydown', handleKeyDown);

  // Return cleanup function
  return () => {
    container.removeEventListener('keydown', handleKeyDown);
  };
}

/**
 * Check if element is visible to screen readers
 */
export function isVisibleToScreenReader(element: HTMLElement): boolean {
  return (
    element.offsetWidth > 0 &&
    element.offsetHeight > 0 &&
    getComputedStyle(element).visibility !== 'hidden' &&
    getComputedStyle(element).display !== 'none'
  );
}

/**
 * Format number with locale for screen readers
 */
export function formatNumberForScreenReader(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

/**
 * Create visually hidden but screen reader accessible text
 */
export function createScreenReaderOnlyText(text: string): HTMLSpanElement {
  const span = document.createElement('span');
  span.className = 'sr-only';
  span.textContent = text;
  return span;
}

/**
 * Get descriptive text for status badge
 */
export function getStatusDescription(status: string): string {
  const descriptions: Record<string, string> = {
    active: 'Active status',
    inactive: 'Inactive status',
    warning: 'Warning status',
    error: 'Error status',
    success: 'Success status',
    pending: 'Pending status',
    managed: 'Managed component',
    unmanaged: 'Unmanaged component',
  };

  return descriptions[status.toLowerCase()] || `${status} status`;
}

/**
 * Keyboard event handler utilities
 */
export const KeyboardUtils = {
  isEnter: (e: KeyboardEvent) => e.key === 'Enter',
  isSpace: (e: KeyboardEvent) => e.key === ' ' || e.key === 'Spacebar',
  isEscape: (e: KeyboardEvent) => e.key === 'Escape' || e.key === 'Esc',
  isArrowUp: (e: KeyboardEvent) => e.key === 'ArrowUp',
  isArrowDown: (e: KeyboardEvent) => e.key === 'ArrowDown',
  isArrowLeft: (e: KeyboardEvent) => e.key === 'ArrowLeft',
  isArrowRight: (e: KeyboardEvent) => e.key === 'ArrowRight',
  isTab: (e: KeyboardEvent) => e.key === 'Tab',
};
