// URL-safe 8-char random ID — same alphabet as nanoid, generated via Web Crypto.
// Slugs used in project URLs are generated server-side by the create_project SQL
// function. This utility is for any client-side ID needs.

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-'

export function generateSlug(length = 8): string {
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => CHARS[b & 63]).join('')
}
