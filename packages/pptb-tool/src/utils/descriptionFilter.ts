/**
 * Filters out placeholder description text from Dataverse
 * @param description The description text to filter
 * @returns The filtered description or undefined if it's a placeholder
 */
export function filterDescription(description: string | undefined): string | undefined {
  if (!description) return undefined;

  // Filter out Dataverse placeholder text
  const placeholders = [
    'Click to add description',
    'click to add description',
    'CLICK TO ADD DESCRIPTION',
  ];

  const trimmed = description.trim();
  if (placeholders.includes(trimmed)) {
    return undefined;
  }

  return description;
}
