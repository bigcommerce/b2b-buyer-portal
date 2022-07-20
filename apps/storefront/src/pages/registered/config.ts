import { re } from '../../constants'

export interface CustomFieldItems {
  [key: string]: any
}
export interface QuoteConfig {
  [key: string]: string
}

export interface ValidateOptions {
  max?: string | Number,
  min?: string | Number,
  [key: string]: any
}
export interface RegisterFileds {
  name: string,
  label?: string,
  required: Boolean,
  fieldType: string,
  default?: string | Array<any> | number,
  [key: string]: any
}

interface ValidateOptionItems {
  max?: number,
  min?: number,
  [key: string]: any
}

export type ContactInformationItems = Array<RegisterFileds>

export const steps = ['Account', 'Details', 'Finish']

const companyExtraFieldsType = ['text', 'multiline', 'number', 'dropdown']

export const Base64 = {
  encode(str: string | number | boolean) {
    return window.btoa(encodeURIComponent(str))
  },
  decode(str: string) {
    return decodeURIComponent(window.atob(str))
  },
}

export const validatorRules = (val: string, validateRuleTypes: string[], options?: ValidateOptions): any => {
  let str = ''
  validateRuleTypes.forEach((item: string) => {
    if (item === 'email' && !re.email.test(val)) {
      str = 'Please enter the correct email address'
    }
    if (item === 'phone' && !re.phone.test(val)) {
      str = 'Please enter the correct phone number'
    }
    if (item === 'max' && options?.max && +options.max < +val) {
      str = `Please do not exceed ${options.max}`
    }

    if (item === 'password' && !re.password.test(val)) {
      str = 'Passwords must be at least 7 characters and contain both alphabetic and numeric characters.'
    }
  })
  if (str) return str
}

const fieldsType = {
  text: ['text', 'number', 'password', 'multiline'],
  checkbox: ['checkbox'],
  dropdown: ['dropdown'],
  radio: ['radio'],
  date: ['date'],
}

const classificationType = (item: RegisterFileds) => {
  let optionItems: ValidateOptionItems = {}
  if (fieldsType.text.includes(item.fieldType)) {
    optionItems = {
      minlength: item.minlength || null,
      maxLength: item.maxLength || +item.maximumLength || null,
      min: item.min || null,
      max: item.max || +item.maximumValue || null,
      rows: item?.options?.rows || item.numberOfRows || null,
    }
    if (optionItems?.max) {
      optionItems.validate = (v: string) => validatorRules(v, ['max'], { max: optionItems?.max })
    }

    if (item.fieldType === 'password') {
      optionItems.validate = (v: string) => validatorRules(v, ['password'])
    }
  }
  if (fieldsType.checkbox.includes(item.fieldType)) {
    optionItems = {
      default: item.default || [],
      options: item.options?.items || null,
    }
  }
  if (fieldsType.dropdown.includes(item.fieldType)) {
    const items = []
    if (item.options?.helperLabel) {
      items.push({
        label: item.options.helperLabel,
        value: '',
      })
    }
    const options = [...items, ...item.options?.items || []]

    if (item.listOfValue) {
      item.listOfValue.forEach((value: any) => options.push({
        label: value,
        value,
      }))
    }

    optionItems = {
      default: item.default || '',
      options: options || null,
    }
  }
  if (fieldsType.radio.includes(item.fieldType)) {
    optionItems = {
      default: item.default || '',
      options: item.options?.items || [],
    }
  }

  if (optionItems?.options) {
    optionItems?.options.forEach((option: any) => {
      if (option.value) {
        option.value = option.label
      }
    })
  }

  return optionItems
}

export const conversionDataFormat = (registerArr: Array<RegisterFileds>) => {
  const newRegisterArr = registerArr.map((item: RegisterFileds) => {
    const requiredItems = {
      id: item.id || item.fieldName,
      name: item.name || Base64.encode(item.fieldName),
      label: item.label || item.fieldName,
      required: item.required || item.isRequired,
      default: item.default || item.defaultValue || '',
      fieldType: item.fieldType,
      xs: 12,
    }

    if (typeof (item.fieldType) === 'number') {
      item.fieldType = companyExtraFieldsType[item.fieldType]
      requiredItems.fieldType = item.fieldType
    }

    const optionItems = classificationType(item)

    return { ...requiredItems, ...optionItems }
  })

  return newRegisterArr
}

export const bcContactInformationFields:ContactInformationItems = [
  {
    name: 'firstName',
    label: 'First Name',
    default: '',
    fieldType: 'text',
    required: true,
    xs: 6,
  },
  {
    name: 'lastName',
    label: 'Last Name',
    default: '',
    fieldType: 'text',
    required: true,
    xs: 6,
  },
  {
    name: 'emailAddress',
    label: 'Email Address',
    default: '',
    fieldType: 'text',
    required: true,
    validate: (v: string) => validatorRules(v, ['email']),
    xs: 12,
  },
  {
    name: 'companyName',
    label: 'Company Name',
    default: '',
    fieldType: 'text',
    required: false,
    xs: 12,
  },
  {
    name: 'phoneNumber',
    label: 'Phone Number',
    default: '',
    fieldType: 'text',
    required: false,
    xs: 12,
  },
]

export const contactInformationFields: ContactInformationItems = [
  {
    name: 'firstName',
    label: 'First Name',
    default: '',
    fieldType: 'text',
    required: true,
    xs: 6,
  },
  {
    name: 'lastName',
    label: 'Last Name',
    default: '',
    fieldType: 'text',
    required: true,
    xs: 6,
  },
  {
    name: 'workEmailAddress',
    label: 'Work Email Address',
    default: '',
    fieldType: 'text',
    required: true,
    validate: (v: string) => validatorRules(v, ['email']),
    xs: 12,
  },
  {
    name: 'phoneNumber',
    label: 'Phone Number',
    default: '',
    fieldType: 'text',
    required: false,
    xs: 12,
  },
]

export const companyInformationFields: ContactInformationItems = [
  {
    name: 'companyName',
    label: 'Company Name',
    default: '',
    fieldType: 'text',
    required: true,
    maxLength: 255,
    xs: 12,
  },
  {
    name: 'companyEmail',
    label: 'Company Email',
    default: '',
    fieldType: 'text',
    required: true,
    validate: (v: string) => validatorRules(v, ['email']),
    xs: 12,
  },
  {
    name: 'companyPhoneNumber',
    label: 'Company Phone Number',
    default: '',
    fieldType: 'text',
    required: true,
    validate: (v: string) => validatorRules(v, ['phone']),
    xs: 12,
  },
]

export const companyAttachmentsFields: ContactInformationItems = [
  {
    name: 'companyAttachments',
    label: 'Company Attachments',
    default: [],
    fieldType: 'file',
    required: false,
    xs: 12,
    filesLimit: 3,
    maxFileSize: 2097152, // 2M
  },
]

export const addressInformationFields: ContactInformationItems = [
  {
    name: 'country',
    label: 'Country',
    default: '',
    fieldType: 'dropdown',
    required: true,
    maxLength: 255,
    xs: 12,
    options: [],
    replaceOptions: {
      label: 'countryName',
      value: 'countryCode',
    },
  },
  {
    name: 'address1',
    label: 'Address 1',
    default: '',
    fieldType: 'text',
    maxLength: 255,
    required: true,
    xs: 12,
  },
  {
    name: 'address2',
    label: 'Address 2',
    default: '',
    fieldType: 'text',
    maxLength: 255,
    required: true,
    xs: 12,
  },
  {
    name: 'city',
    label: 'City',
    default: '',
    fieldType: 'text',
    maxLength: 255,
    required: true,
    xs: 12,
  },
  {
    name: 'state',
    label: 'State',
    default: '',
    fieldType: 'text',
    maxLength: 255,
    required: true,
    xs: 8,
    replaceOptions: {
      label: 'stateName',
      value: 'stateName',
    },
  },
  {
    name: 'zipCode',
    label: 'Zip Code',
    default: '',
    fieldType: 'text',
    maxLength: 255,
    required: true,
    xs: 4,
  },
]
export interface Country {
  countryCode: string,
  countryName: string,
  id?: string,
  states: []
}
export interface State {
  stateCode: string,
  stateName: string,
  id?: string,
}

export const getRegisterLogo = (quoteConfig:Array<QuoteConfig>): string => {
  const item:Array<QuoteConfig> = quoteConfig.filter((list:QuoteConfig) => list.key === 'quote_logo')

  return item[0].isEnabled
}
