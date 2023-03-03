import {
  useEffect,
} from 'react'

const removeElement = (_element: CustomFieldItems) => {
  const _parentElement = _element.parentNode
  if (_parentElement) {
    _parentElement.removeChild(_element)
  }
}

export const useB3PDPOpen = (el: string, cd: () => void, isB2BUser: boolean, shoppingListEnabled: boolean, openQuickViewNum: number) => {
  useEffect(() => {
    const addToCartAll = document.querySelectorAll(el)
    const wishlistSdd = document.querySelector('form[data-wishlist-add]')
    let shoppingBtnDom: CustomFieldItems | null = null
    if (!addToCartAll.length) return
    if (document.querySelectorAll('#shoppingListBtn').length) return
    if (shoppingListEnabled) {
      addToCartAll.forEach((node: CustomFieldItems) => {
        shoppingBtnDom = document.createElement('div')
        shoppingBtnDom.setAttribute('id', 'shoppingListBtn')
        shoppingBtnDom.innerHTML = 'Add to Shopping List'
        node.parentNode.appendChild(shoppingBtnDom)
        shoppingBtnDom.addEventListener('click', cd, {
          capture: true,
        })
      })
      if (wishlistSdd) (wishlistSdd as CustomFieldItems).style.display = 'none'
    } else {
      const shoppingListBtn = document.querySelectorAll('#shoppingListBtn')
      shoppingListBtn.forEach((item: any) => {
        removeElement(item)
      })
      if (wishlistSdd) (wishlistSdd as CustomFieldItems).style.display = 'block'
    }

    return () => {
      if (shoppingBtnDom) {
        shoppingBtnDom.removeEventListener('click', cd)
      }
    }
  }, [isB2BUser, shoppingListEnabled, openQuickViewNum])
}
