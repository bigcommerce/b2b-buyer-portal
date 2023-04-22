import {
  Dispatch,
  SetStateAction,
  useCallback,
  useContext,
  useEffect,
} from 'react'
import globalB3 from '@b3/global-b3'
import type { OpenPageState } from '@b3/hooks'

import { getContrastColor } from '@/components/outSideComponents/utils/b3CustomStyles'
import { CustomStyleContext } from '@/shared/customStyleButtton'

import { addQuoteToCart } from './utils'

type DispatchProps = Dispatch<SetStateAction<OpenPageState>>
interface MutationObserverProps {
  setOpenPage: DispatchProps
  cartQuoteEnabled: boolean
}

const useCartToQuote = ({
  setOpenPage,
  cartQuoteEnabled,
}: MutationObserverProps) => {
  const { addToQuote, addLoadding } = addQuoteToCart(setOpenPage)

  const {
    state: { addToAllQuoteBtn },
  } = useContext(CustomStyleContext)

  const quoteCallBbck = useCallback(() => {
    const b3CartToQuote = document.querySelector('.b2b-cart-to-quote')

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
    const addToQuoteAll = document.querySelectorAll(
      globalB3['dom.cartActions.container']
    )
    const CustomAddToQuoteAll = locationSelector
      ? document.querySelectorAll(locationSelector)
      : []

    let cartQuoteBtnDom: CustomFieldItems | null = null
    if (!addToQuoteAll.length && !CustomAddToQuoteAll.length) return

    if (!cartQuoteEnabled) {
      document.querySelector('.b2b-cart-to-quote')?.remove()
      return
    }

    if (document.querySelectorAll('.b2b-cart-to-quote')?.length) {
      const cartToQuoteBtn = document.querySelectorAll('.b2b-cart-to-quote')
      cartToQuoteBtn.forEach((cartToQuoteBtn: CustomFieldItems) => {
        cartToQuoteBtn.innerHTML = text || 'Add All to Quote'
        cartToQuoteBtn.setAttribute('style', customCss)
        cartToQuoteBtn.style.backgroundColor = color
        cartToQuoteBtn.style.color = getContrastColor(color)
        cartToQuoteBtn.setAttribute(
          'class',
          `b2b-cart-to-quote ${classSelector}`
        )
      })
      return
    }

    if (enabled) {
      ;(CustomAddToQuoteAll.length
        ? CustomAddToQuoteAll
        : addToQuoteAll
      ).forEach((node: CustomFieldItems) => {
        cartQuoteBtnDom = document.createElement('div')
        cartQuoteBtnDom.innerHTML = text || 'Add All to Quote'
        cartQuoteBtnDom.setAttribute('style', customCss)
        cartQuoteBtnDom.style.backgroundColor = color
        cartQuoteBtnDom.style.color = getContrastColor(color)
        cartQuoteBtnDom.setAttribute(
          'class',
          `b2b-cart-to-quote ${classSelector}`
        )
        node.appendChild(cartQuoteBtnDom)
        cartQuoteBtnDom.addEventListener('click', quoteCallBbck, {
          capture: true,
        })
      })
    }

    // eslint-disable-next-line
    return () => {
      if (cartQuoteBtnDom) {
        cartQuoteBtnDom.removeEventListener('click', quoteCallBbck)
      }
    }
  }, [cartQuoteEnabled, addToAllQuoteBtn])
}

export default useCartToQuote
