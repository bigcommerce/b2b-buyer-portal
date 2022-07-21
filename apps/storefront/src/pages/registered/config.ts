import {
  B3Lang,
} from '@b3/lang'

import {
  re,
} from '../../constants'

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
export interface RegisterFields {
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

export type ContactInformationItems = Array<RegisterFields>

export const steps = [
  'intl.user.register.step.account',
  'intl.user.register.step.details',
  'intl.user.register.step.finish',
]

const companyExtraFieldsType = ['text', 'multiline', 'number', 'dropdown']

export const Base64 = {
  encode(str: string | number | boolean) {
    return window.btoa(encodeURIComponent(str))
  },
  decode(str: string) {
    return decodeURIComponent(window.atob(str))
  },
}

export const validatorRules = (validateRuleTypes: string[], options?: ValidateOptions) => (val: string, b3lang: B3Lang) => {
  let str = ''
  validateRuleTypes.forEach((item: string) => {
    if (item === 'email' && val && !re.email.test(val)) {
      str = b3lang('intl.user.register.validatorRules.email')
    }
    if (item === 'phone' && val && !re.phone.test(val)) {
      str = b3lang('intl.user.register.validatorRules.phoneNumber')
    }
    if (item === 'max' && options?.max && +options.max < +val) {
      str = b3lang('intl.user.register.validatorRules.max', {
        max: options.max,
      })
    }

    if (item === 'password' && val && !re.password.test(val)) {
      str = b3lang('intl.user.register.validatorRules.passwords')
    }
  })
  if (str) return str
}

const fieldsType = {
  text: ['text', 'number', 'password',
    'multiline'],
  checkbox: ['checkbox'],
  dropdown: ['dropdown'],
  radio: ['radio'],
  date: ['date'],
}

const classificationType = (item: RegisterFields) => {
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
      optionItems.validate = validatorRules(['max'], {
        max: optionItems?.max,
      })
    }

    if (item.fieldType === 'password') {
      optionItems.validate = validatorRules(['password'])
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

export const conversionDataFormat = (registerArr: Array<RegisterFields>) => {
  const newRegisterArr = registerArr.map((item: RegisterFields) => {
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

    return {
      ...requiredItems,
      ...optionItems,
    }
  })

  return newRegisterArr
}

export const bcContactInformationFields = (b3lang: B3Lang) : ContactInformationItems => [
  {
    name: 'firstName',
    label: b3lang('intl.user.register.registeredAccount.firstName'),
    default: '',
    fieldType: 'text',
    required: true,
    xs: 6,
  },
  {
    name: 'lastName',
    label: b3lang('intl.user.register.registeredAccount.lastName'),
    default: '',
    fieldType: 'text',
    required: true,
    xs: 6,
  },
  {
    name: 'emailAddress',
    label: b3lang('intl.user.register.registeredAccount.emailAddress'),
    default: '',
    fieldType: 'text',
    required: true,
    validate: validatorRules(['email']),
    xs: 12,
  },
  {
    name: 'companyName',
    label: b3lang('intl.user.register.registeredAccount.companyName'),
    default: '',
    fieldType: 'text',
    required: false,
    xs: 12,
  },
  {
    name: 'phoneNumber',
    label: b3lang('intl.user.register.registeredAccount.phoneNumber'),
    default: '',
    fieldType: 'text',
    required: false,
    xs: 12,
  },
]

export const contactInformationFields = (b3lang: B3Lang) : ContactInformationItems => [
  {
    name: 'firstName',
    label: b3lang('intl.user.register.registeredAccount.firstName'),
    default: '',
    fieldType: 'text',
    required: true,
    xs: 6,
  },
  {
    name: 'lastName',
    label: b3lang('intl.user.register.registeredAccount.lastName'),
    default: '',
    fieldType: 'text',
    required: true,
    xs: 6,
  },
  {
    name: 'workEmailAddress',
    label: b3lang('intl.user.register.registeredAccount.workEmailAddress'),
    default: '',
    fieldType: 'text',
    required: true,
    validate: validatorRules(['email']),
    xs: 12,
  },
  {
    name: 'phoneNumber',
    label: b3lang('intl.user.register.registeredAccount.phoneNumber'),
    default: '',
    fieldType: 'text',
    required: false,
    xs: 12,
  },
]

export const companyInformationFields = (b3lang: B3Lang) : ContactInformationItems => [
  {
    name: 'companyName',
    label: b3lang('intl.user.register.label.companyName'),
    default: '',
    fieldType: 'text',
    required: true,
    maxLength: 255,
    xs: 12,
  },
  {
    name: 'companyEmail',
    label: b3lang('intl.user.register.label.companyEmail'),
    default: '',
    fieldType: 'text',
    required: false,
    validate: validatorRules(['email']),
    xs: 12,
  },
  {
    name: 'companyPhoneNumber',
    label: b3lang('intl.user.register.label.companyPhoneNumber'),
    default: '',
    fieldType: 'text',
    required: false,
    validate: validatorRules(['phone']),
    xs: 12,
  },
]

export const companyAttachmentsFields = (b3lang: B3Lang) : ContactInformationItems => [
  {
    name: 'companyAttachments',
    label: b3lang('intl.user.register.label.companyAttachments'),
    default: [],
    fieldType: 'file',
    required: false,
    xs: 12,
    filesLimit: 3,
    maxFileSize: 2097152, // 2M
  },
]

export const addressInformationFields = (b3lang: B3Lang) : ContactInformationItems => [
  {
    name: 'country',
    label: b3lang('intl.user.register.label.country'),
    default: '',
    fieldType: 'dropdown',
    required: false,
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
    label: b3lang('intl.user.register.label.address1'),
    default: '',
    fieldType: 'text',
    maxLength: 255,
    required: false,
    xs: 12,
  },
  {
    name: 'address2',
    label: b3lang('intl.user.register.label.address2'),
    default: '',
    fieldType: 'text',
    maxLength: 255,
    required: false,
    xs: 12,
  },
  {
    name: 'city',
    label: b3lang('intl.user.register.label.city'),
    default: '',
    fieldType: 'text',
    maxLength: 255,
    required: false,
    xs: 12,
  },
  {
    name: 'state',
    label: b3lang('intl.user.register.label.state'),
    default: '',
    fieldType: 'text',
    maxLength: 255,
    required: false,
    xs: 8,
    replaceOptions: {
      label: 'stateName',
      value: 'stateName',
    },
  },
  {
    name: 'zipCode',
    label: b3lang('intl.user.register.label.zipCode'),
    default: '',
    fieldType: 'text',
    maxLength: 255,
    required: false,
    xs: 4,
  },
]

type FieldsRequired = {
  [k: string]: {
    [v: string]: boolean
  }
}

export const addressFieldsRequired: FieldsRequired = {
  account_type_1: {
    country: false,
    address1: false,
    address2: false,
    city: false,
    state: false,
    zipCode: false,
  },
  account_type_2: {
    country: true,
    address1: true,
    address2: false,
    city: true,
    state: true,
    zipCode: true,
  },
}

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
