export function getIsStateRequired(
  country: { stateRequired?: boolean } | undefined,
  stateList: { length: number } | null | undefined,
): boolean {
  return typeof country?.stateRequired === 'boolean'
    ? country.stateRequired
    : (stateList?.length ?? 0) > 0;
}
