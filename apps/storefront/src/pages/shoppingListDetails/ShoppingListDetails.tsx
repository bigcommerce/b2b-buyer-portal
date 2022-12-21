import {
  useState,
  useContext,
  useEffect,
  useRef,
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
  getB2BShoppingListDetails,
  deleteB2BShoppingListItem,
  updateB2BShoppingList,
} from '@/shared/service/b2b'

import {
  B3Sping,
} from '@/components/spin/B3Sping'

import {
  useMobile,
} from '@/hooks'

import {
  snackbar,
  B3SStorage,
} from '@/utils'

import {
  conversionProductsList,
  ShoppingListInfoProps,
  CustomerInfoProps,
  ListItemProps,
} from './shared/config'

import {
  ShoppingListDetailsContext,
  ShoppingListDetailsProvider,
} from './context/ShoppingListDetailsContext'

import {
  AddToShoppingList,
} from './components/AddToShoppingList'

import ShoppingDetailHeader from './components/ShoppingDetailHeader'
import ShoppingDetailFooter from './components/ShoppingDetailFooter'
import ShoppingDetailTable from './components/ShoppingDetailTable'
import ShoppingDetailDeleteItems from './components/ShoppingDetailDeleteItems'

// shoppingList status: 0 -- Approved; 20 -- Rejected; 30 -- Draft; 40 -- Ready for approval
// 0: Admin, 1: Senior buyer, 2: Junior buyer, 3: Super admin
// const shoppingListStatus = {
//   0: 'Approved',
//   20: 'Rejected',
//   30: 'Draft',
//   40: 'Ready for approval',
// }

const ShoppingListDetails = () => {
  const {
    id = '',
  } = useParams()
  const {
    state: {
      role,
      companyInfo: {
        id: companyInfoId,
      },
    },
  } = useContext(GlobaledContext)
  const navigate = useNavigate()
  const [isMobile] = useMobile()
  const {
    dispatch,
  } = useContext(ShoppingListDetailsContext)

  const tableRef = useRef<any>(null)

  const [checkedArr, setCheckedArr] = useState<any>([])
  const [shoppingListInfo, setShoppingListInfo] = useState<null | ShoppingListInfoProps>(null)
  const [customerInfo, setCustomerInfo] = useState<null | CustomerInfoProps>(null)
  const [selectedSubTotal, setSelectedSubTotal] = useState<number>(0.00)
  const [isRequestLoading, setIsRequestLoading] = useState(false)

  const [deleteOpen, setDeleteOpen] = useState<boolean>(false)
  const [deleteItemId, setDeleteItemId] = useState<number | string>('')

  const isReadForApprove = shoppingListInfo?.status === 40 || shoppingListInfo?.status === 20

  const getDefaultCurrencyInfo = () => {
    const currencies = B3SStorage.get('currencies')
    if (currencies) {
      const {
        currencies: currencyArr,
      } = currencies

      const defaultCurrency = currencyArr.find((currency: any) => currency.is_default)

      return defaultCurrency
    }
  }

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

      try {
        const {
          productsSearch,
        } = await searchB2BProducts({
          productIds,
          currencyCode,
          companyId: companyInfoId,
        })

        const newProductsSearch = conversionProductsList(productsSearch, listProducts)

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

  const getShoppingListDetails = async (params: any) => {
    const {
      shoppingList,
      shoppingList: {
        customerInfo,
        products: {
          edges,
          totalCount,
        },
      },
    } = await getB2BShoppingListDetails({
      id,
      ...params,
    })

    const listProducts = await handleGetProductsById(edges)

    setCustomerInfo(customerInfo)
    setShoppingListInfo(shoppingList)
    return {
      edges: listProducts,
      totalCount,
    }
  }

  const handleUpdateShoppingList = async (status: number) => {
    setIsRequestLoading(true)
    try {
      await updateB2BShoppingList({
        id,
        name: shoppingListInfo?.name || '',
        description: shoppingListInfo?.description || '',
        status,
      })

      snackbar.success('Shipping list status updated successfully')
      tableRef.current.initSearch()
    } finally {
      setIsRequestLoading(false)
    }
  }

  const handleDeleteItems = async (itemId: number | string = '') => {
    setIsRequestLoading(true)
    try {
      if (itemId) {
        await deleteB2BShoppingListItem({
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

          await deleteB2BShoppingListItem({
            itemId: node.itemId,
            shoppingListId: id,
          })
        })

        setCheckedArr([])
      }

      snackbar.success('Product removed from your shopping list')
      tableRef.current.initSearch()
    } finally {
      setIsRequestLoading(false)
    }
  }

  const updateList = () => {
    tableRef.current.initSearch()
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

      setSelectedSubTotal(+((1000 * total) / 1000).toFixed(2))
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

  return (
    <B3Sping
      isSpinning={isRequestLoading}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
        }}
      >
        <ShoppingDetailHeader
          shoppingListInfo={shoppingListInfo}
          customerInfo={customerInfo}
          role={role}
          goToShoppingLists={goToShoppingLists}
          handleUpdateShoppingList={handleUpdateShoppingList}
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
              setCheckedArr={setCheckedArr}
              shoppingListInfo={shoppingListInfo}
              currencyToken={currencyToken}
              setIsRequestLoading={setIsRequestLoading}
              shoppingListId={id}
              getShoppingListDetails={getShoppingListDetails}
              setDeleteOpen={setDeleteOpen}
              setDeleteItemId={setDeleteItemId}
            />

          </Grid>

          <Grid
            item
            sx={isMobile ? {
              flexBasis: '100%',
            } : {
              flexBasis: '340px',
            }}
          >
            {
              !isReadForApprove && (
                <AddToShoppingList
                  updateList={updateList}
                />
              )
            }
          </Grid>
        </Grid>

        {
          !isReadForApprove && (
          <ShoppingDetailFooter
            shoppingListInfo={shoppingListInfo}
            role={role}
            checkedArr={checkedArr}
            currencyToken={currencyToken}
            selectedSubTotal={selectedSubTotal}
            setLoading={setIsRequestLoading}
            setDeleteOpen={setDeleteOpen}
          />
          )
        }

      </Box>

      <ShoppingDetailDeleteItems
        open={deleteOpen}
        handleCancelClick={handleCancelClick}
        handleDeleteProductClick={handleDeleteProductClick}
      />
    </B3Sping>
  )
}

const ShoppingListDetailsContent = () => (
  <ShoppingListDetailsProvider>
    <ShoppingListDetails />
  </ShoppingListDetailsProvider>
)

export default ShoppingListDetailsContent
