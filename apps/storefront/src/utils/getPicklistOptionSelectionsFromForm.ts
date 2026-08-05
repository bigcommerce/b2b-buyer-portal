import type { FieldValues } from 'react-hook-form';

import { getOptionRequestData } from '@/utils/b3Product/shared/config';
import { parseAttributeOptionId } from '@/utils/parseAttributeOptionId';

export function getPicklistOptionSelectionsFromForm(
  formFields: Record<string, unknown>[],
  formValues: FieldValues,
): Array<{ option_id: number; value_id: number }> {
  const optionsData = getOptionRequestData(formFields, {}, formValues);

  return Object.entries(optionsData).flatMap(([optionId, optionValue]) => {
    const parsedOptionId = parseAttributeOptionId(optionId);
    if (parsedOptionId === null) {
      return [];
    }

    return [{ option_id: parsedOptionId, value_id: Number(optionValue) }];
  });
}
