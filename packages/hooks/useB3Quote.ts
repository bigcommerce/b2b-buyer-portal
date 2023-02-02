import {
  useEffect,
} from 'react'

export const useB3Quote = (el: string, cd: () => void, openQuickViewNum: number, isEnabled: boolean) => {
  useEffect(() => {
    const addToQuoteAll = document.querySelectorAll(el)

    // const wishlistSdd = document.querySelector('form[data-wishlist-add]')
    let shoppingBtnDom: CustomFieldItems | null = null
    if (!addToQuoteAll.length) return

    if (!isEnabled) {
      document.querySelector('#b3MyQuote')?.remove()
      return
    }

    if (document.querySelectorAll('#b3MyQuote')?.length) {
      return
    }

    addToQuoteAll.forEach((node: CustomFieldItems) => {
      shoppingBtnDom = document.createElement('div')
      shoppingBtnDom.setAttribute('id', 'b3MyQuote')
      // shoppingBtnDom.setAttribute('class', 'b2b-btn-loading')
      shoppingBtnDom.innerHTML = 'Add to Quote'
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
  }, [openQuickViewNum, isEnabled])
}
