import isEmpty from 'lodash-es/isEmpty';

import { CustomStyleButtonState } from '@/shared/customStyleButton/context/config';
import { DispatchProps } from '@/shared/global/context/config';
import {
  getB2BRegisterLogo,
  getBCStoreChannelId,
  getCurrencies,
  getStoreConfigsSwitchStatus,
  getStorefrontConfig,
  getStorefrontConfigs,
  getStorefrontDefaultLanguages,
  getTaxZoneRates,
} from '@/shared/service/b2b';
import { getActiveBcCurrency } from '@/shared/service/bc';
import { store } from '@/store';
import {
  setBlockPendingAccountViewPrice,
  setBlockPendingQuoteNonPurchasableOOS,
  setLoginLandingLocation,
  setQuoteSubmissionResponse,
  setShowInclusiveTaxPrice,
  setStoreInfo,
  setTaxZoneRates,
} from '@/store/slices/global';
import { setActiveCurrency, setCurrencies } from '@/store/slices/storeConfigs';
import { B3SStorage, channelId } from '@/utils';

interface StoreforntKeysProps {
  key: string;
  name: string;
}

interface CurrencyNodeProps {
  node: {
    entityId: number;
    isActive: boolean;
  };
}

interface TaxZoneRatesProps {
  rates: {
    id: number;
    name: string;
    enabled: boolean;
    priority: number;
    classRates: {
      rate: number;
      taxClassId: number;
    }[];
  }[];
  priceDisplaySettings: {
    showInclusive: boolean;
    showBothOnDetailView: boolean;
    showBothOnListView: boolean;
  };
  enabled: boolean;
  id: number;
  name: string;
}

const storeforntKeys: StoreforntKeysProps[] = [
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
];

const getTemPlateConfig = async (dispatch: any, dispatchGlobal: any) => {
  const keys = storeforntKeys.map((item: StoreforntKeysProps) => item.key);
  const { storefrontConfigs } = await getStorefrontConfigs(channelId, keys);

  let logo = '';

  const obj: Partial<CustomStyleButtonState> | {} = {};
  let blockPendingAccountOrderCreation = true;
  let blockPendingAccountViewPrice = true;
  storefrontConfigs.forEach((currentItem: CustomFieldItems) => {
    const item = currentItem;
    const storeforntKey: StoreforntKeysProps | undefined = storeforntKeys.find(
      (option) => option.key === item.key,
    );
    const storefrontConfig = item;
    if (!isEmpty(storeforntKey)) {
      if (storeforntKey.key === 'quote_logo') {
        logo = item.value;
      }
      if (storeforntKey.key === 'quote_on_product_page') {
        storefrontConfig.extraFields = {
          ...item.extraFields,
          locationSelector: item.extraFields?.locationSelector || '.add-to-cart-buttons',
          classSelector: item.extraFields?.classSelector || 'button',
          customCss: item.extraFields?.customCss || 'margin-top: 0.5rem',
        };
      }

      if (storeforntKey.key === 'quote_on_cart_page') {
        storefrontConfig.extraFields = {
          ...item.extraFields,
          classSelector: item.extraFields?.classSelector || 'button',
        };
      }
      if (storeforntKey.key === 'masquerade_button') {
        storefrontConfig.extraFields = {
          ...item.extraFields,
          color: item.extraFields?.color || '#ED6C02',
          location: item.extraFields?.location || ' bottomLeft',
          horizontalPadding: item.extraFields?.horizontalPadding || '',
          verticalPadding: item.extraFields?.verticalPadding || '',
        };
      }

      if (storeforntKey.key === 'switch_account_button') {
        storefrontConfig.extraFields = {
          ...item.extraFields,
          color: item.extraFields?.color || '#ED6C02',
          location: item.extraFields?.location || ' bottomLeft',
          horizontalPadding: item.extraFields?.horizontalPadding || '',
          verticalPadding: item.extraFields?.verticalPadding || '',
        };
      }

      if (storeforntKey.key === 'quote_floating_action_button') {
        storefrontConfig.extraFields = {
          ...item.extraFields,
          color: item.extraFields?.color || '#E00F36',
          location: item.extraFields?.location || ' bottomRight',
          horizontalPadding: item.extraFields?.horizontalPadding || '',
          verticalPadding: item.extraFields?.verticalPadding || '',
        };
      }

      if (storeforntKey.key === 'shopping_list_on_product_page') {
        storefrontConfig.extraFields = {
          ...item.extraFields,
          locationSelector: item.extraFields?.locationSelector || '.add-to-cart-buttons',
          classSelector: item.extraFields?.classSelector || 'button',
          customCss: item.extraFields?.customCss || 'margin-top: 0.5rem',
        };
      }

      if (storeforntKey.key === 'block_pending_account_order_creation') {
        blockPendingAccountOrderCreation = item.value === '1';
        B3SStorage.set('blockPendingAccountOrderCreation', blockPendingAccountOrderCreation);
      }

      if (storeforntKey.key === 'block_pending_account_seeing_products_pricing') {
        blockPendingAccountViewPrice = item.value === '1';
        B3SStorage.set('blockPendingAccountViewPrice', blockPendingAccountViewPrice);
        store.dispatch(setBlockPendingAccountViewPrice(blockPendingAccountViewPrice));
      }

      if (storeforntKey.key === 'non_purchasable_quote') {
        store.dispatch(
          setBlockPendingQuoteNonPurchasableOOS({
            isEnableProduct: item.value === '1',
          }),
        );
      }

      if (storeforntKey.key === 'quote_on_non_purchasable_product_page') {
        storefrontConfig.extraFields = {
          ...item.extraFields,
          locationSelector: item.extraFields?.locationSelector || '.add-to-cart-buttons',
          classSelector: item.extraFields?.classSelector || 'button',
          customCss: item.extraFields?.customCss || '',
        };
      }

      if (storeforntKey.key === 'buyer_non_purchasable_quote') {
        store.dispatch(
          setBlockPendingQuoteNonPurchasableOOS({
            isEnableRequest: item.value === '1',
          }),
        );
      }

      if (storeforntKey.key === 'login_landing_location') {
        store.dispatch(setLoginLandingLocation(item?.extraFields?.location || '0'));
      }

      if (storeforntKey.key === 'quote_submission_response') {
        store.dispatch(
          setQuoteSubmissionResponse({
            key: item.key,
            value: item.value,
            ...item.extraFields,
          }),
        );
      }

      (obj as CustomFieldItems)[(storeforntKey as StoreforntKeysProps).name] = {
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

const getQuoteConfig = async (dispatch: DispatchProps) => {
  const { quoteConfig } = await getB2BRegisterLogo();

  dispatch({
    type: 'common',
    payload: {
      quoteConfig,
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
  const {
    storefrontConfig: { config: storefrontConfig },
  } = await getStorefrontConfig();
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
};

const getStoreTaxZoneRates = async () => {
  const { taxZoneRates = [] } = await getTaxZoneRates();

  if (taxZoneRates.length) {
    const defaultTaxZone: TaxZoneRatesProps = taxZoneRates.find(
      (taxZone: { id: number }) => taxZone.id === 1,
    );
    if (defaultTaxZone) {
      const {
        priceDisplaySettings: { showInclusive },
      } = defaultTaxZone;
      B3SStorage.set('showInclusiveTaxPrice', showInclusive);
      store.dispatch(setShowInclusiveTaxPrice(showInclusive));
    }
  }

  store.dispatch(setTaxZoneRates(taxZoneRates));
};

const getStoreInfo = async () => {
  const { storeBasicInfo }: CustomFieldItems = await getBCStoreChannelId();
  const [storeInfo] = storeBasicInfo.storeSites;

  store.dispatch(setStoreInfo(storeInfo));
};

export {
  getQuoteConfig,
  getStoreInfo,
  getStoreTaxZoneRates,
  getTemPlateConfig,
  setStorefrontConfig,
};
