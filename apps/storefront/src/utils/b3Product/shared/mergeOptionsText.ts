import { ProductItemOption } from '@/types/common';

interface TranslatableOption {
  id?: number | string;
  type?: string;
  display_name?: string;
  config?: { checkbox_label?: string };
  option_values?: { id?: number; label?: string }[];
}

/**
 * Takes the translated text from `localized` and puts it on the matching option of `stored`.
 * Options are matched by id. The stored list decides which options exist, their order, whether
 * they are required, their defaults and their values, so a refreshed search result can never add,
 * remove or reconfigure an option. Checkbox values keep their stored label because the value that
 * counts as checked is found by the label "Yes".
 */
export const mergeOptionsText = <T extends TranslatableOption>(
  stored: T[] = [],
  localized: T[] = [],
): T[] =>
  stored.map((option) => {
    if (option.id === undefined) return option;

    const fresh = localized.find(({ id }) => String(id) === String(option.id));

    if (!fresh) return option;

    const { config, option_values: optionValues } = option;
    const checkboxLabel = fresh.config?.checkbox_label;

    // The spread only replaces text fields of T, so the result is still a T.
    return {
      ...option,
      display_name: fresh.display_name ?? option.display_name,
      ...(config && checkboxLabel !== undefined
        ? { config: { ...config, checkbox_label: checkboxLabel } }
        : {}),
      ...(optionValues && option.type !== 'checkbox'
        ? {
            option_values: optionValues.map((value) => {
              const label = fresh.option_values?.find(({ id }) => id === value.id)?.label;

              return label === undefined ? value : { ...value, label };
            }),
          }
        : {}),
    } as T;
  });

/** The legacy `options` list only carries a display name per option. */
export const mergeLegacyOptionsText = (
  stored: ProductItemOption[] = [],
  localized: ProductItemOption[] = [],
): ProductItemOption[] =>
  stored.map((option) => {
    const fresh = localized.find(({ option_id: id }) => id === option.option_id);

    return fresh ? { ...option, display_name: fresh.display_name } : option;
  });
