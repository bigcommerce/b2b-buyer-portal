import {
  getB2BAccountFormFields,
  getB2BAddressExtraFields,
} from '@/shared/service/b2b'

import {
  AccountFormFieldsItems,
  getAccountFormFields,
  RegisterFieldsItems,
} from '../../registered/config'

import { b2bAddressFields } from './config'

// const addressExtraFieldsType = ['text', 'multiline', 'number', 'dropdown']

export interface StateProps {
  stateCode: string
  stateName: string
}

export interface CountryProps {
  countryCode: string
  countryName: string
  id: string | number
  states: StateProps[]
}
interface B2bExtraFieldsProps {
  defaultValue: string
  fieldName: string
  fieldType: string | number
  isRequired: boolean
  labelName: string
  listOfValue: null | Array<string>
  maximumLength: string | number | null
  maximumValue: string | number | null
  numberOfRows: string | number | null
  visibleToEnduser: boolean
}

interface ExtraFieldsProp extends RegisterFieldsItems {
  type: string
  variant: string
  visible: boolean
  xs: number
}

// interface B2bExtraFields {
//   name: string;
//   label: string;
//   required: boolean;
//   fieldType: string,
//   xs: number,
//   default: string | number | null,
//   variant: string,
//   size?: string,
//   bcLabel?: string,
//   custom?: boolean,
//   fieldId?: string | null,
//   groupId?: number,
//   groupName?: string,
//   id?: string,
//   max?: string | number | null,
//   maxLength?: string | number | null,
//   min?: string | number | null,
//   minlength?: string | number | null,
//   rows?: string | number | null,
//   type?: string | null,
//   visible?: boolean,
//   replaceOptions?: {
//     [k: string]: string
//   },
//   options?: {
//     [k: string]: any
//   }
// }

const convertExtraFields = (
  extraFields: B2bExtraFieldsProps[]
): [] | ExtraFieldsProp[] => {
  if (extraFields.length === 0) return []
  const visibleFields =
    extraFields.filter(
      (field: B2bExtraFieldsProps) => field.visibleToEnduser
    ) || []

  if (visibleFields?.length === 0) return []

  const b2bExtraFields = visibleFields.map((field: B2bExtraFieldsProps) => {
    const fields = {
      ...field,
      groupId: 4,
      visible: field.visibleToEnduser,
    }

    return fields
  })

  const convertB2BExtraFields = getAccountFormFields(b2bExtraFields).address

  convertB2BExtraFields.map((field: ExtraFieldsProp) => {
    field.custom = true

    return field
  })

  return convertB2BExtraFields
}

const getBcAddressFields = async () => {
  try {
    const { accountFormFields } = await getB2BAccountFormFields(1)

    const addressFields = accountFormFields.filter(
      (field: AccountFormFieldsItems) => field.groupName === 'Address'
    )

    const bcAddressFields = getAccountFormFields(addressFields).address

    return bcAddressFields
  } catch (e) {
    console.log(e)
  }
  return undefined
}

const getB2BAddressFields = async () => {
  try {
    const res = await getB2BAddressExtraFields()
    const b2bExtraFields = convertExtraFields(res.addressExtraFields)
    const addressFields = [...b2bAddressFields, ...b2bExtraFields]
    return addressFields
  } catch (e) {
    console.log(e)
  }
  return []
}

export const getAddressFields = async (
  isB2BUser: boolean,
  countries: CountryProps
) => {
  let allAddressFields: CustomFieldItems[] = []

  try {
    if (isB2BUser) {
      const addressFields = await getB2BAddressFields()

      if (addressFields) allAddressFields = addressFields
    } else {
      const bcAddressFields = await getBcAddressFields()
      allAddressFields = bcAddressFields
    }

    allAddressFields.map((field: CustomFieldItems) => {
      if (field.name === 'country') {
        field.options = countries
      }

      if (field.name === 'state') {
        field.fieldType = 'text'
      }

      return field
    })

    return allAddressFields
  } catch (e) {
    console.log(e)
  }
  return []
}
