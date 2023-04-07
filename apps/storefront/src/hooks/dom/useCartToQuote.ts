import {
  useCallback,
  SetStateAction,
  Dispatch,
  useEffect,
  useContext,
} from 'react'

import globalB3 from '@b3/global-b3'

import type {
  OpenPageState,
} from '@b3/hooks'

import {
  CustomStyleContext,
} from '@/shared/customStyleButtton'

import {
  addQuoteToCart,
} from './utils'

import {
  getContrastColor,
} from '@/components/outSideComponents/utils/b3CustomStyles'

type DispatchProps = Dispatch<SetStateAction<OpenPageState>>
interface MutationObserverProps {
  setOpenPage: DispatchProps,
  cartQuoteEnabled: boolean,
}

const useCartToQuote = ({
  setOpenPage,
  cartQuoteEnabled,
}: MutationObserverProps) => {
  const {
    addToQuote,
    addLoadding,
  } = addQuoteToCart(setOpenPage)

  const {
    state: {
      addToAllQuoteBtn,
    },
  } = useContext(CustomStyleContext)

  const quoteCallBbck = useCallback(() => {
    const b3CartToQuote = document.querySelector('.b3-cart-to-cart')

    const b2bLoading = document.querySelector('#b2b-div-loading')
    if (b3CartToQuote && !b2bLoading) {
      addLoadding(b3CartToQuote)
      addToQuote()
    }
  }, [])

  const {
    color = '',
    text = '',
    customCss = '',
    classSelector = '',
    locationSelector = '',
    enabled = false,
  } = addToAllQuoteBtn

  useEffect(() => {
    const addToQuoteAll = document.querySelectorAll(globalB3['dom.cartActions.container'])

    let cartQuoteBtnDom: CustomFieldItems | null = null
    if (!addToQuoteAll.length) return

    if (!cartQuoteEnabled) {
      document.querySelector('.b3-cart-to-cart')?.remove()
      return
    }

    if (document.querySelectorAll('.b3-cart-to-cart')?.length) {
      const cartToQuoteBtn = document.querySelectorAll('.b3-cart-to-cart')
      cartToQuoteBtn.forEach((cartToQuoteBtn: CustomFieldItems) => {
        cartToQuoteBtn.setAttribute('id', `${locationSelector}`)
        cartToQuoteBtn.innerHTML = text || 'Add All to Quote'
        cartToQuoteBtn.setAttribute('style', customCss)
        cartToQuoteBtn.style.backgroundColor = color
        cartToQuoteBtn.style.color = getContrastColor(color)
        cartToQuoteBtn.setAttribute('class', `b3-cart-to-cart ${classSelector}`)
      })
      return
    }

    if (enabled) {
      addToQuoteAll.forEach((node: CustomFieldItems) => {
        cartQuoteBtnDom = document.createElement('div')
        cartQuoteBtnDom.setAttribute('id', `${locationSelector}`)
        cartQuoteBtnDom.innerHTML = text || 'Add All to Quote'
        cartQuoteBtnDom.setAttribute('style', customCss)
        cartQuoteBtnDom.style.backgroundColor = color
        cartQuoteBtnDom.style.color = getContrastColor(color)
        cartQuoteBtnDom.setAttribute('class', `b3-cart-to-cart ${classSelector}`)
        node.appendChild(cartQuoteBtnDom)
        cartQuoteBtnDom.addEventListener('click', quoteCallBbck, {
          capture: true,
        })
      })
    }

    return () => {
      if (cartQuoteBtnDom) {
        cartQuoteBtnDom.removeEventListener('click', quoteCallBbck)
      }
    }
  }, [cartQuoteEnabled, addToAllQuoteBtn])
}

export {
  useCartToQuote,
}
