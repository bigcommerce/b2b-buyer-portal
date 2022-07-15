import { useContext } from 'react'

import { LangContext } from './context/LangContext'

export const useB3CurrentLang = () => {
  const { state, dispatch } = useContext(LangContext)
  const setLang = (lang: string) => {
    if (dispatch) {
      dispatch({
        type: 'lang',
        payload: {
          lang,
        },
      })
    }
  }

  return [
    state.lang,
    setLang,
  ] as const
}
