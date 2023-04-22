import { Dispatch, ReactNode, SetStateAction } from 'react'
import type { OpenPageState } from '@b3/hooks'

import RegisteredCloseButton from './RegisteredCloseButton'
import { CardContainer } from './styled'

interface B3CardProps {
  setOpenPage?: Dispatch<SetStateAction<OpenPageState>>
  children: ReactNode
}

export default function B3Card(props: B3CardProps) {
  const { setOpenPage, children } = props

  return (
    <CardContainer>
      {setOpenPage && <RegisteredCloseButton setOpenPage={setOpenPage} />}
      {children}
    </CardContainer>
  )
}
