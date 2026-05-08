import isEmpty from 'lodash-es/isEmpty';

import { LOGIN_LANDING_LOCATIONS } from '@/constants';
import { CustomStyleButtonState } from '@/shared/customStyleButton/context/config';
import { DispatchProps } from '@/shared/global/context/config';
import { newPermissions } from '@/shared/routes/config';
import {
  endUserMasqueradingCompany,
  getCurrencies,
  getStoreConfigsSwitchStatus,
  getStorefrontConfig,
  getStorefrontConfigs,
  getStorefrontConfigWithCompanyHierarchy,
  getStorefrontDefaultLanguages,
} from '@/shared/service/b2b';
import { getActiveBcCurrency } from '@/shared/service/bc';
import { getStorefrontTaxDisplayType } from '@/shared/service/bc/graphql/tax';
import { store } from '@/store';
import { setCompanyHierarchyInfoModules } from '@/store/slices/company';
import {
  setBlockPendingAccountViewPrice,
  setBlockPendingQuoteNonPurchasableOOS,
  setFeatureFlags,
  setLoginLandingLocation,
  setQuoteSubmissionResponse,
  setShowInclusiveTaxPrice,
} from '@/store/slices/global';
import { setActiveCurrency, setCurrencies } from '@/store/slices/storeConfigs';
import { B3SStorage } from '@/utils/b3Storage';
import { channelId } from '@/utils/basicConfig';
import { FeatureFlagKey, featureFlags } from '@/utils/featureFlags';

import { checkEveryPermissionsCode } from './b3CheckPermissions/check';

interface StorefrontKeysProps {
  key: string;
  name: string;
}

interface CurrencyNodeProps {
  node: {
    entityId: number;
    isActive: boolean;
  };
}

const storefrontKeys: StorefrontKeysProps[] = [
  {
    key: 'quote_on_product_page',
    name: 'addQuoteBtn',
  },
  {
    key: 'login_page_html',
    name: 'loginPageHtml',
  },
  {
    key: 'login_page_display',
    name: 'loginPageDisplay',
  },
  {
    key: 'login_page_button',
    name: 'loginPageButton',
  },
  {
    key: 'account_login_registration',
    name: 'accountLoginRegistration',
  },
  {
    key: 'quote_on_cart_page',
    name: 'addToAllQuoteBtn',
  },
  {
    key: 'portal_style',
    name: 'portalStyle',
  },
  {
    key: 'masquerade_button',
    name: 'masqueradeButton',
  },
  {
    key: 'switch_account_button',
    name: 'switchAccountButton',
  },
  {
    key: 'quote_floating_action_button',
    name: 'floatingAction',
  },
  {
    key: 'shopping_list_on_product_page',
    name: 'shoppingListBtn',
  },
  {
    key: 'quote_customer',
    name: 'quote_customer',
  },
  {
    key: 'quote_for_guest',
    name: 'quote_for_guest',
  },
  {
    key: 'quote_for_individual_customer',
    name: 'quote_for_individual_customer',
  },
  {
    key: 'quote_for_b2b',
    name: 'quote_for_b2b',
  },
  {
    key: 'quote_logo',
    name: 'quote_logo',
  },
  {
    key: 'company_auto_approval',
    name: 'companyAutoApproval',
  },
  {
    key: 'block_pending_account_order_creation',
    name: 'blockPendingAccountOrderCreation',
  },
  {
    key: 'block_pending_account_seeing_products_pricing',
    name: 'blockPendingAccountViewPrice',
  },
  {
    key: 'css_override',
    name: 'cssOverride',
  },
  {
    key: 'non_purchasable_quote',
    name: 'nonPurchasableQuote',
  },
  {
    key: 'quote_auto_quoting',
    name: 'quoteAutoQuoting',
  },
  {
    key: 'buyer_non_purchasable_quote',
    name: 'buyerNonPurchasableQuote',
  },
  {
    key: 'quote_on_non_purchasable_product_page',
    name: 'quoteOnNonPurchasableProductPageBtn',
  },
  {
    key: 'login_landing_location',
    name: 'loginLandingLocation',
  },
  {
    key: 'quote_submission_response',
    name: 'quoteSubmissionResponse',
  },
  ...featureFlags,
];

const getStoreConfigs = async (dispatch: any, dispatchGlobal: any) => {
  const keys = storefrontKeys.map((item: StorefrontKeysProps) => item.key);
  const { storefrontConfigs } = await getStorefrontConfigs(channelId, keys);

  let logo = '';

  const obj: Partial<CustomStyleButtonState> | {} = {};
  let blockPendingAccountOrderCreation = true;
  let blockPendingAccountViewPrice = true;
  storefrontConfigs.forEach((currentItem: CustomFieldItems) => {
    const item = currentItem;
    const storefrontKey: StorefrontKeysProps | undefined = storefrontKeys.find(
      (option) => option.key === item.key,
    );
    const storefrontConfig = item;
    if (!isEmpty(storefrontKey)) {
      if (storefrontKey.key === 'quote_logo') {
        logo = item.value;
      }
      if (storefrontKey.key === 'quote_on_product_page') {
        storefrontConfig.extraFields = {
          ...item.extraFields,
          locationSelector: item.extraFields?.locationSelector || '.add-to-cart-buttons',
          classSelector: item.extraFields?.classSelector || 'button',
          customCss: item.extraFields?.customCss || 'margin-top: 0.5rem',
        };
      }

      if (storefrontKey.key === 'quote_on_cart_page') {
        storefrontConfig.extraFields = {
          ...item.extraFields,
          classSelector: item.extraFields?.classSelector || 'button',
        };
      }
      if (storefrontKey.key === 'masquerade_button') {
        storefrontConfig.extraFields = {
          ...item.extraFields,
          color: item.extraFields?.color || '#ED6C02',
          location: item.extraFields?.location || ' bottomLeft',
          horizontalPadding: item.extraFields?.horizontalPadding || '',
          verticalPadding: item.extraFields?.verticalPadding || '',
        };
      }

      if (storefrontKey.key === 'switch_account_button') {
        storefrontConfig.extraFields = {
          ...item.extraFields,
          color: item.extraFields?.color || '#ED6C02',
          location: item.extraFields?.location || ' bottomLeft',
          horizontalPadding: item.extraFields?.horizontalPadding || '',
          verticalPadding: item.extraFields?.verticalPadding || '',
        };
      }

      if (storefrontKey.key === 'quote_floating_action_button') {
        storefrontConfig.extraFields = {
          ...item.extraFields,
          color: item.extraFields?.color || '#E00F36',
          location: item.extraFields?.location || ' bottomRight',
          horizontalPadding: item.extraFields?.horizontalPadding || '',
          verticalPadding: item.extraFields?.verticalPadding || '',
        };
      }

      if (storefrontKey.key === 'shopping_list_on_product_page') {
        storefrontConfig.extraFields = {
          ...item.extraFields,
          locationSelector: item.extraFields?.locationSelector || '.add-to-cart-buttons',
          classSelector: item.extraFields?.classSelector || 'button',
          customCss: item.extraFields?.customCss || 'margin-top: 0.5rem',
        };
      }

      if (storefrontKey.key === 'block_pending_account_order_creation') {
        blockPendingAccountOrderCreation = item.value === '1';
        B3SStorage.set('blockPendingAccountOrderCreation', blockPendingAccountOrderCreation);
      }

      if (storefrontKey.key === 'block_pending_account_seeing_products_pricing') {
        blockPendingAccountViewPrice = item.value === '1';
        B3SStorage.set('blockPendingAccountViewPrice', blockPendingAccountViewPrice);
        store.dispatch(setBlockPendingAccountViewPrice(blockPendingAccountViewPrice));
      }

      if (storefrontKey.key === 'non_purchasable_quote') {
        store.dispatch(
          setBlockPendingQuoteNonPurchasableOOS({
            isEnableProduct: item.value === '1',
          }),
        );
      }

      if (storefrontKey.key === 'quote_on_non_purchasable_product_page') {
        storefrontConfig.extraFields = {
          ...item.extraFields,
          locationSelector: item.extraFields?.locationSelector || '',
          classSelector: item.extraFields?.classSelector || 'button',
          customCss: item.extraFields?.customCss || 'margin-top: 0.5rem',
        };
      }

      if (storefrontKey.key === 'buyer_non_purchasable_quote') {
        store.dispatch(
          setBlockPendingQuoteNonPurchasableOOS({
            isEnableRequest: item.value === '1',
          }),
        );
      }

      if (storefrontKey.key === 'login_landing_location') {
        store.dispatch(
          setLoginLandingLocation(
            item?.extraFields?.location || LOGIN_LANDING_LOCATIONS.BUYER_PORTAL,
          ),
        );
      }

      if (storefrontKey.key === 'quote_submission_response') {
        store.dispatch(
          setQuoteSubmissionResponse({
            key: item.key,
            value: item.value,
            ...item.extraFields,
          }),
        );
      }

      if (featureFlags.some((ff) => ff.key === storefrontKey.key)) {
        store.dispatch(
          setFeatureFlags({
            [storefrontKey.key as FeatureFlagKey]: item.value === 'true',
          }),
        );
      }

      (obj as CustomFieldItems)[(storefrontKey as StorefrontKeysProps).name] = {
        ...item.extraFields,
        enabled: item.value === '1',
      };
    }
  });

  dispatchGlobal({
    type: 'common',
    payload: {
      logo,
      quoteConfig: storefrontConfigs,
      blockPendingAccountOrderCreation,
    },
  });

  dispatch({
    type: 'merge',
    payload: {
      ...obj,
    },
  });
};

export const getAccountHierarchyIsEnabled = async () => {
  const { storeConfigSwitchStatus } = await getStoreConfigsSwitchStatus('account_hierarchy');
  if (!storeConfigSwitchStatus) return false;
  const { isEnabled } = storeConfigSwitchStatus;

  return isEnabled === '1';
};

const setStorefrontConfig = async (dispatch: DispatchProps) => {
  const { featureFlags } = store.getState().global;
  const useCombinedQuery = featureFlags['B2B-3817.disable_masquerading_cleanup_on_login'] ?? false;

  if (useCombinedQuery) {
    const hasCompanyHierarchyPermission = checkEveryPermissionsCode(
      newPermissions.companyHierarchyPermissionCodes,
    );

    const response = await getStorefrontConfigWithCompanyHierarchy(hasCompanyHierarchyPermission);

    const {
      storefrontConfig: { config: storefrontConfig },
      companySubsidiaries,
      userMasqueradingCompany,
    } = response;

    const { currencies } = await getCurrencies(channelId);
    store.dispatch(setCurrencies(currencies));

    const resetCompanyHierarchyState = () => ({
      isEnabledCompanyHierarchy: false,
      companyHierarchyAllList: [],
      selectCompanyHierarchyId: '',
      companyHierarchyList: [],
      companyHierarchySelectSubsidiariesList: [],
    });

    try {
      if (hasCompanyHierarchyPermission) {
        const isEnabledAccountHierarchy = await getAccountHierarchyIsEnabled();

        if (isEnabledAccountHierarchy) {
          const shouldEndCompanyMasqueradingOnLogin =
            featureFlags['B2B-3817.disable_masquerading_cleanup_on_login'] ?? false;

          if (userMasqueradingCompany?.companyId && !shouldEndCompanyMasqueradingOnLogin) {
            await endUserMasqueradingCompany();
          }

          store.dispatch(
            setCompanyHierarchyInfoModules({
              companyHierarchyAllList: companySubsidiaries || [],
              isEnabledCompanyHierarchy: isEnabledAccountHierarchy,
              selectCompanyHierarchyId: userMasqueradingCompany?.companyId ?? '',
            }),
          );
        } else {
          store.dispatch(setCompanyHierarchyInfoModules(resetCompanyHierarchyState()));
        }
      } else {
        store.dispatch(setCompanyHierarchyInfoModules(resetCompanyHierarchyState()));
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to initialize company hierarchy:', error);
      store.dispatch(setCompanyHierarchyInfoModules(resetCompanyHierarchyState()));
    }

    const {
      storefrontDefaultLanguage: { language },
    } = await getStorefrontDefaultLanguages(channelId);

    let langCode: string = language || 'en';

    if (language && language.includes('-')) {
      const [lang] = language.split('-');
      langCode = lang;
    }

    const {
      data: {
        site: {
          currencies: { edges },
        },
      },
    } = await getActiveBcCurrency();

    store.dispatch(setActiveCurrency(edges.find((item: CurrencyNodeProps) => item.node.isActive)));
    B3SStorage.set('bcLanguage', langCode);

    dispatch({
      type: 'common',
      payload: {
        storefrontConfig,
        bcLanguage: langCode,
      },
    });
  } else {
    const response = await getStorefrontConfig();

    const {
      storefrontConfig: { config: storefrontConfig },
    } = response;

    const { currencies } = await getCurrencies(channelId);
    store.dispatch(setCurrencies(currencies));

    const {
      storefrontDefaultLanguage: { language },
    } = await getStorefrontDefaultLanguages(channelId);

    let langCode: string = language || 'en';

    if (language && language.includes('-')) {
      const [lang] = language.split('-');
      langCode = lang;
    }

    const {
      data: {
        site: {
          currencies: { edges },
        },
      },
    } = await getActiveBcCurrency();

    store.dispatch(setActiveCurrency(edges.find((item: CurrencyNodeProps) => item.node.isActive)));
    B3SStorage.set('bcLanguage', langCode);

    dispatch({
      type: 'common',
      payload: {
        storefrontConfig,
        bcLanguage: langCode,
      },
    });
  }
};

const getGlobalStoreTax = async () => {
  const response = await getStorefrontTaxDisplayType();
  const showInclusive = response.pdp === 'INC';
  B3SStorage.set('showInclusiveTaxPrice', showInclusive);
  store.dispatch(setShowInclusiveTaxPrice(showInclusive));
};

export { getStoreConfigs, setStorefrontConfig, getGlobalStoreTax };
