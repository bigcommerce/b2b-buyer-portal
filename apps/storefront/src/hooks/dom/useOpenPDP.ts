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
import { cloneDeep } from 'lodash'

import {
  getContrastColor,
  getStyles,
  setMediaStyle,
  splitCustomCssValue,
} from '@/components/outSideComponents/utils/b3CustomStyles'
import { CustomStyleContext } from '@/shared/customStyleButtton'
import { GlobaledContext } from '@/shared/global'
import { setGlabolCommonState } from '@/store'

import useRole from '../useRole'

import useDomVariation from './useDomVariation'
import { removeElement } from './utils'

interface MutationObserverProps {
  setOpenPage: Dispatch<SetStateAction<OpenPageState>>
  role: number | string
}

const useOpenPDP = ({ setOpenPage, role }: MutationObserverProps) => {
  const {
    state: { shoppingListBtn },
  } = useContext(CustomStyleContext)

  const cache = useRef({})

  const storeDispatch = useDispatch()
  const {
    dispatch,
    state: { isB2BUser, shoppingListEnabled },
  } = useContext(GlobaledContext)

  const [roleText] = useRole()

  const jumpRegister = useCallback(() => {
    setOpenPage({
      isOpen: true,
      openUrl: '/registered',
    })
  }, [])

  const pdpCallBack = useCallback(
    (e: React.MouseEvent) => {
      const b3ShoppingList = e.target as HTMLElement

      if (role === 100) {
        storeDispatch(
          setGlabolCommonState({
            globalMessage: {
              open: true,
              title: 'Registration',
              message:
                'Please create an account, or login to create a shopping list.',
              cancelText: 'Cancel',
              saveText: 'Register',
              saveFn: jumpRegister,
            },
          })
        )
      } else {
        setOpenPage({
          isOpen: true,
          openUrl: '/pdp',
        })

        dispatch({
          type: 'common',
          payload: {
            shoppingListClickNode: b3ShoppingList,
          },
        })
      }
    },
    [role]
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
        const myShoppingListBtn = document.querySelectorAll('.b2b-add-to-list')
        myShoppingListBtn.forEach((myShoppingListBtn: CustomFieldItems) => {
          myShoppingListBtn.innerHTML = text || 'Add to Shopping List'
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
          shoppingBtnDom.innerHTML = text || 'Add to Shopping List'
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
  }, [isB2BUser, shoppingListEnabled, openQuickView, shoppingListBtn, roleText])
}

export default useOpenPDP
