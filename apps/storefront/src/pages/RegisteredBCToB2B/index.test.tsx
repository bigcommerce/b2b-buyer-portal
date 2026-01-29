import userEvent from '@testing-library/user-event';
import {
  buildCompanyStateWith,
  builder,
  faker,
  renderWithProviders,
  screen,
  waitFor,
} from 'tests/test-utils';

import {
  createB2BCompanyUser,
  getB2BAccountFormFields,
  getB2BCountries,
  validateBCCompanyExtraFields,
  validateBCCompanyUserExtraFields,
} from '@/shared/service/b2b';
import { CustomerRole } from '@/types';
import { getCurrentCustomerInfo } from '@/utils/loginInfo';

import { RegisteredProvider } from '../Registered/context/RegisteredContext';

import RegisteredBCToB2B from '.';

vi.mock('@/shared/service/b2b');
vi.mock('@/utils/loginInfo');
vi.mock('@/utils/storefrontConfig');
vi.mock('@/utils/b3Login', () => ({
  loginJump: vi.fn(() => true),
}));

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

const formType3Fields = [
  {
    id: '1',
    formType: 3,
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
    formType: 3,
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
    formType: 3,
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
    formType: 3,
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
    id: '10',
    formType: 3,
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
    formType: 3,
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
    formType: 3,
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
    id: '17',
    formType: 3,
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
    formType: 3,
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
    formType: 3,
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
    formType: 3,
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
    formType: 3,
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
    formType: 3,
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
];

const buildRegistrationDataWith = builder(() => ({
  businessDetails: {
    'Company Name': faker.company.name(),
    'Company Email': faker.internet.email(),
    'Company Phone Number': faker.phone.number(),
  },
  address: {
    Country: 'United States',
    'Address 1': faker.location.streetAddress(),
    'Address 2': faker.location.secondaryAddress(),
    City: faker.location.city(),
    State: 'California',
    'Zip Code': faker.location.zipCode(),
  },
}));

describe('RegisteredBCToB2B Page', () => {
  const customerEmail = 'john.doe@example.com';
  const customerId = 123;

  const loggedInCustomer = buildCompanyStateWith({
    tokens: { B2BToken: faker.string.uuid() },
    customer: {
      id: customerId,
      firstName: 'John',
      lastName: 'Doe',
      emailAddress: customerEmail,
      phoneNumber: '1234567890',
      role: CustomerRole.B2C,
    },
  });

  beforeEach(() => {
    vi.mocked(getB2BAccountFormFields).mockResolvedValue({ accountFormFields: formType3Fields });
    vi.mocked(getB2BCountries).mockResolvedValue(mockCountries);
    vi.mocked(validateBCCompanyExtraFields).mockResolvedValue({ code: 200 });
    vi.mocked(validateBCCompanyUserExtraFields).mockResolvedValue({ code: 200 });
    vi.mocked(createB2BCompanyUser).mockResolvedValue({
      companyCreate: { company: { companyStatus: 1 } },
    });
    vi.mocked(getCurrentCustomerInfo).mockResolvedValue({
      userType: 5,
      role: 2,
      companyRoleName: 'Junior Buyer',
    });
  });

  it('completes BC to B2B conversion flow successfully', async () => {
    const { navigation } = renderWithProviders(
      <RegisteredProvider>
        <RegisteredBCToB2B setOpenPage={vi.fn()} />
      </RegisteredProvider>,
      {
        preloadedState: { company: loggedInCustomer },
      },
    );

    await waitFor(() => {
      expect(screen.getByLabelText('Company Name', { exact: false })).toBeInTheDocument();
    });

    const testData = buildRegistrationDataWith('WHATEVER_VALUES');

    // Fill business details
    await userEvent.type(
      screen.getByLabelText('Company Name', { exact: false }),
      testData.businessDetails['Company Name'],
    );
    await userEvent.type(
      screen.getByLabelText('Company Email', { exact: false }),
      testData.businessDetails['Company Email'],
    );
    await userEvent.type(
      screen.getByLabelText('Company Phone Number', { exact: false }),
      testData.businessDetails['Company Phone Number'],
    );

    // Fill address
    await userEvent.click(screen.getByLabelText('Country', { exact: false }));
    await userEvent.click(screen.getByRole('option', { name: testData.address.Country }));

    await userEvent.type(
      screen.getByLabelText('Address 1', { exact: false }),
      testData.address['Address 1'],
    );
    await userEvent.type(
      screen.getByLabelText('Address 2', { exact: false }),
      testData.address['Address 2'],
    );
    await userEvent.type(screen.getByLabelText('City', { exact: false }), testData.address.City);

    const stateInputs = screen.getAllByLabelText('State', { exact: false });
    await userEvent.click(stateInputs[stateInputs.length - 1]);
    await userEvent.click(screen.getByRole('option', { name: testData.address.State }));

    await userEvent.type(
      screen.getByLabelText('Zip Code', { exact: false }),
      testData.address['Zip Code'],
    );

    await userEvent.click(screen.getByRole('button', { name: /Register|Submit/i }));

    await waitFor(() => {
      expect(createB2BCompanyUser).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByText(/Your company account application has been approved/i)).toBeVisible();
    });

    const finishButton = screen.getByRole('button', { name: /Finish/i });
    await userEvent.click(finishButton);

    await waitFor(() => {
      expect(navigation).toHaveBeenCalledWith('/orders');
    });
  });

  it('passes customerEmail from Redux to createB2BCompanyUser', async () => {
    renderWithProviders(
      <RegisteredProvider>
        <RegisteredBCToB2B setOpenPage={vi.fn()} />
      </RegisteredProvider>,
      {
        preloadedState: { company: loggedInCustomer },
      },
    );

    await waitFor(() => {
      expect(screen.getByLabelText('Company Name', { exact: false })).toBeInTheDocument();
    });

    // Fill business details with specific test values
    await userEvent.type(screen.getByLabelText('Company Name', { exact: false }), 'Test Co');
    await userEvent.type(
      screen.getByLabelText('Company Email', { exact: false }),
      'test.co@example.com',
    );
    await userEvent.type(
      screen.getByLabelText('Company Phone Number', { exact: false }),
      '1234567890',
    );

    // Fill address with specific test values
    await userEvent.click(screen.getByLabelText('Country', { exact: false }));
    await userEvent.click(screen.getByRole('option', { name: 'United States' }));

    await userEvent.type(screen.getByLabelText('Address 1', { exact: false }), '2 bb street');
    await userEvent.type(screen.getByLabelText('Address 2', { exact: false }), 'suite 100');
    await userEvent.type(screen.getByLabelText('City', { exact: false }), 'New York');

    const stateInputs = screen.getAllByLabelText('State', { exact: false });
    await userEvent.click(stateInputs[stateInputs.length - 1]);
    await userEvent.click(screen.getByRole('option', { name: 'California' }));

    await userEvent.type(screen.getByLabelText('Zip Code', { exact: false }), '54321');

    await userEvent.click(screen.getByRole('button', { name: /Register|Submit/i }));

    await waitFor(() => {
      expect(createB2BCompanyUser).toHaveBeenCalled();
    });

    // Verify that createB2BCompanyUser was called with customerEmail from Redux
    const callArgs = vi.mocked(createB2BCompanyUser).mock.calls[0][0];
    expect(callArgs).toEqual(
      expect.objectContaining({
        customerId,
        customerEmail,
        companyName: 'Test Co',
        companyEmail: 'test.co@example.com',
        companyPhoneNumber: '1234567890',
        country: 'United States',
        addressLine1: '2 bb street',
        addressLine2: 'suite 100',
        city: 'New York',
        state: 'California',
        zip_code: '54321',
        storeHash: 'store-hash',
        channelId: 1,
      }),
    );
  });

  it('redirects to login when registerEnabled is false', async () => {
    const { navigation } = renderWithProviders(
      <RegisteredProvider>
        <RegisteredBCToB2B setOpenPage={vi.fn()} />
      </RegisteredProvider>,
      {
        preloadedState: { company: loggedInCustomer },
        initialGlobalContext: { registerEnabled: false },
      },
    );

    await waitFor(() => {
      expect(navigation).toHaveBeenCalledWith('/login');
    });
  });
});
