import { store } from '@/store';
import { clearCompanySlice } from '@/store/slices/company';
import { resetDraftQuoteInfo, resetDraftQuoteList } from '@/store/slices/quoteInfo';

export const logoutSession = () => {
  store.dispatch(clearCompanySlice());
  store.dispatch(resetDraftQuoteList());
  store.dispatch(resetDraftQuoteInfo());
};
