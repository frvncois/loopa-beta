/**
 * Get a value from an object via a dot-separated path.
 *   getValueAtPath({ a: { b: [10, 20] } }, 'a.b.1') === 20
 */
export function getValueAtPath(obj: unknown, path: string): unknown {
  const keys = path.split('.')
  let cur: unknown = obj
  for (const k of keys) {
    if (cur == null || typeof cur !== 'object') return undefined
    cur = (cur as Record<string, unknown>)[k]
  }
  return cur
}

/**
 * Set a value into an object via a dot-separated path. Mutates `obj`.
 *   setValueAtPath({ fills: [{ color: 'fff' }] }, 'fills.0.color', '000')
 *     → { fills: [{ color: '000' }] }
 *
 * Numeric path segments index into arrays. Missing intermediate keys are NOT created.
 */
export function setValueAtPath(obj: unknown, path: string, value: unknown): void {
  const keys = path.split('.')
  let cur: unknown = obj
  for (let i = 0; i < keys.length - 1; i++) {
    if (cur == null || typeof cur !== 'object') return
    cur = (cur as Record<string, unknown>)[keys[i] ?? '']
  }
  const lastKey = keys[keys.length - 1]
  if (cur != null && typeof cur === 'object' && lastKey !== undefined) {
    (cur as Record<string, unknown>)[lastKey] = value
  }
}
