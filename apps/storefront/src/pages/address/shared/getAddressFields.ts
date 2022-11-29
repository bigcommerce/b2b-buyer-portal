import {
  getB2BCountries,
  getB2BAccountFormFields,
  getB2BAddressExtraFields,
} from '@/shared/service/b2b'

import {
  getAccountFormFields,
} from '../../registered/config'

import {
  b2bAddressFields,
} from './config'

// const addressExtraFieldsType = ['text', 'multiline', 'number', 'dropdown']

const convertExtraFields = (extraFields: any) => {
  if (extraFields.length > 0) {
    const visibleFields = extraFields.filter((field: any) => field.visibleToEnduser)

    const b2bExtraFields = visibleFields.map((field: any) => {
      const fields = {
        ...field,
        groupId: 4,
        visible: field.visibleToEnduser,
      }

      return fields
    })

    const convertB2BExtraFields = getAccountFormFields(b2bExtraFields).address

    convertB2BExtraFields.map((field: any) => {
      field.custom = true

      return field
    })

    return convertB2BExtraFields
  }
}

const getBcAddressFields = async () => {
  let bcAddressFields: Array<any> = []
  try {
    const {
      accountFormFields,
    } = await getB2BAccountFormFields(1)
    const addressFields = accountFormFields.filter((field: any) => field.groupName === 'Address')

    bcAddressFields = getAccountFormFields(addressFields).address
  } catch (e) {
    console.log(e)
  }

  return bcAddressFields
}

const getB2BAddressFields = async () => {
  let addressFields: Array<any> = []

  try {
    const res = await getB2BAddressExtraFields()

    const b2bExtraFields = convertExtraFields(res.addressExtraFields)

    addressFields = [...b2bAddressFields, ...b2bExtraFields]
  } catch (e) {
    console.log(e)
  }

  return addressFields
}

export const getAddressFields = async (isB2BUser: boolean) => {
  let allAddressFields: Array<any> = []

  try {
    const {
      countries,
    } = await getB2BCountries()

    if (isB2BUser) {
      const addressFields = await getB2BAddressFields()
      allAddressFields = addressFields
    } else {
      const bcAddressFields = await getBcAddressFields()
      allAddressFields = bcAddressFields
    }

    allAddressFields.map((field: any) => {
      if (field.name === 'country') {
        field.options = countries
      }

      if (field.name === 'state') {
        field.fieldType = 'text'
      }

      return field
    })
  } catch (e) {
    console.log(e)
  }
  return allAddressFields
}
