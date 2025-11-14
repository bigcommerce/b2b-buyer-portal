import { openPageByClick, removeBCMenus } from './b3AccountItem';
import currencyFormat, {
  currencyFormatConvert,
  currencyFormatInfo,
  handleGetCorrespondingCurrency,
  ordersCurrencyFormat,
} from './b3CurrencyFormat';
import { displayExtendedFormat, displayFormat, getUTCTimestamp } from './b3DateFormat';
import { getLineNumber } from './b3GetTextLenPX';
import handleHideRegisterPage from './b3HideRegister';
import { getQuoteEnabled } from './b3Init';
import distanceDay from './b3Picker';
import { getProductPriceIncTaxOrExTaxBySetting } from './b3Price';
import b2bPrintInvoice from './b3PrintInvoice';
import { serialize } from './b3Serialize';
import { B3LStorage, B3SStorage } from './b3Storage';
import { globalSnackbar, snackbar } from './b3Tip';
import { getActiveCurrencyInfo, handleGetCorrespondingCurrencyToken } from './currencyUtils';
import { forwardRefWithGenerics } from './forwardRefWithGenerics';
import {
  convertArrayToGraphql,
  convertObjectOrArrayKeysToCamel,
  convertObjectOrArrayKeysToSnake,
  convertObjectToGraphql,
} from './graphqlDataConvert';
import { memoWithGenerics } from './memoWithGenerics';
import ValidationError from './validationError';
import { validatorRules } from './validatorRules';

export * from './basicConfig';

export { loginJump } from './b3Login';

// TODO: Clean this up
export { default as hideStorefrontElement } from './b3HideStorefrontElement';

export * from './b3Company';

export { isKeyOf } from './isKeyOf';

export {
  b2bPrintInvoice,
  B3LStorage,
  B3SStorage,
  convertArrayToGraphql,
  convertObjectToGraphql,
  convertObjectOrArrayKeysToCamel,
  convertObjectOrArrayKeysToSnake,
  currencyFormat,
  currencyFormatConvert,
  currencyFormatInfo,
  displayExtendedFormat,
  displayFormat,
  distanceDay,
  getActiveCurrencyInfo,
  getLineNumber,
  getProductPriceIncTaxOrExTaxBySetting,
  getQuoteEnabled,
  getUTCTimestamp,
  globalSnackbar,
  handleGetCorrespondingCurrency,
  handleHideRegisterPage,
  openPageByClick,
  ordersCurrencyFormat,
  removeBCMenus,
  serialize,
  snackbar,
  validatorRules,
  ValidationError,
  handleGetCorrespondingCurrencyToken,
  forwardRefWithGenerics,
  memoWithGenerics,
};
