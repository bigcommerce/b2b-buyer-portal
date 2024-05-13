export interface AddressExtraFieldType {
  fieldName: string;
  fieldValue: string;
}

export interface AddressItemType {
  id: number;
  createdAt: number;
  updatedAt: number;
  firstName: string;
  lastName: string;
  isShipping?: number;
  isBilling?: number;
  addressLine1: string;
  addressLine2: string;
  address1: string;
  address2: string;
  address: string;
  city: string;
  state: string;
  stateCode: string;
  country: string;
  countryCode: string;
  zipCode: string;
  phoneNumber: string;
  postalCode: string;
  phone: string;
  isActive: number;
  label: string;
  uuid?: string;
  extraFields: AddressExtraFieldType[];
  isDefaultShipping?: number;
  isDefaultBilling?: number;
  bcAddressId?: number;
  company?: string;
  [key: string]: any;
}

export interface BcAddressExtraFieldType {
  name: string;
  value: string;
  addressId: string;
}

export interface BCAddressItemType {
  id: number;
  createdAt: number;
  updatedAt: number;
  firstName: string;
  lastName: string;
  company: string;
  bcAddressId: number;
  address1: string;
  address2: string;
  city: string;
  stateOrProvince: string;
  postalCode: string;
  country: string;
  countryCode: string;
  phone: string;
  isActive: number;
  addressType: string;
  uuid: string;
  formFields: BcAddressExtraFieldType[];
  isDefaultShipping: number;
  isDefaultBilling: number;
}

export interface AddressConfigItem {
  key: string;
  isEnabled: string;
}
