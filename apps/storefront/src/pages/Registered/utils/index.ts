export { steps, b2bAddressRequiredFields, emailError } from '../constants';

export { deCodeField, toHump, getAccountFormFields } from './formFieldConversion';
export {
  applyContactEmailTip,
  getEmailFieldName,
  mergeContactInfoWithFormData,
  setRegisterFieldsFromFormData,
  buildDetailsFormValues,
} from './formData';

export {
  buildBCUserPayload,
  buildB2BCompanyPayload,
  getSubscribersPayload,
  uploadAttachmentsToFileList,
} from './payloads';

export {
  loadAndNormalizeAccountFormFields,
  buildInitialRegisterStatePayload,
} from './normalizeAccountFormFields';

export { validateAttachmentsRequired, validateExtraFields } from './validation';
