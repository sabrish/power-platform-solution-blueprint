import type { Action } from '../types/blueprint.js';

/** Format a business rule action as a human-readable sentence (plain text — no HTML escaping). */
export function formatActionSentence(action: Action): string {
  const fieldName = action.fieldLabel ?? action.field;
  switch (action.type) {
    case 'ShowField':   return `Show field: ${fieldName}`;
    case 'HideField':   return `Hide field: ${fieldName}`;
    case 'LockField':   return `Lock field: ${fieldName}`;
    case 'UnlockField': return `Unlock field: ${fieldName}`;
    case 'SetRequired': return `Set required: ${fieldName}${action.value ? ` (${action.value})` : ''}`;
    case 'SetOptional': return `Set optional: ${fieldName}`;
    case 'SetValue':    return `Set value: ${fieldName} = ${action.value ?? '(clear)'}`;
    case 'ShowError':   return `Show error on ${fieldName}${action.message ? `: ${action.message}` : ''}`;
    default:            return `${action.type}: ${fieldName}`;
  }
}
