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
import * as companyGraphqlModule from '@/shared/service/bc/graphql/company';
import { RegisterCompanyStatus } from '@/shared/service/bc/graphql/company';
import * as bcGraphqlLoginModule from '@/shared/service/bc/graphql/login';
import * as loginInfoModule from '@/utils/loginInfo';
import * as storefrontConfigModule from '@/utils/storefrontConfig';

import { RegisteredProvider } from './Context';
import Registered from '.';

vi.hoisted(() => {
  window.B3 = {
    setting: {
      channel_id: 1,
      store_hash: 'store-hash',
      platform: 'catalyst',
      environment: 'local',
    },
  };
});

const formFields = [
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
    valueConfigs: { label: 'Company Name' },
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
    valueConfigs: { label: 'Company Email' },
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
    valueConfigs: { label: 'Company Phone Number' },
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
    valueConfigs: { label: 'Country', default: null },
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
    valueConfigs: { label: 'Address 1' },
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
    valueConfigs: { label: 'City' },
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
    valueConfigs: { label: 'State' },
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
    valueConfigs: { label: 'Zip Code' },
  },
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
    valueConfigs: { label: 'First Name' },
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
    valueConfigs: { label: 'Last Name' },
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
    valueConfigs: { label: 'Email Address' },
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
    valueConfigs: { label: 'Phone Number' },
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

const mockCountries = {
  countries: [
    {
      countryCode: 'US',
      countryName: 'United States',
      id: '1',
      states: [{ stateName: 'California', stateCode: 'CA' }],
    },
  ],
};

const b2bRegistrationData = {
  accountType: 'Business account',
  contactInfo: {
    'First Name': 'Jane',
    'Last Name': 'Smith',
    'Email Address': 'jane.smith@example.com',
    'Phone Number': '5550001111',
  },
  businessDetails: {
    'Company Name': 'Catalyst Co',
    'Company Email': 'catalyst.co@example.com',
    'Company Phone Number': '5550002222',
  },
  address: {
    Country: 'United States',
    'Address 1': '1 Catalyst St',
    City: 'San Francisco',
    State: 'California',
    'Zip Code': '94105',
  },
  password: {
    'Create Password': 'Password123',
    'Confirm Password': 'Password123',
  },
};

async function completeB2BRegistration(
  user: ReturnType<typeof renderWithProviders>['user'],
  data: typeof b2bRegistrationData,
) {
  await user.click(screen.getByLabelText(data.accountType));

  await user.type(screen.getByLabelText(/First Name/i), data.contactInfo['First Name']);
  await user.type(screen.getByLabelText(/Last Name/i), data.contactInfo['Last Name']);
  await user.type(screen.getByLabelText(/Email Address/i), data.contactInfo['Email Address']);
  await user.click(screen.getByRole('button', { name: 'Continue' }));

  await user.type(screen.getByLabelText(/Company Name/i), data.businessDetails['Company Name']);
  await user.type(screen.getByLabelText(/Company Email/i), data.businessDetails['Company Email']);
  await user.type(
    screen.getByLabelText(/Company Phone Number/i),
    data.businessDetails['Company Phone Number'],
  );
  await user.click(screen.getByRole('button', { name: 'Continue' }));

  await user.click(screen.getByLabelText(/Country/i));
  await user.click(screen.getByRole('option', { name: data.address.Country }));
  await user.type(screen.getByLabelText(/Address 1/i), data.address['Address 1']);
  await user.type(screen.getByLabelText(/City/i), data.address.City);
  await user.click(screen.getByRole('combobox', { name: /State/i }));
  await user.click(screen.getByRole('option', { name: data.address.State }));
  await user.type(screen.getByLabelText(/Zip Code/i), data.address['Zip Code']);
  await user.click(screen.getByRole('button', { name: 'Continue' }));

  await user.type(screen.getByLabelText(/Create Password/i), data.password['Create Password']);
  await user.type(screen.getByLabelText(/Confirm Password/i), data.password['Confirm Password']);
  await user.click(screen.getByRole('button', { name: /Submit/i }));
}

const preloadedStateCatalystWithFFOff = {
  global: buildGlobalStateWith({
    featureFlags: { 'B2B-4466.use_register_company_flow': false },
  }),
};

const preloadedStateCatalystWithFFOn = {
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

describe('Registered Page (Catalyst platform)', () => {
  beforeEach(() => {
    window.B3.setting.platform = 'catalyst';

    vi.spyOn(b2bService, 'getB2BAccountFormFields').mockResolvedValue({
      accountFormFields: formFields,
    });
    vi.spyOn(b2bService, 'getB2BCountries').mockResolvedValue(mockCountries);
    vi.spyOn(b2bService, 'checkUserEmail').mockResolvedValue({ isValid: true });
    vi.spyOn(b2bService, 'checkUserBCEmail').mockResolvedValue({ isValid: true });
    vi.spyOn(b2bService, 'validateAddressExtraFields').mockResolvedValue({ code: 200 });
    vi.spyOn(b2bService, 'validateBCCompanyExtraFields').mockResolvedValue({ code: 200 });
    vi.spyOn(b2bService, 'createBCCompanyUser').mockResolvedValue({
      customerCreate: { customer: { id: 42, email: 'jane.smith@example.com' } },
    });
    vi.spyOn(b2bService, 'createB2BCompanyUser').mockResolvedValue({
      companyCreate: { company: { companyStatus: 1 } },
    });
    vi.spyOn(b2bService, 'sendSubscribersState').mockImplementation(() => Promise.resolve({}));
    vi.spyOn(b2bService, 'uploadB2BFile').mockResolvedValue({ code: 200, data: { fileSize: '' } });
    vi.spyOn(companyGraphqlModule, 'registerCompany').mockResolvedValue({
      data: {
        company: {
          registerCompany: { entityId: 1, status: RegisterCompanyStatus.APPROVED, errors: [] },
        },
      },
    });
    vi.spyOn(bcModule, 'bcLogin').mockResolvedValue({ error: undefined });
    vi.spyOn(bcGraphqlLoginModule, 'bcLogoutLogin').mockResolvedValue({
      data: { logout: { result: 'success' } },
    });
    vi.spyOn(loginInfoModule, 'ensureBcGraphqlToken').mockImplementation(() => Promise.resolve());
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

  describe('B2B-4466.use_register_company_flow enabled', () => {
    it('uses createB2BCompanyUser (B2B API) instead of Storefront registerCompany', async () => {
      const { user } = renderWithProviders(
        <RegisteredProvider>
          <Registered setOpenPage={vi.fn()} />
        </RegisteredProvider>,
        { preloadedState: preloadedStateCatalystWithFFOn },
      );

      await completeB2BRegistration(user, b2bRegistrationData);

      await waitFor(() => {
        expect(b2bService.createB2BCompanyUser).toHaveBeenCalled();
      });
      expect(companyGraphqlModule.registerCompany).not.toHaveBeenCalled();
    });

    it('does not call bcLogin for token exchange or ensureBcGraphqlToken', async () => {
      const { user } = renderWithProviders(
        <RegisteredProvider>
          <Registered setOpenPage={vi.fn()} />
        </RegisteredProvider>,
        { preloadedState: preloadedStateCatalystWithFFOn },
      );

      await completeB2BRegistration(user, b2bRegistrationData);

      await waitFor(() => {
        expect(b2bService.createB2BCompanyUser).toHaveBeenCalled();
      });
      expect(loginInfoModule.ensureBcGraphqlToken).not.toHaveBeenCalled();
      expect(bcModule.bcLogin).not.toHaveBeenCalled();
    });

    it('shows approval success screen when company is auto-approved', async () => {
      const { user } = renderWithProviders(
        <RegisteredProvider>
          <Registered setOpenPage={vi.fn()} />
        </RegisteredProvider>,
        {
          preloadedState: preloadedStateCatalystWithFFOn,
          initialGlobalContext: { storeName: 'Catalyst Store' },
        },
      );

      await completeB2BRegistration(user, b2bRegistrationData);

      await waitFor(() => {
        expect(
          screen.getByText(
            'Thank you for creating your account at Catalyst Store. Your company account application has been approved',
          ),
        ).toBeVisible();
      });
      expect(b2bService.createB2BCompanyUser).toHaveBeenCalled();
      expect(companyGraphqlModule.registerCompany).not.toHaveBeenCalled();
    });

    it('shows pending screen when company registration is not auto-approved', async () => {
      when(b2bService.createB2BCompanyUser)
        .calledWith(expect.objectContaining({ customerId: 42 }))
        .thenResolve({ companyCreate: { company: { companyStatus: 0 } } });

      const { navigation, user } = renderWithProviders(
        <RegisteredProvider>
          <Registered setOpenPage={vi.fn()} />
        </RegisteredProvider>,
        { preloadedState: preloadedStateCatalystWithFFOn },
      );

      await completeB2BRegistration(user, b2bRegistrationData);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Application submitted' })).toBeVisible();
      });
      await user.click(screen.getByRole('button', { name: /Finish|FINISH/i }));
      await waitFor(() => {
        expect(navigation).toHaveBeenCalledWith(expect.stringMatching(/login/i));
      });
    });
  });

  describe('B2B-4466.use_register_company_flow disabled', () => {
    it('uses createB2BCompanyUser (B2B API) and does not call Storefront registerCompany', async () => {
      const { user } = renderWithProviders(
        <RegisteredProvider>
          <Registered setOpenPage={vi.fn()} />
        </RegisteredProvider>,
        { preloadedState: preloadedStateCatalystWithFFOff },
      );

      await completeB2BRegistration(user, b2bRegistrationData);

      await waitFor(() => {
        expect(b2bService.createB2BCompanyUser).toHaveBeenCalled();
      });
      expect(companyGraphqlModule.registerCompany).not.toHaveBeenCalled();
      expect(loginInfoModule.ensureBcGraphqlToken).not.toHaveBeenCalled();
      expect(bcModule.bcLogin).not.toHaveBeenCalled();
    });
  });
});
