import { Dispatch, SetStateAction, useContext, useEffect } from 'react'
import { OpenPageState } from '@b3/hooks'

import { GlobaledContext } from '@/shared/global'
import { setCartPermissions } from '@/utils/b3RolePermissions'

import useCartToQuote from './useCartToQuote'
import useHideGoogleCustomerReviews from './useHideGoogleCustomerReviews'
import useMyQuote from './useMyQuote'
import { useOpenPDP } from './useOpenPDP'
import useRegisteredbctob2b from './useRegisteredbctob2b'

type DispatchProps = Dispatch<SetStateAction<OpenPageState>>
interface MutationObserverProps {
  setOpenPage: DispatchProps
  isOpen: boolean
}

const useDomHooks = ({ setOpenPage, isOpen }: MutationObserverProps) => {
  const {
    state: {
      customerId,
      role,
      productQuoteEnabled,
      cartQuoteEnabled,
      B3UserId,
    },
  } = useContext(GlobaledContext)

  useEffect(() => {
    if (+role !== 2) {
      setCartPermissions(role)
    }
  }, [role])

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

  useHideGoogleCustomerReviews({ isOpen })
}

export default useDomHooks
