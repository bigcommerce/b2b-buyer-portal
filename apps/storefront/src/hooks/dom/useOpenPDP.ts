import {
  Dispatch,
  SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from 'react'
import { useDispatch } from 'react-redux'
import globalB3 from '@b3/global-b3'
import type { OpenPageState } from '@b3/hooks'
import { AnyAction, Dispatch as DispatchRedux } from '@reduxjs/toolkit'
import cloneDeep from 'lodash-es/cloneDeep'

import {
  getContrastColor,
  getStyles,
  setMediaStyle,
  splitCustomCssValue,
} from '@/components/outSideComponents/utils/b3CustomStyles'
import {
  ADD_TO_SHOPPING_LIST_DEFUALT_VALUE,
  TRANSLATION_SHOPPING_LIST_BTN_VARAIBLE,
} from '@/constants'
import { CustomStyleContext } from '@/shared/customStyleButtton'
import { GlobaledContext } from '@/shared/global'
import { setGlabolCommonState } from '@/store'

import useGetButtonText from '../useGetButtonText'
import useRole from '../useRole'

import useDomVariation from './useDomVariation'
import { removeElement } from './utils'

interface MutationObserverProps {
  setOpenPage: Dispatch<SetStateAction<OpenPageState>>
  role: number | string
}
interface AddProductFromPageParams {
  role: number
  storeDispatch: DispatchRedux<AnyAction>
  saveFn: () => void
  setOpenPage: (value: SetStateAction<OpenPageState>) => void
  registerEnabled: boolean
}

export const addProductFromPage = ({
  role,
  storeDispatch,
  saveFn,
  setOpenPage,
  registerEnabled,
}: AddProductFromPageParams) => {
  if (role === 100) {
    storeDispatch(
      setGlabolCommonState({
        globalMessage: {
          open: true,
          title: 'Registration',
          message:
            'Please create an account, or login to create a shopping list.',
          cancelText: 'Cancel',
          saveText: registerEnabled ? 'Register' : '',
          saveFn,
        },
      })
    )
  } else {
    setOpenPage({
      isOpen: true,
      openUrl: '/pdp',
    })
  }
}

export const useOpenPDP = ({ setOpenPage, role }: MutationObserverProps) => {
  const {
    state: { shoppingListBtn },
  } = useContext(CustomStyleContext)

  const cache = useRef({})

  const storeDispatch = useDispatch()
  const {
    dispatch,
    state: { isB2BUser, shoppingListEnabled, registerEnabled },
  } = useContext(GlobaledContext)

  const [roleText] = useRole()

  const jumpRegister = useCallback(() => {
    setOpenPage({
      isOpen: true,
      openUrl: '/register',
    })
  }, [])

  const pdpCallBack = useCallback(
    ({ target }: { target: HTMLElement }) => {
      dispatch({
        type: 'common',
        payload: {
          shoppingListClickNode: target,
        },
      })

      addProductFromPage({
        role: +role,
        storeDispatch,
        saveFn: jumpRegister,
        setOpenPage,
        registerEnabled,
      })
    },
    [role, registerEnabled]
  )

  const [openQuickView] = useDomVariation(
    globalB3['dom.setToShoppingListParentEl']
  )

  const {
    color = '#74685c',
    text = '',
    customCss = '',
    classSelector = '',
    locationSelector = '',
    enabled = false,
  } = shoppingListBtn
  const myShoppingListBtnLabel = useGetButtonText(
    TRANSLATION_SHOPPING_LIST_BTN_VARAIBLE,
    text,
    ADD_TO_SHOPPING_LIST_DEFUALT_VALUE
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
    // if (role === 100) return
    const addToShoppingListAll = document.querySelectorAll(
      globalB3['dom.setToShoppingListParentEl']
    )
    const CustomAddToShoppingListAll = locationSelector
      ? document.querySelectorAll(locationSelector)
      : []

    const wishlistSdd = document.querySelector('form[data-wishlist-add]')
    if (!addToShoppingListAll.length && !CustomAddToShoppingListAll.length)
      return
    if (document.querySelectorAll('.b2b-add-to-list').length) {
      const cacheShoppingListDom = cache.current
      const isAddStyle = Object.keys(cacheShoppingListDom).every(
        (key: string) =>
          (cacheShoppingListDom as CustomFieldItems)[key] ===
          (shoppingListBtn as CustomFieldItems)[key]
      )
      if (!isAddStyle) {
        const myShoppingListBtns = document.querySelectorAll('.b2b-add-to-list')
        myShoppingListBtns.forEach((button: CustomFieldItems) => {
          const myShoppingListBtn = button
          myShoppingListBtn.innerHTML = myShoppingListBtnLabel
          myShoppingListBtn.setAttribute('style', customCss)
          myShoppingListBtn.style.backgroundColor = color
          myShoppingListBtn.style.color = customTextColor
          myShoppingListBtn.setAttribute(
            'class',
            `b2b-add-to-list ${classSelector}`
          )
          setMediaStyle(mediaBlocks, `b2b-add-to-list ${classSelector}`)
        })
        cache.current = cloneDeep(shoppingListBtn)
      }
    }

    const isCurrentUserEnabled = roleText
      ? (shoppingListBtn as CustomFieldItems)[roleText]
      : ''

    if (shoppingListEnabled && enabled && isCurrentUserEnabled) {
      ;(CustomAddToShoppingListAll.length
        ? CustomAddToShoppingListAll
        : addToShoppingListAll
      ).forEach((node: CustomFieldItems) => {
        const children = node.parentNode.querySelectorAll('.b2b-add-to-list')

        if (!children.length) {
          let shoppingBtnDom: CustomFieldItems | null = null
          shoppingBtnDom = document.createElement('div')
          shoppingBtnDom.innerHTML = myShoppingListBtnLabel
          shoppingBtnDom.setAttribute('style', customCss)
          shoppingBtnDom.style.backgroundColor = color
          shoppingBtnDom.style.color = customTextColor
          shoppingBtnDom.setAttribute(
            'class',
            `b2b-add-to-list ${classSelector}`
          )

          setMediaStyle(mediaBlocks, `b2b-add-to-list ${classSelector}`)
          if (CustomAddToShoppingListAll.length) {
            node.appendChild(shoppingBtnDom)
          } else {
            node.parentNode.appendChild(shoppingBtnDom)
          }
          shoppingBtnDom.addEventListener('click', pdpCallBack, {
            capture: true,
          })
        }
      })
      cache.current = cloneDeep(shoppingListBtn)
      if (wishlistSdd) (wishlistSdd as CustomFieldItems).style.display = 'none'
    } else {
      const shoppingListBtn = document.querySelectorAll('.b2b-add-to-list')
      shoppingListBtn.forEach((item: CustomFieldItems) => {
        removeElement(item)
      })
      if (wishlistSdd) (wishlistSdd as CustomFieldItems).style.display = 'block'
    }

    // eslint-disable-next-line
    return () => {
      const shoppingListBtn = document.querySelectorAll('.b2b-add-to-list')
      shoppingListBtn.forEach((item: CustomFieldItems) => {
        item.removeEventListener('click', pdpCallBack)
      })
    }
  }, [
    isB2BUser,
    shoppingListEnabled,
    openQuickView,
    shoppingListBtn,
    roleText,
    registerEnabled,
  ])
}
