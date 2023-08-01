import { isEmpty } from 'lodash'

import { CustomStyleButtonState } from '@/shared/customStyleButtton/context/config'
import { DispatchProps } from '@/shared/global/context/config'
import {
  getB2BRegisterLogo,
  getCurrencies,
  getStorefrontConfig,
  getStorefrontConfigs,
  getTaxZoneRates,
} from '@/shared/service/b2b'
import { getActiveBcCurrency } from '@/shared/service/bc'
import {
  setEnteredInclusive,
  setShowInclusiveTaxPrice,
  setTaxZoneRates,
  store,
} from '@/store'
import { B3SStorage } from '@/utils'

// import {
//   storeHash,
// } from '@/utils'

// interface Rates {
//   enabled: boolean,
//   id: number,
//   name: string,
//   priority: number,
//   classRates: TaxZoneRates[],
// }

// interface TaxZoneRatesProps {
//   enabled: boolean,
//   id: number,
//   name: string,
//   rates: Rates[]
// }

interface StoreforntKeysProps {
  key: string
  name: string
}

interface CurrencyNodeProps {
  node: {
    entityId: number
    isActive: boolean
  }
}

interface TaxZoneRatesProps {
  rates: {
    id: number
    name: string
    enabled: boolean
    priority: number
    classRates: {
      rate: number
      taxClassId: number
    }[]
  }[]
  priceDisplaySettings: {
    showInclusive: boolean
    showBothOnDetailView: boolean
    showBothOnListView: boolean
  }
  enabled: boolean
  id: number
  name: string
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
]

const getTemPlateConfig = async (
  channelId: number,
  dispatch: any,
  dispatchGlobal: any
) => {
  const keys = storeforntKeys.map((item: StoreforntKeysProps) => item.key)
  const { storefrontConfigs } = await getStorefrontConfigs(channelId, keys)

  let logo = ''

  const obj: Partial<CustomStyleButtonState> | {} = {}
  let blockPendingAccountOrderCreation = true
  let blockPendingAccountViewPrice = true
  storefrontConfigs.forEach((item: any) => {
    const storeforntKey: StoreforntKeysProps | undefined = storeforntKeys.find(
      (option) => option.key === item.key
    )
    if (!isEmpty(storeforntKey)) {
      if (storeforntKey.key === 'quote_logo') {
        logo = item.value
      }
      if (storeforntKey.key === 'quote_on_product_page') {
        item.extraFields = {
          ...item.extraFields,
          locationSelector:
            item.extraFields?.locationSelector || '.add-to-cart-buttons',
          classSelector: item.extraFields?.classSelector || 'button',
          customCss: item.extraFields?.customCss || 'margin-top: 0.5rem',
        }
      }

      if (storeforntKey.key === 'quote_on_cart_page') {
        item.extraFields = {
          ...item.extraFields,
          classSelector: item.extraFields?.classSelector || 'button',
        }
      }
      if (storeforntKey.key === 'masquerade_button') {
        item.extraFields = {
          ...item.extraFields,
          color: item.extraFields?.color || '#ED6C02',
          location: item.extraFields?.location || ' bottomLeft',
          horizontalPadding: item.extraFields?.horizontalPadding || '',
          verticalPadding: item.extraFields?.verticalPadding || '',
        }
      }

      if (storeforntKey.key === 'quote_floating_action_button') {
        item.extraFields = {
          ...item.extraFields,
          color: item.extraFields?.color || '#E00F36',
          location: item.extraFields?.location || ' bottomRight',
          horizontalPadding: item.extraFields?.horizontalPadding || '',
          verticalPadding: item.extraFields?.verticalPadding || '',
        }
      }

      if (storeforntKey.key === 'shopping_list_on_product_page') {
        item.extraFields = {
          ...item.extraFields,
          locationSelector:
            item.extraFields?.locationSelector || '.add-to-cart-buttons',
          classSelector: item.extraFields?.classSelector || 'button',
          customCss: item.extraFields?.customCss || 'margin-top: 0.5rem',
        }
      }

      if (storeforntKey.key === 'block_pending_account_order_creation') {
        blockPendingAccountOrderCreation = item.value === '1'
        B3SStorage.set(
          'blockPendingAccountOrderCreation',
          blockPendingAccountOrderCreation
        )
      }

      if (
        storeforntKey.key === 'block_pending_account_seeing_products_pricing'
      ) {
        blockPendingAccountViewPrice = item.value === '1'
        B3SStorage.set(
          'blockPendingAccountViewPrice',
          blockPendingAccountViewPrice
        )
      }

      ;(obj as CustomFieldItems)[(storeforntKey as StoreforntKeysProps).name] =
        {
          ...item.extraFields,
          enabled: item.value === '1',
        }
    }
  })

  dispatchGlobal({
    type: 'common',
    payload: {
      logo,
      quoteConfig: storefrontConfigs,
      blockPendingAccountOrderCreation,
    },
  })

  dispatch({
    type: 'merge',
    payload: {
      ...obj,
    },
  })
}

const getQuoteConfig = async (dispatch: DispatchProps) => {
  const { quoteConfig } = await getB2BRegisterLogo()

  dispatch({
    type: 'common',
    payload: {
      quoteConfig,
    },
  })
}

const setStorefrontConfig = async (
  dispatch: DispatchProps,
  currentChannelId: string | number
) => {
  const {
    storefrontConfig: { config: storefrontConfig },
  } = await getStorefrontConfig()
  const { currencies } = await getCurrencies(currentChannelId)
  store.dispatch(setEnteredInclusive(currencies.enteredInclusiveTax))

  const {
    data: {
      site: {
        currencies: { edges },
      },
    },
  } = await getActiveBcCurrency()

  B3SStorage.set('currencies', currencies)
  B3SStorage.set('enteredInclusiveTax', currencies.enteredInclusiveTax || false)
  B3SStorage.set(
    'activeCurrency',
    edges.find((item: CurrencyNodeProps) => item.node.isActive)
  )
  dispatch({
    type: 'common',
    payload: {
      storefrontConfig,
      currencies,
      enteredInclusiveTax: currencies.enteredInclusiveTax || false,
    },
  })
}

const getStoreTaxZoneRates = async () => {
  const { taxZoneRates = [] } = await getTaxZoneRates()

  if (taxZoneRates.length) {
    const defaultTaxZone: TaxZoneRatesProps = taxZoneRates.find(
      (taxZone: { id: number }) => taxZone.id === 1
    )
    if (defaultTaxZone) {
      const {
        priceDisplaySettings: { showInclusive },
      } = defaultTaxZone
      B3SStorage.set('showInclusiveTaxPrice', showInclusive)
      store.dispatch(setShowInclusiveTaxPrice(showInclusive))
    }
  }

  store.dispatch(setTaxZoneRates(taxZoneRates))
}

export {
  getQuoteConfig,
  getStoreTaxZoneRates,
  getTemPlateConfig,
  setStorefrontConfig,
}
