const getCookie = (name: string): string => {
  const strCookie = document.cookie
  const arrCookie = strCookie.split('; ')
  for (let i = 0; i < arrCookie.length; i += 1) {
    const arr = arrCookie[i].split('=')
    if (name === arr[0]) {
      return arr[1]
    }
  }
  return ''
}

export default getCookie
