import {
  buildCompanyStateWith,
  builder,
  faker,
  http,
  HttpResponse,
  renderWithProviders,
  screen,
  startMockServer,
  waitFor,
} from 'tests/test-utils';

import { CustomerRole } from '@/types';
import { getCurrentCustomerInfo } from '@/utils/loginInfo';

import { RegisteredProvider } from '../Registered/context/RegisteredContext';

import RegisteredBCToB2B from '.';

vi.mock('@/utils/loginInfo');
vi.mock('@/utils/storefrontConfig');
vi.mock('@/utils/b3Login', () => ({
  loginJump: vi.fn(() => true),
}));

const { server } = startMockServer();

const buildStateWith = builder(() => ({
  stateName: faker.location.state(),
  stateCode: faker.string.alpha(2).toUpperCase(),
}));

const buildCountryWith = builder(() => ({
  countryCode: faker.location.countryCode(),
  countryName: faker.location.country(),
  id: faker.string.numeric(2),
  states: [buildStateWith('WHATEVER_VALUES')],
}));

const buildCountriesResponseWith = builder(() => ({
  countries: [
    buildCountryWith({
      countryCode: 'AU',
      countryName: 'Australia',
      id: '13',
      states: [buildStateWith({ stateName: 'Australian Capital Territory', stateCode: 'ACT' })],
    }),
    buildCountryWith({
      countryCode: 'US',
      countryName: 'United States',
      id: '1',
      states: [buildStateWith({ stateName: 'California', stateCode: 'CA' })],
    }),
  ],
}));

const buildAccountFormFieldWith = builder(() => ({
  id: faker.string.numeric(),
  formType: 3,
  fieldFrom: 10,
  fieldId: `field_${faker.string.alphanumeric(8)}`,
  groupId: faker.helpers.arrayElement([1, 3, 4]),
  groupName: faker.helpers.arrayElement(['Contact Information', 'Business Details', 'Address']),
  isRequired: true,
  visible: true,
  labelName: faker.lorem.word(),
  fieldName: faker.lorem.word(),
  fieldType: 'text',
  valueConfigs: { label: faker.lorem.word() },
}));

const formType3Fields = [
  buildAccountFormFieldWith({
    id: '1',
    fieldId: 'field_first_name',
    groupId: 1,
    groupName: 'Contact Information',
    labelName: 'First Name',
    fieldName: 'first_name',
    valueConfigs: { label: 'First Name' },
  }),
  buildAccountFormFieldWith({
    id: '3',
    fieldId: 'field_last_name',
    groupId: 1,
    groupName: 'Contact Information',
    labelName: 'Last Name',
    fieldName: 'last_name',
    valueConfigs: { label: 'Last Name' },
  }),
  buildAccountFormFieldWith({
    id: '5',
    fieldId: 'field_email',
    groupId: 1,
    groupName: 'Contact Information',
    labelName: 'Email Address',
    fieldName: 'email',
    valueConfigs: { label: 'Email Address' },
  }),
  buildAccountFormFieldWith({
    id: '7',
    fieldId: 'field_phone_number',
    groupId: 1,
    groupName: 'Contact Information',
    isRequired: false,
    labelName: 'Phone Number',
    fieldName: 'phone',
    valueConfigs: { label: 'Phone Number' },
  }),
  buildAccountFormFieldWith({
    id: '10',
    fieldId: 'field_company_name',
    groupId: 3,
    groupName: 'Business Details',
    labelName: 'Company Name',
    fieldName: 'company_name',
    valueConfigs: { label: 'Company Name' },
  }),
  buildAccountFormFieldWith({
    id: '13',
    fieldId: 'field_company_email',
    groupId: 3,
    groupName: 'Business Details',
    labelName: 'Company Email',
    fieldName: 'company_email',
    valueConfigs: { label: 'Company Email' },
  }),
  buildAccountFormFieldWith({
    id: '14',
    fieldId: 'field_company_phone_number',
    groupId: 3,
    groupName: 'Business Details',
    labelName: 'Company Phone Number',
    fieldName: 'company_phone_number',
    valueConfigs: { label: 'Company Phone Number' },
  }),
  buildAccountFormFieldWith({
    id: '17',
    fieldId: 'field_country',
    groupId: 4,
    groupName: 'Address',
    labelName: 'Country',
    fieldName: 'country',
    fieldType: 'dropdown',
    valueConfigs: { label: 'Country', default: null } as { label: string; default?: null },
  }),
  buildAccountFormFieldWith({
    id: '18',
    fieldId: 'field_address_1',
    groupId: 4,
    groupName: 'Address',
    labelName: 'Address 1',
    fieldName: 'address1',
    valueConfigs: { label: 'Address 1' },
  }),
  buildAccountFormFieldWith({
    id: '20',
    fieldId: 'field_address_2',
    groupId: 4,
    groupName: 'Address',
    isRequired: false,
    labelName: 'Address 2',
    fieldName: 'address2',
    valueConfigs: { label: 'Address 2' },
  }),
  buildAccountFormFieldWith({
    id: '21',
    fieldId: 'field_city',
    groupId: 4,
    groupName: 'Address',
    labelName: 'City',
    fieldName: 'city',
    valueConfigs: { label: 'City' },
  }),
  buildAccountFormFieldWith({
    id: '22',
    fieldId: 'field_state',
    groupId: 4,
    groupName: 'Address',
    labelName: 'State',
    fieldName: 'state',
    fieldType: 'dropdown',
    valueConfigs: { label: 'State' },
  }),
  buildAccountFormFieldWith({
    id: '23',
    fieldId: 'field_zip_code',
    groupId: 4,
    groupName: 'Address',
    labelName: 'Zip Code',
    fieldName: 'zip_code',
    valueConfigs: { label: 'Zip Code' },
  }),
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

type BCToB2BRegistrationData = {
  businessDetails: Record<string, string>;
  address: Record<string, string>;
};

async function completeRegistration(
  user: ReturnType<typeof renderWithProviders>['user'],
  { businessDetails, address }: BCToB2BRegistrationData,
) {
  // Wait for form to load
  await waitFor(() => {
    expect(screen.getByLabelText('Company Name', { exact: false })).toBeInTheDocument();
  });

  // Fill business details
  if (businessDetails['Company Name']) {
    await user.type(
      screen.getByLabelText('Company Name', { exact: false }),
      businessDetails['Company Name'],
    );
  }
  if (businessDetails['Company Email']) {
    await user.type(
      screen.getByLabelText('Company Email', { exact: false }),
      businessDetails['Company Email'],
    );
  }
  if (businessDetails['Company Phone Number']) {
    await user.type(
      screen.getByLabelText('Company Phone Number', { exact: false }),
      businessDetails['Company Phone Number'],
    );
  }

  // Fill address
  if (address.Country) {
    await user.click(screen.getByLabelText('Country', { exact: false }));
    await user.click(screen.getByRole('option', { name: address.Country }));
  }
  if (address['Address 1']) {
    await user.type(screen.getByLabelText('Address 1', { exact: false }), address['Address 1']);
  }
  if (address['Address 2']) {
    await user.type(screen.getByLabelText('Address 2', { exact: false }), address['Address 2']);
  }
  if (address.City) {
    await user.type(screen.getByLabelText('City', { exact: false }), address.City);
  }
  if (address.State) {
    await user.click(screen.getByRole('combobox', { name: /State/i }));
    await user.click(screen.getByRole('option', { name: address.State }));
  }
  if (address['Zip Code']) {
    await user.type(screen.getByLabelText('Zip Code', { exact: false }), address['Zip Code']);
  }

  // Submit the form
  await user.click(screen.getByRole('button', { name: /Submit/i }));

  // Wait for completion
  await waitFor(() => {
    expect(screen.getByRole('button', { name: /Finish/i })).toBeInTheDocument();
  });
}

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
    server.use(
      http.post('*/graphql', async ({ request }) => {
        const body = (await request.json()) as { query?: string };
        const query = body.query ?? '';

        if (query.includes('B2BAccountFormFields')) {
          return HttpResponse.json({ data: { accountFormFields: formType3Fields } });
        }
        if (query.includes('countries(storeHash')) {
          return HttpResponse.json({ data: buildCountriesResponseWith({}) });
        }
        if (query.includes('companyCreate')) {
          return HttpResponse.json({
            data: { companyCreate: { company: { companyStatus: 1 } } },
          });
        }
        return undefined;
      }),
      http.post('*/api/v2/extra-fields/company/validate', () => HttpResponse.json({ code: 200 })),
      http.post('*/api/v2/extra-fields/user/validate', () => HttpResponse.json({ code: 200 })),
    );
    vi.mocked(getCurrentCustomerInfo).mockResolvedValue({
      userType: 5,
      role: 2,
      companyRoleName: 'Junior Buyer',
    });
  });

  it('completes BC to B2B conversion flow successfully', async () => {
    const { navigation, user } = renderWithProviders(
      <RegisteredProvider>
        <RegisteredBCToB2B setOpenPage={vi.fn()} />
      </RegisteredProvider>,
      {
        preloadedState: { company: loggedInCustomer },
      },
    );

    const testData = buildRegistrationDataWith('WHATEVER_VALUES');
    await completeRegistration(user, testData);

    const finishButton = screen.getByRole('button', { name: /Finish/i });
    await user.click(finishButton);

    // Expect /orders because companyAutoApproval.enabled is true (default from CustomStyleContext)
    await waitFor(() => {
      expect(navigation).toHaveBeenCalledWith('/orders');
    });
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
