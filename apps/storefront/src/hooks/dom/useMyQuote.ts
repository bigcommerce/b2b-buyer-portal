import {
  useCallback,
  SetStateAction,
  Dispatch,
  useEffect,
  useContext,
  useRef,
} from 'react'

import globalB3 from '@b3/global-b3'

import type {
  OpenPageState,
} from '@b3/hooks'

import {
  cloneDeep,
} from 'lodash'

import {
  CustomStyleContext,
} from '@/shared/customStyleButtton'

import {
  B3LStorage,
} from '@/utils'

import {
  removeCartPermissions,
} from '@/utils/b3RolePermissions'

import {
  addQuoteToProduct,
  removeElement,
} from './utils'

import {
  useDomVariation,
} from './useDomVariation'

type DispatchProps = Dispatch<SetStateAction<OpenPageState>>

interface MutationObserverProps {
  setOpenPage: DispatchProps,
  productQuoteEnabled: boolean,
  B3UserId: number | string,
  role: number | string,
  customerId: number | string,
}

const useMyQuote = ({
  setOpenPage,
  productQuoteEnabled,
  B3UserId,
  role,
  customerId,
}: MutationObserverProps) => {
  useEffect(() => {
    const quoteDraftUserId = B3LStorage.get('quoteDraftUserId')
    if (!B3UserId && +quoteDraftUserId !== +customerId) {
      B3LStorage.set('MyQuoteInfo', {})
      B3LStorage.set('b2bQuoteDraftList', [])
      B3LStorage.set('quoteDraftUserId', B3UserId || customerId || 0)
    }
  }, [B3UserId])

  const cache = useRef({})

  const {
    state: {
      addQuoteBtn,
    },
  } = useContext(CustomStyleContext)

  // quote method and goto draft
  const {
    addToQuote,
    addLoadding,
  } = addQuoteToProduct(setOpenPage)

  const quoteCallBbck = useCallback(() => {
    const b3MyQuote = document.querySelector('.b3-product-to-quote')
    const b2bLoading = document.querySelector('#b2b-div-loading')
    if (b3MyQuote && !b2bLoading) {
      addLoadding(b3MyQuote)
      addToQuote(role)
    }
  }, [])

  const cd = useCallback(() => {
    removeCartPermissions(role)
  }, [role])

  const [openQuickView] = useDomVariation(globalB3['dom.setToQuote'], cd)

  const {
    color = '',
    text = '',
    customCss = '',
    classSelector = '',
    locationSelector = '',
    enabled = false,
  } = addQuoteBtn

  useEffect(() => {
    const addToQuoteAll = document.querySelectorAll(globalB3['dom.setToQuote'])

    let myQuote: CustomFieldItems | null = null
    if (!addToQuoteAll.length) return

    if (!productQuoteEnabled) {
      document.querySelector('.b3-product-to-quote')?.remove()
      return
    }

    if (document.querySelectorAll('.b3-product-to-quote')?.length) {
      const cacheQuoteDom = cache.current
      const isAddStyle = Object.keys(cacheQuoteDom).every((key: string) => (cacheQuoteDom as CustomFieldItems)[key] === (addQuoteBtn as CustomFieldItems)[key])
      if (!isAddStyle) {
        const myQuoteBtn = document.querySelectorAll('.b3-product-to-quote')
        myQuoteBtn.forEach((myQuote: CustomFieldItems) => {
          myQuote.setAttribute('id', `${locationSelector}`)
          myQuote.innerHTML = text || 'Add to Quote'
          myQuote.setAttribute('style', customCss)
          myQuote.style.color = color
          myQuote.setAttribute('class', `b3-product-to-quote ${classSelector}`)
        })
        cache.current = cloneDeep(addQuoteBtn)
      }
      return
    }

    if (enabled) {
      addToQuoteAll.forEach((node: CustomFieldItems) => {
        myQuote = document.createElement('div')

        myQuote.setAttribute('id', `${locationSelector}`)
        myQuote.innerHTML = text || 'Add to Quote'
        myQuote.setAttribute('style', customCss)
        myQuote.style.color = color
        myQuote.setAttribute('class', `b3-product-to-quote ${classSelector}`)
        node.parentNode.appendChild(myQuote)
        myQuote.addEventListener('click', quoteCallBbck, {
          capture: true,
        })
      })
      cache.current = cloneDeep(addQuoteBtn)
    } else {
      const myQuoteBtn = document.querySelectorAll('.b3-product-to-quote')
      myQuoteBtn.forEach((item: CustomFieldItems) => {
        removeElement(item)
      })
    }
    return () => {
      if (myQuote) {
        myQuote.removeEventListener('click', quoteCallBbck)
      }
    }
  }, [openQuickView, productQuoteEnabled, addQuoteBtn])
}

export {
  useMyQuote,
}
