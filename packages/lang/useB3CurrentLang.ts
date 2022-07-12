import {
  useState,
  useEffect,
  Dispatch,
  SetStateAction,
} from 'react'

import { BrowserLanguage } from '@b3/utils'

const defaultLang = (() => {
  const lang = BrowserLanguage()
  const safeValue = ['en', 'zh', 'fr', 'nl', 'de', 'it', 'es']

  return safeValue.indexOf(lang) !== -1 ? lang : 'en'
})()

const subscriptions: Dispatch<SetStateAction<string>>[] = []
let lang = defaultLang

const setLang = (newLang: string) => {
  lang = newLang
  subscriptions.forEach((subscription) => {
    subscription(lang)
  })
}

type UseB3CurrentLang = {
  (): [string, (newLang: string) => void]
}

export const useB3CurrentLang: UseB3CurrentLang = () => {
  const [_, newSubscription] = useState(defaultLang)
  useEffect(() => {
    subscriptions.push(newSubscription)
  }, [])
  return [lang, setLang]
}
