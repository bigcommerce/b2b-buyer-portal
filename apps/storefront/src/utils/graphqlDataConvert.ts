export const convertObjectToGraphql = (data: CustomFieldItems) => {
  if (typeof data === 'string') {
    return `"${data}"`
  }
  if (typeof data === 'number') {
    return data
  }
  let str = '{'
  Object.keys(data).forEach((item: any, index) => {
    if (typeof data[item] === 'string' || typeof data[item] === 'number') {
      if (index === Object.keys(data).length - 1) {
        str += `${item}: `
        str += `${JSON.stringify(`${data[item]}`)}`
      } else {
        str += `${item}: `
        str += `${JSON.stringify(`${data[item]}`)}, `
      }
    }

    if (Object.prototype.toString.call(data[item]) === '[object Object]') {
      str += `${item}: `
      str += convertObjectToGraphql(data[item])
    }

    if (Object.prototype.toString.call(data[item]) === '[object Array]') {
      str += `${item}: [`
      data[item].forEach((list: any, index: number) => {
        str += convertObjectToGraphql(list)
        if (index < data[item].length - 1) {
          str += ','
        }
      })
      str += '],'
    }
  })
  str += '},'

  return str
}

export const convertArrayToGraphql = (data: CustomFieldItems) => {
  let str = '['
  data.forEach((list: any) => {
    str += convertObjectToGraphql(list)
  })
  str += ']'

  return str
}
