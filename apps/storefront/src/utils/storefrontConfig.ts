import {
  isEmpty,
} from 'lodash'
import {
  getStorefrontConfigs,
  getB2BRegisterLogo,
  getStorefrontConfig,
} from '@/shared/service/b2b'

import {
  DispatchProps,
} from '@/shared/global/context/config'

import {
  CustomStyleButtonState,
} from '@/shared/customStyleButtton/context/config'

// import {
//   storeHash,
// } from '@/utils'

interface StoreforntKeysProps {
  key: string,
  name: string,
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
    key: 'account_login_registration',
    name: 'accountLoginRegistration',
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
  }, {
    key: 'quote_for_b2b',
    name: 'quote_for_b2b',
  }, {
    key: 'quote_logo',
    name: 'quote_logo',
  },
]

const getTemPlateConfig = async (channelId: number, dispatch: any, dispatchGlobal: any) => {
  const keys = storeforntKeys.map((item: StoreforntKeysProps) => item.key)
  const {
    storefrontConfigs,
  } = await getStorefrontConfigs(channelId, keys)

  let logo = ''

  const obj: Partial<CustomStyleButtonState> | {} = {}
  storefrontConfigs.forEach((item: any) => {
    const storeforntKey: StoreforntKeysProps | undefined = storeforntKeys.find((option) => option.key === item.key)
    if (!isEmpty(storeforntKey)) {
      if (storeforntKey.key === 'quote_logo') {
        logo = item.value
      }
      (obj as CustomFieldItems)[(storeforntKey as StoreforntKeysProps).name] = {
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
  const {
    quoteConfig,
  } = await getB2BRegisterLogo()

  dispatch({
    type: 'common',
    payload: {
      quoteConfig,
    },
  })
}

const setStorefrontConfig = async (dispatch: DispatchProps) => {
  const {
    storefrontConfig: {
      config: storefrontConfig,
    },
  } = await getStorefrontConfig()

  dispatch({
    type: 'common',
    payload: {
      storefrontConfig,
    },
  })
}

export {
  getTemPlateConfig,
  getQuoteConfig,
  setStorefrontConfig,
}
