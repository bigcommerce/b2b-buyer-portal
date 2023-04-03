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
  removeElement,
} from './utils'

import {
  useDomVariation,
} from './useDomVariation'

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

  const pdpCallBbck = useCallback(() => {
    setOpenPage({
      isOpen: true,
      openUrl: '/pdp',
    })
  }, [])

  const [openQuickView] = useDomVariation(globalB3['dom.setToShoppingListParentEl'])

  useEffect(() => {
    const addToCartAll = document.querySelectorAll(globalB3['dom.setToShoppingListParentEl'])
    const wishlistSdd = document.querySelector('form[data-wishlist-add]')
    let shoppingBtnDom: CustomFieldItems | null = null
    if (!addToCartAll.length) return
    if (document.querySelectorAll('.b2b-shopping-list-btn').length) return
    const {
      color = '',
      buttonText = '',
      customCss = '',
      classSelector = '',
      locationSelector = '',
      enabled = false,
    } = shoppingListBtn
    if (shoppingListEnabled && enabled) {
      addToCartAll.forEach((node: CustomFieldItems) => {
        shoppingBtnDom = document.createElement('div')
        shoppingBtnDom.setAttribute('id', `${locationSelector}`)
        shoppingBtnDom.innerHTML = buttonText || 'Add to Shopping List'
        shoppingBtnDom.setAttribute('style', customCss)
        shoppingBtnDom.style.color = color
        shoppingBtnDom.setAttribute('class', `b2b-shopping-list-btn ${classSelector}`)
        node.parentNode.appendChild(shoppingBtnDom)
        shoppingBtnDom.addEventListener('click', pdpCallBbck, {
          capture: true,
        })
      })
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
