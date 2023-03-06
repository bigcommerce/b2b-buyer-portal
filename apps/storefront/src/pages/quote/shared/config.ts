export interface QuoteListitemProps {
  node: {
    variantSku: number | string,
    variantId: number | string,
    primaryImage: string,
    productName: string,
    optionList: string,
    productId: number | string,
    basePrice: number,
    productsSearch: CustomFieldItems
    quantity: number,
    tax: number,
  }
}

export const compareOption = (langList: CustomFieldItems[], shortList:CustomFieldItems[]) => {
  let flag = true
  langList.forEach((item: CustomFieldItems) => {
    const option = shortList.find((list: CustomFieldItems) => list.optionId === item.optionId)
    if (!option) {
      if (item?.optionValue) flag = false
    } else if (item.optionValue !== option.optionValue) flag = false
  })
  return flag
}
