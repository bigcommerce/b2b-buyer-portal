export const REGISTER_STEPS = [
  'register.step.account',
  'register.step.details',
  'register.step.finish',
] as const;

export const FORM_TYPES = [1, 2] as const;

export const ATTACHMENTS_FIELD_ID = 'field_attachments';

type EmailErrorMap = {
  [k: number]: string;
};

export const EMAIL_ERROR: EmailErrorMap = {
  2: 'register.emailValidate.alreadyExitsBC',
  3: 'global.emailValidate.multipleCustomer',
  4: 'global.emailValidate.companyUsed',
  5: 'global.emailValidate.alreadyExits',
  6: 'global.emailValidate.usedSuperAdmin',
};
