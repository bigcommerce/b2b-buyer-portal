import { Dispatch, SetStateAction, useContext, useEffect, useRef } from 'react'
import { useDispatch } from 'react-redux'
import globalB3 from '@b3/global-b3'
import type { OpenPageState } from '@b3/hooks'

import { HeadlessRoutes } from '@/constants'
import { addProductFromPage as addProductFromPageToShoppingList } from '@/hooks/dom/useOpenPDP'
import {
  addProductFromProductPageToQuote,
  addProductsFromCartToQuote,
  addProductsToDraftQuote,
} from '@/hooks/dom/utils'
import { addProductsToShoppingList } from '@/pages/pdp/PDP'
import { GlobaledContext } from '@/shared/global'
import { superAdminCompanies } from '@/shared/service/b2b'
import B3Request from '@/shared/service/request/b3Fetch'
import {
  B3SStorage,
  endMasquerade,
  getCurrentCustomerInfo,
  LineItems,
  startMasquerade,
} from '@/utils'
import createShoppingList from '@/utils/b3ShoppingList/b3ShoppingList'

interface HeadlessControllerProps {
  setOpenPage: Dispatch<SetStateAction<OpenPageState>>
}

const transformOptionSelectionsToAttributes = (items: LineItems[]) =>
  items.map((product) => {
    const { optionSelections } = product

    return {
      ...product,
      optionSelections: optionSelections?.reduce(
        (accumulator: Record<string, number>, { optionId, optionValue }) => {
          accumulator[`attribute[${optionId}]`] = optionValue

          return accumulator
        },
        {}
      ),
    }
  })

export default function HeadlessController({
  setOpenPage,
}: HeadlessControllerProps) {
  const storeDispatch = useDispatch()

  const {
    dispatch,
    state: {
      customerId,
      role,
      customer,
      B3UserId,
      salesRepCompanyId = 0,
      isB2BUser,
      currentChannelId,
      registerEnabled,
    },
  } = useContext(GlobaledContext)
  const { addToQuote: addProductFromPageToQuote } =
    addProductFromProductPageToQuote(setOpenPage)
  const { addToQuote: addProductsFromCart } =
    addProductsFromCartToQuote(setOpenPage)

  const saveFn = () => {
    setOpenPage({
      isOpen: true,
      openUrl: '/register',
    })
  }
  const gotoShoppingDetail = (id: number | string) => {
    setOpenPage({
      isOpen: true,
      openUrl: `/shoppingList/${id}`,
      params: {
        shoppingListBtn: 'add',
      },
    })
  }

  // Keep updated values
  const addProductFromPageToQuoteRef = useRef(() =>
    addProductFromPageToQuote(role)
  )
  const B3UserIdRef = useRef(+B3UserId)
  const salesRepCompanyIdRef = useRef(+salesRepCompanyId)
  const customerIdRef = useRef(customerId)
  const customerRef = useRef(customer)
  const roleRef = useRef(+role)
  const isB2BUserRef = useRef(isB2BUser)
  const currentChannelIdRef = useRef(currentChannelId)

  addProductFromPageToQuoteRef.current = () => addProductFromPageToQuote(role)
  B3UserIdRef.current = +B3UserId
  salesRepCompanyIdRef.current = +salesRepCompanyId
  customerIdRef.current = customerId
  customerRef.current = customer
  roleRef.current = +role
  isB2BUserRef.current = isB2BUser
  currentChannelIdRef.current = currentChannelId

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
          addProductFromPage: addProductFromPageToQuoteRef.current,
          addProductsFromCart: () => addProductsFromCart(),
          addProducts: (items) => addProductsToDraftQuote(items, setOpenPage),
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
          getB2BToken: () => B3SStorage.get('B2BToken') || '',
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
          graphqlBCProxy: B3Request.graphqlBCProxy,
          loginWithB2BStorefrontToken: async (
            b2bStorefrontJWTToken: string
          ) => {
            B3SStorage.set('B2BToken', b2bStorefrontJWTToken)
            await getCurrentCustomerInfo(
              dispatch,
              undefined,
              b2bStorefrontJWTToken
            )
          },
        },
        shoppingList: {
          addProductFromPage: () => {
            dispatch({
              type: 'common',
              payload: {
                shoppingListClickNode: document.querySelector(
                  globalB3['dom.productView']
                ),
              },
            })

            addProductFromPageToShoppingList({
              role: roleRef.current,
              storeDispatch,
              saveFn,
              setOpenPage,
              registerEnabled,
            })
          },
          addProducts: (shoppingListId, items) =>
            addProductsToShoppingList({
              shoppingListId,
              items: transformOptionSelectionsToAttributes(items),
              isB2BUser: isB2BUserRef.current,
              customerGroupId: customerRef.current.customerGroupId,
              gotoShoppingDetail,
            }),
          createNewShoppingList: async (name, description) => {
            const { shoppingListsCreate } = await createShoppingList({
              data: { name, description },
              isB2BUser: isB2BUserRef.current,
              role: roleRef.current,
              currentChannelId: currentChannelIdRef.current,
            })

            return shoppingListsCreate.shoppingList
          },
        },
      },
    }
  }, [])

  return null
}
