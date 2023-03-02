export const removeEmptyRow = (arr: string[]) => {
  const tmpArr = arr
  if (tmpArr[tmpArr.length - 1] === '') {
    tmpArr.pop()
  }
  tmpArr.shift()

  return tmpArr
}

export const parseEmptyData = (arr: string[]) => {
  if (arr.length) {
    const tmpArr = arr.map((item: string) => {
      const products = item.split(',')
      return {
        sku: products[0],
        qty: products[1].replace(/[\r\n]/g, ''),
      }
    })
    return tmpArr
  }
  return []
}
