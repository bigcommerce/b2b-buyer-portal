import {
  B3LStorage,
} from '@/utils'

interface QuoteListitemProps {
  node: {
    id: number,
    quantity?: number,
    variantSku: number | string,
    variantId: number | string,
    primaryImage: number | string,
    productName: number | string,
    optionList: number | string,
    productId: number | string,
    basePrice: number | string,
    productsSearch: CustomFieldItems
  }
}

// const getProductPrice = async (optionList: Partial<optionListItem>[], quoteListitem: CustomFieldItems) => {
//   const currencies = B3SStorage.get('currencies')
//   const channelId = B3SStorage.get('B3channelId')
//   const customerInfo = B3SStorage.get('B3CustomerInfo') || {}

//   if (!customerInfo?.customerGroupId) customerInfo.customerGroupId = 0

//   const newOptionList: Partial<optionListItem>[] = []
//   optionList.forEach((item: Partial<optionListItem>) => {
//     const val = Number(item.optionValue)
//     if (!Number.isNaN(val)) {
//       newOptionList.push({
//         option_id: item.optionId,
//         value_id: Number(item.optionValue),
//       })
//     }
//   })
//   console.log(currencies, channelId, newOptionList, quoteListitem)
//   // TODO: get product price
//   // await
//   return quoteListitem
// }

const addQuoteDraftProduce = async (quoteListitem: CustomFieldItems, qty: number, optionList: CustomFieldItems[]) => {
  const b2bQuoteDraftList = B3LStorage.get('b2bQuoteDraftList') || []

  const compareOption = (langList: CustomFieldItems[], shortList:CustomFieldItems[]) => {
    let flag = true
    langList.forEach((item: CustomFieldItems) => {
      const option = shortList.find((list: CustomFieldItems) => list.optionId === item.optionId)
      if (!option) {
        if (item?.optionValue) flag = false
      } else if (item.optionValue !== option.optionValue) flag = false
    })
    return flag
  }

  const index = b2bQuoteDraftList.findIndex((item: QuoteListitemProps) => item?.node?.variantSku === quoteListitem.node.variantSku)

  if (index !== -1) {
    // TODO optionList compare
    const oldOptionList = JSON.parse(b2bQuoteDraftList[index].node.optionList)

    const isAdd = oldOptionList.length > optionList.length ? compareOption(oldOptionList, optionList) : compareOption(optionList, oldOptionList)

    if (isAdd) {
      b2bQuoteDraftList[index].node.quantity += +qty
    } else {
      // const productList = await getProductPrice(optionList, quoteListitem)
      b2bQuoteDraftList.push(quoteListitem)
    }
  } else {
    // const productList = await getProductPrice(optionList, quoteListitem)
    b2bQuoteDraftList.push(quoteListitem)
  }

  B3LStorage.set('b2bQuoteDraftList', b2bQuoteDraftList)
}

export {
  // getProductPrice,
  addQuoteDraftProduce,
}
