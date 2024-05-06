import { AddressItemType, BCAddressItemType } from '../../../types/address';

export interface B2bShippingBillingChildProps {
  name: string;
  label: string;
  default: string;
  parent: string;
  idLang: string;
}
export interface B2bShippingBillingProps {
  name: string;
  label: string;
  default: string;
  child: B2bShippingBillingChildProps;
  idLang: string;
}

export const filterFormConfig = [
  {
    name: 'city',
    label: 'City',
    required: false,
    default: '',
    fieldType: 'text',
    xs: 12,
    variant: 'filled',
    size: 'small',
    idLang: 'addresses.filter.city',
  },
  {
    name: 'state',
    label: 'State',
    required: false,
    default: '',
    fieldType: 'text',
    xs: 12,
    variant: 'filled',
    size: 'small',
    idLang: 'addresses.filter.state',
  },
  {
    name: 'country',
    label: 'Country',
    required: false,
    default: '',
    fieldType: 'text',
    xs: 12,
    variant: 'filled',
    size: 'small',
    idLang: 'addresses.filter.country',
  },
];

export const b2bShippingBilling = [
  {
    name: 'isShipping',
    label: 'Shipping',
    default: '',
    idLang: 'addresses.editAddress.shipping',
    child: {
      name: 'isDefaultShipping',
      label: 'Default Shipping Address',
      default: '',
      parent: 'isShipping',
      idLang: 'addresses.editAddress.defaultShippingAddress',
    },
  },
  {
    name: 'isBilling',
    label: 'Billing',
    default: '',
    idLang: 'addresses.editAddress.billing',
    child: {
      name: 'isDefaultBilling',
      label: 'Default Billing Address',
      default: '',
      parent: 'isBilling',
      idLang: 'addresses.editAddress.defaultBillingAddress',
    },
  },
];

export const b2bAddressFields = [
  {
    name: 'label',
    label: 'Address label',
    required: false,
    fieldType: 'text',
    xs: 12,
    default: '',
    variant: 'filled',
    size: 'small',
    idLang: 'addresses.editAddress.addressLabel',
  },
  {
    name: 'firstName',
    label: 'First name',
    required: true,
    default: '',
    fieldType: 'text',
    xs: 6,
    variant: 'filled',
    size: 'small',
    idLang: 'addresses.editAddress.firstName',
  },
  {
    name: 'lastName',
    label: 'Last name',
    required: true,
    fieldType: 'text',
    xs: 6,
    default: '',
    variant: 'filled',
    size: 'small',
    idLang: 'addresses.editAddress.lastName',
  },
  {
    name: 'company',
    label: 'Company',
    required: false,
    fieldType: 'text',
    xs: 12,
    default: '',
    variant: 'filled',
    size: 'small',
    idLang: 'addresses.editAddress.company',
  },
  {
    name: 'country',
    label: 'Country',
    required: true,
    fieldType: 'dropdown',
    xs: 12,
    default: '',
    variant: 'filled',
    size: 'small',
    replaceOptions: {
      label: 'countryName',
      value: 'countryCode',
    },
    options: [],
    idLang: 'addresses.editAddress.country',
  },
  {
    name: 'addressLine1',
    label: 'Address line 1',
    required: true,
    fieldType: 'text',
    xs: 12,
    default: '',
    variant: 'filled',
    size: 'small',
    idLang: 'addresses.editAddress.addressLine1',
  },
  {
    name: 'addressLine2',
    label: 'Address line 2',
    required: false,
    fieldType: 'text',
    xs: 12,
    default: '',
    variant: 'filled',
    size: 'small',
    idLang: 'addresses.editAddress.addressLine2',
  },
  {
    name: 'city',
    label: 'City',
    required: true,
    fieldType: 'text',
    xs: 12,
    default: '',
    variant: 'filled',
    size: 'small',
    idLang: 'addresses.editAddress.city',
  },
  {
    name: 'state',
    label: 'State',
    required: true,
    fieldType: 'text',
    xs: 8,
    default: '',
    variant: 'filled',
    size: 'small',
    replaceOptions: {
      label: 'stateName',
      value: 'stateCode',
    },
    idLang: 'addresses.editAddress.state',
  },
  {
    name: 'zipCode',
    label: 'ZIP code',
    required: true,
    fieldType: 'text',
    xs: 4,
    default: '',
    variant: 'filled',
    size: 'small',
    idLang: 'addresses.editAddress.zipCode',
  },
  {
    name: 'phoneNumber',
    label: 'Phone number',
    required: false,
    fieldType: 'text',
    xs: 12,
    default: '',
    variant: 'filled',
    size: 'small',
    idLang: 'addresses.editAddress.phoneNumber',
  },
];

export const convertBCToB2BAddress: (data: BCAddressItemType) => AddressItemType = (data) => {
  const extraFields = (data.formFields || []).map((item) => ({
    fieldName: item.name,
    fieldValue: item.value,
  }));

  return {
    id: data.id,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    firstName: data.firstName,
    lastName: data.lastName,
    addressLine1: data.address1,
    addressLine2: data.address2 || '',
    address1: data.address1,
    address2: data.address2 || '',
    address: '',
    city: data.city,
    state: data.stateOrProvince,
    stateCode: '',
    country: data.country,
    countryCode: data.countryCode,
    zipCode: data.postalCode,
    postalCode: data.postalCode,
    phoneNumber: data.phone,
    phone: data.phone,
    isActive: 1,
    label: '',
    extraFields,
    company: data.company,
    bcAddressId: data.bcAddressId,
  };
};
