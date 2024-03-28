import {
  Dispatch,
  SetStateAction,
  useCallback,
  useContext,
  useEffect,
} from 'react'
import globalB3 from '@b3/global-b3'
import type { OpenPageState } from '@b3/hooks'

import {
  getContrastColor,
  getStyles,
  setMediaStyle,
  splitCustomCssValue,
} from '@/components/outSideComponents/utils/b3CustomStyles'
import { useGetButtonText } from '@/hooks'
import { CustomStyleContext } from '@/shared/customStyleButtton'
import { GlobaledContext } from '@/shared/global'
import { useAppSelector } from '@/store'
import { B3SStorage, globalSnackbar } from '@/utils'

import { addProductsFromCartToQuote } from './utils'

type DispatchProps = Dispatch<SetStateAction<OpenPageState>>
interface MutationObserverProps {
  setOpenPage: DispatchProps
  cartQuoteEnabled: boolean
}

interface IsShowBlockPendingAccountOrderCreationTipProps {
  cartTip: number
  checkoutTip: number
}

const useCartToQuote = ({
  setOpenPage,
  cartQuoteEnabled,
}: MutationObserverProps) => {
  const platform = useAppSelector(({ global }) => global.storeInfo.platform)
  const { addToQuote, addLoadding } = addProductsFromCartToQuote(
    setOpenPage,
    platform
  )

  const translationVarName = 'global.customStyles.addToAllQuoteBtn'
  const defaultButtonText = 'Add All To Quote'

  const {
    state: { addToAllQuoteBtn },
  } = useContext(CustomStyleContext)

  const {
    state: { companyInfo },
  } = useContext(GlobaledContext)
  const blockPendingAccountOrderCreation = B3SStorage.get(
    'blockPendingAccountOrderCreation'
  )

  const checkIsInPage = (url: string) => window.location.href.includes(url)

  const { pathname } = window.location

  useEffect(() => {
    const urlArr = ['/cart.php', '/checkout']

    const showPendingAccountTip = () => {
      const isShowBlockPendingAccountOrderCreationTip: IsShowBlockPendingAccountOrderCreationTipProps =
        B3SStorage.get('isShowBlockPendingAccountOrderCreationTip') || {
          cartTip: 0,
          checkoutTip: 0,
        }

      if (!urlArr.includes(pathname)) return

      if (companyInfo.companyStatus === '') return

      if (+companyInfo.companyStatus || !blockPendingAccountOrderCreation)
        return

      if (
        isShowBlockPendingAccountOrderCreationTip.cartTip &&
        checkIsInPage(urlArr[0])
      )
        return

      if (
        isShowBlockPendingAccountOrderCreationTip.checkoutTip &&
        checkIsInPage(urlArr[1])
      )
        return

      if (checkIsInPage(urlArr[0])) {
        globalSnackbar.warning(
          'Your account is pending approval. Ordering will be enabled after account approval',
          {
            isClose: true,
          }
        )
      }

      if (checkIsInPage(urlArr[1])) {
        globalSnackbar.error(
          'Your account is pending approval. Ordering will be enabled after account approval'
        )
      }

      B3SStorage.set('isShowBlockPendingAccountOrderCreationTip', {
        cartTip:
          +checkIsInPage(urlArr[0]) +
          isShowBlockPendingAccountOrderCreationTip.cartTip,
        checkoutTip:
          +checkIsInPage(urlArr[1]) +
          isShowBlockPendingAccountOrderCreationTip.checkoutTip,
      })
    }

    showPendingAccountTip()
  }, [pathname, blockPendingAccountOrderCreation, companyInfo.companyStatus])

  const quoteCallBbck = useCallback(() => {
    const b3CartToQuote = document.querySelector('.b2b-cart-to-quote')

    const b2bLoading = document.querySelector('#b2b-div-loading')
    if (b3CartToQuote && !b2bLoading) {
      addLoadding(b3CartToQuote)
      addToQuote()
    }
  }, [addLoadding, addToQuote])

  const {
    color = '',
    text = '',
    customCss = '',
    classSelector = '',
    locationSelector = '',
    enabled = false,
  } = addToAllQuoteBtn

  const cartToQuoteBtnLabel = useGetButtonText(
    translationVarName,
    text,
    defaultButtonText
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
    const addToQuoteAll = document.querySelectorAll(
      globalB3['dom.cartActions.container']
    )
    const CustomAddToQuoteAll = locationSelector
      ? document.querySelectorAll(locationSelector)
      : []

    let cartQuoteBtnDom: CustomFieldItems | null = null
    if (!addToQuoteAll.length && !CustomAddToQuoteAll.length) return

    if (!cartQuoteEnabled || window?.location?.pathname?.includes('checkout')) {
      document.querySelector('.b2b-cart-to-quote')?.remove()
      return
    }

    if (document.querySelectorAll('.b2b-cart-to-quote')?.length) {
      const cartToQuoteBtns = document.querySelectorAll('.b2b-cart-to-quote')
      cartToQuoteBtns.forEach((button: CustomFieldItems) => {
        const cartToQuoteBtn = button
        cartToQuoteBtn.innerHTML = cartToQuoteBtnLabel
        cartToQuoteBtn.setAttribute('style', customCss)
        cartToQuoteBtn.style.backgroundColor = color
        cartToQuoteBtn.style.color = customTextColor
        cartToQuoteBtn.setAttribute(
          'class',
          `b2b-cart-to-quote ${classSelector}`
        )

        setMediaStyle(mediaBlocks, `b2b-cart-to-quote ${classSelector}`)
      })
      return
    }

    if (enabled) {
      ;(CustomAddToQuoteAll.length
        ? CustomAddToQuoteAll
        : addToQuoteAll
      ).forEach((node: CustomFieldItems) => {
        cartQuoteBtnDom = document.createElement('div')
        cartQuoteBtnDom.innerHTML = cartToQuoteBtnLabel
        cartQuoteBtnDom.setAttribute('style', customCss)
        cartQuoteBtnDom.style.backgroundColor = color
        cartQuoteBtnDom.style.color = customTextColor
        cartQuoteBtnDom.setAttribute(
          'class',
          `b2b-cart-to-quote ${classSelector}`
        )

        setMediaStyle(mediaBlocks, `b2b-cart-to-quote ${classSelector}`)
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
  }, [
    cartQuoteEnabled,
    addToAllQuoteBtn,
    cartToQuoteBtnLabel,
    classSelector,
    color,
    customCss,
    customTextColor,
    enabled,
    locationSelector,
    mediaBlocks,
    quoteCallBbck,
  ])
}

export default useCartToQuote
