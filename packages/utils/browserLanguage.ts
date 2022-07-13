const browserLanguage = () => {
  const lang = navigator.language
  return lang.substring(0, 2)
}

export default browserLanguage
