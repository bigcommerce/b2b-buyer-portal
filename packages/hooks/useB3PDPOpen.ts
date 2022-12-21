import {
  useEffect,
} from 'react'

const removeElement = (_element: any) => {
  const _parentElement = _element.parentNode
  if (_parentElement) {
    _parentElement.removeChild(_element)
  }
}

export const useB3PDPOpen = (el: string, cd: () => void, isB2BUser: boolean, role: string | number) => {
  useEffect(() => {
    const addToCartAll = document.querySelectorAll(el)
    let shoppingBtnDom: any = null
    if (!addToCartAll.length) return
    if (document.querySelectorAll('#shoppingListBtn').length) return
    if (isB2BUser && (+role === 0 || +role === 1)) {
      addToCartAll.forEach((node: any) => {
        shoppingBtnDom = document.createElement('div')
        shoppingBtnDom.setAttribute('id', 'shoppingListBtn')
        shoppingBtnDom.innerHTML = 'Add to Shopping List'
        node.parentNode.appendChild(shoppingBtnDom)
        shoppingBtnDom.addEventListener('click', cd, {
          capture: true,
        })
      })
    } else {
      const shoppingListBtn = document.querySelectorAll('#shoppingListBtn')
      shoppingListBtn.forEach((item: any) => {
        removeElement(item)
      })
    }

    return () => {
      if (shoppingBtnDom) {
        shoppingBtnDom.removeEventListener('click', cd)
      }
    }
  }, [isB2BUser, role])
}
