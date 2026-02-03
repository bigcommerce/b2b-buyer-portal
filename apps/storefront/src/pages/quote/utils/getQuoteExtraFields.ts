import { getQuoteExtraFieldsConfig } from '@/shared/service/b2b';
import { QuoteExtraFieldsOrigin, QuoteFormattedItemsProps } from '@/types/quotes';
import b2bLogger from '@/utils/b3Logger';

const handleConversionExtraItemFormat = (quoteExtraFields: QuoteExtraFieldsOrigin[]) => {
  const formattedQuoteExtraFields = quoteExtraFields.map((item) => {
    const { listOfValue } = item;

    const currentItems: QuoteFormattedItemsProps = {
      isExtraFields: true,
      name: item.fieldName || '',
      label: item.labelName || '',
      required: item.isRequired,
      default: item.defaultValue || '',
      fieldType: item.fieldCategory || '',
      xs: 6,
      variant: 'filled',
      size: 'small',
      id: item.id,
    };

    switch (item.fieldCategory) {
      case 'dropdown':
        if (listOfValue) {
          const options = listOfValue.map((option) => ({
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
  });

  return formattedQuoteExtraFields;
};

const getB2BQuoteExtraFields = async () => {
  let quoteExtraFieldsList: QuoteFormattedItemsProps[] = [];

  try {
    const { quoteExtraFieldsConfig } = await getQuoteExtraFieldsConfig();

    const visibleFields = quoteExtraFieldsConfig.filter((item) => item.visibleToEnduser);

    const formattedQuoteExtraFields = handleConversionExtraItemFormat(visibleFields);

    quoteExtraFieldsList = formattedQuoteExtraFields;
  } catch (err) {
    b2bLogger.error(err);
  }

  return quoteExtraFieldsList;
};

export default getB2BQuoteExtraFields;
