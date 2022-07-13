import {
  useReducer, createContext, useMemo, Dispatch, ReactNode, Context, Reducer,
} from 'react'

import { browserLanguage } from '@b3/utils'

interface LangStateInterface {
  lang: string,
}

interface LangActionInterface {
  type?: string,
  payload?: any
}

const initState: LangStateInterface = {
  lang: browserLanguage(),
}

export const LangContext: Context<{
  state: LangStateInterface
  dispatch?: Dispatch<LangActionInterface>
}> = createContext({
  state: initState,
})

type LangReducer = Reducer<LangStateInterface, LangActionInterface>

const langReducer: LangReducer = (state, action) => {
  switch (action.type) {
    case 'lang':
      return { ...state, ...action.payload }
    default:
      return state
  }
}

interface LangContextProviderProps {
  children: ReactNode
}

export function LangContextProvider(props: LangContextProviderProps) {
  const [state, dispatch] = useReducer(langReducer, initState)

  const { children } = props

  const LangValue = useMemo(() => ({ state, dispatch }), [state])

  return (
    <LangContext.Provider value={LangValue}>
      {children}
    </LangContext.Provider>
  )
}
