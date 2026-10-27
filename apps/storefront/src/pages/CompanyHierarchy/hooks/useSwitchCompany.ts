import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';

import { PAGES_SUBSIDIARIES_PERMISSION_KEYS } from '@/constants';
import { useB3Lang } from '@/lib/lang';
import { endUserMasqueradingCompany, startUserMasqueradingCompany } from '@/shared/service/b2b';
import { deleteCart } from '@/shared/service/bc/graphql/cart';
import { store, useAppSelector } from '@/store';
import { setCompanyHierarchyInfoModules } from '@/store/slices/company';
import { setCartNumber } from '@/store/slices/global';
import { resetDraftQuote } from '@/store/slices/quoteInfo';
import {
  CompanyHierarchyListProps,
  CompanyHierarchyProps,
  PagesSubsidiariesPermissionProps,
} from '@/types';
import { buildHierarchy, flattenBuildHierarchyCompanies } from '@/utils/b3Company';
import { snackbar } from '@/utils/b3Tip';
import { deleteCartData } from '@/utils/cartUtils';
import { CompanyStatusKey, isCompanyError } from '@/utils/companyUtils';

const COMPANY_STATUS_MAPPINGS: Record<CompanyStatusKey, string> = {
  pendingApprovalToViewPrices:
    'global.statusNotifications.willGainAccessToBusinessFeatProductsAndPricingAfterApproval',
  pendingApprovalToOrder:
    'global.statusNotifications.productsPricingAndOrderingWillBeEnabledAfterApproval',
  pendingApprovalToAccessFeatures:
    'global.statusNotifications.willGainAccessToBusinessFeatAfterApproval',
  accountInactive: 'global.statusNotifications.businessAccountInactive',
};

export function useSwitchCompany() {
  const navigate = useNavigate();
  const b3Lang = useB3Lang();

  const { id: currentCompanyId } = useAppSelector(({ company }) => company.companyInfo);
  const { pagesSubsidiariesPermission } = useAppSelector(({ company }) => company);
  const { isHasCurrentPagePermission, companyHierarchyAllList: allList } = useAppSelector(
    ({ company }) => company.companyHierarchyInfo,
  );

  const [loading, setLoading] = useState<boolean>(false);

  const navigateAfterSwitch = (
    currentRow: Partial<CompanyHierarchyProps>,
    isMasquerading: boolean,
  ) => {
    const { companyId } = currentRow;
    if (companyId === Number(currentCompanyId)) {
      const { hash } = window.location;
      if (hash.includes('/shoppingList/')) {
        navigate('/shoppingLists');
      }
    }
    if (!isMasquerading) return;
    if (companyId !== Number(currentCompanyId) && !isHasCurrentPagePermission) {
      const key = Object.keys(pagesSubsidiariesPermission).find(
        (key) => !!pagesSubsidiariesPermission[key as keyof PagesSubsidiariesPermissionProps],
      );
      const route = PAGES_SUBSIDIARIES_PERMISSION_KEYS.find((item) => item.key === key);
      if (route) {
        navigate(route.path);
      }
    }
  };

  const switchCompany = async (
    currentRow: Partial<CompanyHierarchyProps> | null,
    companyHierarchyAllList?: CompanyHierarchyListProps[] | [],
  ) => {
    if (!currentRow) return;
    let isMasquerading = false;
    try {
      setLoading(true);

      const cartEntityId = Cookies.get('cartId');
      const { companyId } = currentRow;

      if (!companyId) return;

      if (companyId === Number(currentCompanyId)) {
        await endUserMasqueradingCompany();
        isMasquerading = false;
      } else {
        await startUserMasqueradingCompany(Number(companyId));
        isMasquerading = true;
      }

      if (cartEntityId) {
        await deleteCart(deleteCartData(cartEntityId));
        store.dispatch(setCartNumber(0));
      }

      store.dispatch(resetDraftQuote());

      const selectCompanyHierarchyId = companyId === Number(currentCompanyId) ? '' : companyId;
      const buildData = companyHierarchyAllList || allList;

      store.dispatch(
        setCompanyHierarchyInfoModules({
          selectCompanyHierarchyId,
          ...(companyHierarchyAllList && { companyHierarchyAllList }),
          companyHierarchySelectSubsidiariesList: flattenBuildHierarchyCompanies(
            buildHierarchy({
              data: buildData,
              companyId,
            })[0],
          ),
        }),
      );

      navigateAfterSwitch(currentRow, isMasquerading);
    } catch (error) {
      if (isCompanyError(error)) {
        snackbar.error(b3Lang(COMPANY_STATUS_MAPPINGS[error.reason]));
      } else if (error instanceof Error) {
        snackbar.error(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return { switchCompany, loading };
}
