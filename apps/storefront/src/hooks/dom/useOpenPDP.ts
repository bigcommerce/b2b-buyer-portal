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
  removeElement,
} from './utils'

import {
  useDomVariation,
} from './useDomVariation'

import {
  getContrastColor,
} from '@/components/outSideComponents/utils/b3CustomStyles'

interface MutationObserverProps {
  setOpenPage: Dispatch<SetStateAction<OpenPageState>>,
  isB2BUser: boolean,
  shoppingListEnabled: boolean,
}

const useOpenPDP = ({
  setOpenPage, isB2BUser, shoppingListEnabled,
}: MutationObserverProps) => {
  const {
    state: {
      shoppingListBtn,
    },
  } = useContext(CustomStyleContext)

  const cache = useRef({})

  const pdpCallBbck = useCallback(() => {
    setOpenPage({
      isOpen: true,
      openUrl: '/pdp',
    })
  }, [])

  const [openQuickView] = useDomVariation(globalB3['dom.setToShoppingListParentEl'])

  const {
    color = '',
    text = '',
    customCss = '',
    classSelector = '',
    locationSelector = '',
    enabled = false,
  } = shoppingListBtn

  useEffect(() => {
    const addToCartAll = document.querySelectorAll(globalB3['dom.setToShoppingListParentEl'])
    const wishlistSdd = document.querySelector('form[data-wishlist-add]')
    let shoppingBtnDom: CustomFieldItems | null = null
    if (!addToCartAll.length) return
    if (document.querySelectorAll('.b2b-shopping-list-btn').length) {
      const cacheShoppingListDom = cache.current
      const isAddStyle = Object.keys(cacheShoppingListDom).every((key: string) => (cacheShoppingListDom as CustomFieldItems)[key] === (shoppingListBtn as CustomFieldItems)[key])
      if (!isAddStyle) {
        const myShoppingListBtn = document.querySelectorAll('.b2b-shopping-list-btn')
        myShoppingListBtn.forEach((myShoppingListBtn: CustomFieldItems) => {
          myShoppingListBtn.setAttribute('id', `${locationSelector}`)
          myShoppingListBtn.innerHTML = text || 'Add to Shopping List'
          myShoppingListBtn.setAttribute('style', customCss)
          myShoppingListBtn.style.backgroundColor = color
          myShoppingListBtn.style.color = getContrastColor(color)
          myShoppingListBtn.setAttribute('class', `b2b-shopping-list-btn ${classSelector}`)
        })
        cache.current = cloneDeep(shoppingListBtn)
      }
      return
    }

    if (shoppingListEnabled && enabled) {
      addToCartAll.forEach((node: CustomFieldItems) => {
        shoppingBtnDom = document.createElement('div')
        shoppingBtnDom.setAttribute('id', `${locationSelector}`)
        shoppingBtnDom.innerHTML = text || 'Add to Shopping List'
        shoppingBtnDom.setAttribute('style', customCss)
        shoppingBtnDom.style.backgroundColor = color
        shoppingBtnDom.style.color = getContrastColor(color)
        shoppingBtnDom.setAttribute('class', `b2b-shopping-list-btn ${classSelector}`)
        node.parentNode.appendChild(shoppingBtnDom)
        shoppingBtnDom.addEventListener('click', pdpCallBbck, {
          capture: true,
        })
      })
      cache.current = cloneDeep(shoppingListBtn)
      if (wishlistSdd) (wishlistSdd as CustomFieldItems).style.display = 'none'
    } else {
      const shoppingListBtn = document.querySelectorAll('.b2b-shopping-list-btn')
      shoppingListBtn.forEach((item: any) => {
        removeElement(item)
      })
      if (wishlistSdd) (wishlistSdd as CustomFieldItems).style.display = 'block'
    }

    return () => {
      if (shoppingBtnDom) {
        shoppingBtnDom.removeEventListener('click', pdpCallBbck)
      }
    }
  }, [isB2BUser, shoppingListEnabled, openQuickView, shoppingListBtn])
}

export {
  useOpenPDP,
}
