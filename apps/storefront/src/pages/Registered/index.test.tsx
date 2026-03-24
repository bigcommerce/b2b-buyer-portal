import {
  buildCompanyStateWith,
  buildGlobalStateWith,
  renderWithProviders,
  screen,
  waitFor,
} from 'tests/test-utils';
import { when } from 'vitest-when';

import * as b2bService from '@/shared/service/b2b';
import * as recaptchaModule from '@/shared/service/b2b/graphql/recaptcha';
import * as bcModule from '@/shared/service/bc';
import type { RegisterCompanyMutationResponse } from '@/shared/service/bc/graphql/company';
import { RegisterCompanyStatus } from '@/shared/service/bc/graphql/company';
import * as companyGraphqlModule from '@/shared/service/bc/graphql/company';
import * as bcGraphqlLoginModule from '@/shared/service/bc/graphql/login';
import { B3SStorage } from '@/utils/b3Storage';
import * as loginInfoModule from '@/utils/loginInfo';
import * as storefrontConfigModule from '@/utils/storefrontConfig';

import { RegisteredProvider } from './Context';
import Registered from '.';

const mockRegisterCompanyGraphqlApproved: RegisterCompanyMutationResponse = {
  data: {
    company: {
      registerCompany: {
        entityId: 1,
        status: RegisterCompanyStatus.APPROVED,
        errors: [],
      },
    },
  },
};

const mockCountries = {
  countries: [
    {
      countryCode: 'AU',
      countryName: 'Australia',
      id: '13',
      states: [{ stateName: 'Australian Capital Territory', stateCode: 'ACT' }],
    },
    {
      countryCode: 'US',
      countryName: 'United States',
      id: '1',
      states: [{ stateName: 'California', stateCode: 'CA' }],
    },
  ],
};

const formType1Fields = [
  {
    id: '2',
    formType: 1,
    fieldFrom: 10,
    fieldId: 'field_first_name',
    groupId: 1,
    groupName: 'Contact Information',
    isRequired: true,
    visible: true,
    labelName: 'First Name',
    fieldName: 'first_name',
    fieldType: 'text',
    valueConfigs: {
      label: 'First Name',
    },
  },
  {
    id: '4',
    formType: 1,
    fieldFrom: 10,
    fieldId: 'field_last_name',
    groupId: 1,
    groupName: 'Contact Information',
    isRequired: true,
    visible: true,
    labelName: 'Last Name',
    fieldName: 'last_name',
    fieldType: 'text',
    valueConfigs: {
      label: 'Last Name',
    },
  },
  {
    id: '6',
    formType: 1,
    fieldFrom: 10,
    fieldId: 'field_email',
    groupId: 1,
    groupName: 'Contact Information',
    isRequired: true,
    visible: true,
    labelName: 'Email Address',
    fieldName: 'email',
    fieldType: 'text',
    valueConfigs: {
      label: 'Email Address',
    },
  },
  {
    id: '9',
    formType: 1,
    fieldFrom: 10,
    fieldId: 'field_company_name',
    groupId: 1,
    groupName: 'Contact Information',
    isRequired: false,
    visible: true,
    labelName: 'Company Name',
    fieldName: 'company',
    fieldType: 'text',
    valueConfigs: {
      label: 'Company Name',
    },
  },
  {
    id: '11',
    formType: 1,
    fieldFrom: 10,
    fieldId: 'field_phone_number',
    groupId: 1,
    groupName: 'Contact Information',
    isRequired: false,
    visible: true,
    labelName: 'Phone Number',
    fieldName: 'phone',
    fieldType: 'text',
    valueConfigs: {
      label: 'Phone Number',
    },
  },
  {
    id: '12',
    formType: 1,
    fieldFrom: 10,
    fieldId: 'field_email_marketing_newsletter',
    groupId: 1,
    groupName: 'Contact Information',
    isRequired: false,
    visible: true,
    labelName: 'Email me special promotions and updates',
    fieldName: 'accepts_marketing_emails',
    fieldType: 'checkbox',
    valueConfigs: {
      label: 'Email me special promotions and updates',
    },
  },
  {
    id: '24',
    formType: 1,
    fieldFrom: 20,
    fieldId: 'field_14',
    groupId: 4,
    groupName: 'Address',
    isRequired: true,
    visible: true,
    labelName: 'First Name',
    fieldName: 'firstName',
    fieldType: 'text',
    valueConfigs: {
      id: 'field_14',
      name: 'firstName',
      type: 'string',
      label: 'First Name',

      default: '',
      required: true,
      fieldType: 'text',
      maxLength: null,
    },
  },
  {
    id: '25',
    formType: 1,
    fieldFrom: 20,
    fieldId: 'field_15',
    groupId: 4,
    groupName: 'Address',
    isRequired: true,
    visible: true,
    labelName: 'Last Name',
    fieldName: 'lastName',
    fieldType: 'text',
    valueConfigs: {
      id: 'field_15',
      name: 'lastName',
      type: 'string',
      label: 'Last Name',

      default: '',
      required: true,
      fieldType: 'text',
      maxLength: null,
    },
  },
  {
    id: '26',
    formType: 1,
    fieldFrom: 20,
    fieldId: 'field_16',
    groupId: 4,
    groupName: 'Address',
    isRequired: false,
    visible: true,
    labelName: 'Company Name',
    fieldName: 'company',
    fieldType: 'text',
    valueConfigs: {
      id: 'field_16',
      name: 'company',
      type: 'string',
      label: 'Company Name',

      default: '',
      required: false,
      fieldType: 'text',
      maxLength: null,
    },
  },
  {
    id: '27',
    formType: 1,
    fieldFrom: 20,
    fieldId: 'field_17',
    groupId: 4,
    groupName: 'Address',
    isRequired: false,
    visible: true,
    labelName: 'Phone Number',
    fieldName: 'phone',
    fieldType: 'text',
    valueConfigs: {
      id: 'field_17',
      name: 'phone',
      type: 'string',
      label: 'Phone Number',

      default: '',
      required: false,
      fieldType: 'text',
      maxLength: null,
    },
  },
  {
    id: '28',
    formType: 1,
    fieldFrom: 20,
    fieldId: 'field_18',
    groupId: 4,
    groupName: 'Address',
    isRequired: true,
    visible: true,
    labelName: 'Address Line 1',
    fieldName: 'address1',
    fieldType: 'text',
    valueConfigs: {
      id: 'field_18',
      name: 'address1',
      type: 'string',
      label: 'Address Line 1',

      default: '',
      required: true,
      fieldType: 'text',
      maxLength: null,
    },
  },
  {
    id: '29',
    formType: 1,
    fieldFrom: 20,
    fieldId: 'field_19',
    groupId: 4,
    groupName: 'Address',
    isRequired: false,
    visible: true,
    labelName: 'Address Line 2',
    fieldName: 'address2',
    fieldType: 'text',
    valueConfigs: {
      id: 'field_19',
      name: 'address2',
      type: 'string',
      label: 'Address Line 2',

      default: '',
      required: false,
      fieldType: 'text',
      maxLength: null,
    },
  },
  {
    id: '30',
    formType: 1,
    fieldFrom: 20,
    fieldId: 'field_20',
    groupId: 4,
    groupName: 'Address',
    isRequired: true,
    visible: true,
    labelName: 'Suburb/City',
    fieldName: 'city',
    fieldType: 'text',
    valueConfigs: {
      id: 'field_20',
      name: 'city',
      type: 'string',
      label: 'Suburb/City',

      default: '',
      required: true,
      fieldType: 'text',
      maxLength: null,
    },
  },
  {
    id: '31',
    formType: 1,
    fieldFrom: 20,
    fieldId: 'field_21',
    groupId: 4,
    groupName: 'Address',
    isRequired: true,
    visible: true,
    labelName: 'Country',
    fieldName: 'countryCode',
    fieldType: 'dropdown',
    valueConfigs: {
      id: 'field_21',
      name: 'countryCode',
      type: 'array',
      label: 'Country',

      default: null,
      options: {
        items: [],
        helperLabel: 'Choose a Country',
      },
      required: true,
      fieldType: 'dropdown',
      maxLength: null,
    },
  },
  {
    id: '32',
    formType: 1,
    fieldFrom: 20,
    fieldId: 'field_22',
    groupId: 4,
    groupName: 'Address',
    isRequired: true,
    visible: true,
    labelName: 'State/Province',
    fieldName: 'stateOrProvince',
    fieldType: '',
    valueConfigs: {
      id: 'field_22',
      name: 'stateOrProvince',
      label: 'State/Province',

      default: null,
      required: true,
      maxLength: null,
    },
  },
  {
    id: '34',
    formType: 1,
    fieldFrom: 20,
    fieldId: 'field_23',
    groupId: 4,
    groupName: 'Address',
    isRequired: true,
    visible: true,
    labelName: 'Zip/Postcode',
    fieldName: 'postalCode',
    fieldType: 'text',
    valueConfigs: {
      id: 'field_23',
      name: 'postalCode',
      type: 'string',
      label: 'Zip/Postcode',

      default: '',
      required: true,
      fieldType: 'text',
      maxLength: null,
    },
  },
  {
    id: '52',
    formType: 1,
    fieldFrom: 20,
    fieldId: 'field_26',
    custom: true,
    groupId: 4,
    groupName: 'Address',
    isRequired: true,
    visible: true,
    labelName: 'ceid',
    fieldName: 'field_26',
    fieldType: 'text',
    valueConfigs: {
      id: 'field_26',
      name: 'field_26',
      type: 'string',
      label: 'ceid',
      custom: true,
      default: '',
      required: true,
      fieldType: 'text',
      maxLength: null,
    },
  },
  {
    id: '15',
    formType: 1,
    fieldFrom: 10,
    fieldId: 'field_create_password',
    groupId: 5,
    groupName: 'Password',
    isRequired: true,
    visible: true,
    labelName: 'Create Password',
    fieldName: 'create_password',
    fieldType: 'password',
    valueConfigs: {
      id: 'field_2',
      name: 'password',
      type: 'string',
      label: 'Password',

      secret: true,
      default: '',
      required: true,
      fieldType: 'password',
      maxLength: null,
      requirements: {
        alpha: '[A-Za-z]',
        numeric: '[0-9]',
        minlength: 7,
        description:
          'Passwords must be at least 7 characters and contain both alphabetic and numeric characters.',
      },
    },
  },
  {
    id: '19',
    formType: 1,
    fieldFrom: 10,
    fieldId: 'field_confirm_password',
    groupId: 5,
    groupName: 'Password',
    isRequired: true,
    visible: true,
    labelName: 'Confirm Password',
    fieldName: 'confirm_password',
    fieldType: 'password',
    valueConfigs: {
      id: 'field_2',
      name: 'password',
      type: 'string',
      label: 'Password',

      secret: true,
      default: '',
      required: true,
      fieldType: 'password',
      maxLength: null,
      requirements: {
        alpha: '[A-Za-z]',
        numeric: '[0-9]',
        minlength: 7,
        description:
          'Passwords must be at least 7 characters and contain both alphabetic and numeric characters.',
      },
    },
  },
];

const formType2Fields = [
  {
    id: '1',
    formType: 2,
    fieldFrom: 10,
    fieldId: 'field_first_name',
    groupId: 1,
    groupName: 'Contact Information',
    isRequired: true,
    visible: true,
    labelName: 'First Name',
    fieldName: 'first_name',
    fieldType: 'text',
    valueConfigs: {
      label: 'First Name',
    },
  },
  {
    id: '3',
    formType: 2,
    fieldFrom: 10,
    fieldId: 'field_last_name',
    groupId: 1,
    groupName: 'Contact Information',
    isRequired: true,
    visible: true,
    labelName: 'Last Name',
    fieldName: 'last_name',
    fieldType: 'text',
    valueConfigs: {
      label: 'Last Name',
    },
  },
  {
    id: '5',
    formType: 2,
    fieldFrom: 10,
    fieldId: 'field_email',
    groupId: 1,
    groupName: 'Contact Information',
    isRequired: true,
    visible: true,
    labelName: 'Email Address',
    fieldName: 'email',
    fieldType: 'text',
    valueConfigs: {
      label: 'Email Address',
    },
  },
  {
    id: '7',
    formType: 2,
    fieldFrom: 10,
    fieldId: 'field_phone_number',
    groupId: 1,
    groupName: 'Contact Information',
    isRequired: false,
    visible: true,
    labelName: 'Phone Number',
    fieldName: 'phone',
    fieldType: 'text',
    valueConfigs: {
      label: 'Phone Number',
    },
  },
  {
    id: '8',
    formType: 2,
    fieldFrom: 10,
    fieldId: 'field_email_marketing_newsletter',
    groupId: 1,
    groupName: 'Contact Information',
    isRequired: false,
    visible: true,
    labelName: 'Email me special promotions and updates',
    fieldName: 'accepts_marketing_emails',
    fieldType: 'checkbox',
    valueConfigs: {
      label: 'Email me special promotions and updates',
    },
  },
  {
    id: '10',
    formType: 2,
    fieldFrom: 10,
    fieldId: 'field_company_name',
    groupId: 3,
    groupName: 'Business Details',
    isRequired: true,
    visible: true,
    labelName: 'Company Name',
    fieldName: 'company_name',
    fieldType: 'text',
    valueConfigs: {
      label: 'Company Name',
    },
  },
  {
    id: '13',
    formType: 2,
    fieldFrom: 10,
    fieldId: 'field_company_email',
    groupId: 3,
    groupName: 'Business Details',
    isRequired: true,
    visible: true,
    labelName: 'Company Email',
    fieldName: 'company_email',
    fieldType: 'text',
    valueConfigs: {
      label: 'Company Email',
    },
  },
  {
    id: '14',
    formType: 2,
    fieldFrom: 10,
    fieldId: 'field_company_phone_number',
    groupId: 3,
    groupName: 'Business Details',
    isRequired: true,
    visible: true,
    labelName: 'Company Phone Number',
    fieldName: 'company_phone_number',
    fieldType: 'text',
    valueConfigs: {
      label: 'Company Phone Number',
    },
  },
  {
    id: '16',
    formType: 2,
    fieldFrom: 10,
    fieldId: 'field_attachments',
    groupId: 3,
    groupName: 'Business Details',
    isRequired: false,
    visible: true,
    labelName: 'Attachments',
    fieldName: 'attachments',
    fieldType: 'files',
    valueConfigs: {
      label: 'Attachments',
    },
  },
  {
    id: '17',
    formType: 2,
    fieldFrom: 10,
    fieldId: 'field_country',
    groupId: 4,
    groupName: 'Address',
    isRequired: true,
    visible: true,
    labelName: 'Country',
    fieldName: 'country',
    fieldType: 'dropdown',
    valueConfigs: {
      label: 'Country',
      default: null,
    },
  },
  {
    id: '18',
    formType: 2,
    fieldFrom: 10,
    fieldId: 'field_address_1',
    groupId: 4,
    groupName: 'Address',
    isRequired: true,
    visible: true,
    labelName: 'Address 1',
    fieldName: 'address1',
    fieldType: 'text',
    valueConfigs: {
      label: 'Address 1',
    },
  },
  {
    id: '20',
    formType: 2,
    fieldFrom: 10,
    fieldId: 'field_address_2',
    groupId: 4,
    groupName: 'Address',
    isRequired: false,
    visible: true,
    labelName: 'Address 2',
    fieldName: 'address2',
    fieldType: 'text',
    valueConfigs: {
      label: 'Address 2',
    },
  },
  {
    id: '21',
    formType: 2,
    fieldFrom: 10,
    fieldId: 'field_city',
    groupId: 4,
    groupName: 'Address',
    isRequired: true,
    visible: true,
    labelName: 'City',
    fieldName: 'city',
    fieldType: 'text',
    valueConfigs: {
      label: 'City',
    },
  },
  {
    id: '22',
    formType: 2,
    fieldFrom: 10,
    fieldId: 'field_state',
    groupId: 4,
    groupName: 'Address',
    isRequired: true,
    visible: true,
    labelName: 'State',
    fieldName: 'state',
    fieldType: 'dropdown',
    valueConfigs: {
      label: 'State',
    },
  },
  {
    id: '23',
    formType: 2,
    fieldFrom: 10,
    fieldId: 'field_zip_code',
    groupId: 4,
    groupName: 'Address',
    isRequired: true,
    visible: true,
    labelName: 'Zip Code',
    fieldName: 'zip_code',
    fieldType: 'text',
    valueConfigs: {
      label: 'Zip Code',
    },
  },
  {
    id: '33',
    formType: 2,
    fieldFrom: 10,
    fieldId: 'field_create_password',
    groupId: 5,
    groupName: 'Password',
    isRequired: true,
    visible: true,
    labelName: 'Create Password',
    fieldName: 'create_password',
    fieldType: 'password',
    valueConfigs: {
      id: 'field_2',
      name: 'password',
      type: 'string',
      label: 'Password',

      secret: true,
      default: '',
      required: true,
      fieldType: 'password',
      maxLength: null,
      requirements: {
        alpha: '[A-Za-z]',
        numeric: '[0-9]',
        minlength: 7,
        description:
          'Passwords must be at least 7 characters and contain both alphabetic and numeric characters.',
      },
    },
  },
  {
    id: '35',
    formType: 2,
    fieldFrom: 10,
    fieldId: 'field_confirm_password',
    groupId: 5,
    groupName: 'Password',
    isRequired: true,
    visible: true,
    labelName: 'Confirm Password',
    fieldName: 'confirm_password',
    fieldType: 'password',
    valueConfigs: {
      id: 'field_2',
      name: 'password',
      type: 'string',
      label: 'Password',

      secret: true,
      default: '',
      required: true,
      fieldType: 'password',
      maxLength: null,
      requirements: {
        alpha: '[A-Za-z]',
        numeric: '[0-9]',
        minlength: 7,
        description:
          'Passwords must be at least 7 characters and contain both alphabetic and numeric characters.',
      },
    },
  },
];

const mockRegistrationData = {
  b2c: {
    accountType: 'Personal account',
    contactInfo: {
      'First Name': 'John',
      'Last Name': 'Doe',
      'Email Address': 'john.doe@example.com',
      'Company Name': 'Test Co',
      'Phone Number': '1234567890',
      'Email me special promotions and updates': true,
    },
    address: {
      'First Name': 'Tom',
      'Last Name': 'Cruise',
      'Company Name': 'Film Co',
      'Phone Number': '1234567890',
      'Address Line 1': '2 bb street',
      'Address Line 2': 'suite 100',
      'Suburb/City': 'Kansas City',
      Country: 'United States',
      'State/Province': 'California',
      'Zip/Postcode': '12345',
      ceid: 'custom value',
    },
    password: {
      'Create Password': 'Password123',
      'Confirm Password': 'Password123',
    },
  },
  b2b: {
    accountType: 'Business account',
    contactInfo: {
      'First Name': 'John',
      'Last Name': 'Doe',
      'Email Address': 'john.doe@example.com',
      'Phone Number': '1234567890',
    },
    businessDetails: {
      'Company Name': 'Test Co',
      'Company Email': 'test.co@example.com',
      'Company Phone Number': '1234567890',
    },
    address: {
      Country: 'United States',
      'Address 1': '2 bb street',
      'Address 2': 'suite 100',
      City: 'New York',
      State: 'California',
      'Zip Code': '54321',
    },
    password: {
      'Create Password': 'Password123',
      'Confirm Password': 'Password123',
    },
  },
};

const expectedPayloadType2 = {
  accepts_product_review_abandoned_cart_emails: false,
  addresses: [],
  authentication: {
    force_password_reset: false,
    new_password: 'Password123',
  },
  channel_ids: [1],
  email: 'john.doe@example.com',
  first_name: 'John',
  form_fields: [],
  last_name: 'Doe',
  origin_channel_id: 1,
  phone: '1234567890',
  storeHash: 'store-hash',
};

const expectedPayloadType1 = {
  ...expectedPayloadType2,
  accepts_product_review_abandoned_cart_emails: true,
  addresses: [
    {
      address1: '2 bb street',
      address2: 'suite 100',
      city: 'Kansas City',
      company: 'Film Co',
      country_code: 'US',
      first_name: 'Tom',
      form_fields: [{ name: 'ceid', value: 'custom value' }],
      last_name: 'Cruise',
      phone: '1234567890',
      postal_code: '12345',
      state_or_province: 'California',
    },
  ],
  company: 'Test Co',
  trigger_account_created_notification: true,
};

type RegistrationData = {
  accountType: string;
  contactInfo: Record<string, string | boolean>;
  businessDetails?: Record<string, string>;
  address: Record<string, string>;
  password: Record<string, string>;
};

async function completeRegistration(
  user: ReturnType<typeof renderWithProviders>['user'],
  { accountType, contactInfo, businessDetails, address, password }: RegistrationData,
) {
  // Step 1: Account type selection
  await user.click(screen.getByLabelText(accountType));

  // Step 1: Contact Information
  if (contactInfo['First Name']) {
    await user.type(screen.getByLabelText(/First Name/i), contactInfo['First Name'] as string);
  }
  if (contactInfo['Last Name']) {
    await user.type(screen.getByLabelText(/Last Name/i), contactInfo['Last Name'] as string);
  }
  if (contactInfo['Email Address']) {
    await user.type(
      screen.getByLabelText(/Email Address/i),
      contactInfo['Email Address'] as string,
    );
  }
  if (contactInfo['Company Name']) {
    await user.type(screen.getByLabelText(/Company Name/i), contactInfo['Company Name'] as string);
  }
  if (contactInfo['Phone Number']) {
    await user.type(screen.getByLabelText(/Phone Number/i), contactInfo['Phone Number'] as string);
  }
  if (contactInfo['Email me special promotions and updates']) {
    await user.click(screen.getByLabelText(/Email me special promotions and updates/i));
  }
  await user.click(screen.getByRole('button', { name: 'Continue' }));

  // Step 2: Business Details (B2B only)
  if (businessDetails) {
    if (businessDetails['Company Name']) {
      await user.type(
        screen.getByLabelText(/Company Name/i),
        businessDetails['Company Name'] as string,
      );
    }
    if (businessDetails['Company Email']) {
      await user.type(
        screen.getByLabelText(/Company Email/i),
        businessDetails['Company Email'] as string,
      );
    }
    if (businessDetails['Company Phone Number']) {
      await user.type(
        screen.getByLabelText(/Company Phone Number/i),
        businessDetails['Company Phone Number'] as string,
      );
    }
    await user.click(screen.getByRole('button', { name: 'Continue' }));
  }

  // Step 3: Address
  if (address['First Name']) {
    await user.type(screen.getByLabelText(/First Name/i), address['First Name'] as string);
  }
  if (address['Last Name']) {
    await user.type(screen.getByLabelText(/Last Name/i), address['Last Name'] as string);
  }
  if (address['Company Name']) {
    await user.type(screen.getByLabelText(/Company Name/i), address['Company Name'] as string);
  }
  if (address['Phone Number']) {
    await user.type(screen.getByLabelText(/Phone Number/i), address['Phone Number'] as string);
  }
  if (address['Address Line 1'] || address['Address 1']) {
    await user.type(
      screen.getByLabelText(/Address Line 1|Address 1/i),
      (address['Address Line 1'] || address['Address 1']) as string,
    );
  }
  if (address['Address Line 2'] || address['Address 2']) {
    await user.type(
      screen.getByLabelText(/Address Line 2|Address 2/i),
      (address['Address Line 2'] || address['Address 2']) as string,
    );
  }
  if (address['Suburb/City'] || address.City) {
    await user.type(
      screen.getByLabelText(/Suburb\/City|City/i),
      (address['Suburb/City'] || address.City) as string,
    );
  }
  if (address.Country) {
    await user.click(screen.getByLabelText(/Country/i));
    await user.click(screen.getByRole('option', { name: address.Country as string }));
  }
  if (address['State/Province'] || address.State) {
    await user.click(screen.getByRole('combobox', { name: /State/i }));
    await user.click(
      screen.getByRole('option', {
        name: (address['State/Province'] || address.State) as string,
      }),
    );
  }
  if (address['Zip/Postcode'] || address['Zip Code']) {
    await user.type(
      screen.getByLabelText(/Zip\/Postcode|Zip Code/i),
      (address['Zip/Postcode'] || address['Zip Code']) as string,
    );
  }
  if (address.ceid) {
    await user.type(screen.getByLabelText(/ceid/i), address.ceid as string);
  }
  await user.click(screen.getByRole('button', { name: 'Continue' }));

  // Step 4: Password
  if (password['Create Password']) {
    await user.type(
      screen.getByLabelText(/Create Password/i),
      password['Create Password'] as string,
    );
  }
  if (password['Confirm Password']) {
    await user.type(
      screen.getByLabelText(/Confirm Password/i),
      password['Confirm Password'] as string,
    );
  }
  await user.click(screen.getByRole('button', { name: /Submit/i }));
}

/**
 * FF off: B2B GraphQL `companyCreate` mutation (via `createB2BCompanyUser` from `@/shared/service/b2b/graphql/register`).
 * FF on: BigCommerce Storefront GraphQL `registerCompany` (see `describe` below).
 */
const preloadedStateB2bCompanyCreate = {
  global: buildGlobalStateWith({
    featureFlags: { 'B2B-4466.use_register_company_flow': false },
  }),
};

/** FF on: Storefront `registerCompany` + `bcLogin` after `createBCCompanyUser`. Prefetch `bcGraphqlToken` so `loginInfo` is not required in the happy path. */
const preloadedStateStorefrontRegisterCompany = {
  global: buildGlobalStateWith({
    featureFlags: { 'B2B-4466.use_register_company_flow': true },
  }),
  company: buildCompanyStateWith({
    tokens: {
      bcGraphqlToken: 'prefetched-bc-storefront-token',
      B2BToken: '',
      currentCustomerJWT: '',
    },
  }),
};

describe('Registered Page', () => {
  beforeEach(() => {
    vi.spyOn(companyGraphqlModule, 'registerCompany').mockResolvedValue(
      mockRegisterCompanyGraphqlApproved,
    );
    vi.spyOn(loginInfoModule, 'loginInfo').mockImplementation(() => Promise.resolve());

    vi.spyOn(b2bService, 'getB2BAccountFormFields').mockResolvedValue({
      accountFormFields: formType2Fields,
    });
    when(b2bService.getB2BAccountFormFields)
      .calledWith(1)
      .thenResolve({ accountFormFields: formType1Fields });

    vi.spyOn(b2bService, 'getB2BCountries').mockResolvedValue(mockCountries);
    vi.spyOn(b2bService, 'checkUserEmail').mockResolvedValue({ isValid: true });
    vi.spyOn(b2bService, 'checkUserBCEmail').mockResolvedValue({ isValid: true });
    vi.spyOn(b2bService, 'createBCCompanyUser').mockResolvedValue({
      customerCreate: { customer: { id: 1, email: 'john.doe@example.com' } },
    });
    vi.spyOn(b2bService, 'validateAddressExtraFields').mockResolvedValue({ code: 200 });
    vi.spyOn(b2bService, 'validateBCCompanyExtraFields').mockResolvedValue({ code: 200 });
    vi.spyOn(b2bService, 'createB2BCompanyUser').mockResolvedValue({
      companyCreate: { company: { companyStatus: 1 } },
    });
    vi.spyOn(b2bService, 'sendSubscribersState').mockImplementation(() => Promise.resolve({}));
    vi.spyOn(b2bService, 'uploadB2BFile').mockResolvedValue({
      code: 200,
      data: { fileSize: '' },
    });
    vi.spyOn(bcModule, 'bcLogin').mockResolvedValue({ error: undefined });
    vi.spyOn(bcGraphqlLoginModule, 'bcLogoutLogin').mockResolvedValue({
      data: { logout: { result: 'success' } },
    });
    vi.spyOn(loginInfoModule, 'getCurrentCustomerInfo').mockResolvedValue({
      userType: 5,
      role: 2,
      companyRoleName: 'Junior Buyer',
    });
    vi.spyOn(recaptchaModule, 'getStorefrontToken').mockResolvedValue({
      isEnabledOnStorefront: false,
      siteKey: '',
    });
    vi.spyOn(storefrontConfigModule, 'getStoreConfigs').mockImplementation(() => Promise.resolve());
  });

  it('renders and completes personal (B2C) registration flow', async () => {
    const { navigation, user } = renderWithProviders(
      <RegisteredProvider>
        <Registered setOpenPage={vi.fn()} />
      </RegisteredProvider>,
      { preloadedState: preloadedStateB2bCompanyCreate },
    );

    await completeRegistration(user, { ...mockRegistrationData.b2c, businessDetails: undefined });

    expect(b2bService.createBCCompanyUser).toHaveBeenCalledWith(expectedPayloadType1, '');
    expect(screen.getByRole('heading', { name: 'Registration complete!' })).toBeVisible();
    expect(screen.getByText('Thank you for creating your account at')).toBeVisible();
    await user.click(screen.getByRole('button', { name: /Finish|FINISH/i }));
    // Expect /orders because companyAutoApproval.enabled is true (default from CustomStyleContext)
    await waitFor(() => {
      expect(navigation).toHaveBeenCalledWith(expect.stringMatching(/\/orders/i));
    });
  });

  it('renders and completes Business (B2B) registration flow with auto approval', async () => {
    const { navigation, user } = renderWithProviders(
      <RegisteredProvider>
        <Registered setOpenPage={vi.fn()} />
      </RegisteredProvider>,
      {
        preloadedState: preloadedStateB2bCompanyCreate,
        initialGlobalContext: { storeName: 'My Store' },
      },
    );

    await completeRegistration(user, mockRegistrationData.b2b);

    expect(b2bService.createBCCompanyUser).toHaveBeenCalledWith(expectedPayloadType2, '');
    expect(companyGraphqlModule.registerCompany).not.toHaveBeenCalled();
    expect(bcGraphqlLoginModule.bcLogoutLogin).not.toHaveBeenCalled();
    expect(screen.getByRole('heading', { name: 'Application submitted' })).toBeVisible();
    expect(
      screen.getByText(
        'Thank you for creating your account at My Store. Your company account application has been approved',
      ),
    ).toBeVisible();
    await user.click(screen.getByRole('button', { name: /Finish|FINISH/i }));
    // Expect /orders because companyAutoApproval.enabled is true (default from CustomStyleContext)
    await waitFor(() => {
      expect(navigation).toHaveBeenCalledWith(expect.stringMatching(/\/orders/i));
    });
  });

  describe('B2B-4466.use_register_company_flow enabled (BC Storefront GraphQL registerCompany)', () => {
    beforeEach(() => {
      when(bcModule.bcLogin)
        .calledWith({ email: 'john.doe@example.com', password: 'Password123' })
        .thenResolve({
          errors: [],
          data: {
            login: {
              customer: {
                firstName: 'John',
                lastName: 'Doe',
              },
            },
          },
        });
    });

    it('completes B2B registration via Storefront registerCompany and does not call B2B companyCreate (createB2BCompanyUser)', async () => {
      const { navigation, user } = renderWithProviders(
        <RegisteredProvider>
          <Registered setOpenPage={vi.fn()} />
        </RegisteredProvider>,
        {
          preloadedState: preloadedStateStorefrontRegisterCompany,
          initialGlobalContext: { storeName: 'My Store' },
        },
      );

      await completeRegistration(user, mockRegistrationData.b2b);

      await waitFor(() => {
        expect(companyGraphqlModule.registerCompany).toHaveBeenCalled();
      });
      expect(b2bService.createB2BCompanyUser).not.toHaveBeenCalled();
      expect(b2bService.createBCCompanyUser).toHaveBeenCalled();
      expect(bcModule.bcLogin).toHaveBeenCalledWith({
        email: 'john.doe@example.com',
        password: 'Password123',
      });
      expect(loginInfoModule.loginInfo).not.toHaveBeenCalled();
      expect(screen.getByRole('heading', { name: 'Application submitted' })).toBeVisible();
      expect(
        screen.getByText(
          'Thank you for creating your account at My Store. Your company account application has been approved',
        ),
      ).toBeVisible();
      await user.click(screen.getByRole('button', { name: /Finish|FINISH/i }));
      await waitFor(() => {
        expect(navigation).toHaveBeenCalledWith(expect.stringMatching(/\/orders/i));
      });
      expect(bcGraphqlLoginModule.bcLogoutLogin).not.toHaveBeenCalled();
    });

    it('shows pending copy when Storefront registerCompany returns a non-APPROVED status', async () => {
      when(companyGraphqlModule.registerCompany)
        .calledWith(expect.anything())
        .thenResolve({
          data: {
            company: {
              registerCompany: {
                entityId: 2,
                status: RegisterCompanyStatus.PENDING,
                errors: [],
              },
            },
          },
        });

      const { navigation, user } = renderWithProviders(
        <RegisteredProvider>
          <Registered setOpenPage={vi.fn()} />
        </RegisteredProvider>,
        {
          preloadedState: preloadedStateStorefrontRegisterCompany,
          initialGlobalContext: { storeName: 'My Store' },
        },
      );

      await completeRegistration(user, mockRegistrationData.b2b);

      await waitFor(() => {
        expect(companyGraphqlModule.registerCompany).toHaveBeenCalled();
      });
      expect(b2bService.createB2BCompanyUser).not.toHaveBeenCalled();
      expect(bcGraphqlLoginModule.bcLogoutLogin).toHaveBeenCalledTimes(1);
      expect(
        screen.getByText(
          'Your business account is pending approval. You will gain access to business account features after account approval.',
        ),
      ).toBeVisible();
      await user.click(screen.getByRole('button', { name: /Finish|FINISH/i }));
      await waitFor(() => {
        expect(navigation).toHaveBeenCalledWith(expect.stringMatching(/login/i));
      });
    });

    it('shows mutation validation errors from registerCompany payload instead of success copy', async () => {
      when(companyGraphqlModule.registerCompany)
        .calledWith(expect.anything())
        .thenResolve({
          data: {
            company: {
              registerCompany: {
                entityId: null,
                status: RegisterCompanyStatus.PENDING,
                errors: [{ message: 'A company with this name already exists.', path: ['name'] }],
              },
            },
          },
        });

      const { user } = renderWithProviders(
        <RegisteredProvider>
          <Registered setOpenPage={vi.fn()} />
        </RegisteredProvider>,
        {
          preloadedState: preloadedStateStorefrontRegisterCompany,
          initialGlobalContext: { storeName: 'My Store' },
        },
      );

      await completeRegistration(user, mockRegistrationData.b2b);

      await waitFor(() => {
        expect(companyGraphqlModule.registerCompany).toHaveBeenCalled();
      });
      expect(screen.getByText('A company with this name already exists.')).toBeVisible();
      expect(
        screen.queryByText(
          'Thank you for creating your account at My Store. Your company account application has been approved',
        ),
      ).not.toBeInTheDocument();
      expect(bcGraphqlLoginModule.bcLogoutLogin).not.toHaveBeenCalled();
    });

    it('shows generic error when storefront login returns no customer', async () => {
      when(bcModule.bcLogin)
        .calledWith({ email: 'john.doe@example.com', password: 'Password123' })
        .thenResolve({
          errors: [],
          data: {
            login: {
              customer: null,
            },
          },
        });

      const { user } = renderWithProviders(
        <RegisteredProvider>
          <Registered setOpenPage={vi.fn()} />
        </RegisteredProvider>,
        {
          preloadedState: preloadedStateStorefrontRegisterCompany,
          initialGlobalContext: { storeName: 'My Store' },
        },
      );

      await completeRegistration(user, mockRegistrationData.b2b);

      await waitFor(() => {
        expect(screen.getByText('Something went wrong. Please try again.')).toBeInTheDocument();
      });
      expect(companyGraphqlModule.registerCompany).not.toHaveBeenCalled();
      expect(bcGraphqlLoginModule.bcLogoutLogin).not.toHaveBeenCalled();
    });
  });

  describe('B2B registration pending approval scenarios', () => {
    it('can order, cannot view prices', async () => {
      const storageSpy = vi.spyOn(B3SStorage, 'get');
      when(storageSpy).calledWith('blockPendingAccountOrderCreation').thenReturn(false);
      when(storageSpy).calledWith('blockPendingAccountViewPrice').thenReturn(true);

      when(b2bService.createB2BCompanyUser)
        .calledWith(
          expect.objectContaining({
            customerId: 1,
            customerEmail: 'john.doe@example.com',
          }),
        )
        .thenResolve({
          companyCreate: { company: { companyStatus: 0 } },
        });

      const { navigation, user } = renderWithProviders(
        <RegisteredProvider>
          <Registered setOpenPage={vi.fn()} />
        </RegisteredProvider>,
        { preloadedState: preloadedStateB2bCompanyCreate },
      );

      await completeRegistration(user, mockRegistrationData.b2b);

      expect(screen.getByRole('heading', { name: 'Application submitted' })).toBeVisible();
      expect(
        screen.getByText(
          'Your business account is pending approval. You will gain access to business account features, products, and pricing after account approval.',
        ),
      ).toBeVisible();
      await user.click(screen.getByRole('button', { name: /Finish|FINISH/i }));
      await waitFor(() => {
        expect(navigation).toHaveBeenCalledWith(expect.stringMatching(/login/i));
      });
    });

    it('cannot order or view prices', async () => {
      const storageSpy = vi.spyOn(B3SStorage, 'get');
      when(storageSpy).calledWith('blockPendingAccountOrderCreation').thenReturn(true);
      when(storageSpy).calledWith('blockPendingAccountViewPrice').thenReturn(true);

      when(b2bService.createB2BCompanyUser)
        .calledWith(
          expect.objectContaining({
            customerId: 1,
            customerEmail: 'john.doe@example.com',
          }),
        )
        .thenResolve({
          companyCreate: { company: { companyStatus: 0 } },
        });

      const { navigation, user } = renderWithProviders(
        <RegisteredProvider>
          <Registered setOpenPage={vi.fn()} />
        </RegisteredProvider>,
        { preloadedState: preloadedStateB2bCompanyCreate },
      );

      await completeRegistration(user, mockRegistrationData.b2b);

      expect(screen.getByRole('heading', { name: 'Application submitted' })).toBeVisible();
      expect(
        screen.getByText(
          'Your business account is pending approval. Products, pricing, and ordering will be enabled after account approval.',
        ),
      ).toBeVisible();
      await user.click(screen.getByRole('button', { name: /Finish|FINISH/i }));
      await waitFor(() => {
        expect(navigation).toHaveBeenCalledWith(expect.stringMatching(/login/i));
      });
    });

    it('other restrictions', async () => {
      const storageSpy = vi.spyOn(B3SStorage, 'get');
      when(storageSpy).calledWith('blockPendingAccountOrderCreation').thenReturn(true);
      when(storageSpy).calledWith('blockPendingAccountViewPrice').thenReturn(false);

      when(b2bService.createB2BCompanyUser)
        .calledWith(
          expect.objectContaining({
            customerId: 1,
            customerEmail: 'john.doe@example.com',
          }),
        )
        .thenResolve({
          companyCreate: { company: { companyStatus: 0 } },
        });
      const { navigation, user } = renderWithProviders(
        <RegisteredProvider>
          <Registered setOpenPage={vi.fn()} />
        </RegisteredProvider>,
        { preloadedState: preloadedStateB2bCompanyCreate },
      );

      await completeRegistration(user, mockRegistrationData.b2b);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Application submitted' })).toBeVisible();
      });
      expect(
        screen.getByText(
          'Your business account is pending approval. You will gain access to business account features after account approval.',
        ),
      ).toBeVisible();
      await user.click(screen.getByRole('button', { name: /Finish|FINISH/i }));
      await waitFor(() => {
        expect(navigation).toHaveBeenCalledWith(expect.stringMatching(/login/i));
      });
    });
  });

  it('passes customerEmail from createBCCompanyUser response to B2B companyCreate (createB2BCompanyUser)', async () => {
    const { user } = renderWithProviders(
      <RegisteredProvider>
        <Registered setOpenPage={vi.fn()} />
      </RegisteredProvider>,
      {
        preloadedState: preloadedStateB2bCompanyCreate,
        initialGlobalContext: { storeName: 'My Store' },
      },
    );

    await completeRegistration(user, mockRegistrationData.b2b);

    await waitFor(() => {
      expect(b2bService.createB2BCompanyUser).toHaveBeenCalledWith(
        expect.objectContaining({
          customerId: 1,
          customerEmail: 'john.doe@example.com',
        }),
      );
    });
    expect(companyGraphqlModule.registerCompany).not.toHaveBeenCalled();
  });
});
