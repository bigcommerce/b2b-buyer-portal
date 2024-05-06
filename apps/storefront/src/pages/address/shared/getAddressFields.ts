import { getB2BAccountFormFields, getB2BAddressExtraFields } from '@/shared/service/b2b';
import b2bLogger from '@/utils/b3Logger';

import {
  AccountFormFieldsItems,
  getAccountFormFields,
  RegisterFieldsItems,
} from '../../registered/config';

import { b2bAddressFields } from './config';

export interface StateProps {
  stateCode: string;
  stateName: string;
}

export interface CountryProps {
  countryCode: string;
  countryName: string;
  id: string | number;
  states: StateProps[];
}
interface B2bExtraFieldsProps {
  defaultValue: string;
  fieldName: string;
  fieldType: string | number;
  isRequired: boolean;
  labelName: string;
  listOfValue: null | Array<string>;
  maximumLength: string | number | null;
  maximumValue: string | number | null;
  numberOfRows: string | number | null;
  visibleToEnduser: boolean;
}

interface ExtraFieldsProp extends RegisterFieldsItems {
  type: string;
  variant: string;
  visible: boolean;
  xs: number;
}

const convertExtraFields = (extraFields: B2bExtraFieldsProps[]): [] | ExtraFieldsProp[] => {
  if (extraFields.length === 0) return [];
  const visibleFields =
    extraFields.filter((field: B2bExtraFieldsProps) => field.visibleToEnduser) || [];

  if (visibleFields?.length === 0) return [];

  const b2bExtraFields = visibleFields.map((field: B2bExtraFieldsProps) => {
    const fields = {
      ...field,
      groupId: 4,
      visible: field.visibleToEnduser,
    };

    return fields;
  });

  const convertB2BExtraFields = getAccountFormFields(b2bExtraFields).address;

  convertB2BExtraFields.map((extraField: ExtraFieldsProp) => {
    const field = extraField;
    field.custom = true;

    return extraField;
  });

  return convertB2BExtraFields;
};

const getBcAddressFields = async () => {
  try {
    const { accountFormFields } = await getB2BAccountFormFields(1);

    const addressFields = accountFormFields.filter(
      (field: AccountFormFieldsItems) => field.groupId === 4,
    );

    const bcAddressFields = getAccountFormFields(addressFields).address;

    return bcAddressFields;
  } catch (e) {
    b2bLogger.error(e);
  }
  return undefined;
};

const getB2BAddressFields = async () => {
  try {
    const res = await getB2BAddressExtraFields();
    const b2bExtraFields = convertExtraFields(res.addressExtraFields);
    const addressFields = [...b2bAddressFields, ...b2bExtraFields];
    return addressFields;
  } catch (e) {
    b2bLogger.error(e);
  }
  return [];
};

export const getAddressFields = async (isB2BUser: boolean, countries: CountryProps) => {
  let allAddressFields: CustomFieldItems[] = [];

  try {
    if (isB2BUser) {
      const addressFields = await getB2BAddressFields();

      if (addressFields) allAddressFields = addressFields;
    } else {
      const bcAddressFields = await getBcAddressFields();
      allAddressFields = bcAddressFields;
    }

    allAddressFields.map((addressField: CustomFieldItems) => {
      const field = addressField;
      if (addressField.name === 'country') {
        field.options = countries;
      }

      if (addressField.name === 'state') {
        field.fieldType = 'text';
      }

      return addressField;
    });

    return allAddressFields;
  } catch (e) {
    b2bLogger.error(e);
  }
  return [];
};
