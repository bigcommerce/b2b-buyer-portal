// Draft-quote / catalog option keys carry the modifier id shaped like "attribute[123]".
export function parseAttributeOptionId(rawId: string | number): number | null {
  const match = `${rawId}`.match(/\d+/);
  return match ? Number(match[0]) : null;
}
