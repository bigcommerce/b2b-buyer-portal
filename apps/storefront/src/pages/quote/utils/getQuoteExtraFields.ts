import { getQuoteExtraFieldsConfig } from '@/shared/service/b2b';
import { B2bExtraFieldsProps, FieldsOptionProps, FormattedItemsProps } from '@/types/quotes';
import b2bLogger from '@/utils/b3Logger';

const FIELD_TYPE = {
  0: 'text',
  1: 'multiline',
  2: 'number',
  3: 'dropdown',
};

const handleConversionExtraItemFormat = (quoteExtraFields: B2bExtraFieldsProps[]) => {
  const formattedQuoteExtraFields: FormattedItemsProps[] = quoteExtraFields.map(
    (item: B2bExtraFieldsProps) => {
      const { listOfValue } = item;
      const type = FIELD_TYPE[item.fieldType];

      const currentItems: FormattedItemsProps = {
        isExtraFields: true,
        name: item.fieldName,
        label: item.labelName,
        required: item.isRequired,
        default: item.defaultValue || '',
        fieldType: type,
        xs: 6,
        variant: 'filled',
        size: 'small',
        id: item.id,
      };

      switch (type) {
        case 'dropdown':
          if (listOfValue) {
            const options: FieldsOptionProps[] = listOfValue?.map((option: string) => ({
              label: option,
              value: option,
            }));

            if (options.length > 0) {
              currentItems.options = options;
            }
          }

          break;
        case 'number':
          currentItems.max = item.maximumValue || '';
          break;
        case 'multiline':
          currentItems.rows = item.numberOfRows || '';
          break;
        default:
          currentItems.maxLength = item.maximumLength || '';
          break;
      }

      return currentItems;
    },
  );

  return formattedQuoteExtraFields;
};

const getB2BQuoteExtraFields = async () => {
  let quoteExtraFieldsList: FormattedItemsProps[] = [];
  try {
    const { quoteExtraFieldsConfig } = await getQuoteExtraFieldsConfig();

    const visibleFields = quoteExtraFieldsConfig.filter(
      (item: B2bExtraFieldsProps) => item.visibleToEnduser,
    );

    const formattedQuoteExtraFields = handleConversionExtraItemFormat(visibleFields);

    quoteExtraFieldsList = formattedQuoteExtraFields;
  } catch (err) {
    b2bLogger.error(err);
  }

  return quoteExtraFieldsList;
};

export default getB2BQuoteExtraFields;
