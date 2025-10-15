import { useCallback, useEffect } from 'react';

import { getCompanySubsidiaries, getUserMasqueradingCompany } from '@/shared/service/b2b';
import { useAppDispatch, useAppSelector } from '@/store';
import { setCompanyHierarchyInfoModules } from '@/store/slices/company';
import { CompanyHierarchyListProps, CustomerRole } from '@/types';
import { buildHierarchy, flattenBuildHierarchyCompanies } from '@/utils';
import b2bLogger from '@/utils/b3Logger';
import { getAccountHierarchyIsEnabled } from '@/utils/storefrontConfig';

/**
 * Hook to manage company hierarchy state by fetching fresh data from server
 */
export const useCompanyHierarchy = () => {
  const dispatch = useAppDispatch();
  const { companyInfo, customer } = useAppSelector(({ company }) => company);
  const { companyHierarchyInfo } = useAppSelector(({ company }) => company);

  const resetCompanyHierarchyState = () => ({
    isEnabledCompanyHierarchy: false,
    companyHierarchyAllList: [],
    selectCompanyHierarchyId: '',
    companyHierarchyList: [],
    companyHierarchySelectSubsidiariesList: [],
  });

  const initializeCompanyHierarchy = useCallback(async () => {
    try {
      const { role } = customer;

      if (
        role === CustomerRole.ADMIN ||
        role === CustomerRole.SENIOR_BUYER ||
        role === CustomerRole.JUNIOR_BUYER ||
        role === CustomerRole.CUSTOM_ROLE
      ) {
        const isEnabledAccountHierarchy = await getAccountHierarchyIsEnabled();

        if (isEnabledAccountHierarchy) {
          const [{ companySubsidiaries }, { userMasqueradingCompany }] = await Promise.all([
            getCompanySubsidiaries(),
            getUserMasqueradingCompany(),
          ]);

          const currentRepresentationId = userMasqueradingCompany?.companyId ?? '';

          let subsidiaryList: CompanyHierarchyListProps[] = [];
          if (currentRepresentationId && companySubsidiaries?.length) {
            const hierarchyData = buildHierarchy({
              data: companySubsidiaries,
              companyId: Number(currentRepresentationId),
            });
            subsidiaryList = flattenBuildHierarchyCompanies(hierarchyData[0] || {});
          }

          dispatch(
            setCompanyHierarchyInfoModules({
              companyHierarchyAllList: companySubsidiaries || [],
              isEnabledCompanyHierarchy: isEnabledAccountHierarchy,
              selectCompanyHierarchyId: currentRepresentationId,
              companyHierarchyList: (companySubsidiaries || []).filter((item) => item.channelFlag),
              companyHierarchySelectSubsidiariesList: subsidiaryList,
            }),
          );
        } else {
          dispatch(setCompanyHierarchyInfoModules(resetCompanyHierarchyState()));
        }
      } else {
        dispatch(setCompanyHierarchyInfoModules(resetCompanyHierarchyState()));
      }
    } catch (error) {
      b2bLogger.error('Failed to initialize company hierarchy:', error);

      dispatch(setCompanyHierarchyInfoModules(resetCompanyHierarchyState()));
    }
  }, [dispatch, customer]);

  useEffect(() => {
    const initializeIfReady = () => {
      if (customer.id && companyInfo.id) {
        initializeCompanyHierarchy();
      }
    };

    initializeIfReady();

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        initializeIfReady();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [customer.id, companyInfo.id, initializeCompanyHierarchy]);

  return {
    initializeCompanyHierarchy,
    companyHierarchyInfo,
  };
};
