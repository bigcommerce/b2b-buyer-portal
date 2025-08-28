import b2bLogger from '@/utils/b3Logger';

import { getUsersExtraFieldsInfo, UserExtraFieldsInfoResponse } from './getUsersExtraFieldsInfo';

interface FieldsOptionProps {
  label: string;
  value: string | number;
}

interface FormattedItemsProps {
  [key: string]: string | boolean | number | Array<any> | boolean | undefined;
  name: string;
}

const FIELD_TYPE = {
  0: 'text',
  1: 'multiline',
  2: 'number',
  3: 'dropdown',
} as const;

type UserExtraFields = UserExtraFieldsInfoResponse['data']['userExtraFields'];

const handleConversionExtraItemFormat = (userExtraFields: UserExtraFields) => {
  const formattedUserExtraFields: FormattedItemsProps[] = userExtraFields.map((item) => {
    const { listOfValue } = item;
    const type = FIELD_TYPE[item.fieldType];

    const currentItems: FormattedItemsProps = {
      isExtraFields: true,
      name: item.fieldName,
      label: item.labelName,
      required: item.isRequired,
      default: item.defaultValue || '',
      fieldType: type,
      xs: 12,
      variant: 'filled',
      size: 'small',
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
  });

  return formattedUserExtraFields;
};

const getB2BUserExtraFields = async () => {
  let userExtraFieldsList: FormattedItemsProps[] = [];

  try {
    const { userExtraFields } = await getUsersExtraFieldsInfo();
    const visibleFields = userExtraFields.filter((item) => item.visibleToEnduser);

    const formattedUserExtraFields = handleConversionExtraItemFormat(visibleFields);

    userExtraFieldsList = formattedUserExtraFields;
  } catch (err) {
    b2bLogger.error(err);
  }

  return userExtraFieldsList;
};

export default getB2BUserExtraFields;
