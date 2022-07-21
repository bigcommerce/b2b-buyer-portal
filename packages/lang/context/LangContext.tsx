import {
  useReducer,
  createContext,
  useMemo,
  Dispatch,
  ReactNode,
  Context,
  Reducer,
} from 'react'

import {
  LangUtils,
} from '@b3/utils'

interface LangContextState {
  lang: string,
}

interface LangContextAction {
  type?: string,
  payload?: any
}

const initState: LangContextState = {
  lang: LangUtils.getBrowserLanguage(),
}

export const LangContext: Context<{
  state: LangContextState
  dispatch?: Dispatch<LangContextAction>
}> = createContext({
  state: initState,
})

type LangReducer = Reducer<LangContextState, LangContextAction>

const langReducer: LangReducer = (state, action) => {
  switch (action.type) {
    case 'lang':
      return {
        ...state,
        ...action.payload,
      }
    default:
      return state
  }
}

interface LangContextProviderProps {
  children: ReactNode
}

export function LangContextProvider(props: LangContextProviderProps) {
  const [state, dispatch] = useReducer(langReducer, initState)

  const {
    children,
  } = props

  const LangValue = useMemo(() => ({
    state,
    dispatch,
  }), [state.lang])

  return (
    <LangContext.Provider value={LangValue}>
      {children}
    </LangContext.Provider>
  )
}
