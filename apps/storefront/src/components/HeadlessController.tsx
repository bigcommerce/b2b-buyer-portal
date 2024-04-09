import { Dispatch, SetStateAction, useContext, useEffect, useRef } from 'react'
import type { OpenPageState } from '@b3/hooks'
import { useB3Lang } from '@b3/lang'

import { HeadlessRoutes } from '@/constants'
import { addProductFromPage as addProductFromPageToShoppingList } from '@/hooks/dom/useOpenPDP'
import {
  addProductsFromCartToQuote,
  addProductsToDraftQuote,
} from '@/hooks/dom/utils'
import { addProductsToShoppingList } from '@/pages/pdp/PDP'
import { CustomStyleContext } from '@/shared/customStyleButtton'
import { GlobaledContext } from '@/shared/global'
import { superAdminCompanies } from '@/shared/service/b2b'
import B3Request from '@/shared/service/request/b3Fetch'
import { useAppDispatch, useAppSelector } from '@/store'
import {
  B3LStorage,
  B3SStorage,
  endMasquerade,
  getCurrentCustomerInfo,
  LineItems,
  startMasquerade,
} from '@/utils'
import CallbackManager from '@/utils/b3Callbacks'
import createShoppingList from '@/utils/b3ShoppingList/b3ShoppingList'

interface QuoteDraftItem {
  node: {
    basePrice: string
    id: string
    optionList: string
    primaryImage: string
    productId: number
    productName: string
    quantity: number
    taxPrice: string
    variantId: number
    variantSku: string
    calculatedValue: Record<
      string,
      string | number | Array<string | number> | Record<string, string | number>
    >
    productsSearch: Record<
      string,
      string | number | Array<string | number> | Record<string, string | number>
    >
  }
}

export interface FormatedQuoteItem
  extends Omit<
    QuoteDraftItem['node'],
    'optionList' | 'calculatedValue' | 'productsSearch'
  > {
  optionSelections: {
    optionId: string | number
    optionValue: number
  }[]
}

interface HeadlessControllerProps {
  setOpenPage: Dispatch<SetStateAction<OpenPageState>>
}

const transformOptionSelectionsToAttributes = (items: LineItems[]) =>
  items.map((product) => {
    const { selectedOptions } = product

    return {
      ...product,
      selectedOptions: selectedOptions?.reduce(
        (
          accumulator: Record<string, number>,
          { optionEntityId, optionValueEntityId }
        ) => {
          accumulator[`attribute[${optionEntityId}]`] = optionValueEntityId

          return accumulator
        },
        {}
      ),
    }
  })

export type ProductMappedAttributes = ReturnType<
  typeof transformOptionSelectionsToAttributes
>

const getDraftQuote = () => {
  const itemsList: QuoteDraftItem[] = B3LStorage.get('b2bQuoteDraftList')
  let productList: FormatedQuoteItem[] = []

  if (itemsList.length) {
    productList = itemsList.map(
      ({
        node: { optionList, calculatedValue, productsSearch, ...restItem },
      }) => {
        const parsedOptionList: Record<string, string>[] =
          JSON.parse(optionList)
        const optionSelections = parsedOptionList.map(
          ({ optionId, optionValue }) => {
            const optionIdFormated = optionId.match(/\d+/)
            return {
              optionId: optionIdFormated?.length
                ? +optionIdFormated[0]
                : optionId,
              optionValue: +optionValue,
            }
          }
        )
        return {
          ...restItem,
          optionSelections,
        }
      }
    )
  }

  return { productList }
}

export default function HeadlessController({
  setOpenPage,
}: HeadlessControllerProps) {
  const storeDispatch = useAppDispatch()
  const b3Lang = useB3Lang()

  const {
    dispatch,
    state: {
      B3UserId,
      salesRepCompanyId = 0,
      isB2BUser,
      currentChannelId,
      registerEnabled,
      productQuoteEnabled,
      cartQuoteEnabled,
      shoppingListEnabled,
    },
  } = useContext(GlobaledContext)
  const customer = useAppSelector(({ company }) => company.customer)
  const role = useAppSelector(({ company }) => company.customer.role)
  const platform = useAppSelector(({ global }) => global.storeInfo.platform)
  const {
    state: { addQuoteBtn, shoppingListBtn, addToAllQuoteBtn },
  } = useContext(CustomStyleContext)
  const { addToQuote: addProductsFromCart } = addProductsFromCartToQuote(
    setOpenPage,
    platform
  )

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

  const customerId = customer.id
  // Keep updated values
  const B3UserIdRef = useRef(+B3UserId)
  const salesRepCompanyIdRef = useRef(+salesRepCompanyId)
  const customerIdRef = useRef(customerId)
  const customerRef = useRef(customer)
  const roleRef = useRef(+role)
  const isB2BUserRef = useRef(isB2BUser)
  const currentChannelIdRef = useRef(currentChannelId)
  const productQuoteEnabledRef = useRef(productQuoteEnabled)
  const shoppingListEnabledRef = useRef(shoppingListEnabled)
  const cartQuoteEnabledRef = useRef(cartQuoteEnabled)
  const addQuoteBtnRef = useRef(addQuoteBtn)
  const shoppingListBtnRef = useRef(shoppingListBtn)
  const addToAllQuoteBtnRef = useRef(addToAllQuoteBtn)

  B3UserIdRef.current = +B3UserId
  salesRepCompanyIdRef.current = +salesRepCompanyId
  customerIdRef.current = customerId
  customerRef.current = customer
  roleRef.current = +role
  isB2BUserRef.current = isB2BUser
  currentChannelIdRef.current = currentChannelId
  productQuoteEnabledRef.current = productQuoteEnabled
  shoppingListEnabledRef.current = shoppingListEnabled
  cartQuoteEnabledRef.current = cartQuoteEnabled
  addQuoteBtnRef.current = addQuoteBtn
  shoppingListBtnRef.current = shoppingListBtn
  addToAllQuoteBtnRef.current = addToAllQuoteBtn

  useEffect(() => {
    window.b2b = {
      ...window.b2b,
      callbacks: new CallbackManager(),
      utils: {
        openPage: (page) =>
          setTimeout(() => {
            if (page === 'CLOSE') {
              setOpenPage({ isOpen: false })
              return
            }
            setOpenPage({ isOpen: true, openUrl: HeadlessRoutes[page] })
          }, 0),
        quote: {
          addProductFromPage: (item) =>
            addProductsToDraftQuote([item], setOpenPage),
          addProductsFromCart: () => addProductsFromCart(),
          addProducts: (items) => addProductsToDraftQuote(items, setOpenPage),
          getCurrent: getDraftQuote,
          getButtonInfo: () => ({
            ...addQuoteBtnRef.current,
            enabled: productQuoteEnabledRef.current,
          }),
          getButtonInfoAddAllFromCartToQuote: () => ({
            ...addToAllQuoteBtnRef.current,
            enabled: cartQuoteEnabledRef.current,
          }),
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
              orderBy: 'companyId',
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
          graphqlBCProxy: B3Request.graphqlBCProxy,
          loginWithB2BStorefrontToken: async (
            b2bStorefrontJWTToken: string
          ) => {
            B3SStorage.set('B2BToken', b2bStorefrontJWTToken)
            await getCurrentCustomerInfo(dispatch, b2bStorefrontJWTToken)
          },
        },
        shoppingList: {
          itemFromCurrentPage: [],
          addProductFromPage: (item) => {
            window.b2b.utils.shoppingList.itemFromCurrentPage =
              transformOptionSelectionsToAttributes([item])
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
              b3Lang,
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
          getButtonInfo: () => ({
            ...shoppingListBtnRef.current,
            enabled: shoppingListEnabledRef.current,
          }),
        },
      },
    }
    // disabling because we don't want to run this effect on every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}
