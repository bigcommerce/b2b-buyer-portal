export interface QuoteConfigItem {
  [key: string]: string
}

export interface QuoteConfig {
  switchStatus: QuoteConfigItem[],
  otherConfigs: QuoteConfigItem[],
}

export const getLogo = (quoteConfig:QuoteConfig): string => {
  const logoItem = quoteConfig.switchStatus.find((list:QuoteConfigItem) => list.key === 'quote_logo') || {}

  return logoItem.isEnabled || ''
}

export const getQuoteEnabled = (
  quoteConfig: QuoteConfig,
  storefrontConfig: {
    [k: string]: boolean | {
      value: boolean,
      enabledStatus: boolean,
    },
    shoppingLists: boolean,
  },
  role: number | string,
  isB2BUser: boolean,
  isAgenting: boolean,
) => {
  let customerEnabled = '1'
  let guestEnabled = '1'
  let bcUserEnabled = '1'
  let b2bUserEnabled = '1'
  let productEnabled = '1'
  let cartEnabled = '1'

  const quoteEnabled = storefrontConfig.quotes || false

  let shoppingListEnabled = storefrontConfig.shoppingLists || false

  quoteConfig.switchStatus.forEach((config) => {
    if (config.key === 'quote_customer') {
      customerEnabled = config.isEnabled
    }
    if (config.key === 'quote_for_guest') {
      guestEnabled = config.isEnabled
    }
    if (config.key === 'quote_for_individual_customer') {
      bcUserEnabled = config.isEnabled
    }
    // TODO: check
    if (config.key === 'quote_for_b2b') {
      b2bUserEnabled = config.isEnabled
    }
    if (config.key === 'quote_on_product_page') {
      productEnabled = config.isEnabled
    }
    if (config.key === 'quote_on_cart_page') {
      cartEnabled = config.isEnabled
    }
  })

  let productQuoteEnabled = quoteEnabled && customerEnabled === '1' && productEnabled === '1'
  let cartQuoteEnabled = quoteEnabled && customerEnabled === '1' && cartEnabled === '1'

  if (`${role}` === '100') { // guest
    productQuoteEnabled = productQuoteEnabled && guestEnabled === '1'
    cartQuoteEnabled = cartQuoteEnabled && guestEnabled === '1'
    shoppingListEnabled = false
  } else if (isB2BUser) {
    productQuoteEnabled = b2bUserEnabled === '1'
    cartQuoteEnabled = b2bUserEnabled === '1'
    if (`${role}` === '3' && !isAgenting) {
      productQuoteEnabled = false
      cartQuoteEnabled = false
      shoppingListEnabled = false
    }
  } else if (!isB2BUser) { // BCUser
    productQuoteEnabled = productQuoteEnabled && bcUserEnabled === '1'
    cartQuoteEnabled = cartQuoteEnabled && bcUserEnabled === '1'
  }

  return {
    productQuoteEnabled,
    cartQuoteEnabled,
    shoppingListEnabled,
  }
}
