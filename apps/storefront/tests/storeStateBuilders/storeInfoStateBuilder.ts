import { StoreInfo } from '@/store/slices/storeInfo';
import { builder } from 'tests/builder';

export const buildStoreInfoStateWith = builder<StoreInfo>(() => ({
  timeFormat: {
    display: 'M jS Y',
    export: 'M j Y',
    extendedDisplay: 'M j Y @ g:i A',
    offset: 0,
  },
}));
