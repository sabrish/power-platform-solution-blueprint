/**
 * Global Choice (Option Set) types
 */

export interface GlobalChoice {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  isManaged: boolean;
  isCustomizable: boolean;
  options: GlobalChoiceOption[];
  totalOptions: number;
  owner: string;
  modifiedOn: string;
  modifiedBy: string;
}

export interface GlobalChoiceOption {
  value: number;
  label: string;
  description?: string;
  color?: string;
  externalValue?: string;
}

/**
 * Color mapping for managed vs unmanaged global choices
 */
export const GLOBAL_CHOICE_STATUS_COLORS = {
  managed: 'warning',
  unmanaged: 'success',
} as const;
