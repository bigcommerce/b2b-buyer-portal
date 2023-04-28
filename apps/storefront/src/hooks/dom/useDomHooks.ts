import { Dispatch, SetStateAction, useContext } from 'react'
import { OpenPageState } from '@b3/hooks'

import { GlobaledContext } from '@/shared/global'

import useCartToQuote from './useCartToQuote'
import useJuniorCart from './useJuniorCart'
import useMyQuote from './useMyQuote'
import useOpenPDP from './useOpenPDP'
import useRegisteredbctob2b from './useRegisteredbctob2b'

type DispatchProps = Dispatch<SetStateAction<OpenPageState>>
interface MutationObserverProps {
  setOpenPage: DispatchProps
}

const useDomHooks = ({ setOpenPage }: MutationObserverProps) => {
  const {
    state: {
      customerId,
      role,
      productQuoteEnabled,
      cartQuoteEnabled,
      B3UserId,
    },
  } = useContext(GlobaledContext)

  useJuniorCart({ role })

  useOpenPDP({
    setOpenPage,
    role,
  })

  useRegisteredbctob2b(setOpenPage)

  useMyQuote({
    setOpenPage,
    productQuoteEnabled,
    B3UserId,
    role,
    customerId,
  })
  useCartToQuote({
    setOpenPage,
    cartQuoteEnabled,
  })
}

export default useDomHooks
