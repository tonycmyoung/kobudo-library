/**
 * Returns true if any of the supplied field values contain the query string
 * (case-insensitive). Null/undefined fields are skipped.
 */
export const matchesSearch = (query: string, ...fields: (string | null | undefined)[]): boolean => {
  const q = query.toLowerCase()
  return fields.some((f) => f?.toLowerCase().includes(q))
}
