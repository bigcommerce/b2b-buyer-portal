import {
  useState,
  useContext,
  useEffect,
  useRef,
  Dispatch,
  SetStateAction,
} from 'react'

import {
  useNavigate,
  useParams,
} from 'react-router-dom'

import {
  Box,
  Grid,
} from '@mui/material'

import {
  GlobaledContext,
} from '@/shared/global'

import {
  searchB2BProducts,
  searchBcProducts,
  getB2BShoppingListDetails,
  getBcShoppingListDetails,
  deleteB2BShoppingListItem,
  deleteBcShoppingListItem,
  updateB2BShoppingList,
  updateBcShoppingList,
  getB2BJuniorPlaceOrder,
} from '@/shared/service/b2b'

import {
  B3Sping,
} from '@/components/spin/B3Sping'

import {
  useMobile,
} from '@/hooks'

import {
  snackbar,
  getDefaultCurrencyInfo,
} from '@/utils'

import {
  conversionProductsList,
  ShoppingListInfoProps,
  CustomerInfoProps,
  ListItemProps,
  SearchProps,
  ProductsProps,
} from './shared/config'

import {
  ShoppingListDetailsContext,
  ShoppingListDetailsProvider,
} from './context/ShoppingListDetailsContext'

import {
  AddToShoppingList,
} from './components/AddToShoppingList'

import {
  ReAddToCart,
} from './components/ReAddToCart'

import ShoppingDetailHeader from './components/ShoppingDetailHeader'
import ShoppingDetailFooter from './components/ShoppingDetailFooter'
import ShoppingDetailTable from './components/ShoppingDetailTable'
import ShoppingDetailDeleteItems from './components/ShoppingDetailDeleteItems'

interface TableRefProps extends HTMLInputElement {
  initSearch: () => void,
}

interface OpenPageState {
  isOpen: boolean,
  openUrl?: string,
}

interface UpdateShoppingListParamsProps {
  id: number,
  name: string,
  description: string,
  status?: number,
  channelId?: number,
}

interface ShoppingListDetailsProps {
  setOpenPage: Dispatch<SetStateAction<OpenPageState>>
}
interface ShoppingListDetailsContentProps {
  setOpenPage: Dispatch<SetStateAction<OpenPageState>>
}

// shoppingList status: 0 -- Approved; 20 -- Rejected; 30 -- Draft; 40 -- Ready for approval
// 0: Admin, 1: Senior buyer, 2: Junior buyer, 3: Super admin

const ShoppingListDetails = ({
  setOpenPage,
}: ShoppingListDetailsProps) => {
  const {
    id = '',
  } = useParams()
  const {
    state: {
      role,
      companyInfo: {
        id: companyInfoId,
      },
      isB2BUser,
      currentChannelId,
      isAgenting,
    },
  } = useContext(GlobaledContext)
  const navigate = useNavigate()
  const [isMobile] = useMobile()
  const {
    dispatch,
  } = useContext(ShoppingListDetailsContext)

  const tableRef = useRef<TableRefProps | null>(null)

  const [checkedArr, setCheckedArr] = useState<CustomFieldItems>([])
  const [shoppingListInfo, setShoppingListInfo] = useState<null | ShoppingListInfoProps>(null)
  const [customerInfo, setCustomerInfo] = useState<null | CustomerInfoProps>(null)
  const [selectedSubTotal, setSelectedSubTotal] = useState<number>(0.00)
  const [isRequestLoading, setIsRequestLoading] = useState(false)

  const [deleteOpen, setDeleteOpen] = useState<boolean>(false)
  const [deleteItemId, setDeleteItemId] = useState<number | string>('')

  const [validateSuccessProducts, setValidateSuccessProducts] = useState<ProductsProps[]>([])
  const [validateFailureProducts, setValidateFailureProducts] = useState<ProductsProps[]>([])

  const [allowJuniorPlaceOrder, setAllowJuniorPlaceOrder] = useState<boolean>(false)

  const isJuniorApprove = shoppingListInfo?.status === 0 && role === 2
  const isReadForApprove = shoppingListInfo?.status === 40 || shoppingListInfo?.status === 20

  const {
    currency_code: currencyCode,
    token: currencyToken,
  } = getDefaultCurrencyInfo()

  const goToShoppingLists = () => {
    navigate('/shoppingLists')
  }

  useEffect(() => {
    dispatch({
      type: 'init',
      payload: {
        id: parseInt(id, 10) || 0,
      },
    })
  }, [id])

  const handleGetProductsById = async (listProducts: ListItemProps[]) => {
    if (listProducts.length > 0) {
      const productIds: number[] = []
      listProducts.forEach((item) => {
        const {
          node,
        } = item
        if (!productIds.includes(node.productId)) {
          productIds.push(node.productId)
        }
      })
      const getProducts = isB2BUser ? searchB2BProducts : searchBcProducts

      try {
        const {
          productsSearch,
        } = await getProducts({
          productIds,
          currencyCode,
          companyId: companyInfoId,
        })

        const newProductsSearch = conversionProductsList(productsSearch)

        listProducts.forEach((item) => {
          const {
            node,
          } = item

          const productInfo = newProductsSearch.find((search: CustomFieldItems) => {
            const {
              id: productId,
            } = search

            return node.productId === productId
          })

          node.productsSearch = productInfo || {}
        })

        return listProducts
      } catch (err: any) {
        snackbar.error(err)
      }
    }
  }

  const getShoppingListDetails = async (params: SearchProps) => {
    const getSLDetail = isB2BUser ? getB2BShoppingListDetails : getBcShoppingListDetails
    const infoKey = isB2BUser ? 'shoppingList' : 'customerShoppingList'

    const shoppingListInfos = await getSLDetail({
      id,
      ...params,
    })

    const shoppingListDetailInfo = shoppingListInfos[infoKey]

    const {
      products: {
        edges,
        totalCount,
      },
    } = shoppingListDetailInfo

    const listProducts = await handleGetProductsById(edges)

    if (isB2BUser) setCustomerInfo(shoppingListDetailInfo.customerInfo)
    setShoppingListInfo(shoppingListDetailInfo)
    return {
      edges: listProducts,
      totalCount,
    }
  }

  const handleUpdateShoppingList = async (status: number) => {
    setIsRequestLoading(true)
    try {
      const updateShoppingList = isB2BUser ? updateB2BShoppingList : updateBcShoppingList
      const params: UpdateShoppingListParamsProps = {
        id: +id,
        name: shoppingListInfo?.name || '',
        description: shoppingListInfo?.description || '',
      }

      if (isB2BUser) {
        params.status = status
      } else {
        params.channelId = currentChannelId
      }

      await updateShoppingList(params)

      snackbar.success('Shipping list status updated successfully')
      tableRef.current?.initSearch()
    } finally {
      setIsRequestLoading(false)
    }
  }

  const handleDeleteItems = async (itemId: number | string = '') => {
    setIsRequestLoading(true)
    const deleteShoppingListItem = isB2BUser ? deleteB2BShoppingListItem : deleteBcShoppingListItem

    try {
      if (itemId) {
        await deleteShoppingListItem({
          itemId,
          shoppingListId: id,
        })

        if (checkedArr.length > 0) {
          const newCheckedArr = checkedArr.filter((item: ListItemProps) => {
            const {
              itemId: checkedItemId,
            } = item.node

            return itemId !== checkedItemId
          })

          setCheckedArr([...newCheckedArr])
        }
      } else {
        if (checkedArr.length === 0) return
        checkedArr.forEach(async (item: ListItemProps) => {
          const {
            node,
          } = item

          await deleteShoppingListItem({
            itemId: node.itemId,
            shoppingListId: id,
          })
        })

        setCheckedArr([])
      }

      snackbar.success('Product removed from your shopping list')
      tableRef.current?.initSearch()
    } finally {
      setIsRequestLoading(false)
    }
  }

  const updateList = () => {
    tableRef.current?.initSearch()
  }

  useEffect(() => {
    if (checkedArr.length > 0) {
      let total = 0.00

      checkedArr.forEach((item: ListItemProps) => {
        const {
          node,
        } = item

        total += +node.basePrice * +node.quantity
      })

      setSelectedSubTotal((1000 * total) / 1000)
    } else {
      setSelectedSubTotal(0.00)
    }
  }, [checkedArr])

  const handleCancelClick = () => {
    setDeleteOpen(false)
    setDeleteItemId('')
  }

  const handleDeleteProductClick = async () => {
    await handleDeleteItems(+deleteItemId)
    await handleCancelClick()
  }

  const getJuniorPlaceOrder = async () => {
    const {
      storeConfigSwitchStatus: {
        isEnabled,
      },
    } = await getB2BJuniorPlaceOrder()

    setAllowJuniorPlaceOrder(isEnabled === '1')
  }

  useEffect(() => {
    if (isJuniorApprove) getJuniorPlaceOrder()
  }, [isJuniorApprove])

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
        }}
      >
        <ShoppingDetailHeader
          isB2BUser={isB2BUser}
          shoppingListInfo={shoppingListInfo}
          customerInfo={customerInfo}
          role={role}
          goToShoppingLists={goToShoppingLists}
          handleUpdateShoppingList={handleUpdateShoppingList}
          setOpenPage={setOpenPage}
          isAgenting={isAgenting}
        />

        <Grid
          container
          spacing={2}
          sx={{
            marginTop: '0',
            overflow: 'auto',
            flexWrap: isMobile ? 'wrap' : 'nowrap',
            paddingBottom: '20px',
            marginBottom: isMobile ? '6rem' : 0,
          }}
        >
          <Box
            sx={isMobile ? {
              flexBasis: '100%',
              pl: '16px',
            } : {
              flexBasis: '690px',
              flexGrow: 1,
              ml: '16px',
              pt: '16px',
            }}
          >
            <B3Sping
              isSpinning={isRequestLoading}
            >
              <Grid
                item
                sx={isMobile ? {
                  flexBasis: '100%',
                } : {
                  flexBasis: '690px',
                  flexGrow: 1,
                }}
              >
                <ShoppingDetailTable
                  ref={tableRef}
                  isReadForApprove={isReadForApprove}
                  isJuniorApprove={isJuniorApprove}
                  allowJuniorPlaceOrder={allowJuniorPlaceOrder}
                  setCheckedArr={setCheckedArr}
                  shoppingListInfo={shoppingListInfo}
                  currencyToken={currencyToken}
                  isRequestLoading={isRequestLoading}
                  setIsRequestLoading={setIsRequestLoading}
                  shoppingListId={id}
                  getShoppingListDetails={getShoppingListDetails}
                  setDeleteOpen={setDeleteOpen}
                  setDeleteItemId={setDeleteItemId}
                  isB2BUser={isB2BUser}
                />
              </Grid>
            </B3Sping>
          </Box>

          <Grid
            item
            sx={isMobile ? {
              flexBasis: '100%',
            } : {
              flexBasis: '340px',
            }}
          >
            {
              (!isReadForApprove && !isJuniorApprove) && (
                <AddToShoppingList
                  updateList={updateList}
                  isB2BUser={isB2BUser}
                />
              )
            }
          </Grid>
        </Grid>

        {
          (!isReadForApprove && (allowJuniorPlaceOrder || !isJuniorApprove)) && (
          <ShoppingDetailFooter
            shoppingListInfo={shoppingListInfo}
            role={role}
            allowJuniorPlaceOrder={allowJuniorPlaceOrder}
            checkedArr={checkedArr}
            currencyToken={currencyToken}
            selectedSubTotal={selectedSubTotal}
            setLoading={setIsRequestLoading}
            setDeleteOpen={setDeleteOpen}
            setValidateFailureProducts={setValidateFailureProducts}
            setValidateSuccessProducts={setValidateSuccessProducts}
            isB2BUser={isB2BUser}
          />
          )
        }

      </Box>

      <ReAddToCart
        shoppingListInfo={shoppingListInfo}
        role={role}
        products={validateFailureProducts}
        successProducts={validateSuccessProducts.length}
        allowJuniorPlaceOrder={allowJuniorPlaceOrder}
        currencyToken={currencyToken}
        setValidateFailureProducts={setValidateFailureProducts}
        setValidateSuccessProducts={setValidateSuccessProducts}
      />

      <ShoppingDetailDeleteItems
        open={deleteOpen}
        handleCancelClick={handleCancelClick}
        handleDeleteProductClick={handleDeleteProductClick}
      />
    </>
  )
}

const ShoppingListDetailsContent = ({
  setOpenPage,
}: ShoppingListDetailsContentProps) => (
  <ShoppingListDetailsProvider>
    <ShoppingListDetails setOpenPage={setOpenPage} />
  </ShoppingListDetailsProvider>
)

export default ShoppingListDetailsContent
