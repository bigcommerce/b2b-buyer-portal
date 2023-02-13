import {
  useEffect,
} from 'react'

export const useB3CartToQuote = (el: string, cd: () => void, isEnabled: boolean) => {
  useEffect(() => {
    const addToQuoteAll = document.querySelectorAll(el)

    let cartQuoteBtnDom: CustomFieldItems | null = null
    if (!addToQuoteAll.length) return

    if (!isEnabled) {
      document.querySelector('#b3CartToQuote')?.remove()
      return
    }

    if (document.querySelectorAll('#b3CartToQuote')?.length) {
      return
    }

    addToQuoteAll.forEach((node: CustomFieldItems) => {
      cartQuoteBtnDom = document.createElement('div')
      cartQuoteBtnDom.setAttribute('id', 'b3CartToQuote')
      cartQuoteBtnDom.innerHTML = 'Add All to Quote'
      node.appendChild(cartQuoteBtnDom)
      cartQuoteBtnDom.addEventListener('click', cd, {
        capture: true,
      })
    })
    return () => {
      if (cartQuoteBtnDom) {
        cartQuoteBtnDom.removeEventListener('click', cd)
      }
    }
  }, [isEnabled])
}
