import CryptoJS from 'crypto-js'
import tripledes from 'crypto-js/tripledes'

const encryptedStr = 'B3Info'

export const cipherText = (text: any) => {
  if (!text) return ''
  const stringifiedText =
    typeof text === 'boolean' || typeof text === 'number'
      ? text.toString()
      : text
  return tripledes.encrypt(stringifiedText, encryptedStr).toString()
}

export const plainText = (text: any) => {
  if (!text) return ''
  return tripledes.decrypt(text, encryptedStr).toString(CryptoJS.enc.Utf8)
}

export const setCipherTextToStorage = (key: any, value: any) => {
  sessionStorage.setItem(key, cipherText(value))
}

export const getPlainTextFromStorage = (key: any) =>
  plainText(sessionStorage.getItem(key))
