import { Dispatch, SetStateAction, useContext, useEffect } from 'react'

import { GlobaledContext } from '@/shared/global'
import { useAppSelector } from '@/store'
import { OpenPageState } from '@/types/hooks'
import { setCartPermissions } from '@/utils/b3RolePermissions'

import useCartToQuote from './useCartToQuote'
import useHideGoogleCustomerReviews from './useHideGoogleCustomerReviews'
import useMonitorBrowserBack from './useMonitorBrowserBack'
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
    state: { productQuoteEnabled, cartQuoteEnabled },
  } = useContext(GlobaledContext)
  const customerId = useAppSelector(({ company }) => company.customer.id)
  const role = useAppSelector(({ company }) => company.customer.role)

  useMonitorBrowserBack({ isOpen })
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
