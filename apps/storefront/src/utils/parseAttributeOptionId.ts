export function parseAttributeOptionId(rawId: string | number): number | null {
  const match = `${rawId}`.match(/\d+/);
  return match ? Number(match[0]) : null;
}
