import {
  Dispatch,
  SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from 'react'
import globalB3 from '@b3/global-b3'
import type { OpenPageState } from '@b3/hooks'
import { cloneDeep } from 'lodash'

import {
  getContrastColor,
  getStyles,
} from '@/components/outSideComponents/utils/b3CustomStyles'
import { CustomStyleContext } from '@/shared/customStyleButtton'
import { B3LStorage, removeCartPermissions } from '@/utils'

// import { removeCartPermissions } from '@/utils/b3RolePermissions'
import useDomVariation from './useDomVariation'
import { addQuoteToProduct, removeElement } from './utils'

type DispatchProps = Dispatch<SetStateAction<OpenPageState>>

interface MutationObserverProps {
  setOpenPage: DispatchProps
  productQuoteEnabled: boolean
  B3UserId: number | string
  role: number | string
  customerId: number | string
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
    state: { addQuoteBtn },
  } = useContext(CustomStyleContext)

  // quote method and goto draft
  const { addToQuote, addLoadding } = addQuoteToProduct(setOpenPage)

  const quoteCallBbck = useCallback(() => {
    const b3MyQuote = document.querySelector('.b2b-add-to-quote')
    const b2bLoading = document.querySelector('#b2b-div-loading')
    if (b3MyQuote && !b2bLoading) {
      addLoadding(b3MyQuote)
      addToQuote(role)
    }
  }, [])

  const cd = () => {
    if (+role === 2) {
      removeCartPermissions(role)
    }
  }

  const [openQuickView] = useDomVariation(globalB3['dom.setToQuote'], cd)

  const {
    color = '',
    text = '',
    customCss = '',
    classSelector = '',
    locationSelector = '',
    enabled = false,
  } = addQuoteBtn

  const customTextColor = getStyles(customCss).color || getContrastColor(color)

  useEffect(() => {
    const addToQuoteAll = document.querySelectorAll(globalB3['dom.setToQuote'])
    const CustomAddToQuoteAll = locationSelector
      ? document.querySelectorAll(locationSelector)
      : []

    let myQuote: CustomFieldItems | null = null
    if (!addToQuoteAll.length && !CustomAddToQuoteAll.length) return

    if (!productQuoteEnabled) {
      document.querySelector('.b2b-add-to-quote')?.remove()
      return
    }

    if (document.querySelectorAll('.b2b-add-to-quote')?.length) {
      const cacheQuoteDom = cache.current
      const isAddStyle = Object.keys(cacheQuoteDom).every(
        (key: string) =>
          (cacheQuoteDom as CustomFieldItems)[key] ===
          (addQuoteBtn as CustomFieldItems)[key]
      )
      if (!isAddStyle) {
        const myQuoteBtn = document.querySelectorAll('.b2b-add-to-quote')
        myQuoteBtn.forEach((myQuote: CustomFieldItems) => {
          myQuote.innerHTML = text || 'Add to Quote'
          myQuote.setAttribute('style', customCss)
          myQuote.style.backgroundColor = color
          myQuote.style.color = customTextColor
          myQuote.setAttribute('class', `b2b-add-to-quote ${classSelector}`)
        })
        cache.current = cloneDeep(addQuoteBtn)
      }
      return
    }

    if (enabled) {
      ;(CustomAddToQuoteAll.length
        ? CustomAddToQuoteAll
        : addToQuoteAll
      ).forEach((node: CustomFieldItems) => {
        myQuote = document.createElement('div')
        myQuote.innerHTML = text || 'Add to Quote'
        myQuote.setAttribute('style', customCss)
        myQuote.style.backgroundColor = color
        myQuote.style.color = customTextColor
        myQuote.setAttribute('class', `b2b-add-to-quote ${classSelector}`)
        if (CustomAddToQuoteAll.length) {
          node.appendChild(myQuote)
        } else {
          node.parentNode.appendChild(myQuote)
        }
        myQuote.addEventListener('click', quoteCallBbck, {
          capture: true,
        })
      })
      cache.current = cloneDeep(addQuoteBtn)
    } else {
      const myQuoteBtn = document.querySelectorAll('.b2b-add-to-quote')
      myQuoteBtn.forEach((item: CustomFieldItems) => {
        removeElement(item)
      })
    }

    // eslint-disable-next-line
    return () => {
      if (myQuote) {
        myQuote.removeEventListener('click', quoteCallBbck)
      }
    }
  }, [openQuickView, productQuoteEnabled, addQuoteBtn])
}

export default useMyQuote
