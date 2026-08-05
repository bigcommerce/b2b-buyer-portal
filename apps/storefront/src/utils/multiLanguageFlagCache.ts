/*
  localStorage bridge for the LOCAL-3191.B2B_multi_language feature flag.

  The flag lives in StoreConfig and is only populated (asynchronously, by
  setStorefrontConfig) once App's effect has run. B3StoreContainer dispatches
  getGlobalTranslations from a layout effect well before that, so reading the
  flag from the store at that point resolves to false on every page load: the
  global page would always take the legacy merge branch and phrases the
  merchant deleted would stay in persisted storage forever.

  Caching the resolved value lets the translation thunks read it synchronously.
  On the very first visit nothing is cached and it resolves to false, which is
  harmless: persisted storage is empty then, so merging and replacing produce
  the same result.

  TODO(LOCAL-3191): remove this bridge once the flag is fully rolled out and
  the legacy merge branch in the lang slice is deleted.
*/
const MULTI_LANGUAGE_STORAGE_KEY = 'b2b-multi-language-enabled';

export const setMultiLanguageEnabledCache = (enabled: boolean) => {
  try {
    localStorage.setItem(MULTI_LANGUAGE_STORAGE_KEY, String(enabled));
  } catch {
    // ignore: persistence is best-effort
  }
};

export const getMultiLanguageEnabledCache = (): boolean => {
  try {
    return localStorage.getItem(MULTI_LANGUAGE_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
};
