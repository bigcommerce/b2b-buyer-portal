import { CustomerRole, FeatureEnabled } from '@/types';

export interface QuoteConfigItem {
  [key: string]: string;
}

export const getLogo = (quoteConfig: CustomFieldItems[]): string => {
  const logoItem = quoteConfig.find((list: QuoteConfigItem) => list.key === 'quote_logo');

  return logoItem?.isEnabled || '';
};

export const getQuoteEnabled = (
  quoteConfig: CustomFieldItems[],
  storefrontConfig: {
    [k: string]:
      | boolean
      | {
          value: boolean;
          enabledStatus: boolean;
        };
    shoppingLists: boolean;
    tradeProfessionalApplication: boolean;
  },
  role: number | string,
  isB2BUser: boolean,
  isAgenting: boolean,
) => {
  let customerEnabled = '1';
  let guestEnabled = '1';
  let bcUserEnabled = '1';
  let b2bUserEnabled = '1';
  let productEnabled = '1';
  let cartEnabled = '1';

  let slGuestEnabled = true;
  let slBcUserEnabled = true;
  let slB2bUserEnabled = true;

  const quoteEnabled = storefrontConfig.quotes || false;

  const shoppingListEnabled = storefrontConfig.shoppingLists;
  const registerEnabled = storefrontConfig.tradeProfessionalApplication;

  quoteConfig.forEach((config) => {
    switch (config.key) {
      case 'quote_customer':
        customerEnabled = config.value;
        break;

      case 'quote_for_guest':
        guestEnabled = config.value;
        break;

      case 'quote_for_individual_customer':
        bcUserEnabled = config.value;
        break;

      case 'quote_for_b2b':
        b2bUserEnabled = config.value;
        break;

      case 'quote_on_product_page':
        productEnabled = config.value;
        break;

      case 'quote_on_cart_page':
        cartEnabled = config.value;
        break;

      case 'shopping_list_on_product_page':
        if (config?.extraFields) {
          slGuestEnabled = config?.extraFields?.guest || false;
          slBcUserEnabled = config?.extraFields?.b2c || false;
          slB2bUserEnabled = config?.extraFields?.b2b || false;
        }
        break;

      default:
        break;
    }
  });

  let productQuoteEnabled =
    quoteEnabled &&
    customerEnabled === FeatureEnabled.ENABLED &&
    productEnabled === FeatureEnabled.ENABLED;
  let cartQuoteEnabled =
    quoteEnabled &&
    customerEnabled === FeatureEnabled.ENABLED &&
    cartEnabled === FeatureEnabled.ENABLED;
  let productShoppingListEnabled = shoppingListEnabled;

  if (role === CustomerRole.GUEST) {
    // guest
    productQuoteEnabled = productQuoteEnabled && guestEnabled === FeatureEnabled.ENABLED;
    cartQuoteEnabled = cartQuoteEnabled && guestEnabled === FeatureEnabled.ENABLED;
    productShoppingListEnabled = shoppingListEnabled && slGuestEnabled;
  } else if (isB2BUser) {
    productQuoteEnabled = productQuoteEnabled && b2bUserEnabled === FeatureEnabled.ENABLED;
    cartQuoteEnabled = cartQuoteEnabled && b2bUserEnabled === FeatureEnabled.ENABLED;
    productShoppingListEnabled = shoppingListEnabled && slB2bUserEnabled;

    if (role === CustomerRole.SUPER_ADMIN && !isAgenting) {
      productQuoteEnabled = false;
      cartQuoteEnabled = false;
      productShoppingListEnabled = false;
    }
  } else if (!isB2BUser) {
    // BCUser
    productQuoteEnabled = productQuoteEnabled && bcUserEnabled === FeatureEnabled.ENABLED;
    cartQuoteEnabled = cartQuoteEnabled && bcUserEnabled === FeatureEnabled.ENABLED;
    productShoppingListEnabled = shoppingListEnabled && slBcUserEnabled;
  }

  return {
    productQuoteEnabled,
    cartQuoteEnabled,
    shoppingListEnabled: productShoppingListEnabled,
    registerEnabled,
  };
};
