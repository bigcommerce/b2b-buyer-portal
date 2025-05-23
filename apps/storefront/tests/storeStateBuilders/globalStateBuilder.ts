import { faker } from '@faker-js/faker';
import { PersistPartial } from 'redux-persist/es/persistReducer';
import { builder } from 'tests/builder';

import { GlobalState } from '@/store/slices/global';

export const buildGlobalStateWith = builder<GlobalState & PersistPartial>(() => ({
  taxZoneRates: [],
  isClickEnterBtn: faker.datatype.boolean(),
  currentClickedUrl: faker.internet.url(),
  isRegisterAndLogin: faker.datatype.boolean(),
  isPageComplete: faker.datatype.boolean(),
  globalMessage: {
    open: faker.datatype.boolean(),
    title: faker.lorem.sentence(),
    message: faker.lorem.sentence(),
    cancelText: faker.lorem.word(),
  },
  setOpenPageFn: faker.datatype.boolean() ? () => {} : undefined,
  showInclusiveTaxPrice: faker.datatype.boolean(),
  blockPendingAccountViewPrice: faker.datatype.boolean(),
  cartNumber: faker.number.int({ min: 0, max: 100 }),
  storeInfo: {
    b2bEnabled: faker.datatype.boolean(),
    b3ChannelId: faker.number.int({ min: 0, max: 100 }),
    channelId: faker.number.int({ min: 0, max: 100 }),
    channelLogo: faker.image.url(),
    iconUrl: faker.image.url(),
    isEnabled: faker.datatype.boolean(),
    platform: faker.helpers.arrayElement(['bigcommerce', 'others']),
    translationVersion: faker.number.int({ min: 0, max: 100 }),
    type: faker.helpers.arrayElement(['b2b', 'b3']),
    urls: [],
  },
  blockPendingQuoteNonPurchasableOOS: {
    isEnableProduct: faker.datatype.boolean(),
    isEnableRequest: faker.datatype.boolean(),
  },
  loginLandingLocation: faker.internet.url(),
  recordOpenHash: faker.lorem.word(),
  quoteSubmissionResponse: {
    value: faker.lorem.sentence(),
    key: faker.lorem.word(),
    message: faker.lorem.sentence(),
    title: faker.lorem.sentence(),
  },
  isOpenCompanyHierarchyDropDown: faker.datatype.boolean(),
  _persist: {
    version: 1,
    rehydrated: true,
  },
}));
