import { useEffect, useRef, useState } from 'react'

import { getB2BProductPurchasable } from '@/shared/service/b2b/graphql/product'
import { store } from '@/store'

interface MyMutationRecord extends MutationRecord {
  target: HTMLElement
}

interface ProductInfoProps {
  availability: boolean
  inventoryLevel: number
  inventoryTracking: boolean
  purchasingDisabled: boolean
}

const usePurchasableQuote = (openQuickView: boolean) => {
  const [isBuyPurchasable, setBuyPurchasable] = useState<boolean>(true)

  const productInfoRef = useRef<ProductInfoProps>({
    availability: false,
    inventoryLevel: 0,
    inventoryTracking: false,
    purchasingDisabled: false,
  })

  const {
    global: {
      blockPendingQuoteNonPurchasableOOS: { isEnableProduct },
    },
  } = store.getState()

  const isOOStockPurchaseQuantity = (
    qty: number,
    productPurchasable: ProductInfoProps
  ): boolean => {
    const { inventoryLevel, inventoryTracking } = productPurchasable

    if (inventoryTracking && qty > inventoryLevel) return true

    return false
  }

  const callback = async (
    newSkuValue: string,
    isDetailOpen: boolean,
    isInit?: boolean
  ): Promise<void> => {
    const modal = document.getElementById('modal') as HTMLElement

    const dom = isDetailOpen ? document : modal
    const productViewQty =
      (dom.querySelector('[name="qty[]"]') as CustomFieldItems)?.value || 1

    const productId = (
      dom.querySelector('input[name=product_id]') as CustomFieldItems
    )?.value

    const {
      productPurchasable: {
        availability,
        inventoryLevel,
        inventoryTracking,
        purchasingDisabled,
      },
    } = await getB2BProductPurchasable({
      productId,
      sku: newSkuValue || '',
      isProduct: !!isInit,
    })

    const productPurchasable = {
      availability: availability === 'available',
      inventoryLevel,
      inventoryTracking:
        inventoryTracking === 'product' || inventoryTracking === 'variant',
      purchasingDisabled,
    }
    if (productInfoRef?.current) {
      productInfoRef.current = productPurchasable
    }

    const isOOStock = isOOStockPurchaseQuantity(
      +productViewQty,
      productPurchasable
    )
    if (
      purchasingDisabled === '1' ||
      isOOStock ||
      availability !== 'available'
    ) {
      setBuyPurchasable(false)
    } else {
      setBuyPurchasable(true)
    }
  }

  useEffect(() => {
    const modal = document.getElementById('modal') as HTMLElement

    let productViewSku: Element | null =
      document.querySelector('[data-product-sku]') || null
    let qtyDom: HTMLInputElement | null =
      document.querySelector('[name="qty[]"]') || null
    let isDetailOpen = true
    let dataQuantityChangeDom =
      document.querySelector('[data-quantity-change]') || null
    // information about multiple products exists
    if (modal && modal.classList.contains('open')) {
      productViewSku = modal.querySelector('[data-product-sku]')
      qtyDom = modal.querySelector('[name="qty[]"]')
      dataQuantityChangeDom = modal.querySelector('[data-quantity-change]')
      isDetailOpen = false
    }

    if (productViewSku && isEnableProduct) {
      const sku = productViewSku.innerHTML.trim()
      callback(sku, isDetailOpen, true)
    }

    const observer = new MutationObserver((mutations: MutationRecord[]) => {
      let sku = ''
      mutations.forEach((mutation) => {
        const myMutation: MyMutationRecord = mutation as MyMutationRecord
        if (
          myMutation.type === 'childList' &&
          myMutation.target.hasAttribute('data-product-sku')
        ) {
          const newSkuValue = myMutation.target.innerHTML.trim()
          sku = newSkuValue
        }
      })
      if (sku) callback(sku, isDetailOpen, false)
    })

    const config: MutationObserverInit = { childList: true, subtree: true }

    if (productViewSku && isEnableProduct) {
      observer.observe(productViewSku, config)
    }

    const judgmentBuyPurchasable = (newQuantity: number | string) => {
      const isOOStock = isOOStockPurchaseQuantity(
        +newQuantity,
        productInfoRef.current
      )

      if (isOOStock) {
        setBuyPurchasable(false)
      } else {
        setBuyPurchasable(true)
      }
    }

    const handleQuantityChange = () => {
      const newQuantity = qtyDom ? qtyDom.value : 0

      judgmentBuyPurchasable(newQuantity)
    }

    if (qtyDom && isEnableProduct) {
      qtyDom.addEventListener('input', handleQuantityChange)
    }

    const handleBtnQuantityChange = (button: Element) => {
      if (qtyDom) {
        const action = button.getAttribute('data-action')
        const val = qtyDom?.value || '1'

        const isNumber = (str: string) => /^\d+$/.test(str)

        if (!isNumber(val)) {
          judgmentBuyPurchasable(action === 'dec' ? 0 : 1)

          return
        }

        if (action === 'dec' && (val === '0' || val === '1')) {
          judgmentBuyPurchasable(val)
          return
        }

        const newNum = action === 'dec' ? +val - 1 : +val + 1

        judgmentBuyPurchasable(newNum)
      }
    }

    if (dataQuantityChangeDom && isEnableProduct) {
      const buttons = dataQuantityChangeDom.querySelectorAll('button')
      buttons.forEach((button) => {
        button.addEventListener('click', () => {
          handleBtnQuantityChange(button)
        })
        return () => {
          button.removeEventListener('click', () => {
            handleBtnQuantityChange(button)
          })
        }
      })
    }

    return () => {
      if (observer) observer.disconnect()
      if (qtyDom) qtyDom.removeEventListener('input', handleQuantityChange)
    }
  }, [openQuickView, isEnableProduct])

  return [isBuyPurchasable]
}

export default usePurchasableQuote
