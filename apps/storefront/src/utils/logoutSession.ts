import { store } from '@/store';
import { clearMasqueradeCompany } from '@/store/slices/b2bFeatures';
import { clearCompanySlice } from '@/store/slices/company';
import { resetDraftQuoteInfo, resetDraftQuoteList } from '@/store/slices/quoteInfo';

export const logoutSession = () => {
  store.dispatch(clearCompanySlice());
  store.dispatch(clearMasqueradeCompany());
  store.dispatch(resetDraftQuoteList());
  store.dispatch(resetDraftQuoteInfo());
};
