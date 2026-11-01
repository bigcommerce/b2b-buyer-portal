import { faker } from '@faker-js/faker';
import { PersistPartial } from 'redux-persist/es/persistReducer';
import { builder } from 'tests/builder';

import { QuoteInfoState } from '@/store/slices/quoteInfo';
import { QuoteItem } from '@/types/quotes';

// Only an item's presence matters to the draft-quote confirmation gate, so the
// product payload is left empty here.
export const buildDraftQuoteItemWith = builder<QuoteItem>(() => ({
  node: {
    id: faker.number.int().toString(),
    basePrice: faker.number.int(),
    quantity: faker.number.int({ min: 1 }),
    taxPrice: faker.number.int(),
    optionList: '[]',
    calculatedValue: {},
    productsSearch: {} as QuoteItem['node']['productsSearch'],
  },
}));

const buildAddressWith = () => ({
  address: faker.location.streetAddress(),
  addressId: faker.number.int(),
  apartment: faker.location.secondaryAddress(),
  companyName: faker.company.name(),
  city: faker.location.city(),
  country: faker.location.country(),
  firstName: faker.person.firstName(),
  label: faker.lorem.word(),
  lastName: faker.person.lastName(),
  phoneNumber: faker.phone.number(),
  state: faker.location.state(),
  zipCode: faker.location.zipCode(),
});

export const buildQuoteInfoStateWith = builder<QuoteInfoState & PersistPartial>(() => ({
  draftQuoteList: [],
  draftQuoteInfo: {
    userId: faker.number.int(),
    contactInfo: {
      name: faker.person.fullName(),
      email: faker.internet.email(),
      companyName: faker.company.name(),
      phoneNumber: faker.phone.number(),
      quoteTitle: faker.commerce.productName(),
    },
    shippingAddress: buildAddressWith(),
    billingAddress: buildAddressWith(),
    fileInfo: [],
    note: '',
    referenceNumber: '',
    extraFields: [],
    recipients: [],
    totalIsTbd: false,
  },
  quoteDetailToCheckoutUrl: '',
  _persist: { version: 1, rehydrated: true },
}));
