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
import cloneDeep from 'lodash-es/cloneDeep'

import {
  getContrastColor,
  getStyles,
  setMediaStyle,
  splitCustomCssValue,
} from '@/components/outSideComponents/utils/b3CustomStyles'
import {
  ADD_TO_QUOTE_DEFAULT_VALUE,
  TRANSLATION_ADD_TO_QUOTE_VARIABLE,
} from '@/constants'
import { useGetButtonText } from '@/hooks'
import { CustomStyleContext } from '@/shared/customStyleButtton'
import { B3LStorage, setCartPermissions } from '@/utils'

import useDomVariation from './useDomVariation'
import { addProductFromProductPageToQuote, removeElement } from './utils'

type DispatchProps = Dispatch<SetStateAction<OpenPageState>>

interface MutationObserverProps {
  setOpenPage: DispatchProps
  productQuoteEnabled: boolean
  B3UserId: number | string
  role: number | string
  customerId?: number | string
}

const useMyQuote = ({
  setOpenPage,
  productQuoteEnabled,
  B3UserId,
  role,
}: MutationObserverProps) => {
  useEffect(() => {
    const quoteDraftUserId = B3LStorage.get('quoteDraftUserId')
    const roles = [0, 1, 2, 3, 99]
    const isLogin = roles.includes(+role)

    if (isLogin && +quoteDraftUserId !== 0 && +quoteDraftUserId !== +B3UserId) {
      B3LStorage.set('MyQuoteInfo', {})
      B3LStorage.set('b2bQuoteDraftList', [])
      B3LStorage.set('quoteDraftUserId', B3UserId || 0)
    }
  }, [B3UserId])
  const cache = useRef({})
  const {
    state: { addQuoteBtn },
  } = useContext(CustomStyleContext)

  // quote method and goto draft
  const { addToQuote, addLoadding } =
    addProductFromProductPageToQuote(setOpenPage)

  const quoteCallBack = useCallback((e: React.MouseEvent) => {
    const b3MyQuote = e.target as HTMLElement
    const b2bLoading = document.querySelector('#b2b-div-loading')
    if (b3MyQuote && !b2bLoading) {
      addLoadding(b3MyQuote)
      addToQuote(role, b3MyQuote)
    }
  }, [])

  const cd = () => {
    if (+role !== 2) {
      setCartPermissions(role)
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
  const myQuoteBtnLabel = useGetButtonText(
    TRANSLATION_ADD_TO_QUOTE_VARIABLE,
    text,
    ADD_TO_QUOTE_DEFAULT_VALUE
  )

  const cssInfo = splitCustomCssValue(customCss)
  const {
    cssValue,
    mediaBlocks,
  }: {
    cssValue: string
    mediaBlocks: string[]
  } = cssInfo
  const customTextColor = getStyles(cssValue).color || getContrastColor(color)

  useEffect(() => {
    const addToQuoteAll = document.querySelectorAll(globalB3['dom.setToQuote'])
    const CustomAddToQuoteAll = locationSelector
      ? document.querySelectorAll(locationSelector)
      : []

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
          myQuote.innerHTML = myQuoteBtnLabel
          myQuote.setAttribute('style', customCss)
          myQuote.style.backgroundColor = color
          myQuote.style.color = customTextColor
          myQuote.setAttribute('class', `b2b-add-to-quote ${classSelector}`)

          setMediaStyle(mediaBlocks, `b2b-add-to-quote ${classSelector}`)
        })
        cache.current = cloneDeep(addQuoteBtn)
      }
    }

    if (enabled) {
      ;(CustomAddToQuoteAll.length
        ? CustomAddToQuoteAll
        : addToQuoteAll
      ).forEach((node: CustomFieldItems) => {
        const children = node.parentNode.querySelectorAll('.b2b-add-to-quote')
        if (!children.length) {
          let myQuote: CustomFieldItems | null = null
          myQuote = document.createElement('div')
          myQuote.innerHTML = myQuoteBtnLabel
          myQuote.setAttribute('style', customCss)
          myQuote.style.backgroundColor = color
          myQuote.style.color = customTextColor
          myQuote.setAttribute('class', `b2b-add-to-quote ${classSelector}`)

          setMediaStyle(mediaBlocks, `b2b-add-to-quote ${classSelector}`)
          if (CustomAddToQuoteAll.length) {
            node.appendChild(myQuote)
          } else {
            node.parentNode.appendChild(myQuote)
          }
          myQuote.addEventListener('click', quoteCallBack, {
            capture: true,
          })
        }
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
      const myQuoteBtn = document.querySelectorAll('.b2b-add-to-quote')
      myQuoteBtn.forEach((item: CustomFieldItems) => {
        item.removeEventListener('click', quoteCallBack)
      })
    }
  }, [openQuickView, productQuoteEnabled, addQuoteBtn])
}

export default useMyQuote
