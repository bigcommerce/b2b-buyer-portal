import { searchB2BProducts } from '@/shared/service/b2b';
import { store } from '@/store';

import { conversionProductsList } from './b3Product/shared/config';

export const handleGetCurrentProductInfo = async (productId: number | string) => {
  const currentState = store.getState();
  const { customerGroupId } = currentState.company.customer;
  const { id: salesRepCompanyId } = currentState.b2bFeatures.masqueradeCompany;
  const { id: companyInfoId } = currentState.company.companyInfo;
  const companyId = companyInfoId || salesRepCompanyId;

  const { productsSearch } = await searchB2BProducts({
    productIds: [+productId],
    companyId,
    customerGroupId,
  });

  const currentProductInfo = conversionProductsList(productsSearch);

  return currentProductInfo;
};

export const isModifierMultiLineTextValid = (option: any, optionVal: any) => {
  let isOptionValid = true;
  let errMsg = '';

  const {
    display_name: displayName,
    config: { text_max_length: maxLength, text_max_lines: maxLines, text_min_length: minLength },
  } = option;
  const valueArrOrigin = optionVal.includes('\n') ? optionVal.split('\n') : [optionVal];
  const mulValue: any = [];

  valueArrOrigin.forEach((value: string, index: number) => {
    if (index !== valueArrOrigin.length - 1) {
      mulValue.push(value);
    }

    if (index === valueArrOrigin.length - 1 && value.length > 0) {
      mulValue.push(value);
    }
  });

  const mulValueLength = mulValue.join('').length;

  if (maxLength) {
    if (mulValueLength > maxLength) {
      isOptionValid = false;

      errMsg = `The max length of ${displayName} is ${maxLength}.`;
    }
  }
  if (minLength) {
    if (mulValueLength < minLength) {
      isOptionValid = false;

      errMsg = `The min length of ${displayName} is ${minLength}.`;
    }
  }

  if (maxLines) {
    if (mulValue.length > maxLines) {
      isOptionValid = false;

      errMsg = `The max line of ${displayName} is ${maxLines}.`;
    }
  }

  return {
    isOptionValid,
    errMsg,
  };
};

export const isModifierTextValid = (option: any, optionVal: any) => {
  let isOptionValid = true;
  let errMsg = '';

  const {
    config: { text_max_length: maxLength, text_min_length: minLength },
    display_name: displayName,
  } = option;

  if (maxLength) {
    if (optionVal.length > maxLength) {
      isOptionValid = false;

      errMsg = `The max length of ${displayName} is ${maxLength}.`;
    }
  }

  if (minLength) {
    if (optionVal.length < minLength) {
      isOptionValid = false;

      errMsg = `The min length of ${displayName} is ${minLength}.`;
    }
  }

  return {
    isOptionValid,
    errMsg,
  };
};

export const isModifierNumberTextValid = (option: any, optionVal: any) => {
  let isOptionValid = true;
  let errMsg = '';
  const {
    config: {
      number_highest_value: highest,
      number_lowest_value: lowest,
      number_integers_only: integerOnly,
    },
    display_name: displayName,
  } = option;

  if (typeof +optionVal !== 'number') {
    isOptionValid = false;
    errMsg = `Please enter a valid number in ${displayName}.`;

    return {
      isOptionValid,
      errMsg,
    };
  }

  if (integerOnly && optionVal.includes('.')) {
    isOptionValid = false;
    errMsg = `Please enter an integer number in ${displayName}.`;

    return {
      isOptionValid,
      errMsg,
    };
  }

  if (optionVal !== '' && !Number.isNaN(+optionVal)) {
    if (lowest && +optionVal < lowest) {
      isOptionValid = false;
      errMsg = `The lowest value of ${displayName} is ${lowest}.`;
    }

    if (highest && +optionVal > highest) {
      isOptionValid = false;
      errMsg = `The highest value of ${displayName} is ${highest}.`;
    }
  }

  return {
    isOptionValid,
    errMsg,
  };
};

export const isAllRequiredOptionFilled = (bcOriginalOptions: any, optionList: any): any => {
  if (bcOriginalOptions.length === 0) {
    return {
      isValid: true,
      message: '',
    };
  }
  const requiredOptions = bcOriginalOptions.filter(({ required }: any) => !!required);

  const isRequiredValid = requiredOptions.every(({ id, noValue, type }: any) => {
    const { optionValue } =
      optionList.find(({ optionId }: any) => `attribute[${id}]` === optionId) ?? {};

    if (type === 'checkbox') return !!optionValue;

    return optionValue && +optionValue !== +noValue;
  });

  if (!isRequiredValid) {
    const errorMessage = 'Please fill out product options first.';
    return {
      isValid: false,
      message: errorMessage,
    };
  }

  const VALIDATION_MAP: {
    textarea: (option: any, optionValue: any) => { isOptionValid: boolean; errMsg: string };
    inputText: (option: any, optionValue: any) => { isOptionValid: boolean; errMsg: string };
    inputNumbers: (option: any, optionValue: any) => { isOptionValid: boolean; errMsg?: string };
  } = {
    textarea: isModifierMultiLineTextValid,
    inputText: isModifierTextValid,
    inputNumbers: isModifierNumberTextValid,
  };

  for (let i = 0; i < bcOriginalOptions.length; i += 1) {
    const option = bcOriginalOptions[i];
    const {
      partial,
      type,
      id,
    }: {
      partial: string;
      type: string;
      id: string | number;
    } = option;

    if (['multi_line_text', 'numbers_only_text', 'text'].includes(type)) {
      let validationFuc: any = VALIDATION_MAP.textarea;
      if (type !== 'multi_line_text') {
        validationFuc =
          partial === 'numbers_only_text' ? VALIDATION_MAP.inputNumbers : VALIDATION_MAP.inputText;
      }

      const { optionValue } = optionList.find(({ optionId }: any) => optionId.includes(id)) ?? {};

      const { isOptionValid, errMsg }: any = validationFuc(option, optionValue);
      if (!isOptionValid) {
        return {
          isValid: false,
          message: errMsg,
        };
      }
    }
  }

  return {
    isValid: true,
    message: '',
  };
};

export const getProductOptionList = (optionMap: any) => {
  const optionList: any = [];
  Object.keys(optionMap).forEach((item) => {
    if (item.includes('attribute') && item.match(/\[([0-9]+)\]/g)) {
      optionList.push({
        optionId: item,
        optionValue: optionMap[item],
      });
    }
  });

  return optionList;
};
