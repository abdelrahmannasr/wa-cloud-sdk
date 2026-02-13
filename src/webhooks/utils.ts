/** Extract a single string value from a record that may contain arrays (e.g. query params, headers). */
export function extractFirstValue(
  record: Record<string, string | string[] | undefined>,
  key: string,
): string | undefined {
  const value = record[key];
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}
