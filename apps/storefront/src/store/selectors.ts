import { createSelector } from '@reduxjs/toolkit';

import { RootState } from '@/store';
import { CompanyStatus, Currency, CustomerRole, UserTypes } from '@/types';
import { getCorrespondsConfigurationPermission } from '@/utils/b3CheckPermissions/base';
import { B2BPermissionParams } from '@/utils/b3CheckPermissions/config';

import { defaultCurrenciesState } from './slices/storeConfigs';

const themeSelector = (state: RootState) => state.theme;
const storeConfigSelector = (state: RootState) => state.storeConfigs;
const companySelector = (state: RootState) => state.company;
const quoteInfoSelector = (state: RootState) => state.quoteInfo;
const b2bFeaturesSelector = (state: RootState) => state.b2bFeatures;

export const themeFrameSelector = createSelector(themeSelector, (theme) => theme.themeFrame);

export const defaultCurrencyInfoSelector = createSelector(storeConfigSelector, (storeConfigs) => {
  const defaultCurrency = storeConfigs.currencies.currencies.find(
    (currency) => currency.is_default,
  );

  return defaultCurrency || defaultCurrenciesState.currencies[0];
});
export const activeCurrencyInfoSelector = createSelector(
  storeConfigSelector,
  (storeConfigs): Currency => {
    const entityId = storeConfigs.activeCurrency?.node.entityId || '';
    const activeCurrency = storeConfigs.currencies.currencies.find(
      (currency) => +currency.id === +entityId,
    );

    return activeCurrency || defaultCurrenciesState.currencies[0];
  },
);

export const isLoggedInSelector = createSelector(
  companySelector,
  (company) => company.customer.role !== CustomerRole.GUEST,
);

export const isAgentingSelector = createSelector(
  b2bFeaturesSelector,
  (b2bFeatures) => b2bFeatures.masqueradeCompany.isAgenting,
);

export const isB2BUserSelector = createSelector(
  companySelector,
  (company) =>
    (company.customer.userType === UserTypes.MULTIPLE_B2C &&
      company.companyInfo.status === CompanyStatus.APPROVED) ||
    +company.customer.role === CustomerRole.SUPER_ADMIN,
);

interface OptionList {
  optionId: string;
  optionValue: string;
}

export const rolePermissionSelector = createSelector(
  companySelector,
  ({ permissions, companyHierarchyInfo: { selectCompanyHierarchyId } }): B2BPermissionParams => {
    return getCorrespondsConfigurationPermission(permissions, +selectCompanyHierarchyId);
  },
);

export const formattedQuoteDraftListSelector = createSelector(quoteInfoSelector, (quoteInfo) =>
  quoteInfo.draftQuoteList.map(
    ({ node: { optionList, calculatedValue, productsSearch, ...restItem } }) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const parsedOptionList: OptionList[] = JSON.parse(optionList);

      const optionSelections = parsedOptionList.map(({ optionId, optionValue }) => {
        const optionIdFormatted = optionId.match(/\d+/);

        return {
          optionId: optionIdFormatted?.[0] ? +optionIdFormatted[0] : optionId,
          optionValue: +optionValue,
        };
      });

      return {
        ...restItem,
        optionSelections,
      };
    },
  ),
);

export const isValidUserTypeSelector = createSelector(
  companySelector,
  ({ customer, companyInfo }) => {
    const { userType } = customer;
    const isB2BUser =
      (customer.userType === UserTypes.MULTIPLE_B2C &&
        companyInfo.status === CompanyStatus.APPROVED) ||
      +customer.role === CustomerRole.SUPER_ADMIN;

    if (isB2BUser) {
      return userType === UserTypes.DOES_NOT_EXIST;
    }

    return userType !== UserTypes.B2C;
  },
);
