import { openPageByClick, redirectBcMenus, removeBCMenus } from './b3AccountItem';
import {
  checkEveryPermissionsCode,
  checkOneOfPermissionsCode,
  checkPermissionCode,
} from './b3CheckPermissions';
import currencyFormat, {
  currencyFormatConvert,
  currencyFormatInfo,
  handleGetCorrespondingCurrency,
  ordersCurrencyFormat,
} from './b3CurrencyFormat';
import { displayExtendedFormat, displayFormat, getUTCTimestamp } from './b3DateFormat';
import { getLineNumber, getTextLenPX } from './b3GetTextLenPX';
import handleHideRegisterPage from './b3HideRegister';
import { getLogo, getQuoteEnabled } from './b3Init';
import { showPageMask } from './b3PageMask';
import distanceDay from './b3Picker';
import getProductPriceIncTax from './b3Price';
import b2bPrintInvoice from './b3PrintInvoice';
import { setCartPermissions } from './b3RolePermissions';
import { serialize } from './b3Serialize';
import { B3LStorage, B3SStorage } from './b3Storage';
import { globalSnackbar, snackbar } from './b3Tip';
import {
  getActiveCurrencyInfo,
  getDefaultCurrencyInfo,
  handleGetCorrespondingCurrencyToken,
} from './currencyUtils';
import { convertArrayToGraphql, convertObjectToGraphql } from './graphqlDataConvert';
import { validatorRules } from './validatorRules';

export * from './basicConfig';

export { loginJump } from './b3Login';

// TODO: Clean this up
export { default as hideStorefrontElement } from './b3HideStorefrontElement';

export {
  b2bPrintInvoice,
  B3LStorage,
  B3SStorage,
  checkEveryPermissionsCode,
  checkOneOfPermissionsCode,
  checkPermissionCode,
  convertArrayToGraphql,
  convertObjectToGraphql,
  currencyFormat,
  currencyFormatConvert,
  currencyFormatInfo,
  displayExtendedFormat,
  displayFormat,
  distanceDay,
  getActiveCurrencyInfo,
  getDefaultCurrencyInfo,
  getLineNumber,
  getLogo,
  getProductPriceIncTax,
  getQuoteEnabled,
  getTextLenPX,
  getUTCTimestamp,
  globalSnackbar,
  handleGetCorrespondingCurrency,
  handleHideRegisterPage,
  openPageByClick,
  ordersCurrencyFormat,
  redirectBcMenus,
  removeBCMenus,
  serialize,
  setCartPermissions,
  showPageMask,
  snackbar,
  validatorRules,
  handleGetCorrespondingCurrencyToken,
};
