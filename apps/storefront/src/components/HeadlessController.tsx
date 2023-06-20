import { Dispatch, SetStateAction, useContext, useEffect, useRef } from 'react'
import type { OpenPageState } from '@b3/hooks'

import { HeadlessRoutes } from '@/constants'
import {
  addProductFromProductPageToQuote,
  addProductsFromCartToQuote,
  addProductsToDraftQuote,
} from '@/hooks/dom/utils'
import { GlobaledContext } from '@/shared/global'
import { superAdminCompanies } from '@/shared/service/b2b'
import {
  B3SStorage,
  endMasquerade,
  getCurrentCustomerInfo,
  startMasquerade,
} from '@/utils'

interface HeadlessControllerProps {
  setOpenPage: Dispatch<SetStateAction<OpenPageState>>
}

export default function HeadlessController({
  setOpenPage,
}: HeadlessControllerProps) {
  const {
    state: { customerId, role, customer, B3UserId, salesRepCompanyId = 0 },
    dispatch,
  } = useContext(GlobaledContext)
  const { addToQuote: addProductFromPage } =
    addProductFromProductPageToQuote(setOpenPage)
  const { addToQuote: addProductsFromCart } =
    addProductsFromCartToQuote(setOpenPage)

  // Keep updated values
  const addProductFromPageRef = useRef(() => addProductFromPage(role))
  const B3UserIdRef = useRef(+B3UserId)
  const salesRepCompanyIdRef = useRef(+salesRepCompanyId)
  const customerIdRef = useRef(customerId)
  const customerRef = useRef(customer)

  addProductFromPageRef.current = () => addProductFromPage(role)
  B3UserIdRef.current = +B3UserId
  salesRepCompanyIdRef.current = +salesRepCompanyId
  customerIdRef.current = customerId
  customerRef.current = customer

  useEffect(() => {
    window.b2b = {
      utils: {
        openPage: (page) => {
          setOpenPage({ isOpen: false })
          setTimeout(
            () => setOpenPage({ isOpen: true, openUrl: HeadlessRoutes[page] }),
            0
          )
        },
        quote: {
          addProductFromPage: addProductFromPageRef.current,
          addProductsFromCart: () => addProductsFromCart(),
          addProducts: (items) => addProductsToDraftQuote(items),
        },
        user: {
          getProfile: () => ({ ...customerRef.current, role }),
          getMasqueradeState: async () => {
            // get companies list
            const {
              superAdminCompanies: { edges: companies = [] },
            } = await superAdminCompanies(B3UserIdRef.current, {
              first: 50,
              offset: 0,
            })

            return {
              current_company_id: salesRepCompanyIdRef.current,
              companies: companies.map(
                ({ node }: { node: CustomFieldStringItems }) => node
              ),
            }
          },
          getB2BToken: () => B3SStorage.get('B3B2BToken') || '',
          setMasqueradeCompany: (companyId) =>
            startMasquerade({
              dispatch,
              companyId,
              B3UserId: B3UserIdRef.current,
              customerId: customerIdRef.current,
            }),
          endMasquerade: () =>
            endMasquerade({
              dispatch,
              salesRepCompanyId: salesRepCompanyIdRef.current,
              B3UserId: B3UserIdRef.current,
            }),
          logInWithStorefrontToken: (customerJWTToken: string) =>
            getCurrentCustomerInfo(dispatch, customerJWTToken),
        },
      },
    }
  }, [])

  return null
}
