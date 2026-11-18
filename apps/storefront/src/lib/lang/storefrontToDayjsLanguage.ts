// Storefront language codes that differ from the dayjs locale name.
export const STOREFRONT_TO_DAYJS_LANGUAGE: Record<string, string> = {
  no: 'nb',
};

export const DAYJS_TO_STOREFRONT_LANGUAGE: Record<string, string> = Object.fromEntries(
  Object.entries(STOREFRONT_TO_DAYJS_LANGUAGE).map(([storefront, dayjs]) => [dayjs, storefront]),
);
