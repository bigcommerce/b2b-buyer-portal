export interface AddressExtraFieldType {
  fieldName: string,
  fieldValue: string,
}

export interface AddressItemType {
  id: number,
  createdAt: number,
  updatedAt: number,
  firstName: string
  lastName: string
  isShipping: number
  isBilling: number
  addressLine1: string
  addressLine2: string
  address: string
  city: string
  state: string
  stateCode: string
  country: string
  countryCode: string
  zipCode: string
  phoneNumber: string
  isActive: number,
  label: string
  uuid: string
  extraFields: AddressExtraFieldType[]
  isDefaultShipping: number,
  isDefaultBilling: number,
}
