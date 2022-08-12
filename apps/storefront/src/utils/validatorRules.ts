import {
  B3Lang,
} from '@b3/lang'

import {
  re,
} from '../constants'

export interface ValidateOptions extends Record<string, any> {
  max?: string | Number,
  min?: string | Number,
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
    if (item === 'number' && val && !re.number.test(val)) {
      str = b3lang('intl.user.register.validatorRules.number')
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
