/**
 * Next.js getServerSideProps cannot pass `undefined` — convert to `null` recursively.
 */
export function serializeForProps<T>(value: T): T {
  if (value === undefined) {
    return null as T;
  }
  if (value === null || typeof value !== 'object') {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => serializeForProps(item)) as T;
  }
  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value)) {
    out[key] = serializeForProps(val);
  }
  return out as T;
}
