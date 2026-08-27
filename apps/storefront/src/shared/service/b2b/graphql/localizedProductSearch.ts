import { getActiveLocale } from '@/lib/lang/getActiveLocale';
import { getStorefrontLanguageCode } from '@/lib/lang/getStorefrontLanguageCode';
import { store } from '@/store';
import b2bLogger from '@/utils/b3Logger';

import { getLocalizedProducts, LocalizedProduct } from '../../bc/graphql/product';

interface OptionValue {
  id: number;
  label: string;
}

interface VariantOptionValue extends OptionValue {
  option_id: number;
  option_display_name: string;
}

/**
 * The localizable subset of a `productsSearch` result. Everything else (pricing, inventory,
 * backorder data) stays as returned by B2B GraphQL.
 */
export interface LocalizableProduct {
  id: number;
  name: string;
  productUrl: string;
  options?: Array<{ option_id: number; display_name: string }>;
  optionsV3?: Array<{ id: number; display_name: string; option_values: OptionValue[] }>;
  modifiers?: unknown[];
  variants?: Array<{ option_values: VariantOptionValue[] }>;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

/**
 * The active locale, or `undefined` when there is nothing to localize — multi-language is disabled,
 * or the shopper is browsing the store's default language, which is what B2B GraphQL already returns.
 */
const getLocaleToLocalize = () => {
  if (!getStorefrontLanguageCode()) {
    return undefined;
  }

  const activeLocale = getActiveLocale(store.getState().global.locales);

  return activeLocale && !activeLocale.isDefault ? activeLocale : undefined;
};

/**
 * Storefront GraphQL returns `path` without the locale subfolder, so the subfolder of the active
 * locale is re-applied to keep product links inside the shopper's language.
 */
const withLocaleSubfolder = (path: string, localeFullPath: string) => {
  let subfolder: string;

  try {
    subfolder = new URL(localeFullPath).pathname;
  } catch {
    return path;
  }

  if (subfolder === '/' || path.startsWith(subfolder)) {
    return path;
  }

  return `${subfolder.replace(/\/$/, '')}${path}`;
};

const localizeOptionsV3 = (
  optionsV3: LocalizableProduct['optionsV3'],
  optionNames: Map<number, string>,
  optionValueLabels: Map<number, string>,
) =>
  optionsV3?.map((option) => ({
    ...option,
    display_name: optionNames.get(option.id) ?? option.display_name,
    option_values: option.option_values?.map((value) => ({
      ...value,
      label: optionValueLabels.get(value.id) ?? value.label,
    })),
  }));

/**
 * Modifiers share the shape of `optionsV3`, but are typed as `unknown[]` by the search response, so
 * each entry is localized defensively.
 */
const localizeModifiers = (
  modifiers: unknown[] | undefined,
  optionNames: Map<number, string>,
  optionValueLabels: Map<number, string>,
) =>
  modifiers?.map((modifier) => {
    if (!isRecord(modifier) || typeof modifier.id !== 'number') {
      return modifier;
    }

    const displayName = optionNames.get(modifier.id);
    const optionValues = Array.isArray(modifier.option_values)
      ? modifier.option_values.map((value: unknown) => {
          if (!isRecord(value) || typeof value.id !== 'number') {
            return value;
          }

          return { ...value, label: optionValueLabels.get(value.id) ?? value.label };
        })
      : modifier.option_values;

    return {
      ...modifier,
      display_name: displayName ?? modifier.display_name,
      option_values: optionValues,
    };
  });

const localizeProduct = <T extends LocalizableProduct>(
  product: T,
  localized: LocalizedProduct,
  localeFullPath: string,
): T => {
  const optionNames = new Map<number, string>();
  const optionValueLabels = new Map<number, string>();

  localized.options.forEach((option) => {
    optionNames.set(option.entityId, option.displayName);
    option.values.forEach((value) => optionValueLabels.set(value.entityId, value.label));
  });

  return {
    ...product,
    name: localized.name || product.name,
    productUrl: localized.path
      ? withLocaleSubfolder(localized.path, localeFullPath)
      : product.productUrl,
    options: product.options?.map((option) => ({
      ...option,
      display_name: optionNames.get(option.option_id) ?? option.display_name,
    })),
    optionsV3: localizeOptionsV3(product.optionsV3, optionNames, optionValueLabels),
    modifiers: localizeModifiers(product.modifiers, optionNames, optionValueLabels),
    variants: product.variants?.map((variant) => ({
      ...variant,
      option_values: variant.option_values?.map((value) => ({
        ...value,
        label: optionValueLabels.get(value.id) ?? value.label,
        option_display_name: optionNames.get(value.option_id) ?? value.option_display_name,
      })),
    })),
  };
};

/**
 * Replaces the translatable text of B2B `productsSearch` results with the shopper's language, which
 * only the storefront GraphQL API resolves. Commerce data is left untouched, and any failure falls
 * back to the untranslated results rather than breaking product search.
 */
export const localizeProductSearchResults = async <T extends LocalizableProduct>(
  products: T[],
): Promise<T[]> => {
  const locale = getLocaleToLocalize();

  if (!locale || products.length === 0) {
    return products;
  }

  try {
    const localizedProducts = await getLocalizedProducts(products.map(({ id }) => Number(id)));
    const localizedById = new Map(localizedProducts.map((product) => [product.entityId, product]));

    return products.map((product) => {
      const localized = localizedById.get(Number(product.id));

      return localized ? localizeProduct(product, localized, locale.fullPath) : product;
    });
  } catch (error) {
    b2bLogger.error(error);

    return products;
  }
};
