import { faker } from '@faker-js/faker';
import { PersistPartial } from 'redux-persist/es/persistReducer';
import { builder } from 'tests/builder';

import { MasqueradeCompany } from '@/store/slices/b2bFeatures';

export const buildB2BFeaturesStateWith = builder<MasqueradeCompany & PersistPartial>(() => ({
  masqueradeCompany: {
    id: faker.number.int(),
    isAgenting: faker.datatype.boolean(),
    companyName: faker.company.name(),
    customerGroupId: faker.number.int(),
  },
  _persist: {
    version: faker.number.int({ min: 1 }),
    rehydrated: faker.datatype.boolean(),
  },
}));
