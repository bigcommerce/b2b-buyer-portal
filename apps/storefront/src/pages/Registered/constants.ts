export const steps = [
  'register.step.account',
  'register.step.details',
  'register.step.finish',
] as const;

export const noEncryptFieldList = ['country', 'state', 'email'];

export const FORM_TYPES = [1, 2] as const;

export const EMAIL_FIELD_ID = 'field_email';
export const EMAIL_MARKETING_FIELD_ID = 'field_email_marketing_newsletter';
export const FIRST_NAME_FIELD_ID = 'field_first_name';
export const LAST_NAME_FIELD_ID = 'field_last_name';
export const ATTACHMENTS_FIELD_ID = 'field_attachments';

export const b2bAddressRequiredFields = [
  'field_country',
  'field_address_1',
  'field_city',
  'field_state',
  'field_zip_code',
];

export const groupItems = {
  1: 'contactInformation',
  2: 'additionalInformation',
  3: 'businessDetails',
  4: 'address',
  5: 'password',
};

type EmailError = {
  [k: number]: string;
};

export const emailError: EmailError = {
  2: 'register.emailValidate.alreadyExitsBC',
  3: 'global.emailValidate.multipleCustomer',
  4: 'global.emailValidate.companyUsed',
  5: 'global.emailValidate.alreadyExits',
  6: 'global.emailValidate.usedSuperAdmin',
};
