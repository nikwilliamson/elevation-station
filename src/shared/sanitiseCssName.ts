/** Sanitise a user-entered name into a valid CSS custom-property fragment. */
export function sanitiseCssName(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "") || "unnamed"
}
