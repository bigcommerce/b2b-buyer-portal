import { LangFormatFunction } from '@b3/lang';

import { re } from '../constants';

export interface ValidateOptions extends Record<string, any> {
  max?: string | number;
  min?: string | number;
}

export const validatorRules =
  (validateRuleTypes: string[], options?: ValidateOptions) =>
  (val: string, b3lang: LangFormatFunction) => {
    let str = '';
    validateRuleTypes.forEach((item: string) => {
      if (item === 'email' && val && !re.email.test(val)) {
        str = b3lang('global.validatorRules.email');
      } else if (val.length >= 200) {
        str = b3lang('global.emailValidate.emailLength');
      }

      if (item === 'phone' && val && !re.phone.test(val)) {
        str = b3lang('global.validatorRules.phoneNumber');
      }
      if (item === 'number' && val && !re.number.test(val)) {
        str = b3lang('global.validatorRules.number');
      }
      if (item === 'max' && options?.max && Number(options.max) < Number(val)) {
        str = b3lang('global.validatorRules.max', {
          max: options.max,
        });
      }

      if (item === 'password' && val && !re.password.test(val)) {
        str = b3lang('global.validatorRules.passwords');
      }
    });
    return str || undefined;
  };
