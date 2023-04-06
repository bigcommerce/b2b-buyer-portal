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

  useEffect(() => {
    const addToQuoteAll = document.querySelectorAll(globalB3['dom.cartActions.container'])

    let cartQuoteBtnDom: CustomFieldItems | null = null
    if (!addToQuoteAll.length) return

    if (!cartQuoteEnabled) {
      document.querySelector('.b3-cart-to-cart')?.remove()
      return
    }

    if (document.querySelectorAll('.b3-cart-to-cart')?.length) {
      return
    }

    const {
      color = '',
      text = '',
      customCss = '',
      classSelector = '',
      locationSelector = '',
      enabled = false,
    } = addToAllQuoteBtn

    if (enabled) {
      addToQuoteAll.forEach((node: CustomFieldItems) => {
        cartQuoteBtnDom = document.createElement('div')
        cartQuoteBtnDom.setAttribute('id', `${locationSelector}`)
        cartQuoteBtnDom.innerHTML = text
        cartQuoteBtnDom.setAttribute('style', customCss)
        cartQuoteBtnDom.style.color = color
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
  }, [cartQuoteEnabled])
}

export {
  useCartToQuote,
}
