export const Lang = {
  getBrowserLanguage: () => {
    const lang = navigator.language
    return lang.substring(0, 2)
  },
}
