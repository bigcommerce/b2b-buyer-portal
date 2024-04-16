import {
  Dispatch,
  SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from 'react'
import globalB3 from '@b3/global-b3'
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
import {
  resetDraftQuoteList,
  setQuoteUserId,
  store,
  useAppSelector,
} from '@/store'
import { CustomerRole } from '@/types'
import { OpenPageState } from '@/types/hooks'
import { B3LStorage, setCartPermissions } from '@/utils'

import useDomVariation from './useDomVariation'
import usePurchasableQuote from './usePurchasableQuote'
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
  const quoteDraftUserId = useAppSelector(
    ({ quoteInfo }) => quoteInfo.draftQuoteInfo.userId
  )
  useEffect(() => {
    const isLogin = role !== CustomerRole.GUEST

    if (isLogin && +quoteDraftUserId !== 0 && +quoteDraftUserId !== +B3UserId) {
      B3LStorage.set('MyQuoteInfo', {})

      store.dispatch(resetDraftQuoteList())
      store.dispatch(setQuoteUserId(+B3UserId))
    }
  }, [B3UserId, role, quoteDraftUserId])
  const cache = useRef({})
  const {
    state: { addQuoteBtn, quoteOnNonPurchasableProductPageBtn },
  } = useContext(CustomStyleContext)

  // quote method and go to draft
  const { addToQuote, addLoadding } =
    addProductFromProductPageToQuote(setOpenPage)

  const quoteCallBack = useCallback(
    (e: React.MouseEvent) => {
      const b3MyQuote = e.target as HTMLElement
      const b2bLoading = document.querySelector('#b2b-div-loading')
      if (b3MyQuote && !b2bLoading) {
        addLoadding(b3MyQuote)
        addToQuote(role, b3MyQuote)
      }
    },
    [role, addLoadding, addToQuote]
  )

  const cd = () => {
    if (+role !== 2) {
      setCartPermissions(role)
    }
  }

  const [openQuickView] = useDomVariation(globalB3['dom.setToQuote'], cd)

  const [isBuyPurchasable] = usePurchasableQuote(openQuickView)

  const {
    color = '',
    text = '',
    customCss = '',
    classSelector = '',
    locationSelector = '',
    enabled = false,
  } = addQuoteBtn

  const {
    color: noPuchasableQuoteColor = '',
    text: noPuchasableQuoteText = '',
    customCss: noPuchasableQuoteCustomCss = '',
    classSelector: noPuchasableQuoteClassSelector = '',
    locationSelector: noPuchasableQuoteLocationSelector = '',
    enabled: noPuchasableQuoteEnabled = false,
  } = quoteOnNonPurchasableProductPageBtn

  const newText = isBuyPurchasable ? text : noPuchasableQuoteText
  const myQuoteBtnLabel = useGetButtonText(
    TRANSLATION_ADD_TO_QUOTE_VARIABLE,
    newText,
    ADD_TO_QUOTE_DEFAULT_VALUE
  )

  const cssInfo = splitCustomCssValue(
    isBuyPurchasable ? customCss : noPuchasableQuoteCustomCss
  )
  const {
    cssValue,
    mediaBlocks,
  }: {
    cssValue: string
    mediaBlocks: string[]
  } = cssInfo
  const customTextColor =
    getStyles(cssValue).color ||
    getContrastColor(isBuyPurchasable ? color : noPuchasableQuoteColor)

  const clearQuoteDom = () => {
    const myQuoteBtn = document.querySelectorAll('.b2b-add-to-quote')
    myQuoteBtn.forEach((item: CustomFieldItems) => {
      removeElement(item)
    })
  }

  const clearNoPuchasableQuoteDom = () => {
    const myNoPuchasableQuoteBtn = document.querySelectorAll(
      '.b2b-add-to-no-puchasable-quote'
    )
    myNoPuchasableQuoteBtn.forEach((item: CustomFieldItems) => {
      removeElement(item)
    })
  }

  const addBtnStyle = useCallback(() => {
    const myQuoteBtn = document.querySelectorAll('.b2b-add-to-quote')
    myQuoteBtn.forEach((quote: CustomFieldItems) => {
      const myQuote = quote
      myQuote.innerHTML = myQuoteBtnLabel
      myQuote.setAttribute(
        'style',
        isBuyPurchasable ? customCss : noPuchasableQuoteCustomCss
      )
      myQuote.style.backgroundColor = isBuyPurchasable
        ? color
        : noPuchasableQuoteColor
      myQuote.style.color = customTextColor
      myQuote.setAttribute(
        'class',
        `b2b-add-to-quote ${
          isBuyPurchasable ? classSelector : noPuchasableQuoteClassSelector
        }`
      )

      setMediaStyle(
        mediaBlocks,
        `b2b-add-to-quote ${
          isBuyPurchasable ? classSelector : noPuchasableQuoteClassSelector
        }`
      )
    })
  }, [
    classSelector,
    color,
    customCss,
    customTextColor,
    isBuyPurchasable,
    mediaBlocks,
    myQuoteBtnLabel,
    noPuchasableQuoteClassSelector,
    noPuchasableQuoteColor,
    noPuchasableQuoteCustomCss,
  ])

  useEffect(() => {
    const purchasableQuote = (
      CustomAddToQuoteAll: NodeListOf<Element> | never[],
      addToQuoteAll: NodeListOf<Element>,
      isBuyer: boolean
    ) => {
      const quoteNode = isBuyer
        ? '.b2b-add-to-quote'
        : '.b2b-add-to-no-puchasable-quote'
      const quoteNodeStyle = isBuyer
        ? 'b2b-add-to-quote'
        : 'b2b-add-to-no-puchasable-quote'

      if (document.querySelectorAll(quoteNode)?.length) {
        const cacheQuoteDom = cache.current

        const isAddStyle = Object.keys(cacheQuoteDom).every(
          (key: string) =>
            (cacheQuoteDom as CustomFieldItems)[key] ===
            (addQuoteBtn as CustomFieldItems)[key]
        )
        if (!isAddStyle) {
          addBtnStyle()
          cache.current = cloneDeep(addQuoteBtn)
        }
      }

      if (isBuyPurchasable ? enabled : noPuchasableQuoteEnabled) {
        ;(CustomAddToQuoteAll.length
          ? CustomAddToQuoteAll
          : addToQuoteAll
        ).forEach((node: CustomFieldItems) => {
          const children = node.parentNode.querySelectorAll(quoteNode)
          if (!children.length) {
            let myQuote: CustomFieldItems | null = null
            myQuote = document.createElement('div')
            myQuote.innerHTML = myQuoteBtnLabel
            myQuote.setAttribute(
              'style',
              isBuyPurchasable ? customCss : noPuchasableQuoteCustomCss
            )
            myQuote.style.backgroundColor = isBuyPurchasable
              ? color
              : noPuchasableQuoteColor
            myQuote.style.color = customTextColor
            myQuote.setAttribute(
              'class',
              `${quoteNodeStyle} ${
                isBuyPurchasable
                  ? classSelector
                  : noPuchasableQuoteClassSelector
              }`
            )

            setMediaStyle(
              mediaBlocks,
              `${quoteNodeStyle} ${
                isBuyPurchasable
                  ? classSelector
                  : noPuchasableQuoteClassSelector
              }`
            )
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
        clearQuoteDom()
      }
    }

    if (!productQuoteEnabled) {
      clearQuoteDom()
      clearNoPuchasableQuoteDom()
      return
    }

    if (!isBuyPurchasable) {
      clearQuoteDom()
      const noPuchasableQuoteAll = document.querySelectorAll(
        globalB3['dom.setToNoPuchasable']
      )

      const CustomAddToQuoteAll = noPuchasableQuoteLocationSelector
        ? document.querySelectorAll(noPuchasableQuoteLocationSelector)
        : []

      if (!noPuchasableQuoteAll.length && !CustomAddToQuoteAll.length) return

      if (noPuchasableQuoteAll.length) {
        purchasableQuote(CustomAddToQuoteAll, noPuchasableQuoteAll, false)
      }
    } else {
      clearNoPuchasableQuoteDom()
      const addToQuoteAll = document.querySelectorAll(
        globalB3['dom.setToQuote']
      )
      const CustomAddToQuoteAll = locationSelector
        ? document.querySelectorAll(locationSelector)
        : []

      if (!addToQuoteAll.length && !CustomAddToQuoteAll.length) return
      purchasableQuote(CustomAddToQuoteAll, addToQuoteAll, true)
    }

    // eslint-disable-next-line
    return () => {
      const myQuoteBtn = document.querySelectorAll('.b2b-add-to-quote')
      myQuoteBtn.forEach((item: CustomFieldItems) => {
        item.removeEventListener('click', quoteCallBack)
      })
    }
  }, [
    openQuickView,
    productQuoteEnabled,
    addQuoteBtn,
    isBuyPurchasable,
    locationSelector,
    noPuchasableQuoteLocationSelector,
    quoteCallBack,
    addBtnStyle,
    classSelector,
    color,
    customCss,
    customTextColor,
    enabled,
    mediaBlocks,
    myQuoteBtnLabel,
    noPuchasableQuoteClassSelector,
    noPuchasableQuoteColor,
    noPuchasableQuoteCustomCss,
    noPuchasableQuoteEnabled,
  ])
}

export default useMyQuote
