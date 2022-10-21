import {
  Dispatch,
  SetStateAction,
  ReactNode,
} from 'react'

import type {
  OpenPageState,
} from '@b3/hooks'

import {
  CardContainer,
} from './styled'

import {
  RegisteredCloseButton,
} from './RegisteredCloseButton'

interface B3CardProps {
  setOpenPage?: Dispatch<SetStateAction<OpenPageState>>,
  children: ReactNode;
}

export const B3Card = (props:B3CardProps) => {
  const {
    setOpenPage,
    children,
  } = props

  return (
    <CardContainer>
      {
        setOpenPage && <RegisteredCloseButton setOpenPage={setOpenPage} />
      }
      { children }
    </CardContainer>
  )
}
