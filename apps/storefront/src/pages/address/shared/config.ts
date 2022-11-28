import {
  AddressItemType,
  BCAddressItemType,
} from '../../../types/address'

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
  },
]

export const convertBCToB2BAddress : (data: BCAddressItemType) => AddressItemType = (data) => {
  const extraFields = (data.extraFields || []).map((item) => ({
    fieldName: item.name,
    fieldValue: item.value,
  }))

  return {
    id: data.id,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    firstName: data.firstName,
    lastName: data.lastName,
    addressLine1: data.address1,
    addressLine2: data.address2 || '',
    address: '',
    city: data.city,
    state: data.stateOrProvince,
    stateCode: '',
    country: data.country,
    countryCode: data.countryCode,
    zipCode: data.postalCode,
    phoneNumber: data.phone,
    isActive: 1,
    label: '',
    extraFields,
    company: data.company,
    bcAddressId: data.bcAddressId,
  }
}
