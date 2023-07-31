import {
  Dispatch,
  forwardRef,
  ReactElement,
  Ref,
  SetStateAction,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import { Delete, Edit } from '@mui/icons-material'
import { Box, Grid, styled, TextField, Typography } from '@mui/material'
import { cloneDeep } from 'lodash'

import { B3PaginationTable } from '@/components/table/B3PaginationTable'
import { TableColumnItem } from '@/components/table/B3Table'
import { PRODUCT_DEFAULT_IMAGE } from '@/constants'
import { useMobile } from '@/hooks'
import {
  updateB2BShoppingListsItem,
  updateBcShoppingListsItem,
} from '@/shared/service/b2b'
import { store } from '@/store'
import { currencyFormat, snackbar } from '@/utils'
import { getBCPrice } from '@/utils/b3Product/b3Product'
import { getProductOptionsFields } from '@/utils/b3Product/shared/config'

import B3FilterSearch from '../../../components/filter/B3FilterSearch'

import ChooseOptionsDialog from './ChooseOptionsDialog'
import ShoppingDetailCard from './ShoppingDetailCard'

interface ListItem {
  [key: string]: string
}

interface ProductInfoProps {
  basePrice: number | string
  baseSku: string
  createdAt: number
  discount: number | string
  enteredInclusive: boolean
  id: number | string
  itemId: number
  optionList: string
  primaryImage: string
  productId: number
  productName: string
  productUrl: string
  quantity: number | string
  tax: number | string
  updatedAt: number
  variantId: number
  variantSku: string
  productsSearch: CustomFieldItems
}

interface ListItemProps {
  node: ProductInfoProps
}

interface ShoppingDetailTableProps {
  shoppingListInfo: any
  isRequestLoading: boolean
  setIsRequestLoading: Dispatch<SetStateAction<boolean>>
  shoppingListId: number | string
  getShoppingListDetails: CustomFieldItems
  setCheckedArr: (values: CustomFieldItems) => void
  isReadForApprove: boolean
  isJuniorApprove: boolean
  allowJuniorPlaceOrder: boolean
  setDeleteItemId: (itemId: number | string) => void
  setDeleteOpen: (open: boolean) => void
  isB2BUser: boolean
}

interface SearchProps {
  search: string
  first?: number
  offset?: number
}

interface PaginationTableRefProps extends HTMLInputElement {
  getList: () => void
  setList: (items?: ListItemProps[]) => void
  getSelectedValue: () => void
  refresh: () => void
}

const StyledShoppingListTableContainer = styled('div')(() => ({
  backgroundColor: '#FFFFFF',
  padding: '1rem',
  borderRadius: '4px',
  boxShadow:
    '0px 2px 1px -1px rgba(0, 0, 0, 0.2), 0px 1px 1px rgba(0, 0, 0, 0.14), 0px 1px 3px rgba(0, 0, 0, 0.12)',

  '& tbody': {
    '& tr': {
      '& td': {
        verticalAlign: 'top',
      },
      '& td: first-of-type': {
        paddingTop: '25px',
      },
    },
    '& tr: hover': {
      '& #shoppingList-actionList': {
        opacity: 1,
      },
    },
  },
}))

const StyledImage = styled('img')(() => ({
  maxWidth: '60px',
  height: 'auto',
  marginRight: '0.5rem',
}))

const StyledTextField = styled(TextField)(() => ({
  '& input': {
    paddingTop: '12px',
    paddingRight: '6px',
  },
}))

function ShoppingDetailTable(
  props: ShoppingDetailTableProps,
  ref: Ref<unknown>
) {
  const [isMobile] = useMobile()

  const {
    shoppingListInfo,
    isRequestLoading,
    setIsRequestLoading,
    shoppingListId,
    getShoppingListDetails,
    setCheckedArr,
    isReadForApprove,
    setDeleteItemId,
    setDeleteOpen,
    isJuniorApprove,
    isB2BUser,
    allowJuniorPlaceOrder,
  } = props

  const {
    global: { showInclusiveTaxPrice },
  } = store.getState()

  const paginationTableRef = useRef<PaginationTableRefProps | null>(null)

  const [chooseOptionsOpen, setSelectedOptionsOpen] = useState(false)
  const [optionsProduct, setOptionsProduct] = useState<any>(null)
  const [editProductItemId, setEditProductItemId] = useState<
    number | string | null
  >(null)
  const [search, setSearch] = useState<SearchProps | {}>()
  const [qtyNotChangeFlag, setQtyNotChangeFlag] = useState<boolean>(true)
  const [originProducts, setOriginProducts] = useState<ListItemProps[]>([])
  const [shoppingListTotalPrice, setShoppingListTotalPrice] =
    useState<number>(0.0)

  const handleUpdateProductQty = (
    id: number | string,
    value: number | string
  ) => {
    if (value !== '' && +value <= 0) return
    const currentItem = originProducts.find((item: ListItemProps) => {
      const { node } = item

      return node.id === id
    })

    const currentQty = currentItem?.node?.quantity || ''
    setQtyNotChangeFlag(+currentQty === +value)

    const listItems: ListItemProps[] =
      paginationTableRef.current?.getList() || []
    const newListItems = listItems?.map((item: ListItemProps) => {
      const { node } = item
      if (node?.id === id) {
        node.quantity = +value || ''
      }

      return item
    })

    paginationTableRef.current?.setList([...newListItems])
  }

  const initSearch = () => {
    paginationTableRef.current?.refresh()
  }

  useImperativeHandle(ref, () => ({
    initSearch,
    getList: () => paginationTableRef.current?.getList(),
    setList: () => paginationTableRef.current?.setList(),
    getSelectedValue: () => paginationTableRef.current?.getSelectedValue(),
  }))

  const handleSearchProduct = async (q: string) => {
    setSearch({
      search: q,
    })
  }

  const handleChooseOptionsDialogCancel = () => {
    setEditProductItemId('')
    setSelectedOptionsOpen(false)
  }

  const handleOpenProductEdit = (
    product: any,
    variantId: number | string,
    itemId: number | string
  ) => {
    setEditProductItemId(itemId)
    setOptionsProduct(product)
    setSelectedOptionsOpen(true)
  }

  const handleChooseOptionsDialogConfirm = async (
    products: CustomFieldItems[]
  ) => {
    setIsRequestLoading(true)
    const updateShoppingListItem = isB2BUser
      ? updateB2BShoppingListsItem
      : updateBcShoppingListsItem
    try {
      const data = {
        itemId: editProductItemId,
        shoppingListId,
        itemData: {
          variantId: products[0].variantId,
          quantity: products[0].quantity,
          optionList: products[0].newSelectOptionList || [],
        },
      }

      await updateShoppingListItem(data)
      setSelectedOptionsOpen(false)
      setEditProductItemId('')
      snackbar.success('Product updated successfully')
      initSearch()
    } finally {
      // setIsRequestLoading(false)
    }
  }

  const handleUpdateShoppingListItem = async (itemId: number | string) => {
    if (qtyNotChangeFlag) return
    setIsRequestLoading(true)
    const listItems: ListItemProps[] =
      paginationTableRef.current?.getList() || []
    const currentItem = listItems.find((item: ListItemProps) => {
      const { node } = item

      return node.itemId === itemId
    })
    let currentNode

    if (currentItem) {
      currentNode = currentItem.node
    }

    const options = JSON.parse(currentNode?.optionList || '[]')

    const optionsList = options.map(
      (option: {
        option_id: number | string
        option_value: number | string
      }) => ({
        optionId: option.option_id,
        optionValue: option.option_value,
      })
    )

    const itemData = {
      variantId: currentNode?.variantId,
      quantity: currentNode?.quantity,
      optionList: optionsList || [],
    }

    try {
      const data = {
        itemId,
        shoppingListId,
        itemData,
      }

      const updateShoppingListItem = isB2BUser
        ? updateB2BShoppingListsItem
        : updateBcShoppingListsItem

      await updateShoppingListItem(data)
      snackbar.success('Product quantity updated successfully')
      setQtyNotChangeFlag(true)
      initSearch()
    } finally {
      // setIsRequestLoading(false)
    }
  }

  const getSelectCheckbox = (selectCheckbox: Array<string | number>) => {
    if (selectCheckbox.length > 0) {
      const productList = paginationTableRef.current?.getList() || []
      const checkedItems = selectCheckbox.map((item: number | string) => {
        const newItems = productList.find((product: ListItemProps) => {
          const { node } = product

          return node.id === item
        })

        return newItems
      })

      setCheckedArr([...checkedItems])
    } else {
      setCheckedArr([])
    }
  }

  useEffect(() => {
    if (shoppingListInfo) {
      const {
        products: { edges },
        grandTotal,
        totalTax,
      } = shoppingListInfo

      const NewShoppingListTotalPrice = showInclusiveTaxPrice
        ? +grandTotal
        : +grandTotal - +totalTax || 0.0

      setOriginProducts(cloneDeep(edges))
      setShoppingListTotalPrice(NewShoppingListTotalPrice)
    }
  }, [shoppingListInfo])

  const columnItems: TableColumnItem<ListItem>[] = [
    {
      key: 'Product',
      title: 'Product',
      render: (row: CustomFieldItems) => {
        const product: any = {
          ...row.productsSearch,
          selectOptions: row.optionList,
        }
        const productFields = getProductOptionsFields(product, {})

        const optionList = JSON.parse(row.optionList)
        const optionsValue: CustomFieldItems[] = productFields.filter(
          (item) => item.valueText
        )

        return (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
            }}
          >
            <StyledImage
              src={row.primaryImage || PRODUCT_DEFAULT_IMAGE}
              alt="Product-img"
              loading="lazy"
            />
            <Box>
              <Typography
                variant="body1"
                color="#212121"
                onClick={() => {
                  const {
                    location: { origin },
                  } = window

                  window.location.href = `${origin}${row.productUrl}`
                }}
                sx={{
                  cursor: 'pointer',
                }}
              >
                {row.productName}
              </Typography>
              <Typography variant="body1" color="#616161">
                {row.variantSku}
              </Typography>
              {optionList.length > 0 && optionsValue.length > 0 && (
                <Box>
                  {optionsValue.map((option: any) => (
                    <Typography
                      sx={{
                        fontSize: '0.75rem',
                        lineHeight: '1.5',
                        color: '#455A64',
                      }}
                      key={option.valueLabel}
                    >
                      {`${option.valueLabel}: ${option.valueText}`}
                    </Typography>
                  ))}
                </Box>
              )}
            </Box>
          </Box>
        )
      },
      width: '45%',
    },
    {
      key: 'Price',
      title: 'Price',
      render: (row: CustomFieldItems) => {
        const { basePrice, taxPrice = 0 } = row
        const inTaxPrice = getBCPrice(+basePrice, +taxPrice)

        return (
          <Typography
            sx={{
              padding: '12px 0',
            }}
          >
            {currencyFormat(inTaxPrice)}
          </Typography>
        )
      },
      width: '15%',
      style: {
        textAlign: 'right',
      },
    },
    {
      key: 'Qty',
      title: 'Qty',
      render: (row) => (
        <StyledTextField
          size="small"
          type="number"
          variant="filled"
          sx={{
            width: '72px',
          }}
          disabled={isReadForApprove || isJuniorApprove}
          value={row.quantity}
          inputProps={{
            inputMode: 'numeric',
            pattern: '[0-9]*',
          }}
          onChange={(e) => {
            handleUpdateProductQty(row.id, e.target.value)
          }}
          onBlur={() => {
            handleUpdateShoppingListItem(row.itemId)
          }}
        />
      ),
      width: '15%',
      style: {
        textAlign: 'right',
      },
    },
    {
      key: 'Total',
      title: 'Total',
      render: (row: CustomFieldItems) => {
        const {
          basePrice,
          quantity,
          itemId,
          productsSearch: { options },
          taxPrice = 0,
        } = row

        const inTaxPrice = getBCPrice(+basePrice, +taxPrice)

        const totalPrice = inTaxPrice * +quantity

        const optionList = options || JSON.parse(row.optionList)

        return (
          <Box>
            <Typography
              sx={{
                padding: '12px 0',
              }}
            >
              {currencyFormat(totalPrice)}
            </Typography>
            <Box
              sx={{
                marginTop: '1rem',
                opacity: 0,
                textAlign: isMobile ? 'end' : 'start',
                display: 'flex',
                justifyContent: 'flex-end',
              }}
              id="shoppingList-actionList"
            >
              <Grid
                item
                sx={{
                  marginRight: '0.5rem',
                  minWidth: '32px',
                }}
              >
                {optionList.length > 0 &&
                  !isReadForApprove &&
                  !isJuniorApprove && (
                    <Edit
                      sx={{
                        cursor: 'pointer',
                        color: 'rgba(0, 0, 0, 0.54)',
                      }}
                      onClick={() => {
                        const {
                          productsSearch,
                          variantId,
                          itemId,
                          optionList,
                          quantity,
                        } = row

                        handleOpenProductEdit(
                          {
                            ...productsSearch,
                            selectOptions: optionList,
                            quantity,
                          },
                          variantId,
                          itemId
                        )
                      }}
                    />
                  )}
              </Grid>
              <Grid item>
                {!isReadForApprove && !isJuniorApprove && (
                  <Delete
                    sx={{
                      cursor: 'pointer',
                      color: 'rgba(0, 0, 0, 0.54)',
                    }}
                    onClick={() => {
                      setDeleteOpen(true)
                      setDeleteItemId(+itemId)
                    }}
                  />
                )}
              </Grid>
            </Box>
          </Box>
        )
      },
      width: '15%',
      style: {
        textAlign: 'right',
      },
    },
  ]

  return (
    <StyledShoppingListTableContainer>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          margin: '0 0 1rem 0',
        }}
      >
        <Typography
          sx={{
            fontSize: '24px',
          }}
        >
          {`${shoppingListInfo?.products?.totalCount || 0} products`}
        </Typography>
        <Typography
          sx={{
            fontSize: '24px',
          }}
        >
          {`${currencyFormat(shoppingListTotalPrice || 0.0)}`}
        </Typography>
      </Box>
      <Box
        sx={{
          marginBottom: '5px',
        }}
      >
        <B3FilterSearch
          searchBGColor="rgba(0, 0, 0, 0.06)"
          handleChange={(e) => {
            handleSearchProduct(e)
          }}
        />
      </Box>

      <B3PaginationTable
        ref={paginationTableRef}
        columnItems={columnItems}
        rowsPerPageOptions={[10, 20, 50]}
        getRequestList={getShoppingListDetails}
        searchParams={search}
        isCustomRender={false}
        showCheckbox
        showSelectAllCheckbox
        disableCheckbox={
          allowJuniorPlaceOrder
            ? !allowJuniorPlaceOrder
            : isReadForApprove || isJuniorApprove
        }
        hover
        labelRowsPerPage="Items per page:"
        showBorder={false}
        requestLoading={setIsRequestLoading}
        getSelectCheckbox={getSelectCheckbox}
        itemIsMobileSpacing={0}
        noDataText="No products found"
        renderItem={(
          row: ProductInfoProps,
          index?: number,
          checkBox?: () => ReactElement
        ) => (
          <ShoppingDetailCard
            len={shoppingListInfo?.products?.edges.length || 0}
            item={row}
            itemIndex={index}
            onEdit={handleOpenProductEdit}
            onDelete={setDeleteItemId}
            checkBox={checkBox}
            setDeleteOpen={setDeleteOpen}
            handleUpdateProductQty={handleUpdateProductQty}
            handleUpdateShoppingListItem={handleUpdateShoppingListItem}
            isReadForApprove={isReadForApprove || isJuniorApprove}
          />
        )}
      />

      <ChooseOptionsDialog
        isOpen={chooseOptionsOpen}
        isLoading={isRequestLoading}
        setIsLoading={setIsRequestLoading}
        product={optionsProduct}
        onCancel={handleChooseOptionsDialogCancel}
        onConfirm={handleChooseOptionsDialogConfirm}
        isEdit
        isB2BUser={isB2BUser}
      />
    </StyledShoppingListTableContainer>
  )
}

export default forwardRef(ShoppingDetailTable)
