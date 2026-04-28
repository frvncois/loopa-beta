let counter = 0

export function generateId(prefix?: string): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).slice(2, 7)
  const seq = (counter++).toString(36)
  const id = `${timestamp}${random}${seq}`
  return prefix ? `${prefix}_${id}` : id
}
