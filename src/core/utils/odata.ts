/**
 * OData query building utilities.
 */

/**
 * Builds an OData $filter expression joining multiple values with OR.
 *
 * Examples:
 *   buildOrFilter(['a', 'b'], 'fieldname')
 *     → "fieldname eq 'a' or fieldname eq 'b'"
 *
 *   buildOrFilter(['guid1', 'guid2'], 'roleid', { guids: true })
 *     → "roleid eq guid1 or roleid eq guid2"
 *
 * @param values  Array of string values to match against
 * @param field   OData field name
 * @param opts    Optional: set guids=true to omit quotes (GUIDs need no quotes in OData)
 * @returns       OData OR filter expression, or empty string if values is empty
 */
export function buildOrFilter(
  values: string[],
  field: string,
  opts?: { guids?: boolean }
): string {
  if (values.length === 0) return '';
  const fmt = opts?.guids
    ? (v: string) => `${field} eq ${v}`
    : (v: string) => `${field} eq '${v}'`;
  return values.map(fmt).join(' or ');
}
