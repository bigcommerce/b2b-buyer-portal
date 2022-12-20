import {
  useEffect,
} from 'react'

export const useB3PDPOpen = (el: string, cd: () => void) => {
  useEffect(() => {
    const addToCartAll = document.querySelectorAll(el)
    console.log(addToCartAll, 'addToCartAll')
    let shoppingBtnDom: any = null
    if (!addToCartAll.length) return
    addToCartAll.forEach((node: any) => {
      shoppingBtnDom = document.createElement('div')
      shoppingBtnDom.setAttribute('id', 'shoppingListBtn')
      shoppingBtnDom.innerHTML = 'Test'
      node.parentNode.appendChild(shoppingBtnDom)
      shoppingBtnDom.addEventListener('click', cd, {
        capture: true,
      })
    })

    return () => {
      if (shoppingBtnDom) {
        shoppingBtnDom.removeEventListener('click', cd)
      }
    }
  }, [])
}
