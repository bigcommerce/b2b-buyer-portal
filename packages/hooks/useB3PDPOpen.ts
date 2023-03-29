import {
  useEffect,
} from 'react'

const removeElement = (_element: CustomFieldItems) => {
  const _parentElement = _element.parentNode
  if (_parentElement) {
    _parentElement.removeChild(_element)
  }
}

export const useB3PDPOpen = (el: string, cd: () => void, isB2BUser: boolean, shoppingListEnabled: boolean, openQuickView: boolean) => {
  useEffect(() => {
    const addToCartAll = document.querySelectorAll(el)
    const wishlistSdd = document.querySelector('form[data-wishlist-add]')
    let shoppingBtnDom: CustomFieldItems | null = null
    if (!addToCartAll.length) return
    if (document.querySelectorAll('#shoppingListBtn').length) return
    if (shoppingListEnabled) {
      // const style = 'background-color:red;color: white;font-size:18px;'
      addToCartAll.forEach((node: CustomFieldItems) => {
        shoppingBtnDom = document.createElement('div')
        shoppingBtnDom.setAttribute('id', 'shoppingListBtn')
        shoppingBtnDom.innerHTML = 'Add to Shopping List'
        // shoppingBtnDom.setAttribute('style', style)
        // shoppingBtnDom.setAttribute('class', 'xxxx aaa')
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
  }, [isB2BUser, shoppingListEnabled, openQuickView])
}
